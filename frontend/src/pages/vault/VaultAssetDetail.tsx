import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Share2,
  Edit,
  Box,
  CheckCircle2,
  MoreVertical,
  History,
  Tag,
  FileBox,
  Activity
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function VaultAssetDetail() {
  const { assetId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('Overview');

  const tabs = ['Overview', 'Metadata', 'Versions', 'Usage'];

  // Mock Asset Data
  const asset = {
    id: assetId || '1',
    name: 'Industrial Pump',
    status: 'Ready',
    category: 'Industrial',
    fileFormat: 'GLB',
    fileSize: '24.8 MB',
    created: 'Sep 10, 2025',
    uploadedBy: 'John Smith',
    createdBy: 'John Smith',
    description: 'High performance industrial centrifugal pump used in water treatment plants. Includes internal mechanical details and accurate scaling.',
    tags: ['pump', 'industrial', 'water treatment'],
    versions: [
      { v: 'v3', date: 'Sep 13, 2025', size: '24.8 MB', current: true },
      { v: 'v2', date: 'Sep 08, 2025', size: '22.1 MB', current: false },
      { v: 'v1', date: 'Aug 20, 2025', size: '18.4 MB', current: false },
    ],
    connections: [
      { app: 'I3DION Omni Studio', usage: 'Used in 3 catalogs' },
      { app: 'I3DION Spatial Engine', usage: 'Used in 2 experiences' },
      { app: 'I3DION Spatial Hub', usage: 'Published to public library' },
    ]
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
            {/* Placeholder for real 3D Viewer (like ModelViewer component) */}
            <Box size={120} className="text-slate-300" />
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
                  <div className="font-semibold text-slate-900">{asset.category}</div>
                  
                  <div className="text-slate-500 font-medium">File Format</div>
                  <div className="font-semibold text-slate-900">{asset.fileFormat}</div>
                  
                  <div className="text-slate-500 font-medium">File Size</div>
                  <div className="font-semibold text-slate-900">{asset.fileSize}</div>
                  
                  <div className="text-slate-500 font-medium">Created</div>
                  <div className="font-semibold text-slate-900">{asset.created}</div>
                  
                  <div className="text-slate-500 font-medium">Uploaded by</div>
                  <div className="font-semibold text-slate-900">{asset.uploadedBy}</div>
                  
                  <div className="text-slate-500 font-medium">Created by</div>
                  <div className="font-semibold text-slate-900">{asset.createdBy}</div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-2">Description</h3>
                  <p className="text-sm text-slate-700 leading-relaxed">{asset.description}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-2 flex items-center gap-2"><Tag size={14} /> Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {asset.tags.map(tag => (
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
                  {asset.versions.map((ver, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 font-bold text-slate-700">
                          {ver.v}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900">{ver.date}</span>
                            {ver.current && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Current</span>}
                          </div>
                          <span className="text-xs text-slate-500">{ver.size}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!ver.current && (
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
                   {asset.connections.map((conn, idx) => (
                     <div key={idx} className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                          <FileBox size={20} />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-bold text-slate-900">{conn.app}</h4>
                          <p className="text-xs text-slate-500">{conn.usage}</p>
                        </div>
                        <button className="text-xs font-semibold text-emerald-600">Open →</button>
                     </div>
                   ))}
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
