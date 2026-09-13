import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Share2,
  Edit,
  Box,
  CheckCircle2,
  MoreVertical,
  Tag,
  FileBox,
  Activity
} from 'lucide-react';
import { vaultApi, VaultAsset } from '../../api/vaultApi';

export default function VaultAssetDetail() {
  const { assetId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('Overview');
  const [asset, setAsset] = useState<VaultAsset | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const tabs = ['Overview', 'Metadata', 'Versions', 'Usage'];

  useEffect(() => {
    if (assetId) {
      vaultApi.getAsset(assetId)
        .then((data: VaultAsset) => {
          setAsset(data);
          setIsLoading(false);
        })
        .catch((err: Error) => {
          console.error(err);
          setError('Failed to load asset details');
          setIsLoading(false);
        });
    }
  }, [assetId]);

  if (isLoading) {
    return <div className="h-full flex items-center justify-center text-slate-400">Loading asset...</div>;
  }

  if (error || !asset) {
    return <div className="h-full flex items-center justify-center text-red-500">{error || 'Asset not found'}</div>;
  }

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="mx-auto max-w-7xl h-full flex flex-col animate-in fade-in duration-300">
      <div className="mb-6 flex items-center justify-between">
        <button 
          onClick={() => navigate('/vault/assets')}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft size={16} />
          Back to Assets
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-0">
        {/* Left: 3D Viewer / Media Preview */}
        <div className="w-full lg:w-7/12 xl:w-2/3 h-96 lg:h-full flex-shrink-0 flex flex-col">
          <div className="flex-1 rounded-2xl border border-slate-200 bg-slate-100 flex items-center justify-center relative overflow-hidden shadow-sm">
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
              <Box size={120} className="text-slate-300" />
            )}
            <div className="absolute top-4 right-4 flex gap-2">
               <button className="h-8 w-8 rounded-lg bg-white/80 backdrop-blur-sm border border-slate-200 flex items-center justify-center shadow-xs text-slate-700 hover:bg-white transition"><Box size={14} /></button>
               <button className="h-8 w-8 rounded-lg bg-white/80 backdrop-blur-sm border border-slate-200 flex items-center justify-center shadow-xs text-slate-700 hover:bg-white transition"><Activity size={14} /></button>
            </div>
          </div>
        </div>

        {/* Right: Info Panel */}
        <div className="w-full lg:w-5/12 xl:w-1/3 flex flex-col min-h-0">
          <div className="mb-6">
            <div className="flex items-start justify-between">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">{asset.name}</h1>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                <CheckCircle2 size={14} />
                {asset.status}
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-6 border-b border-slate-200 mb-6 shrink-0">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap border-b-2 py-2 text-sm font-semibold transition ${
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
                <div className="grid grid-cols-2 gap-y-4 gap-x-4 text-sm">
                  <div className="text-slate-500 font-medium">Category</div>
                  <div className="font-semibold text-slate-900">{asset.category || 'Uncategorized'}</div>
                  
                  <div className="text-slate-500 font-medium">Type</div>
                  <div className="font-semibold text-slate-900">{asset.type}</div>
                  
                  <div className="text-slate-500 font-medium">File Size</div>
                  <div className="font-semibold text-slate-900">{formatSize(asset.size_bytes)}</div>
                  
                  <div className="text-slate-500 font-medium">Created</div>
                  <div className="font-semibold text-slate-900">{new Date(asset.created_at).toLocaleDateString()}</div>
                  
                  <div className="text-slate-500 font-medium">Visibility</div>
                  <div className="font-semibold text-slate-900">{asset.visibility}</div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-2">Description</h3>
                  <p className="text-sm text-slate-700 leading-relaxed">{asset.description || 'No description provided.'}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-2 flex items-center gap-2"><Tag size={14} /> Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {asset.tags?.map(tag => (
                      <span key={tag} className="inline-flex items-center rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        {tag}
                      </span>
                    ))}
                    <button className="inline-flex items-center gap-1 rounded-lg border border-dashed border-slate-300 px-3 py-1 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 transition">
                      + Add tag
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 grid grid-cols-3 gap-3">
                  <button className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition">
                    <Download size={16} /> Download
                  </button>
                  <button className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition">
                    <Share2 size={16} /> Share
                  </button>
                  <button className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition">
                    <Edit size={16} /> Edit
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'Versions' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Version History</h3>
                  <button className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">Upload New Version</button>
                </div>
                <div className="space-y-3">
                  {asset.versions?.map((ver, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 font-bold text-slate-700">
                          v{ver.version_number}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900">{new Date(ver.created_at).toLocaleDateString()}</span>
                            {idx === 0 && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Current</span>}
                          </div>
                          <span className="text-xs text-slate-500">{formatSize(ver.size_bytes)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {idx !== 0 && (
                          <button className="text-xs font-semibold text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition">Restore</button>
                        )}
                        <button className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-50">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {activeTab === 'Usage' && (
               <div className="space-y-6">
                 <h3 className="text-sm font-bold text-slate-900">Connected Applications</h3>
                 <div className="space-y-3">
                   {/* Connections are mocked for now since they query other apps */}
                   <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                        <FileBox size={20} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-slate-900">I3DION Omni Studio</h4>
                        <p className="text-xs text-slate-500">Used in 3 catalogs</p>
                      </div>
                      <button className="text-xs font-semibold text-emerald-600">Open →</button>
                   </div>
                 </div>
               </div>
            )}
            
            {activeTab === 'Metadata' && (
               <div className="flex items-center justify-center h-48 text-sm text-slate-500">
                 Metadata schema editor would appear here.
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
