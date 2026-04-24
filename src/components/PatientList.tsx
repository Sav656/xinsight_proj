import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Patient } from '../types/database';
import { Search, User, Calendar, Activity, Upload } from 'lucide-react';

interface PatientListProps {
  onSelectPatient: (patient: Patient) => void;
  onUpload?: (patient: Patient) => void;
  refreshTrigger: number;
}

export function PatientList({ onSelectPatient, onUpload, refreshTrigger }: PatientListProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPatients();
  }, [refreshTrigger]);

  const fetchPatients = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPatients(data);
    }
    setLoading(false);
  };

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.patient_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Patient Registry</h2>
          <span className="text-sm text-slate-400">{patients.length} patients</span>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or ID..."
            className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      <div className="max-h-[500px] overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center text-slate-400">
            <Activity className="w-8 h-8 mx-auto mb-2 animate-pulse" />
            <p>Loading patients...</p>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{searchQuery ? 'No patients found' : 'No patients yet'}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {filteredPatients.map((patient) => (
              <div
                key={patient.id}
                className="flex items-center gap-2 p-4 hover:bg-slate-700/50 transition-colors group"
              >
                <button
                  onClick={() => onSelectPatient(patient)}
                  className="flex-1 flex items-center gap-3 text-left"
                >
                  <div className="w-10 h-10 bg-teal-500/20 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-teal-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{patient.name}</p>
                    <p className="text-sm text-slate-400">ID: {patient.patient_id}</p>
                  </div>
                </button>
                <div className="text-right mr-2 hidden sm:block">
                  {patient.date_of_birth && (
                    <p className="text-sm text-slate-400">
                      {calculateAge(patient.date_of_birth)} years old
                    </p>
                  )}
                  {patient.gender && (
                    <p className="text-xs text-slate-500 capitalize">{patient.gender}</p>
                  )}
                </div>
                {onUpload && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpload(patient);
                    }}
                    className="p-2 text-slate-400 hover:text-teal-400 hover:bg-teal-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="Upload X-ray"
                  >
                    <Upload className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
