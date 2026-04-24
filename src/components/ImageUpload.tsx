import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Upload, AlertCircle, CheckCircle, Activity } from 'lucide-react';

interface ImageUploadProps {
  patientId: string | null;
  onAnalysisCreated: (analysisId: string, imageUrl: string) => void;
}

export function ImageUpload({ patientId, onAnalysisCreated }: ImageUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setFile(selectedFile);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('Not authenticated');
      setUploading(false);
      return;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('xray-images')
      .upload(filePath, file);

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage
      .from('xray-images')
      .getPublicUrl(filePath);

    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .insert({
        user_id: user.id,
        patient_id: patientId || null,
        image_url: data.publicUrl,
        status: 'draft',
      })
      .select()
      .single();

    if (analysisError) {
      setError(analysisError.message);
      setUploading(false);
      return;
    }

    onAnalysisCreated(analysis.id, data.publicUrl);
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setUploading(false);
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-teal-500/20 rounded-lg flex items-center justify-center">
            <Upload className="w-5 h-5 text-teal-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Upload X-Ray Image</h3>
        </div>
        <p className="text-sm text-slate-400">
          {patientId ? 'Upload a chest X-ray for analysis' : 'Select a patient first, then upload an X-ray'}
        </p>
      </div>

      <div className="p-6">
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            uploading
              ? 'border-slate-600 bg-slate-900/50 cursor-not-allowed'
              : 'border-teal-500/50 hover:border-teal-500 bg-teal-500/5 hover:bg-teal-500/10 cursor-pointer'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />

          {preview ? (
            <div className="space-y-4">
              <img
                src={preview}
                alt="Preview"
                className="max-h-64 mx-auto rounded-lg"
              />
              <p className="text-sm text-slate-300 font-medium">{file?.name}</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="w-12 h-12 text-teal-400 mx-auto opacity-50" />
              <div>
                <p className="text-white font-medium">Drop X-ray image here</p>
                <p className="text-sm text-slate-400">or click to browse</p>
              </div>
              <p className="text-xs text-slate-500">PNG, JPG, DICOM • Max 10MB</p>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {preview && (
          <div className="mt-4 space-y-3">
            <button
              onClick={() => {
                setFile(null);
                setPreview(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              className="w-full py-2 text-slate-400 hover:text-white text-sm font-medium transition-colors"
            >
              Choose Different File
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading || !patientId}
              className="w-full py-3 bg-teal-500 hover:bg-teal-600 disabled:bg-teal-500/50 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Activity className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Upload & Analyze
                </>
              )}
            </button>
          </div>
        )}

        {!patientId && (
          <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/50 rounded-lg text-amber-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Please select a patient before uploading
          </div>
        )}
      </div>
    </div>
  );
}
