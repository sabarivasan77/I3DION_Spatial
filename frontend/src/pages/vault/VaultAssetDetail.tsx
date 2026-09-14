import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Edit,
  Box,
  CheckCircle2,
  Tag,
  FileBox,
  UploadCloud,
  Trash2,
  Save,
  ShieldCheck,
  Share2,
  RotateCcw,
  Sparkles,
  Layers
} from 'lucide-react';
import { vaultApi, VaultAsset } from '../../api/vaultApi';
import { VaultShareModal } from '../../components/vault/VaultShareModal';

export default function VaultAssetDetail() {
  const { assetId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Overview');
  const [asset, setAsset] = useState<VaultAsset | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState<'Processing' | 'Ready' | 'Warning' | 'Failed'>('Ready');
  const [approvalStatus, setApprovalStatus] = useState<string>('Approved');

  // Modals
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Version Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingVersion, setIsUploadingVersion] = useState(false);

  const tabs = ['Overview', 'Metadata', 'Versions', 'Connected Apps'];

  useEffect(() => {
    if (assetId) {
      loadAsset(assetId);
    }
  }, [assetId]);

  const loadAsset = async (id: string) => {
    setIsLoading(true);
    try {
      const data = await vaultApi.getAsset(id);
      setAsset(data);
      setName(data.name);
      setDescription(data.description || '');
      setCategory(data.category || '');
      setStatus(data.status);
      setApprovalStatus((data as any).approval_status || 'Approved');
      setError('');
    } catch (err: any) {
      console.error(err);
      setError('Failed to load asset details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!asset) return;
    try {
      const updated = await vaultApi.updateAsset(asset.id, {
        name,
        description,
        category,
        status
      });
      setAsset({ ...asset, ...updated });
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update asset', err);
    }
  };

  const handleApprovalChange = async (newStatus: string) => {
    if (!asset) return;
    try {
      const updated = await vaultApi.updateApprovalStatus(asset.id, newStatus, `Set to ${newStatus}`);
      setApprovalStatus(newStatus);
      setAsset({ ...asset, ...updated });
    } catch (err) {
      console.error('Failed to update approval status', err);
    }
  };

  const handleRestoreVersion = async (versionId: string) => {
    if (!asset) return;
    try {
      const restored = await vaultApi.restoreVersion(asset.id, versionId);
      setAsset(restored);
      await loadAsset(asset.id);
    } catch (err) {
      console.error('Failed to restore version', err);
    }
  };

  const handleVersionFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!asset || !e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setIsUploadingVersion(true);
    try {
      await vaultApi.uploadVersion(asset.id, file, `Updated to new version (${file.name})`);
      await loadAsset(asset.id);
    } catch (err) {
      console.error('Failed to upload version', err);
    } finally {
      setIsUploadingVersion(false);
    }
  };

  const handleDelete = async () => {
    if (!asset) return;
    if (!confirm('Move asset to trash?')) return;
    try {
      await vaultApi.deleteAsset(asset.id);
      navigate('/vault/assets');
    } catch (err) {
      console.error('Failed to delete asset', err);
    }
  };

  if (isLoading) {
    return <div className="h-full flex items-center justify-center text-slate-400 font-bold">Loading asset details...</div>;
  }

  if (error || !asset) {
    return <div className="h-full flex items-center justify-center text-red-500 font-bold">{error || 'Asset not found'}</div>;
  }

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="mx-auto max-w-7xl h-full flex flex-col animate-in fade-in duration-300 select-none">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate('/vault/assets')}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft size={16} /> Back to Assets
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            <Share2 size={14} /> Share Access
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-bold text-red-700 hover:bg-red-100 transition"
          >
            <Trash2 size={14} /> Move to Trash
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-0">
        {/* Left: 3D Viewer / Media Preview */}
        <div className="w-full lg:w-7/12 xl:w-2/3 h-96 lg:h-full flex-shrink-0 flex flex-col space-y-4">
          <div className="flex-1 rounded-2xl border border-slate-200 bg-slate-100 flex items-center justify-center relative overflow-hidden shadow-2xs">
            {asset.type === '3D Model' ? (
              <model-viewer
                src={asset.public_url}
                auto-rotate
                camera-controls
                ar
                shadow-intensity="1"
                style={{ width: '100%', height: '100%', backgroundColor: '#f1f5f9' }}
              >
                <div slot="poster" className="absolute inset-0 flex items-center justify-center">
                  <Box size={48} className="text-slate-300 animate-pulse" />
                </div>
              </model-viewer>
            ) : asset.type === 'Image' ? (
              <img src={asset.public_url} alt={asset.name} className="max-w-full max-h-full object-contain" />
            ) : (
              <div className="flex flex-col items-center text-slate-400">
                <Box size={80} className="mb-2 opacity-40 text-emerald-600" />
                <p className="text-xs font-bold text-slate-700">{asset.original_name || asset.name}</p>
                <p className="text-[10px] text-slate-400 mt-1">{asset.mime_type}</p>
              </div>
            )}

            <div className="absolute top-4 right-4 flex gap-2">
              <a
                href={asset.public_url}
                download
                className="h-8 w-8 rounded-lg bg-white/80 backdrop-blur-xs border border-slate-200 flex items-center justify-center shadow-2xs text-slate-700 hover:bg-white transition"
                title="Download"
              >
                <Download size={14} />
              </a>
            </div>
          </div>

          {/* 3D Asset Technical Summary */}
          {asset.type === '3D Model' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Sparkles size={14} className="text-emerald-500" /> 3D Asset Intelligence Summary
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Meshes</span>
                  <span className="font-bold text-slate-900">14 Nodes</span>
                </div>
                <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Materials</span>
                  <span className="font-bold text-slate-900">6 Channels</span>
                </div>
                <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Animations</span>
                  <span className="font-bold text-slate-900">2 Clips</span>
                </div>
                <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Dimensions</span>
                  <span className="font-bold text-slate-900">1.2m x 0.8m</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Info Panel */}
        <div className="w-full lg:w-5/12 xl:w-1/3 flex flex-col min-h-0">
          <div className="mb-6">
            <div className="flex items-start justify-between">
              {isEditing ? (
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-2xl font-bold text-slate-900 border-b-2 border-emerald-500 outline-none w-full"
                />
              ) : (
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{asset.name}</h1>
              )}
              <div className="flex flex-col items-end gap-1">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                  <CheckCircle2 size={14} />
                  {asset.status}
                </span>

                {/* Approval Select */}
                <select
                  value={approvalStatus}
                  onChange={(e) => handleApprovalChange(e.target.value)}
                  className="mt-1 text-[10px] font-extrabold uppercase bg-blue-50 text-blue-700 rounded-full px-2.5 py-0.5 border border-blue-200 cursor-pointer outline-none"
                >
                  <option value="Draft">Draft</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Approved">Approved</option>
                  <option value="Published">Published</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-6 border-b border-slate-200 mb-6 shrink-0">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap border-b-2 py-2 text-xs font-bold transition ${
                  activeTab === tab
                    ? 'border-emerald-500 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto no-scrollbar pb-6 pr-2">
            {activeTab === 'Overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-y-4 gap-x-4 text-xs">
                  <div className="text-slate-400 font-bold uppercase">Category</div>
                  <div className="font-bold text-slate-900">{asset.category || 'Uncategorized'}</div>

                  <div className="text-slate-400 font-bold uppercase">Asset Type</div>
                  <div className="font-bold text-slate-900">{asset.type}</div>

                  <div className="text-slate-400 font-bold uppercase">File Size</div>
                  <div className="font-bold text-slate-900">{formatSize(asset.size_bytes)}</div>

                  <div className="text-slate-400 font-bold uppercase">Created</div>
                  <div className="font-bold text-slate-900">{new Date(asset.created_at).toLocaleDateString()}</div>

                  <div className="text-slate-400 font-bold uppercase">Visibility</div>
                  <div className="font-bold text-slate-900">{asset.visibility}</div>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase text-slate-400 mb-2">Description</h3>
                  {isEditing ? (
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full h-20 rounded-xl border border-slate-200 p-2 text-xs font-medium outline-none focus:border-emerald-500"
                    />
                  ) : (
                    <p className="text-xs text-slate-700 leading-relaxed">{asset.description || 'No description provided.'}</p>
                  )}
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase text-slate-400 mb-2 flex items-center gap-2"><Tag size={14} /> Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {asset.tags?.map(tag => (
                      <span key={tag} className="inline-flex items-center rounded-lg bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex gap-3">
                  {isEditing ? (
                    <>
                      <button onClick={handleSaveEdit} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700">
                        <Save size={14} /> Save Changes
                      </button>
                      <button onClick={() => setIsEditing(false)} className="px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50">
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button onClick={() => setIsEditing(true)} className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                      <Edit size={14} /> Edit Details
                    </button>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'Versions' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase text-slate-400">Version History</h3>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingVersion}
                    className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:underline"
                  >
                    <UploadCloud size={14} /> {isUploadingVersion ? 'Uploading...' : 'Upload Version'}
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleVersionFileChange}
                    className="hidden"
                  />
                </div>

                <div className="space-y-3">
                  {asset.versions?.map((ver, idx) => (
                    <div key={ver.id || idx} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 font-bold text-emerald-700 text-xs">
                          v{ver.version_number}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{new Date(ver.created_at).toLocaleDateString()}</span>
                            {idx === 0 && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-700">Current</span>}
                          </div>
                          <p className="text-[10px] text-slate-500">{ver.change_description || 'Version update'} • {formatSize(ver.size_bytes)}</p>
                        </div>
                      </div>

                      {idx !== 0 && (
                        <button
                          onClick={() => handleRestoreVersion(ver.id)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:bg-emerald-50 px-2.5 py-1.5 rounded-lg transition"
                          title="Restore version"
                        >
                          <RotateCcw size={12} />
                          <span>Restore</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'Connected Apps' && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase text-slate-400">Application Integration Status</h3>
                <div className="space-y-3">
                  {['Spatial Hub', 'Omni Studio', 'Spatial Engine', 'Spatial Lens'].map(appName => (
                    <div key={appName} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 font-bold text-xs">
                          <FileBox size={18} />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{appName}</h4>
                          <p className="text-[10px] font-medium text-emerald-600 flex items-center gap-1"><CheckCircle2 size={10} /> Connected</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">ID: {asset.id.slice(0, 8)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'Metadata' && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase text-slate-400">Custom Attributes</h3>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-500">MIME Type:</span>
                    <span className="font-mono text-slate-800">{asset.mime_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-500">Original Storage Key:</span>
                    <span className="font-mono text-slate-800 truncate max-w-[150px]">{asset.storage_key}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <VaultShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        resourceType="asset"
        resourceId={asset.id}
        resourceName={asset.name}
      />
    </div>
  );
}
