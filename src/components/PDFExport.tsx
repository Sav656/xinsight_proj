import { useState } from 'react';
import { AnalysisWithDetails } from '../types/database';
import { FileDown, Activity } from 'lucide-react';

interface PDFExportProps {
  analysis: AnalysisWithDetails;
}

export function PDFExport({ analysis }: PDFExportProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to export PDF');
      setExporting(false);
      return;
    }

    const patientName = analysis.patient?.name || 'Unknown Patient';
    const patientId = analysis.patient?.patient_id || 'N/A';
    const date = new Date(analysis.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const findings = analysis.pathology_findings || [];
    const report = analysis.report?.content || 'No report available';

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>X-Insight Report - ${patientName}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      background: #ffffff;
      padding: 40px;
    }
    .header {
      border-bottom: 3px solid #0d9488;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
    }
    .logo-icon {
      width: 48px;
      height: 48px;
      background: #0d9488;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .logo-icon svg {
      width: 28px;
      height: 28px;
      fill: white;
    }
    .logo-text h1 {
      font-size: 28px;
      font-weight: 700;
      color: #0f172a;
    }
    .logo-text p {
      font-size: 14px;
      color: #64748b;
    }
    .report-title {
      font-size: 24px;
      font-weight: 600;
      color: #0f172a;
      margin-top: 20px;
    }
    .patient-info {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-bottom: 30px;
      padding: 20px;
      background: #f8fafc;
      border-radius: 12px;
    }
    .info-item {
      display: flex;
      flex-direction: column;
    }
    .info-label {
      font-size: 12px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .info-value {
      font-size: 16px;
      font-weight: 500;
      color: #0f172a;
      margin-top: 4px;
    }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e2e8f0;
    }
    .findings-grid {
      display: grid;
      gap: 12px;
    }
    .finding-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: #f8fafc;
      border-radius: 8px;
      border-left: 4px solid #0d9488;
    }
    .finding-item.abnormal {
      border-left-color: #ef4444;
      background: #fef2f2;
    }
    .finding-name {
      font-weight: 500;
      color: #0f172a;
    }
    .finding-confidence {
      font-size: 14px;
      font-weight: 600;
      color: #64748b;
    }
    .report-content {
      background: #f8fafc;
      padding: 20px;
      border-radius: 12px;
      white-space: pre-wrap;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      line-height: 1.8;
      color: #334155;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e2e8f0;
      text-align: center;
      color: #64748b;
      font-size: 12px;
    }
    .footer p {
      margin: 4px 0;
    }
    @media print {
      body {
        padding: 20px;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">
      <div class="logo-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
        </svg>
      </div>
      <div class="logo-text">
        <h1>X-Insight</h1>
        <p>AI-Powered Chest X-Ray Analysis</p>
      </div>
    </div>
    <h2 class="report-title">Radiology Report</h2>
  </div>

  <div class="patient-info">
    <div class="info-item">
      <span class="info-label">Patient Name</span>
      <span class="info-value">${patientName}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Patient ID</span>
      <span class="info-value">${patientId}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Analysis Date</span>
      <span class="info-value">${date}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Status</span>
      <span class="info-value" style="text-transform: capitalize;">${analysis.status}</span>
    </div>
  </div>

  <div class="section">
    <h3 class="section-title">Pathology Findings</h3>
    <div class="findings-grid">
      ${findings.length > 0 ? findings.map(f => `
        <div class="finding-item ${f.confidence > 0.5 ? 'abnormal' : ''}">
          <span class="finding-name">${f.condition}</span>
          <span class="finding-confidence">${(f.confidence * 100).toFixed(1)}%</span>
        </div>
      `).join('') : '<p style="color: #64748b;">No pathology findings recorded.</p>'}
    </div>
  </div>

  <div class="section">
    <h3 class="section-title">Clinical Report</h3>
    <div class="report-content">${report}</div>
  </div>

  <div class="footer">
    <p>Generated by X-Insight AI System</p>
    <p>Report ID: ${analysis.id}</p>
    <p>This report is for clinical reference only. Final diagnosis should be made by a qualified physician.</p>
  </div>

  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    setExporting(false);
  };

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-700/50 text-white font-medium rounded-lg transition-all"
    >
      {exporting ? (
        <Activity className="w-4 h-4 animate-pulse" />
      ) : (
        <FileDown className="w-4 h-4" />
      )}
      {exporting ? 'Exporting...' : 'Export PDF'}
    </button>
  );
}
