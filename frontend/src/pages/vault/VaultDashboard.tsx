import { useState } from 'react';
import {
  Box,
  FileText,
  Folder,
  Layers,
  ArrowUpRight,
  Database,
  PlusCircle,
  FileDown,
  UploadCloud
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';

export default function VaultDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Mock Data for Dashboard
  const stats = [
    { label: 'Total Assets', value: '1,248', change: '+12%', icon: Box, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: '3D Models', value: '642', change: '+8%', icon: Layers, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Files', value: '386', change: '+18%', icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { label: 'Templates', value: '120', change: '+5%', icon: Folder, color: 'text-purple-600', bg: 'bg-purple-100' },
  ];

  const recentAssets = [
    { id: '1', name: 'Compressor.glb', type: '3D Model', time: '2 hours ago', size: '24.8 MB', status: 'Ready' },
    { id: '2', name: 'Factory Layout.fbx', type: '3D Model', time: '5 hours ago', size: '128 MB', status: 'Processing' },
    { id: '3', name: 'Product Image.png', type: 'Image', time: '1 day ago', size: '4.1 MB', status: 'Ready' },
    { id: '4', name: 'Installation Manual.pdf', type: 'Document', time: '2 days ago', size: '5.2 MB', status: 'Ready' },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Section */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Good Morning, {user?.name?.split(' ')[0] || 'User'}</h1>
        <p className="mt-1 text-slate-500">Your spatial assets are organized and secure.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bg}`}>
                <stat.icon size={24} className={stat.color} />
              </div>
              <span className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                <ArrowUpRight size={14} className="mr-1" />
                {stat.change}
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-black text-slate-800">{stat.value}</h3>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Assets */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Recent Assets</h2>
            <button onClick={() => navigate('/vault/assets')} className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">View All</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {recentAssets.map((asset) => (
              <div key={asset.id} className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-200 hover:shadow-md">
                <div className="flex h-32 w-full items-center justify-center rounded-xl bg-slate-100 text-slate-400 overflow-hidden relative">
                   {/* Placeholder for actual thumbnail */}
                   <Box size={48} className="opacity-20" />
                   <div className="absolute top-2 right-2">
                     <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                       asset.status === 'Ready' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                     }`}>
                       {asset.status}
                     </span>
                   </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-sm font-bold text-slate-900 truncate">{asset.name}</h3>
                  <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                    <span>{asset.type} • {asset.size}</span>
                    <span>{asset.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-8">
          {/* Storage Usage */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                <Database size={20} className="text-slate-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Storage Usage</h2>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="font-bold text-slate-800">256 GB <span className="font-medium text-slate-500">of 1 TB</span></span>
                <span className="font-bold text-emerald-600">25% used</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 flex">
                <div className="h-full bg-emerald-500 w-[60%] rounded-l-full"></div>
                <div className="h-full bg-blue-500 w-[20%]"></div>
                <div className="h-full bg-amber-500 w-[10%]"></div>
              </div>
              <div className="flex flex-wrap gap-4 pt-2 text-xs font-semibold text-slate-500">
                <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-emerald-500"></div>3D Models 60%</div>
                <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-blue-500"></div>Images 20%</div>
                <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-amber-500"></div>Documents 10%</div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => navigate('/vault/upload')}
                className="flex flex-col items-center justify-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-emerald-700 transition hover:bg-emerald-100 hover:border-emerald-200"
              >
                <UploadCloud size={20} />
                <span className="text-xs font-bold text-center">Upload Asset</span>
              </button>
              <button className="flex flex-col items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 p-4 text-blue-700 transition hover:bg-blue-100 hover:border-blue-200">
                <FileText size={20} />
                <span className="text-xs font-bold text-center">Create Template</span>
              </button>
              <button className="flex flex-col items-center justify-center gap-2 rounded-xl border border-purple-100 bg-purple-50 p-4 text-purple-700 transition hover:bg-purple-100 hover:border-purple-200">
                <Folder size={20} />
                <span className="text-xs font-bold text-center">New Collection</span>
              </button>
              <button className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-700 transition hover:bg-slate-100 hover:border-slate-300">
                <FileDown size={20} />
                <span className="text-xs font-bold text-center">Import Data</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
