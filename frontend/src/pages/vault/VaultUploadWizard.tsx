import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  UploadCloud,
  CheckCircle2,
  X,
  AlertCircle,
  Box
} from 'lucide-react';

import { vaultApi } from '../../api/vaultApi';

type UploadStep = 'select' | 'metadata' | 'access' | 'review' | 'uploading' | 'success';

export default function VaultUploadWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState<UploadStep>('select');
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<{name: string; description: string; category: string; type: string; visibility: 'Organization' | 'Private' | 'Public'}>({ name: '', description: '', category: 'Industrial Equipment', type: 'Document', visibility: 'Organization' });
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [error, setError] = useState<string>('');

  const handleNext = async () => {
    if (step === 'select' && file) setStep('metadata');
    else if (step === 'metadata') setStep('access');
    else if (step === 'access') setStep('review');
    else if (step === 'review' && file) {
      setStep('uploading');
      try {
        const result = await vaultApi.uploadAsset(file, metadata);
        setUploadId(result.id);
        setStep('success');
      } catch (err) {
        console.error(err);
        setError('Upload failed');
        setStep('review');
      }
    }
  };

  const handleBack = () => {
    if (step === 'metadata') setStep('select');
    else if (step === 'access') setStep('metadata');
    else if (step === 'review') setStep('access');
  };

  const StepIndicator = () => {
    const steps = ['File', 'Metadata', 'Access', 'Review'];
    const currentIndex = steps.findIndex(s => s.toLowerCase() === (step === 'uploading' || step === 'success' ? 'review' : step));
    
    return (
      <div className="flex items-center justify-between w-full max-w-2xl mx-auto mb-12">
        {steps.map((s, idx) => (
          <div key={s} className="flex flex-col items-center flex-1 relative">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold z-10 ${
              idx <= currentIndex ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400 border border-slate-200'
            }`}>
              {idx < currentIndex || step === 'success' ? <CheckCircle2 size={16} /> : idx + 1}
            </div>
            <span className={`text-[10px] uppercase tracking-wider font-bold mt-2 ${
              idx <= currentIndex ? 'text-slate-800' : 'text-slate-400'
            }`}>{s}</span>
            {idx < steps.length - 1 && (
              <div className={`absolute top-4 left-1/2 w-full h-[2px] -z-0 ${
                idx < currentIndex ? 'bg-emerald-500' : 'bg-slate-100'
              }`} />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-4xl h-full flex flex-col animate-in fade-in duration-300">
      <div className="mb-8 flex items-center justify-between">
        <button 
          onClick={() => navigate('/vault/assets')}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft size={16} />
          Cancel Upload
        </button>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Upload New Asset</h1>
        <div className="w-24"></div> {/* spacer */}
      </div>

      <StepIndicator />

      <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm p-8 flex flex-col min-h-[500px]">
        {/* STEP 1: SELECT */}
        {step === 'select' && (
          <div className="flex-1 flex flex-col items-center justify-center">
            <label className="w-full max-w-xl rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 p-12 text-center hover:bg-emerald-50 transition cursor-pointer">
              <input 
                type="file" 
                className="hidden" 
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    const f = e.target.files[0];
                    setFile(f);
                    setMetadata({ ...metadata, name: f.name.split('.')[0] });
                    // Basic type detection
                    if (f.name.endsWith('.glb') || f.name.endsWith('.obj')) setMetadata(m => ({...m, type: '3D Model'}));
                    else if (f.type.startsWith('image/')) setMetadata(m => ({...m, type: 'Image'}));
                    else if (f.type.startsWith('video/')) setMetadata(m => ({...m, type: 'Video'}));
                    else setMetadata(m => ({...m, type: 'Document'}));
                  }
                }} 
              />
              <UploadCloud size={48} className="mx-auto text-emerald-500 mb-4" />
              <h3 className="text-lg font-bold text-slate-900">{file ? file.name : 'Drag & drop your files here'}</h3>
              {!file && <p className="text-sm text-slate-500 mt-2 mb-6">or</p>}
              <div className="mt-4 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition inline-block">
                {file ? 'Change File' : 'Browse Files'}
              </div>
              <p className="text-[10px] text-slate-400 mt-6 font-semibold">
                Supported: GLB, OBJ, FBX, STEP, STL, DXF, JPG, PNG, MP4, PDF and more<br/>
                Max file size: 2 GB
              </p>
            </label>
          </div>
        )}

        {/* STEP 2: METADATA */}
        {step === 'metadata' && (
          <div className="flex-1 max-w-xl mx-auto w-full flex flex-col">
            <div className="space-y-6 flex-1">
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">Asset Name</label>
                <input type="text" value={metadata.name} onChange={e => setMetadata({...metadata, name: e.target.value})} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">Description</label>
                <textarea rows={4} value={metadata.description} onChange={e => setMetadata({...metadata, description: e.target.value})} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">Category</label>
                <select value={metadata.category} onChange={e => setMetadata({...metadata, category: e.target.value})} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500">
                  <option>Industrial Equipment</option>
                  <option>Architecture</option>
                  <option>Marketing</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">Tags</label>
                <div className="flex gap-2 mb-3">
                  <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    compressor <X size={12} className="cursor-pointer hover:text-red-500" />
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    industrial <X size={12} className="cursor-pointer hover:text-red-500" />
                  </span>
                </div>
                <input type="text" placeholder="Add tag and press enter..." className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: ACCESS */}
        {step === 'access' && (
          <div className="flex-1 max-w-xl mx-auto w-full flex flex-col">
            <div className="space-y-8 flex-1">
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-4">Visibility</h3>
                <div className="space-y-3">
                  <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${metadata.visibility === 'Organization' ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <input type="radio" name="vis" checked={metadata.visibility === 'Organization'} onChange={() => setMetadata({...metadata, visibility: 'Organization'})} className="text-emerald-600 focus:ring-emerald-500" />
                    <div>
                      <div className="text-sm font-bold text-emerald-900">Organization</div>
                      <div className="text-xs text-emerald-700">All organization members can view this asset</div>
                    </div>
                  </label>
                  <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${metadata.visibility === 'Private' ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <input type="radio" name="vis" checked={metadata.visibility === 'Private'} onChange={() => setMetadata({...metadata, visibility: 'Private'})} className="text-emerald-600 focus:ring-emerald-500" />
                    <div>
                      <div className="text-sm font-bold text-slate-900">Private</div>
                      <div className="text-xs text-slate-500">Only you and explicitly invited members</div>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-4">Default Permissions</h3>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <input type="checkbox" defaultChecked className="rounded text-emerald-600 focus:ring-emerald-500" /> View
                  </label>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <input type="checkbox" defaultChecked className="rounded text-emerald-600 focus:ring-emerald-500" /> Download
                  </label>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <input type="checkbox" className="rounded text-emerald-600 focus:ring-emerald-500" /> Edit Metadata
                  </label>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <input type="checkbox" className="rounded text-emerald-600 focus:ring-emerald-500" /> Manage Access
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: REVIEW */}
        {step === 'review' && (
          <div className="flex-1 max-w-xl mx-auto w-full flex flex-col justify-center">
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-4">
              <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
                 <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                   <Box size={24} />
                 </div>
                 <div>
                   <h3 className="text-lg font-bold text-slate-900">{metadata.name}</h3>
                   <p className="text-sm text-slate-500">{file?.name} • {metadata.type}</p>
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                 <div className="text-slate-500">Category</div>
                 <div className="font-semibold text-slate-900">{metadata.category}</div>
                 
                 <div className="text-slate-500">Visibility</div>
                 <div className="font-semibold text-slate-900">{metadata.visibility}</div>
              </div>
              {error && <div className="text-red-500 text-sm font-bold mt-2">{error}</div>}
              <div className="pt-4 flex items-start gap-2 text-xs text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-200">
                 <AlertCircle size={16} className="shrink-0 mt-0.5" />
                 This asset will undergo validation and processing. It may take a few minutes before it is fully available in the 3D Viewer.
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: UPLOADING */}
        {step === 'uploading' && (
          <div className="flex-1 max-w-md mx-auto w-full flex flex-col items-center justify-center text-center">
            <div className="w-full space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Processing Asset...</h3>
                <p className="text-sm text-slate-500">Please do not close this window</p>
              </div>
              
              <div className="space-y-4 text-left bg-slate-50 p-4 rounded-xl border border-slate-200">
                 <div>
                   <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                     <span>Uploading Compressor_Assembly.glb</span>
                     <span className="text-emerald-600">100%</span>
                   </div>
                   <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                     <div className="h-full bg-emerald-500 w-full" />
                   </div>
                 </div>
                 
                 <div>
                   <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                     <span>Validating geometry and textures</span>
                     <span className="text-blue-600">60%</span>
                   </div>
                   <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                     <div className="h-full bg-blue-500 w-[60%] animate-pulse" />
                   </div>
                 </div>

                 <div className="flex justify-between text-xs font-bold text-slate-400">
                     <span>Generating previews</span>
                     <span>Pending</span>
                 </div>
              </div>
            </div>
          </div>
        )}
        
        {/* STEP 6: SUCCESS */}
        {step === 'success' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-300">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-6">
              <CheckCircle2 size={40} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Asset Uploaded Successfully!</h3>
            <p className="text-sm text-slate-500 mb-8">{metadata.name} is now available in your Vault.</p>
            <div className="flex gap-4">
              <button 
                onClick={() => navigate(`/vault/assets/${uploadId}`)}
                className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition"
              >
                View Asset
              </button>
              <button 
                onClick={() => {
                  setStep('select');
                  setFile(null);
                  setMetadata({ name: '', description: '', category: 'Industrial Equipment', type: 'Document', visibility: 'Organization' });
                }}
                className="rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Upload Another
              </button>
            </div>
          </div>
        )}

        {/* BOTTOM NAVIGATION */}
        {step !== 'uploading' && step !== 'success' && (
          <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
            {step === 'select' ? (
              <div /> // empty div to keep Next button on right
            ) : (
              <button 
                onClick={handleBack}
                className="rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Back
              </button>
            )}
            
            <button 
              onClick={handleNext}
              className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition shadow-sm"
            >
              {step === 'review' ? 'Start Upload' : 'Next Step'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
