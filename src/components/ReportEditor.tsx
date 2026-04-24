import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AnalysisWithDetails, Report } from '../types/database';
import { Save, FileCheck, CreditCard as Edit3, AlertCircle } from 'lucide-react';

interface ReportEditorProps {
  analysis: AnalysisWithDetails;
  onUpdate: () => void;
}

export function ReportEditor({ analysis, onUpdate }: ReportEditorProps) {
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (analysis.report) {
      setContent(analysis.report.content);
    }
  }, [analysis.report]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('Not authenticated');
      setSaving(false);
      return;
    }

    if (analysis.report) {
      const { error: updateError } = await supabase
        .from('reports')
        .update({
          content,
          version: (analysis.report.version || 1) + 1,
        })
        .eq('id', analysis.report.id);

      if (updateError) {
        setError(updateError.message);
      } else {
        setSuccess('Report saved successfully');
        onUpdate();
      }
    } else {
      const { error: insertError } = await supabase
        .from('reports')
        .insert({
          analysis_id: analysis.id,
          content,
          biobert_validation: {},
        });

      if (insertError) {
        setError(insertError.message);
      } else {
        setSuccess('Report created successfully');
        onUpdate();
      }
    }

    setSaving(false);
  };

  const handleFinalize = async () => {
    setFinalizing(true);
    setError(null);

    const { error: updateError } = await supabase
      .from('analyses')
      .update({ status: 'finalized' })
      .eq('id', analysis.id);

    if (updateError) {
      setError(updateError.message);
      setFinalizing(false);
      return;
    }

    await handleSave();
    onUpdate();
    setFinalizing(false);
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-500/20 rounded-lg flex items-center justify-center">
              <Edit3 className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Clinical Report</h3>
              {analysis.report && (
                <p className="text-sm text-slate-400">Version {analysis.report.version}</p>
              )}
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            analysis.status === 'finalized'
              ? 'bg-green-500/20 text-green-400'
              : 'bg-amber-500/20 text-amber-400'
          }`}>
            {analysis.status}
          </span>
        </div>
      </div>

      <div className="p-6">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={analysis.status === 'finalized'}
          rows={20}
          className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono text-sm resize-none"
          placeholder="Enter clinical report content..."
        />

        {error && (
          <div className="mt-4 bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {success && (
          <div className="mt-4 bg-green-500/10 border border-green-500/50 rounded-lg p-3 text-green-400 text-sm">
            {success}
          </div>
        )}

        <div className="flex gap-3 mt-4">
          {analysis.status !== 'finalized' && (
            <>
              <button
                onClick={handleSave}
                disabled={saving || finalizing}
                className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-700/50 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                onClick={handleFinalize}
                disabled={saving || finalizing}
                className="flex-1 py-3 bg-teal-500 hover:bg-teal-600 disabled:bg-teal-500/50 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <FileCheck className="w-4 h-4" />
                {finalizing ? 'Finalizing...' : 'Finalize Report'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
