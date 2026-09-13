import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  FileText,
  Folder,
  Layers,
  ArrowUpRight,
  Database,
  UploadCloud,
  Cpu
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { vaultApi, VaultDatasetSummary, VaultAsset } from '../../api/vaultApi';

export default function VaultDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [summary, setSummary] = useState<VaultDatasetSummary | null>(null);
  const [recentAssets, setRecentAssets] = useState<VaultAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [sumData, assetsData] = await Promise.all([
        vaultApi.getDatasetsSummary().catch(() => null),
        vaultApi.getAssets({ sort: 'newest' }).catch(() => [])
      ]);
      setSummary(sumData);
      setRecentAssets(Array.isArray(assetsData) ? assetsData.slice(0, 4) : []);
    } catch (err) {
      console.error('Failed to load dashboard metrics', err);
      setRecentAssets([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const stats = [
    { label: 'Total Assets', value: summary ? summary.total_assets.toLocaleString() : '0', icon: Box, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: '3D Models', value: summary ? summary.total_3d_models.toLocaleString() : '0', icon: Layers, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Product Records', value: summary ? summary.total_products.toLocaleString() : '0', icon: Database, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { label: 'Templates', value: summary ? summary.total_templates.toLocaleString() : '0', icon: Folder, color: 'text-purple-600', bg: 'bg-purple-100' },
  ];

  const storageUsedBytes = summary?.total_storage_bytes || 0;
  const storageQuotaBytes = summary?.storage_quota_bytes || 107374182400; // 100 GB
  const storagePct = Math.min(100, Math.round((storageUsedBytes / storageQuotaBytes) * 100)) || 1;

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Section */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Good Morning, {user?.name?.split(' ')[0] || 'User'}</h1>
        <p className="mt-1 text-xs text-slate-500">Centralized spatial data & asset repository dashboard.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bg}`}>
                <stat.icon size={24} className={stat.color} />
              </div>
              <span className="flex items-center text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                <ArrowUpRight size={14} className="mr-1" /> Live Sync
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-black text-slate-800">{isLoading ? '...' : stat.value}</h3>
              <p className="text-xs font-bold uppercase text-slate-400 mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Assets */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Recent Asset Additions</h2>
            <button onClick={() => navigate('/vault/assets')} className="text-xs font-bold text-emerald-600 hover:underline">View All Assets →</button>
          </div>

          {isLoading ? (
            <div className="flex h-48 items-center justify-center text-slate-400">Loading recent assets...</div>
          ) : recentAssets.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-400">
              <Box size={40} className="mb-2 opacity-30 text-emerald-600" />
              <p className="text-xs font-semibold">No assets stored yet</p>
              <button onClick={() => navigate('/vault/upload')} className="mt-2 text-xs font-bold text-emerald-600 hover:underline">+ Upload First Asset</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recentAssets.map((asset) => (
                <div
                  key={asset.id}
                  onClick={() => navigate(`/vault/assets/${asset.id}`)}
                  className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
                >
                  <div className="flex h-28 w-full items-center justify-center rounded-xl bg-slate-100 text-slate-400 overflow-hidden relative">
                    {asset.type === 'Image' ? (
                      <img src={asset.public_url} alt={asset.name} className="h-full w-full object-cover" />
                    ) : (
                      <Box size={40} className="opacity-20 text-slate-600" />
                    )}
                    <div className="absolute top-2 right-2">
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        {asset.status}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <h3 className="text-xs font-bold text-slate-900 truncate group-hover:text-emerald-700 transition">{asset.name}</h3>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                      <span>{asset.type} • {formatSize(asset.size_bytes)}</span>
                      <span>{new Date(asset.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-8">
          {/* Storage Usage */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <Database size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Real Storage Usage</h2>
                <p className="text-xs text-slate-500">PostgreSQL + Binary Storage</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-slate-800">{formatSize(storageUsedBytes)} <span className="font-medium text-slate-400">used</span></span>
                <span className="font-bold text-emerald-600">{storagePct}% of 100 GB</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 flex">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.max(5, storagePct)}%` }}></div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-4">Vault Operations</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/vault/upload')}
                className="flex flex-col items-center justify-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-emerald-700 transition hover:bg-emerald-100"
              >
                <UploadCloud size={20} />
                <span className="text-xs font-bold text-center">Upload Asset</span>
              </button>
              <button
                onClick={() => navigate('/vault/collections')}
                className="flex flex-col items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 p-4 text-blue-700 transition hover:bg-blue-100"
              >
                <Folder size={20} />
                <span className="text-xs font-bold text-center">Data Sources</span>
              </button>
              <button
                onClick={() => navigate('/vault/templates')}
                className="flex flex-col items-center justify-center gap-2 rounded-xl border border-purple-100 bg-purple-50 p-4 text-purple-700 transition hover:bg-purple-100"
              >
                <FileText size={20} />
                <span className="text-xs font-bold text-center">Templates</span>
              </button>
              <button
                onClick={() => navigate('/vault/audit')}
                className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-700 transition hover:bg-slate-100"
              >
                <Cpu size={20} />
                <span className="text-xs font-bold text-center">Audit Logs</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
