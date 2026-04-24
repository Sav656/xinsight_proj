import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { PathologyFinding, Report, ReportFeedback } from '../types/database';
import { CheckCircle, XCircle, AlertCircle, MessageSquare } from 'lucide-react';

interface FeedbackSystemProps {
  report: Report | null;
  findings: PathologyFinding[];
  onUpdate: () => void;
}

export function FeedbackSystem({ report, findings, onUpdate }: FeedbackSystemProps) {
  const [feedback, setFeedback] = useState<Record<string, 'correct' | 'incorrect' | 'pending'>>({});
  const [doctorNotes, setDoctorNotes] = useState<Record<string, string>>({});
  const [reportFeedback, setReportFeedback] = useState<'correct' | 'incorrect' | 'partial' | null>(null);
  const [reportComments, setReportComments] = useState('');
  const [saving, setSaving] = useState(false);

  const handleFindingFeedback = async (findingId: string, status: 'correct' | 'incorrect') => {
    setSaving(true);

    const { error } = await supabase
      .from('pathology_findings')
      .update({
        verification_status: status,
        is_verified: true,
        doctor_notes: doctorNotes[findingId] || '',
      })
      .eq('id', findingId);

    if (!error) {
      setFeedback({ ...feedback, [findingId]: status });
      onUpdate();
    }
    setSaving(false);
  };

  const handleReportFeedback = async (type: 'correct' | 'incorrect' | 'partial') => {
    if (!report) return;

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from('report_feedback')
      .insert({
        report_id: report.id,
        user_id: user.id,
        feedback_type: type,
        comments: reportComments,
      });

    if (!error) {
      setReportFeedback(type);
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white">Pathology Verification</h3>
          <p className="text-sm text-slate-400 mt-1">
            Verify each AI-flagged condition to improve model accuracy
          </p>
        </div>

        <div className="divide-y divide-slate-700">
          {findings.length === 0 ? (
            <div className="p-6 text-center text-slate-400">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No pathology findings to verify</p>
            </div>
          ) : (
            findings.map((finding) => (
              <div key={finding.id} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      finding.confidence > 0.5
                        ? 'bg-red-500/20'
                        : 'bg-green-500/20'
                    }`}>
                      <span className={`text-sm font-bold ${
                        finding.confidence > 0.5
                          ? 'text-red-400'
                          : 'text-green-400'
                      }`}>
                        {(finding.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-white">{finding.condition}</p>
                      <p className="text-xs text-slate-400">
                        {finding.verification_status === 'pending' ? 'Pending verification' :
                         finding.verification_status === 'correct' ? 'Verified as correct' : 'Verified as incorrect'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <textarea
                    value={doctorNotes[finding.id] || finding.doctor_notes || ''}
                    onChange={(e) => setDoctorNotes({ ...doctorNotes, [finding.id]: e.target.value })}
                    placeholder="Add clinical notes..."
                    rows={2}
                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm resize-none"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleFindingFeedback(finding.id, 'correct')}
                    disabled={saving || finding.verification_status === 'correct'}
                    className={`flex-1 py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all ${
                      finding.verification_status === 'correct'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                        : 'bg-slate-700 hover:bg-green-500/20 hover:text-green-400 text-slate-300'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Correct
                  </button>
                  <button
                    onClick={() => handleFindingFeedback(finding.id, 'incorrect')}
                    disabled={saving || finding.verification_status === 'incorrect'}
                    className={`flex-1 py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all ${
                      finding.verification_status === 'incorrect'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                        : 'bg-slate-700 hover:bg-red-500/20 hover:text-red-400 text-slate-300'
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    Incorrect
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {report && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-700">
            <h3 className="text-lg font-semibold text-white">Report Validation</h3>
            <p className="text-sm text-slate-400 mt-1">
              BioBERT semantic validation feedback
            </p>
          </div>

          <div className="p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Additional Comments
              </label>
              <textarea
                value={reportComments}
                onChange={(e) => setReportComments(e.target.value)}
                placeholder="Add any additional clinical observations..."
                rows={3}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm resize-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handleReportFeedback('correct')}
                disabled={saving || reportFeedback === 'correct'}
                className={`py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all ${
                  reportFeedback === 'correct'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                    : 'bg-slate-700 hover:bg-green-500/20 hover:text-green-400 text-slate-300'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                Accurate
              </button>
              <button
                onClick={() => handleReportFeedback('partial')}
                disabled={saving || reportFeedback === 'partial'}
                className={`py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all ${
                  reportFeedback === 'partial'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                    : 'bg-slate-700 hover:bg-amber-500/20 hover:text-amber-400 text-slate-300'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                Partial
              </button>
              <button
                onClick={() => handleReportFeedback('incorrect')}
                disabled={saving || reportFeedback === 'incorrect'}
                className={`py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all ${
                  reportFeedback === 'incorrect'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                    : 'bg-slate-700 hover:bg-red-500/20 hover:text-red-400 text-slate-300'
                }`}
              >
                <XCircle className="w-4 h-4" />
                Inaccurate
              </button>
            </div>

            {reportFeedback && (
              <div className="mt-4 p-3 bg-teal-500/10 border border-teal-500/50 rounded-lg text-teal-400 text-sm">
                Thank you for your feedback! This data helps improve our AI model accuracy.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
