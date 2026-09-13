import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  UploadCloud,
  Box,
  FileText,
  Image as ImageIcon,
  Video,
  FileBox,
  Grid,
  List,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { vaultApi, VaultAsset } from '../../api/vaultApi';

export default function VaultAssetList() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('All');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [assets, setAssets] = useState<VaultAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    loadAssets();
  }, [search, activeTab]);

  const loadAssets = async () => {
    setIsLoading(true);
    try {
      const typeFilter = activeTab === 'All' ? undefined : activeTab.endsWith('s') ? activeTab.slice(0, -1) : activeTab;
      const data = await vaultApi.getAssets({ search, type: typeFilter });
      setAssets(data);
      setError('');
    } catch (err: any) {
      console.error('Failed to load assets', err);
      setError('Failed to load assets');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      await vaultApi.bulkDeleteAssets(selectedIds);
      setAssets(assets.filter(a => !selectedIds.includes(a.id)));
      setSelectedIds([]);
    } catch (err) {
      console.error('Bulk delete failed', err);
    }
  };

  const handleDeleteSingle = async (id: string) => {
    try {
      await vaultApi.deleteAsset(id);
      setAssets(assets.filter(a => a.id !== id));
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  const tabs = ['All', '3D Model', 'Image', 'Video', 'Document'];

  const getIcon = (type: string) => {
    switch (type) {
      case '3D Model': return Box;
      case 'Document': return FileText;
      case 'Image': return ImageIcon;
      case 'Video': return Video;
      case 'Template': return FileBox;
      default: return FileText;
    }
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="mx-auto max-w-7xl h-full flex flex-col space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Enterprise Asset Repository</h1>
          <p className="text-xs text-slate-500 mt-0.5">3D Models, spatial media, and binary assets.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search assets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-64 rounded-xl border border-slate-200 pl-9 pr-4 text-xs font-semibold outline-none focus:border-emerald-500"
            />
          </div>

          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex h-10 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-xs font-bold text-red-700 hover:bg-red-100 transition"
            >
              <Trash2 size={15} /> Move to Trash ({selectedIds.length})
            </button>
          )}

          <button
            onClick={loadAssets}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>

          <button
            onClick={() => navigate('/vault/upload')}
            className="flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
          >
            <UploadCloud size={16} />
            <span className="hidden sm:inline">Upload Asset</span>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex overflow-x-auto no-scrollbar gap-6">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap border-b-2 py-3 text-xs font-bold transition ${
                activeTab === tab
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab}s
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
        {isLoading ? (
          <div className="flex h-64 items-center justify-center text-slate-400">Loading assets...</div>
        ) : error ? (
          <div className="flex h-64 items-center justify-center text-red-500">{error}</div>
        ) : assets.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-slate-400 flex-col rounded-2xl border border-slate-200 bg-white">
            <Box size={48} className="mb-4 opacity-40 text-emerald-600" />
            <p className="text-sm font-semibold">No assets found</p>
            <button onClick={() => navigate('/vault/upload')} className="mt-3 text-xs font-bold text-emerald-600 hover:underline">+ Upload Asset</button>
          </div>
        ) : viewMode === 'list' ? (
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === assets.length && assets.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedIds(assets.map(a => a.id));
                        else setSelectedIds([]);
                      }}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </th>
                  <th className="px-6 py-4 font-bold">Name</th>
                  <th className="px-6 py-4 font-bold">Type</th>
                  <th className="px-6 py-4 font-bold">Size</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                  <th className="px-6 py-4 font-bold">Updated</th>
                  <th className="px-6 py-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assets.map((asset) => {
                  const Icon = getIcon(asset.type);
                  return (
                    <tr key={asset.id} className="hover:bg-slate-50 transition cursor-pointer" onClick={() => navigate(`/vault/assets/${asset.id}`)}>
                      <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(asset.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedIds([...selectedIds, asset.id]);
                            else setSelectedIds(selectedIds.filter(id => id !== asset.id));
                          }}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 font-bold">
                            <Icon size={18} />
                          </div>
                          <span className="font-bold text-slate-900">{asset.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium">{asset.type}</td>
                      <td className="px-6 py-4 font-medium">{formatSize(asset.size_bytes)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          asset.status === 'Ready' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {asset.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400">{new Date(asset.updated_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => handleDeleteSingle(asset.id)}
                          className="text-slate-400 hover:text-red-600 transition p-1"
                          title="Move to Trash"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {assets.map((asset) => {
              const Icon = getIcon(asset.type);
              return (
                <div
                  key={asset.id}
                  onClick={() => navigate(`/vault/assets/${asset.id}`)}
                  className="group cursor-pointer rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-emerald-300 hover:shadow-md overflow-hidden flex flex-col justify-between"
                >
                  <div className="flex h-44 w-full items-center justify-center bg-slate-100 text-slate-400 relative">
                    {asset.type === 'Image' ? (
                      <img src={asset.public_url} alt={asset.name} className="h-full w-full object-cover" />
                    ) : (
                      <Icon size={56} className="opacity-20 text-slate-600" />
                    )}
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
                      <span>{formatSize(asset.size_bytes)}</span>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button className="flex-1 rounded-xl border border-slate-200 py-1.5 text-xs font-bold hover:bg-slate-50 text-slate-700">Open Detail</button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteSingle(asset.id); }}
                        className="rounded-xl border border-slate-200 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
