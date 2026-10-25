import React from 'react';
import { useLensStore, LensView } from '../store/useLensStore';
import {
  Compass,
  Users,
  TrendingUp,
  Building2,
  CheckSquare,
  MessageSquare,
  BarChart3,
  Box,
  PieChart,
  FileText,
  Folder,
  Zap,
  Bookmark,
  Database,
  Settings,
  HelpCircle,
  LogOut,
  RefreshCw,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

interface NavSection {
  title: string;
  items: {
    id: LensView;
    label: string;
    icon: React.ElementType;
    badge?: string;
  }[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Sales Operations',
    items: [
      { id: 'home', label: 'Command Center', icon: Compass },
      { id: 'leads', label: 'Leads Management', icon: Users },
      { id: 'deals', label: 'Deals & Pipeline', icon: TrendingUp },
      { id: 'crm', label: 'Accounts & Contacts', icon: Building2 },
      { id: 'tasks', label: 'Tasks & Follow-ups', icon: CheckSquare },
      { id: 'enquiries', label: 'Customer Enquiries', icon: MessageSquare }
    ]
  },
  {
    title: 'Intelligence & Studio',
    items: [
      { id: 'analytics', label: 'Performance Analytics', icon: BarChart3 },
      { id: 'projects', label: '3D Projects Intelligence', icon: Box },
      { id: 'visualizations', label: 'BI Customizer Studio', icon: PieChart },
      { id: 'reports', label: 'Reports & Export', icon: FileText },
      { id: 'documents', label: 'Sales Documents', icon: Folder },
      { id: 'automations', label: 'Simple Automations', icon: Zap }
    ]
  },
  {
    title: 'Data & Settings',
    items: [
      { id: 'saved-views', label: 'Saved Views', icon: Bookmark },
      { id: 'data-explorer', label: 'Data Explorer', icon: Database },
      { id: 'settings', label: 'Settings', icon: Settings }
    ]
  }
];

export const LensSidebar: React.FC = () => {
  const {
    activeView,
    setActiveView,
    vaultSyncStatus,
    lastSyncTime,
    syncNow,
    openAiAssistant
  } = useLensStore();

  const handleLogout = () => {
    window.location.href = '/login';
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between py-5 px-3 select-none shrink-0 z-40 shadow-xs h-screen overflow-hidden">
      {/* Top Branding Header */}
      <div className="flex flex-col overflow-hidden min-h-0 flex-1">
        <div className="flex items-center gap-2.5 px-2 mb-4 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-white border border-amber-200/80 p-1 flex items-center justify-center shadow-xs shrink-0">
            <img src="/assets/logos/lens.png" alt="I3DION Spatial Lens" className="h-7 w-7 object-contain drop-shadow-sm" />
          </div>
          <div className="flex flex-col text-left leading-none">
            <span className="font-black text-slate-900 text-base tracking-tight leading-none">I3DION</span>
            <span className="text-[#D97706] font-bold text-[10px] tracking-widest uppercase mt-0.5">
              Spatial Lens
            </span>
          </div>
        </div>

        {/* AI Assistant Quick Launcher Pill */}
        <div className="px-1 mb-3 shrink-0">
          <button
            onClick={openAiAssistant}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-gradient-to-r from-amber-50 to-amber-100/60 border border-amber-200/80 text-amber-900 text-xs font-bold hover:shadow-xs transition active:scale-95 group"
          >
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-[#D97706] group-hover:rotate-12 transition-transform" />
              <span>Sales AI Assistant</span>
            </div>
            <span className="text-[10px] bg-white/90 text-amber-700 px-1.5 py-0.5 rounded font-extrabold border border-amber-200">
              Ask
            </span>
          </button>
        </div>

        {/* Scrollable Navigation Sections */}
        <nav className="flex-1 overflow-y-auto space-y-4 pr-1">
          {NAV_SECTIONS.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              <div className="px-3 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                {section.title}
              </div>
              {section.items.map((item) => {
                const Icon = item.icon as any;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition ${
                      isActive
                        ? 'bg-amber-50 text-[#D97706] shadow-2xs border border-amber-200/60'
                        : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon size={16} className={isActive ? 'text-[#F4B400]' : 'text-slate-400'} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[9px] font-extrabold px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom Vault Connection Widget & Support */}
      <div className="space-y-2 pt-3 border-t border-slate-100 shrink-0">
        <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-2.5 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>I3DION Vault</span>
            </div>
            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
              <CheckCircle2 size={10} />
              Connected
            </span>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500">
            <span>Last Sync</span>
            <span className="font-semibold text-slate-700">{lastSyncTime}</span>
          </div>

          <button
            onClick={syncNow}
            disabled={vaultSyncStatus === 'syncing'}
            className="w-full mt-0.5 flex items-center justify-center gap-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-[11px] py-1 rounded-lg transition active:scale-95 shadow-2xs"
          >
            <RefreshCw size={11} className={vaultSyncStatus === 'syncing' ? 'animate-spin text-[#F4B400]' : 'text-slate-400'} />
            <span>{vaultSyncStatus === 'syncing' ? 'Syncing...' : 'Sync Vault Records'}</span>
          </button>
        </div>

        {/* Secondary Links & Sign Out */}
        <div className="flex items-center justify-between px-1 text-xs font-bold text-slate-500">
          <button
            onClick={() => setActiveView('help')}
            className={`flex items-center gap-1 hover:text-slate-900 ${activeView === 'help' ? 'text-[#D97706]' : ''}`}
          >
            <HelpCircle size={14} />
            <span>Help</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-rose-600 hover:text-rose-700"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
