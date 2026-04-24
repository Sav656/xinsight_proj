/*
  # X-Insight Medical Imaging Database Schema

  1. New Tables
    - `patients`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `patient_id` (text, unique identifier for the patient)
      - `name` (text, patient name)
      - `date_of_birth` (date)
      - `gender` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `analyses`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `patient_id` (uuid, references patients)
      - `image_url` (text, URL to stored X-ray image)
      - `status` (text: 'draft', 'finalized')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `pathology_findings`
      - `id` (uuid, primary key)
      - `analysis_id` (uuid, references analyses)
      - `condition` (text, pathology name)
      - `confidence` (decimal, 0-1)
      - `heatmap_url` (text, URL to Grad-CAM heatmap)
      - `is_verified` (boolean, whether doctor verified)
      - `verification_status` (text: 'pending', 'correct', 'incorrect')
      - `doctor_notes` (text)
      - `created_at` (timestamp)
    
    - `reports`
      - `id` (uuid, primary key)
      - `analysis_id` (uuid, references analyses)
      - `content` (text, markdown report content)
      - `biobert_validation` (jsonb, validation results)
      - `version` (integer, for tracking edits)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `report_feedback`
      - `id` (uuid, primary key)
      - `report_id` (uuid, references reports)
      - `user_id` (uuid, references auth.users)
      - `feedback_type` (text: 'correct', 'incorrect', 'partial')
      - `comments` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Users can only access patients and analyses they created

  3. Important Notes
    - All tables use uuid primary keys for secure references
    - Timestamps track creation and modification times
    - Status fields enable draft/finalize workflow
    - JSONB used for flexible BioBERT validation storage
*/

-- Create patients table
CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id text UNIQUE NOT NULL,
  name text NOT NULL,
  date_of_birth date,
  gender text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create analyses table
CREATE TABLE IF NOT EXISTS analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES patients(id) ON DELETE SET NULL,
  image_url text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'finalized')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create pathology_findings table
CREATE TABLE IF NOT EXISTS pathology_findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  condition text NOT NULL,
  confidence decimal(5,4) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  heatmap_url text,
  is_verified boolean DEFAULT false,
  verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'correct', 'incorrect')),
  doctor_notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  content text NOT NULL,
  biobert_validation jsonb DEFAULT '{}'::jsonb,
  version integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create report_feedback table
CREATE TABLE IF NOT EXISTS report_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feedback_type text NOT NULL CHECK (feedback_type IN ('correct', 'incorrect', 'partial')),
  comments text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE pathology_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_feedback ENABLE ROW LEVEL SECURITY;

-- Patients policies
CREATE POLICY "Users can view own patients"
  ON patients FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own patients"
  ON patients FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own patients"
  ON patients FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own patients"
  ON patients FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Analyses policies
CREATE POLICY "Users can view own analyses"
  ON analyses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own analyses"
  ON analyses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analyses"
  ON analyses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own analyses"
  ON analyses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Pathology findings policies
CREATE POLICY "Users can view findings from own analyses"
  ON pathology_findings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM analyses
      WHERE analyses.id = pathology_findings.analysis_id
      AND analyses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create findings for own analyses"
  ON pathology_findings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM analyses
      WHERE analyses.id = pathology_findings.analysis_id
      AND analyses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update findings from own analyses"
  ON pathology_findings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM analyses
      WHERE analyses.id = pathology_findings.analysis_id
      AND analyses.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM analyses
      WHERE analyses.id = pathology_findings.analysis_id
      AND analyses.user_id = auth.uid()
    )
  );

-- Reports policies
CREATE POLICY "Users can view reports from own analyses"
  ON reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM analyses
      WHERE analyses.id = reports.analysis_id
      AND analyses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create reports for own analyses"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM analyses
      WHERE analyses.id = reports.analysis_id
      AND analyses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update reports from own analyses"
  ON reports FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM analyses
      WHERE analyses.id = reports.analysis_id
      AND analyses.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM analyses
      WHERE analyses.id = reports.analysis_id
      AND analyses.user_id = auth.uid()
    )
  );

-- Report feedback policies
CREATE POLICY "Users can view own feedback"
  ON report_feedback FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own feedback"
  ON report_feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);
CREATE INDEX IF NOT EXISTS idx_patients_patient_id ON patients(patient_id);
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_patient_id ON analyses(patient_id);
CREATE INDEX IF NOT EXISTS idx_analyses_status ON analyses(status);
CREATE INDEX IF NOT EXISTS idx_pathology_findings_analysis_id ON pathology_findings(analysis_id);
CREATE INDEX IF NOT EXISTS idx_reports_analysis_id ON reports(analysis_id);
CREATE INDEX IF NOT EXISTS idx_report_feedback_report_id ON report_feedback(report_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON patients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analyses_updated_at
  BEFORE UPDATE ON analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();