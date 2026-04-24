import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Patient, AnalysisWithDetails } from '../types/database';
import { ArrowLeft, User, Calendar, Activity, FileText, Clock } from 'lucide-react';

interface PatientProfileProps {
  patient: Patient;
  onBack: () => void;
  onSelectAnalysis: (analysis: AnalysisWithDetails) => void;
}

export function PatientProfile({ patient, onBack, onSelectAnalysis }: PatientProfileProps) {
  const [analyses, setAnalyses] = useState<AnalysisWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatientHistory();
  }, [patient.id]);

  const fetchPatientHistory = async () => {
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
        pathology_findings (*),
        reports (*)
      `)
      .eq('user_id', user.id)
      .eq('patient_id', patient.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAnalyses(data as AnalysisWithDetails[]);
    }
    setLoading(false);
  };

  const calculateAge = (dob: string | null) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
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

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Patients</span>
      </button>

      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-teal-500/20 rounded-xl flex items-center justify-center">
              <User className="w-8 h-8 text-teal-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{patient.name}</h2>
              <p className="text-slate-400">Patient ID: {patient.patient_id}</p>
            </div>
          </div>
          <div className="text-right space-y-1">
            {patient.date_of_birth && (
              <div className="flex items-center gap-2 text-slate-400">
                <Calendar className="w-4 h-4" />
                <span>{calculateAge(patient.date_of_birth)} years old</span>
              </div>
            )}
            {patient.gender && (
              <p className="text-slate-400 capitalize">{patient.gender}</p>
            )}
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <Clock className="w-4 h-4" />
              <span>Added {formatDate(patient.created_at)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">Analysis History</h3>
            <span className="text-sm text-slate-400">{analyses.length} analyses</span>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400">
            <Activity className="w-8 h-8 mx-auto mb-2 animate-pulse" />
            <p>Loading history...</p>
          </div>
        ) : analyses.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No analyses yet for this patient</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {analyses.map((analysis) => (
              <button
                key={analysis.id}
                onClick={() => onSelectAnalysis(analysis)}
                className="w-full p-4 hover:bg-slate-700/50 transition-colors text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      analysis.status === 'finalized'
                        ? 'bg-green-500/20'
                        : 'bg-amber-500/20'
                    }`}>
                      <FileText className={`w-5 h-5 ${
                        analysis.status === 'finalized'
                          ? 'text-green-400'
                          : 'text-amber-400'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium text-white">
                        {formatDate(analysis.created_at)}
                      </p>
                      <p className="text-sm text-slate-400">
                        {getPrimaryFindings(analysis)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
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
