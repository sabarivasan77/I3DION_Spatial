import React, { useState } from 'react';
import { useLensStore } from '../store/useLensStore';
import { AppLauncher } from '../../../components/AppLauncher';
import {
  Search,
  Calendar,
  Bell,
  ChevronDown,
  Sparkles,
  Maximize2,
  X
} from 'lucide-react';

export const LensHeader: React.FC = () => {
  const { filters, setFilters, activeView, setActiveView, openAiAssistant, togglePresentationMode } = useLensStore();
  const [searchInput, setSearchInput] = useState(filters.searchKeyword);
  const [dateMenuOpen, setDateMenuOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ searchKeyword: searchInput });
    if (activeView !== 'leads' && activeView !== 'deals' && activeView !== 'crm') {
      setActiveView('leads');
    }
  };

  const getPageTitle = () => {
    switch (activeView) {
      case 'home':
        return { title: 'Sales Command Center', subtitle: 'Executive visibility into revenue, pipeline, deals, and team velocity.' };
      case 'leads':
        return { title: 'Lead Management & Conversion', subtitle: 'Track visitor intent, qualify leads, and convert prospects to CRM accounts.' };
      case 'deals':
        return { title: 'Deals & Sales Pipeline', subtitle: 'Manage sales opportunities across Kanban stages from Discovery to Won.' };
      case 'crm':
        return { title: 'Accounts & Customer Relationships', subtitle: 'Authoritative company accounts, contacts, and unified commercial timelines.' };
      case 'tasks':
        return { title: 'Activities, Tasks & Follow-ups', subtitle: 'Manage scheduled client calls, meetings, demos, and track overdue alerts.' };
      case 'enquiries':
        return { title: 'Customer Enquiries & Service Desk', subtitle: 'Lightweight support, technical RFQs, and resolution workflows.' };
      case 'analytics':
        return { title: 'Performance Analytics & Telemetry', subtitle: 'Interactive 3D model dwell time, hotspot click maps, and WebXR sessions.' };
      case 'projects':
        return { title: '3D Projects Intelligence', subtitle: 'Deep-dive engagement telemetry per spatial project and catalog.' };
      case 'visualizations':
        return { title: 'BI Customizer Studio', subtitle: 'Build and save customizable drag-and-drop KPI cards and chart tiles.' };
      case 'reports':
        return { title: 'Executive Reports & Data Export', subtitle: 'Generate, preview, and download structured intelligence reports.' };
      case 'documents':
        return { title: 'Sales Documents Repository', subtitle: 'Access contract PDFs, NDA templates, and technical specification brochures.' };
      case 'automations':
        return { title: 'Lightweight Automations & Spatial Flow', subtitle: 'Configure notification toggles, reminder rules, and hand-off to Spatial Flow.' };
      case 'saved-views':
        return { title: 'Saved Views & Presets', subtitle: 'One-click restore of custom dashboard queries and filter states.' };
      case 'data-explorer':
        return { title: 'Vault Data Explorer', subtitle: 'Direct schema inspection and table browser for authorized datasets.' };
      case 'settings':
        return { title: 'Lens Settings', subtitle: 'Data sync frequency, security controls, and operational preferences.' };
      case 'help':
        return { title: 'Help & Documentation', subtitle: 'Best practices, workflow guides, and Spatial Lens support.' };
      default:
        return { title: 'Spatial Lens', subtitle: 'Sales Operations & Commercial Intelligence' };
    }
  };

  const pageInfo = getPageTitle();

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 flex items-center justify-between px-5 md:px-7 select-none shrink-0 z-30 shadow-2xs">
      {/* Page Title Context (Clean typography, never clipped) */}
      <div className="flex items-center gap-3 min-w-0 pr-4">
        <div className="py-1">
          <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight truncate">
            {pageInfo.title}
          </h1>
          <p className="text-xs text-slate-400 font-medium leading-none mt-1 hidden md:block truncate">
            {pageInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Simplified, Cohesive Controls Bar */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative hidden xl:block w-60">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search leads, deals..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 pl-8 pr-7 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#F4B400] focus:bg-white transition"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setFilters({ searchKeyword: '' });
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={12} />
            </button>
          )}
        </form>

        {/* Compact Date Range Filter */}
        <div className="relative">
          <button
            onClick={() => setDateMenuOpen(!dateMenuOpen)}
            className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/90 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition shadow-2xs"
          >
            <Calendar size={13} className="text-[#F4B400]" />
            <span className="hidden sm:inline">
              {filters.dateRange === '7d'
                ? 'Last 7 Days'
                : filters.dateRange === '30d'
                ? 'Last 30 Days'
                : filters.dateRange === '90d'
                ? 'Last 90 Days'
                : 'Year to Date'}
            </span>
            <ChevronDown size={12} className="text-slate-400" />
          </button>

          {dateMenuOpen && (
            <div className="absolute right-0 top-9 z-50 w-40 bg-white border border-slate-200 rounded-xl p-1 shadow-xl text-xs font-medium">
              {(['7d', '30d', '90d', 'ytd'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => {
                    setFilters({ dateRange: range });
                    setDateMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 rounded-lg transition ${
                    filters.dateRange === range
                      ? 'bg-amber-50 text-[#D97706] font-bold'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : range === '90d' ? 'Last 90 Days' : 'Year to Date'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Boardroom Presentation Mode Button (Sleek Ghost Pill) */}
        <button
          onClick={togglePresentationMode}
          title="Open Fullscreen Boardroom Presentation"
          className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/90 font-semibold text-xs px-2.5 py-1.5 rounded-xl transition shadow-2xs active:scale-95"
        >
          <Maximize2 size={13} className="text-slate-500" />
          <span className="hidden md:inline">Presentation</span>
        </button>

        {/* AI Assistant Button (Refined, Non-Clashing Pill) */}
        <button
          onClick={openAiAssistant}
          title="Open AI Sales Assistant"
          className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-[#B45309] border border-amber-200 font-bold text-xs px-2.5 py-1.5 rounded-xl transition shadow-2xs active:scale-95"
        >
          <Sparkles size={13} className="text-[#F4B400]" />
          <span className="hidden sm:inline">AI Assistant</span>
        </button>

        {/* App Launcher (3x3 grid) */}
        <AppLauncher />

        {/* Notifications */}
        <button
          title="Notifications"
          className="relative flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition shadow-2xs"
        >
          <Bell size={15} />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[#F4B400]" />
        </button>

        <div className="h-5 w-px bg-slate-200 mx-0.5 hidden sm:block" />

        {/* User Profile Box */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#F4B400] text-slate-950 font-black flex items-center justify-center text-xs shadow-2xs ring-2 ring-amber-100">
            JD
          </div>
          <div className="hidden 2xl:block text-left text-xs leading-tight">
            <div className="font-bold text-slate-900">Commercial Rep</div>
            <div className="text-[10px] text-slate-400 font-medium">Enterprise Sales</div>
          </div>
        </div>
      </div>
    </header>
  );
};
