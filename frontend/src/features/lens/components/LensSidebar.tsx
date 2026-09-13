import React from 'react';
import { useLensStore, LensView } from '../store/useLensStore';
import {
  Compass,
  Users,
  BarChart3,
  Box,
  PieChart,
  FileText,
  Bookmark,
  Database,
  Settings,
  HelpCircle,
  LogOut,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';

interface NavItem {
  id: LensView;
  label: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', icon: Compass },
  { id: 'leads', label: 'Leads', icon: Users },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'projects', label: 'Projects', icon: Box },
  { id: 'visualizations', label: 'Visualizations', icon: PieChart },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'saved-views', label: 'Saved Views', icon: Bookmark },
  { id: 'data-explorer', label: 'Data Explorer', icon: Database },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const LensSidebar: React.FC = () => {
  const {
    activeView,
    setActiveView,
    vaultSyncStatus,
    lastSyncTime,
    syncNow
  } = useLensStore();

  const handleLogout = () => {
    window.location.href = '/login';
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between py-5 px-4 select-none shrink-0 z-40 shadow-xs">
      {/* Top Branding Header */}
      <div>
        <div className="flex items-center gap-2.5 px-2 mb-6">
          <div className="w-8 h-8 rounded-xl bg-[#F4B400] flex items-center justify-center text-slate-950 font-black text-sm shadow-md">
            3D
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1 font-black text-slate-900 text-sm tracking-tight leading-none">
              <span>I3DION</span>
            </div>
            <span className="text-[#D97706] font-bold text-xs tracking-tight">
              Spatial Lens
            </span>
          </div>
        </div>

        {/* Main Navigation List */}
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon as any;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                  isActive
                    ? 'bg-amber-50 text-[#D97706] shadow-2xs border border-amber-200/60'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <Icon size={17} className={isActive ? 'text-[#F4B400]' : 'text-slate-400'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Vault Connection Widget & Support */}
      <div className="space-y-3 pt-4 border-t border-slate-100">
        {/* Vault Connection Card (as seen in Image 1 & 2) */}
        <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 space-y-2">
          <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
            Data Source
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>I3DION Vault</span>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              <CheckCircle2 size={10} />
              Connected
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span>Last Sync</span>
            <span className="font-semibold text-slate-700">{lastSyncTime}</span>
          </div>

          <button
            onClick={syncNow}
            disabled={vaultSyncStatus === 'syncing'}
            className="w-full mt-1 flex items-center justify-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs py-1.5 rounded-xl transition active:scale-95 shadow-2xs"
          >
            <RefreshCw size={12} className={vaultSyncStatus === 'syncing' ? 'animate-spin text-[#F4B400]' : 'text-slate-400'} />
            <span>{vaultSyncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        </div>

        {/* Secondary Links & Sign Out */}
        <div className="space-y-1">
          <button
            onClick={() => setActiveView('help')}
            className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeView === 'help' ? 'bg-amber-50 text-[#D97706]' : 'text-slate-600 hover:bg-slate-100/80'
            }`}
          >
            <HelpCircle size={16} className="text-slate-400" />
            <span>Help & Support</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition border border-transparent hover:border-rose-100"
          >
            <LogOut size={16} className="text-rose-500" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Footer info */}
        <div className="px-2 text-[10px] font-semibold text-slate-400 text-center pt-1">
          I3DION Spatial Lens v1.0.0
        </div>
      </div>
    </aside>
  );
};
