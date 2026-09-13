import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  UploadCloud,
  MoreHorizontal,
  Box,
  FileText,
  Image as ImageIcon,
  Video,
  FileBox,
  Grid,
  List
} from 'lucide-react';

const mockAssets = [
  { id: '1', name: 'Compressor Assembly', type: '3D Model', size: '24.8 MB', status: 'Ready', updated: '2 hrs ago', icon: Box },
  { id: '2', name: 'Motor Housing', type: '3D Model', size: '18.4 MB', status: 'Ready', updated: '5 hrs ago', icon: Box },
  { id: '3', name: 'Technical Drawing', type: 'Document', size: '2.4 MB', status: 'Ready', updated: '1 day ago', icon: FileText },
  { id: '4', name: 'Product Render', type: 'Image', size: '4.1 MB', status: 'Ready', updated: '1 day ago', icon: ImageIcon },
  { id: '5', name: 'Installation Video', type: 'Video', size: '124 MB', status: 'Processing', updated: '2 days ago', icon: Video },
  { id: '6', name: 'Spare Parts List', type: 'Template', size: '1.2 MB', status: 'Ready', updated: '4 days ago', icon: FileBox },
  { id: '7', name: 'Factory Layout', type: '3D Model', size: '52.8 MB', status: 'Ready', updated: '5 days ago', icon: Box },
];

export default function VaultAssetList() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('All');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const tabs = ['All', '3D Models', 'Images', 'Videos', 'Documents', 'Templates'];

  return (
    <div className="mx-auto max-w-7xl h-full flex flex-col space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Assets</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search assets..."
              className="h-10 w-64 rounded-xl border border-slate-200 pl-9 pr-4 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <button className="flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
            <Filter size={16} />
            <span className="hidden sm:inline">Filter</span>
          </button>
          <button 
            onClick={() => navigate('/vault/upload')}
            className="flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            <UploadCloud size={16} />
            <span className="hidden sm:inline">Upload</span>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex overflow-x-auto no-scrollbar gap-6">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap border-b-2 py-3 text-sm font-semibold transition ${
                activeTab === tab
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="hidden sm:flex items-center gap-1 rounded-lg border border-slate-200 p-1 bg-slate-50 mb-2">
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <List size={16} />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Grid size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {viewMode === 'list' ? (
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold w-10">
                    <input type="checkbox" className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                  </th>
                  <th className="px-6 py-4 font-semibold">Name</th>
                  <th className="px-6 py-4 font-semibold">Type</th>
                  <th className="px-6 py-4 font-semibold">Size</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Updated</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mockAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-50 transition cursor-pointer" onClick={() => navigate(`/vault/assets/${asset.id}`)}>
                    <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                          <asset.icon size={20} />
                        </div>
                        <span className="font-bold text-slate-900">{asset.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">{asset.type}</td>
                    <td className="px-6 py-4">{asset.size}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        asset.status === 'Ready' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {asset.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">{asset.updated}</td>
                    <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                      <button className="text-slate-400 hover:text-slate-700 transition">
                        <MoreHorizontal size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {mockAssets.map((asset) => (
              <div 
                key={asset.id} 
                onClick={() => navigate(`/vault/assets/${asset.id}`)}
                className="group cursor-pointer rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-emerald-300 hover:shadow-md overflow-hidden flex flex-col"
              >
                <div className="flex h-48 w-full items-center justify-center bg-slate-100 text-slate-400 relative">
                  <asset.icon size={64} className="opacity-20" />
                  <div className="absolute top-3 right-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      asset.status === 'Ready' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {asset.status}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-bold text-slate-900 truncate">{asset.name}</h3>
                  <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                    <span>{asset.type}</span>
                    <span>{asset.size}</span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button className="flex-1 rounded-lg border border-slate-200 py-1.5 text-xs font-semibold hover:bg-slate-50 text-slate-700">Preview</button>
                    <button className="rounded-lg border border-slate-200 px-2 py-1.5 text-slate-500 hover:bg-slate-50"><MoreHorizontal size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
