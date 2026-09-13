import React, { useState } from 'react';
import { useLensStore } from '../store/useLensStore';
import { AppLauncher } from '../../../components/AppLauncher';
import {
  Search,
  Calendar,
  Bell,
  HelpCircle,
  ChevronDown,
  Sparkles,
  Layers,
  X
} from 'lucide-react';

export const LensHeader: React.FC = () => {
  const { filters, setFilters, activeView, setActiveView } = useLensStore();
  const [searchInput, setSearchInput] = useState(filters.searchKeyword);
  const [dateMenuOpen, setDateMenuOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ searchKeyword: searchInput });
    if (activeView !== 'leads') {
      setActiveView('leads');
    }
  };

  const getPageTitle = () => {
    switch (activeView) {
      case 'home':
        return { title: 'Home', subtitle: 'Get insights from your data, track leads and measure performance' };
      case 'leads':
        return { title: 'Leads', subtitle: 'Manage and analyze your leads across all projects. Track engagement, convert opportunities.' };
      case 'analytics':
        return { title: 'Analytics', subtitle: 'Interactive project performance telemetry and engagement analytics.' };
      case 'projects':
        return { title: 'Projects Intelligence', subtitle: 'Project-wise deep-dive analytics, views, and lead metrics.' };
      case 'visualizations':
        return { title: 'Visualization Builder', subtitle: 'Build customized drag-and-drop charts inspired by Vault data.' };
      case 'reports':
        return { title: 'Reports & Export', subtitle: 'Generate, preview, and export executive intelligence reports.' };
      case 'saved-views':
        return { title: 'Saved Views', subtitle: 'Manage saved filter configurations and custom dashboard presets.' };
      case 'data-explorer':
        return { title: 'Data Explorer', subtitle: 'Direct schema inspection and table browser for authorized Vault datasets.' };
      case 'settings':
        return { title: 'Lens Settings', subtitle: 'Preferences, security controls, and Vault synchronization frequency.' };
      case 'help':
        return { title: 'Help & Documentation', subtitle: 'Guides, API references, and Spatial Lens support.' };
      default:
        return { title: 'Spatial Lens', subtitle: 'Data Intelligence' };
    }
  };

  const pageInfo = getPageTitle();

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 select-none shrink-0 z-30 shadow-2xs">
      {/* Page Title Context */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">
            {pageInfo.title}
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1 hidden sm:block">
            {pageInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Right Controls Bar */}
      <div className="flex items-center gap-3">
        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative hidden md:block w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search leads, projects, products..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200/90 rounded-xl py-1.5 pl-9 pr-8 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#F4B400] focus:bg-white transition"
          />
          {searchInput ? (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setFilters({ searchKeyword: '' });
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={12} />
            </button>
          ) : (
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-slate-200 text-slate-500 text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-300">
              ⌘K
            </kbd>
          )}
        </form>

        {/* Date Range Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDateMenuOpen(!dateMenuOpen)}
            className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
          >
            <Calendar size={14} className="text-[#F4B400]" />
            <span>
              {filters.dateRange === '7d'
                ? 'Last 7 Days'
                : filters.dateRange === '30d'
                ? 'Last 30 Days'
                : filters.dateRange === '90d'
                ? 'Last 90 Days'
                : 'Year to Date'}
            </span>
            <ChevronDown size={13} className="text-slate-400" />
          </button>

          {dateMenuOpen && (
            <div className="absolute right-0 top-10 z-50 w-44 bg-white border border-slate-200 rounded-xl p-1.5 shadow-xl animate-in fade-in slide-in-from-top-1 text-xs font-semibold">
              <button
                onClick={() => {
                  setFilters({ dateRange: '7d' });
                  setDateMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 rounded-lg transition ${filters.dateRange === '7d' ? 'bg-amber-50 text-[#D97706] font-bold' : 'hover:bg-slate-50 text-slate-700'}`}
              >
                Last 7 Days
              </button>
              <button
                onClick={() => {
                  setFilters({ dateRange: '30d' });
                  setDateMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 rounded-lg transition ${filters.dateRange === '30d' ? 'bg-amber-50 text-[#D97706] font-bold' : 'hover:bg-slate-50 text-slate-700'}`}
              >
                Last 30 Days
              </button>
              <button
                onClick={() => {
                  setFilters({ dateRange: '90d' });
                  setDateMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 rounded-lg transition ${filters.dateRange === '90d' ? 'bg-amber-50 text-[#D97706] font-bold' : 'hover:bg-slate-50 text-slate-700'}`}
              >
                Last 90 Days
              </button>
              <button
                onClick={() => {
                  setFilters({ dateRange: 'ytd' });
                  setDateMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 rounded-lg transition ${filters.dateRange === 'ytd' ? 'bg-amber-50 text-[#D97706] font-bold' : 'hover:bg-slate-50 text-slate-700'}`}
              >
                Year to Date
              </button>
            </div>
          )}
        </div>

        {/* App Launcher (4-dot grid) */}
        <AppLauncher />

        {/* Notifications */}
        <button
          title="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition"
        >
          <Bell size={17} />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#F4B400] ring-2 ring-white" />
        </button>

        {/* Help & Support Shortcut */}
        <button
          onClick={() => setActiveView('help')}
          title="Help & Support"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition"
        >
          <HelpCircle size={17} />
        </button>

        <div className="h-6 w-px bg-slate-200 mx-1" />

        {/* User Profile Box */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-[#F4B400] text-slate-900 font-extrabold flex items-center justify-center text-xs shadow-sm ring-2 ring-amber-100">
            JD
          </div>
          <div className="hidden lg:block text-left text-xs leading-tight">
            <div className="font-bold text-slate-900">John Doe</div>
            <div className="text-[10px] text-slate-400 font-medium">Acme Industries</div>
          </div>
        </div>
      </div>
    </header>
  );
};
