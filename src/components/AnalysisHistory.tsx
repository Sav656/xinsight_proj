import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AnalysisWithDetails } from '../types/database';
import { Search, FileText, Activity, Clock, AlertCircle } from 'lucide-react';

interface AnalysisHistoryProps {
  onSelectAnalysis: (analysis: AnalysisWithDetails) => void;
  refreshTrigger: number;
}

export function AnalysisHistory({ onSelectAnalysis, refreshTrigger }: AnalysisHistoryProps) {
  const [analyses, setAnalyses] = useState<AnalysisWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'finalized'>('all');

  useEffect(() => {
    fetchAnalyses();
  }, [refreshTrigger]);

  const fetchAnalyses = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('analyses')
      .select(`
        *,
        patient:patients (*),
        pathology_findings (*),
        reports (*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAnalyses(data as AnalysisWithDetails[]);
    }
    setLoading(false);
  };

  const filteredAnalyses = analyses.filter((analysis) => {
    const matchesStatus = statusFilter === 'all' || analysis.status === statusFilter;
    const matchesSearch =
      searchQuery === '' ||
      analysis.patient?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      analysis.patient?.patient_id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPrimaryFindings = (analysis: AnalysisWithDetails) => {
    if (!analysis.pathology_findings || analysis.pathology_findings.length === 0) {
      return 'No findings';
    }
    const topFindings = analysis.pathology_findings
      .filter((f) => f.confidence > 0.5)
      .slice(0, 3)
      .map((f) => f.condition);
    return topFindings.length > 0 ? topFindings.join(', ') : 'No significant findings';
  };

  const hasAbnormalFindings = (analysis: AnalysisWithDetails) => {
    if (!analysis.pathology_findings) return false;
    return analysis.pathology_findings.some((f) => f.confidence > 0.5);
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Analysis History</h2>
          <span className="text-sm text-slate-400">{analyses.length} analyses</span>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by patient..."
              className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'draft' | 'finalized')}
            className="px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">All Status</option>
            <option value="draft">Drafts</option>
            <option value="finalized">Finalized</option>
          </select>
        </div>
      </div>

      <div className="max-h-[600px] overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center text-slate-400">
            <Activity className="w-8 h-8 mx-auto mb-2 animate-pulse" />
            <p>Loading analyses...</p>
          </div>
        ) : filteredAnalyses.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{searchQuery || statusFilter !== 'all' ? 'No analyses found' : 'No analyses yet'}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {filteredAnalyses.map((analysis) => (
              <button
                key={analysis.id}
                onClick={() => onSelectAnalysis(analysis)}
                className="w-full p-4 hover:bg-slate-700/50 transition-colors text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      hasAbnormalFindings(analysis)
                        ? 'bg-red-500/20'
                        : 'bg-green-500/20'
                    }`}>
                      {hasAbnormalFindings(analysis) ? (
                        <AlertCircle className="w-5 h-5 text-red-400" />
                      ) : (
                        <FileText className="w-5 h-5 text-green-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-white">
                        {analysis.patient?.name || 'Unknown Patient'}
                      </p>
                      <p className="text-sm text-slate-400">
                        {getPrimaryFindings(analysis)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatDate(analysis.created_at)}</span>
                    </div>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      analysis.status === 'finalized'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {analysis.status}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
