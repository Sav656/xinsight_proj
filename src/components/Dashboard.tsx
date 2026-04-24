import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Patient } from '../types/database';
import { PatientForm } from './PatientForm';
import { PatientList } from './PatientList';
import { PatientProfile } from './PatientProfile';
import { AnalysisHistory } from './AnalysisHistory';
import { AnalysisResults } from './AnalysisResults';
import { ImageUpload } from './ImageUpload';
import { AnalysisWithDetails } from '../types/database';
import { Activity, UserPlus, FileText, LogOut, Search } from 'lucide-react';

type View = 'dashboard' | 'patient' | 'analysis' | 'upload' | 'results';

export function Dashboard() {
  const { user, signOut } = useAuth();
  const [view, setView] = useState<View>('dashboard');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisWithDetails | null>(null);
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [newAnalysisId, setNewAnalysisId] = useState<string | null>(null);

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setView('patient');
  };

  const handleSelectAnalysis = (analysis: AnalysisWithDetails) => {
    setSelectedAnalysis(analysis);
    setView('analysis');
  };

  const handleUpload = (patient: Patient) => {
    setSelectedPatient(patient);
    setView('upload');
  };

  const handleAnalysisCreated = async (analysisId: string, imageUrl: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('analyses')
      .select(`
        *,
        pathology_findings (*),
        reports (*)
      `)
      .eq('id', analysisId)
      .single();

    if (!error && data) {
      setSelectedAnalysis(data as AnalysisWithDetails);
      setNewAnalysisId(analysisId);
      setRefreshTrigger(prev => prev + 1);
      setView('results');
    }
  };

  const handleBackToDashboard = () => {
    setView('dashboard');
    setSelectedPatient(null);
    setSelectedAnalysis(null);
    setNewAnalysisId(null);
  };

  const handleBackToPatient = () => {
    setView('patient');
    setSelectedAnalysis(null);
  };

  const handlePatientCreated = () => {
    setShowPatientForm(false);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleUpdateAnalysis = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="bg-slate-800/50 backdrop-blur-xl border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">X-Insight</h1>
                <p className="text-xs text-slate-400">AI-Powered CXR Analysis</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">
                  {user?.email}
                </p>
                <p className="text-xs text-slate-400">Radiologist</p>
              </div>
              <button
                onClick={signOut}
                className="p-2 text-slate-400 hover:text-white transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Clinical Dashboard</h2>
                <p className="text-slate-400 mt-1">Manage patients and view analysis history</p>
              </div>
              <button
                onClick={() => setShowPatientForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-lg transition-all"
              >
                <UserPlus className="w-5 h-5" />
                Add Patient
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <PatientList
                  onSelectPatient={handleSelectPatient}
                  onUpload={handleUpload}
                  refreshTrigger={refreshTrigger}
                />
              </div>
              <AnalysisHistory
                onSelectAnalysis={handleSelectAnalysis}
                refreshTrigger={refreshTrigger}
              />
            </div>
          </div>
        )}

        {view === 'patient' && selectedPatient && (
          <div className="space-y-6">
            <PatientProfile
              patient={selectedPatient}
              onBack={handleBackToDashboard}
              onSelectAnalysis={handleSelectAnalysis}
            />
            <ImageUpload
              patientId={selectedPatient.id}
              onAnalysisCreated={handleAnalysisCreated}
            />
          </div>
        )}

        {view === 'upload' && selectedPatient && (
          <div className="space-y-6">
            <button
              onClick={handleBackToDashboard}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <Search className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
            <ImageUpload
              patientId={selectedPatient.id}
              onAnalysisCreated={handleAnalysisCreated}
            />
          </div>
        )}

        {view === 'results' && newAnalysisId && selectedAnalysis && (
          <div className="space-y-6">
            <button
              onClick={handleBackToDashboard}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <Search className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
            <AnalysisResults
              analysis={selectedAnalysis}
              onUpdate={handleUpdateAnalysis}
            />
          </div>
        )}

        {view === 'analysis' && selectedAnalysis && (
          <div className="space-y-6">
            <button
              onClick={selectedPatient ? handleBackToPatient : handleBackToDashboard}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <Search className="w-5 h-5" />
              <span>Back to {selectedPatient ? 'Patient' : 'Dashboard'}</span>
            </button>

            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {selectedAnalysis.patient?.name || 'Unknown Patient'}
                  </h2>
                  <p className="text-slate-400">
                    ID: {selectedAnalysis.patient?.patient_id || 'N/A'} •
                    Analysis Date: {new Date(selectedAnalysis.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedAnalysis.status === 'finalized'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {selectedAnalysis.status}
                  </span>
                </div>
              </div>

              {selectedAnalysis.pathology_findings && selectedAnalysis.pathology_findings.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-3">Detected Conditions</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {selectedAnalysis.pathology_findings.map((finding) => (
                      <div
                        key={finding.id}
                        className={`p-3 rounded-lg ${
                          finding.confidence > 0.5
                            ? 'bg-red-500/10 border border-red-500/30'
                            : 'bg-slate-700/50 border border-slate-600'
                        }`}
                      >
                        <p className="font-medium text-white text-sm">{finding.condition}</p>
                        <p className={`text-xs ${
                          finding.confidence > 0.5 ? 'text-red-400' : 'text-slate-400'
                        }`}>
                          {(finding.confidence * 100).toFixed(1)}% confidence
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Analysis Details</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Analysis ID</span>
                      <span className="text-white font-mono text-sm">{selectedAnalysis.id.slice(0, 8)}...</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Created</span>
                      <span className="text-white">{new Date(selectedAnalysis.created_at).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Findings</span>
                      <span className="text-white">{selectedAnalysis.pathology_findings?.length || 0} conditions</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Report Version</span>
                      <span className="text-white">v{selectedAnalysis.report?.version || 1}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Actions</h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => window.print()}
                      className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-all"
                    >
                      Print Report
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Clinical Report</h3>
                  {selectedAnalysis.report ? (
                    <div className="bg-slate-900/50 border border-slate-600 rounded-lg p-4">
                      <pre className="text-slate-300 text-sm whitespace-pre-wrap font-mono">
                        {selectedAnalysis.report.content}
                      </pre>
                    </div>
                  ) : (
                    <p className="text-slate-400">No report available</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {showPatientForm && (
        <PatientForm
          onClose={() => setShowPatientForm(false)}
          onSuccess={handlePatientCreated}
        />
      )}
    </div>
  );
}
