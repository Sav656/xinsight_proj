# X-Insight Workflow Guide

## Complete User Journey

### 1. Authentication
- **Sign Up**: Create account with email and password (minimum 6 characters)
- **Sign In**: Login with your credentials
- Session persists automatically via Supabase

### 2. Patient Management
- **Add Patient**: Click "Add Patient" button to create new patient record
  - Patient ID (required, unique)
  - Full Name (required)
  - Date of Birth (optional)
  - Gender (optional)
- **Patient Registry**: Search and browse all patients
- **Patient Profile**: View complete history of analyses for each patient

### 3. X-Ray Analysis Upload
After selecting a patient, you have two options:

#### Option A: Upload from Dashboard
1. Click the **Upload icon** button on a patient in the list
2. Drop or select an X-ray image file (PNG, JPG, DICOM)
3. Click "Upload & Analyze"
4. System creates analysis record and stores image

#### Option B: Upload from Patient Profile
1. Navigate to patient profile
2. Scroll to "Upload X-Ray Image" section
3. Select image and click "Upload & Analyze"

**Supported Formats**: PNG, JPG, DICOM (max 10MB)

### 4. Analysis Results Screen
After upload, view analysis results with 4 tabs:

#### Tab 1: X-Ray Image
- Original uploaded chest X-ray
- Full resolution view

#### Tab 2: Findings
- **Pathology Findings Grid**: Display of detected conditions
  - Condition name
  - Confidence score (0-100%)
  - Color coding (red = abnormal, gray = normal)
  - Grad-CAM heatmaps (visual attention maps)
  
#### Tab 3: Report
- **Report Editor**: Edit clinical narrative
- **Status**: Draft or Finalized
- **Version Tracking**: Track report edits
- **Actions**:
  - Save Draft: Save without finalizing
  - Finalize Report: Lock report and mark analysis complete

#### Tab 4: Verify (Human-in-the-Loop)
- **Pathology Verification**:
  - Mark each finding as "Correct" or "Incorrect"
  - Add clinical notes for each condition
  - Track verification status
  
- **Report Validation**:
  - Rate report accuracy: Accurate / Partial / Inaccurate
  - Add comments for model improvement
  - BioBERT semantic validation feedback

### 5. PDF Export
- Click **"Export PDF"** button (top-right of results)
- Generates professional medical document containing:
  - Patient information header
  - Analysis date and status
  - All pathology findings with confidence scores
  - Complete clinical report
  - X-Insight branding and disclaimer
- Opens print dialog automatically
- Can be saved to PDF or printed directly

### 6. Print Optimization
- Results page is fully optimized for printing
- Press **Ctrl+P** (or Cmd+P on Mac) from any results view
- Removes navigation elements automatically
- Preserves colors and formatting
- Professional medical document layout

### 7. Analysis History
- **Dashboard View**: See all analyses across all patients
- **Patient View**: See analyses for specific patient
- **Filter Options**:
  - Search by patient name or ID
  - Filter by status (All / Drafts / Finalized)
- **Indicators**:
  - Red icon = abnormal findings detected
  - Green icon = normal findings
  - Timestamp and primary findings displayed

## Key Features

### Data Persistence
- All patients, analyses, and reports stored in Supabase
- Survives page refresh and browser restart
- Full audit trail with timestamps
- Version history for reports

### Security
- Row-level security (RLS) on all tables
- Users only access their own data
- Encrypted connections
- Secure file storage in Supabase

### Professional Workflow
- Draft/finalize workflow prevents accidental changes
- Version control for report edits
- Human verification loop for model improvement
- BioBERT validation for semantic correctness

### Integration Ready
- API structure ready for FastAPI backend
- Pathology findings table ready for model results
- Heatmap URLs ready for Grad-CAM images
- Report validation field ready for BioBERT scores

## Integration with FastAPI Backend

When your backend is ready, the workflow will be:

1. **Upload triggers analysis**:
   - Frontend sends image to FastAPI
   - Backend runs DenseNet121 model
   - Returns confidence scores for 14 conditions

2. **Backend populates findings**:
   ```
   POST /api/analyze
   - Input: image file + analysis_id
   - Output: pathology_findings, heatmap URLs
   - Updates analyses table
   ```

3. **BioBERT validation**:
   - Backend validates findings semantically
   - Returns validation scores
   - Stores in biobert_validation JSON field

4. **Llama 3 report generation**:
   - Backend generates clinical narrative
   - Creates or updates report record
   - Report ready for doctor editing

5. **Doctor verification**:
   - Doctor edits report if needed
   - Verifies each finding (correct/incorrect)
   - Finalizes analysis
   - Provides feedback for model retraining

## Database Schema

### Key Tables
- **patients**: Patient demographics
- **analyses**: X-ray analysis records with image URLs
- **pathology_findings**: Detected conditions with confidence scores
- **reports**: Clinical narratives with version tracking
- **report_feedback**: Doctor feedback for model improvement

All tables have RLS policies ensuring data privacy and security.
