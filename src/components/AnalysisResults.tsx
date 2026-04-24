import { useState } from 'react';
import { AnalysisWithDetails } from '../types/database';
import { ReportEditor } from './ReportEditor';
import { FeedbackSystem } from './FeedbackSystem';
import { PDFExport } from './PDFExport';
import { FileText, Image as ImageIcon, Zap, AlertCircle } from 'lucide-react';

interface AnalysisResultsProps {
  analysis: AnalysisWithDetails;
  onUpdate: () => void;
}

type ResultsTab = 'image' | 'findings' | 'report' | 'feedback';

export function AnalysisResults({ analysis, onUpdate }: AnalysisResultsProps) {
  const [activeTab, setActiveTab] = useState<ResultsTab>('findings');

  const hasAbnormalFindings = analysis.pathology_findings?.some((f) => f.confidence > 0.5) ?? false;

  return (
    <div className="space-y-6">
      <div className={`rounded-2xl border overflow-hidden ${
        hasAbnormalFindings
          ? 'bg-red-500/5 border-red-500/20'
          : 'bg-green-500/5 border-green-500/20'
      }`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                hasAbnormalFindings
                  ? 'bg-red-500/20'
                  : 'bg-green-500/20'
              }`}>
                <AlertCircle className={`w-6 h-6 ${
                  hasAbnormalFindings
                    ? 'text-red-400'
                    : 'text-green-400'
                }`} />
              </div>
              <div>
                <h3 className={`text-lg font-semibold ${
                  hasAbnormalFindings
                    ? 'text-red-300'
                    : 'text-green-300'
                }`}>
                  {hasAbnormalFindings ? 'Abnormalities Detected' : 'No Abnormalities'}
                </h3>
                <p className="text-sm text-slate-400">
                  {analysis.pathology_findings?.length || 0} conditions analyzed
                </p>
              </div>
            </div>
            <PDFExport analysis={analysis} />
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
        <div className="border-b border-slate-700">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => setActiveTab('image')}
              className={`flex-1 px-4 py-4 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'image'
                  ? 'border-teal-500 text-teal-400 bg-teal-500/5'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <ImageIcon className="w-4 h-4" />
                <span className="hidden sm:inline">X-Ray Image</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('findings')}
              className={`flex-1 px-4 py-4 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'findings'
                  ? 'border-teal-500 text-teal-400 bg-teal-500/5'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Zap className="w-4 h-4" />
                <span className="hidden sm:inline">Findings</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('report')}
              className={`flex-1 px-4 py-4 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'report'
                  ? 'border-teal-500 text-teal-400 bg-teal-500/5'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Report</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('feedback')}
              className={`flex-1 px-4 py-4 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'feedback'
                  ? 'border-teal-500 text-teal-400 bg-teal-500/5'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Verify</span>
              </div>
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'image' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Original X-Ray Image</h3>
              {analysis.image_url ? (
                <div className="bg-black rounded-lg overflow-hidden max-h-96 flex items-center justify-center">
                  <img
                    src={analysis.image_url}
                    alt="X-Ray"
                    className="max-w-full max-h-96 object-contain"
                  />
                </div>
              ) : (
                <p className="text-slate-400">No image available</p>
              )}
            </div>
          )}

          {activeTab === 'findings' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Pathology Findings</h3>
              {analysis.pathology_findings && analysis.pathology_findings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysis.pathology_findings.map((finding) => (
                    <div
                      key={finding.id}
                      className={`p-4 rounded-lg border ${
                        finding.confidence > 0.5
                          ? 'bg-red-500/10 border-red-500/30'
                          : 'bg-slate-700/50 border-slate-600'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-semibold text-white">{finding.condition}</p>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          finding.confidence > 0.5
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-slate-600/50 text-slate-300'
                        }`}>
                          {(finding.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                      {finding.heatmap_url && (
                        <div className="mt-3 bg-black rounded overflow-hidden max-h-40">
                          <img
                            src={finding.heatmap_url}
                            alt={`${finding.condition} heatmap`}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                      <div className={`mt-2 text-xs ${
                        finding.is_verified
                          ? 'text-green-400'
                          : 'text-slate-400'
                      }`}>
                        {finding.is_verified && `✓ Verified as ${finding.verification_status}`}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400">No findings detected</p>
              )}
            </div>
          )}

          {activeTab === 'report' && (
            <ReportEditor analysis={analysis} onUpdate={onUpdate} />
          )}

          {activeTab === 'feedback' && (
            <FeedbackSystem
              report={analysis.report || null}
              findings={analysis.pathology_findings || []}
              onUpdate={onUpdate}
            />
          )}
        </div>
      </div>
    </div>
  );
}
