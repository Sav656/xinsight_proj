export interface Patient {
  id: string;
  user_id: string;
  patient_id: string;
  name: string;
  date_of_birth: string | null;
  gender: string | null;
  created_at: string;
  updated_at: string;
}

export interface Analysis {
  id: string;
  user_id: string;
  patient_id: string | null;
  image_url: string | null;
  status: 'draft' | 'finalized';
  created_at: string;
  updated_at: string;
  patient?: Patient;
}

export interface PathologyFinding {
  id: string;
  analysis_id: string;
  condition: string;
  confidence: number;
  heatmap_url: string | null;
  is_verified: boolean;
  verification_status: 'pending' | 'correct' | 'incorrect';
  doctor_notes: string;
  created_at: string;
}

export interface Report {
  id: string;
  analysis_id: string;
  content: string;
  biobert_validation: Record<string, unknown>;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface ReportFeedback {
  id: string;
  report_id: string;
  user_id: string;
  feedback_type: 'correct' | 'incorrect' | 'partial';
  comments: string;
  created_at: string;
}

export interface AnalysisWithDetails extends Analysis {
  pathology_findings: PathologyFinding[];
  report: Report | null;
}
