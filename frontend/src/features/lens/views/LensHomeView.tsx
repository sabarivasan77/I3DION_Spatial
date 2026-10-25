import React, { useEffect } from 'react';
import { useLensStore } from '../store/useLensStore';
import {
  Users,
  TrendingUp,
  Box,
  Eye,
  Smartphone,
  PieChart,
  ShieldCheck,
  ArrowUpRight,
  MoreVertical,
  Layers,
  Sparkles,
  QrCode,
  RefreshCw,
  Briefcase,
  Building2,
  CheckSquare,
  AlertCircle,
  ArrowRight
} from 'lucide-react';

export const LensHomeView: React.FC = () => {
  const {
    homeViewMode,
    setHomeViewMode,
    leads,
    projects,
    openLeadDrawer,
    setActiveView,
    overview,
    isLoadingLive,
    liveError,
    fetchLiveData,
    deals,
    accounts,
    tasks,
    overviewStats,
    fetchCrmOverview
  } = useLensStore();

  useEffect(() => {
    fetchLiveData();
    fetchCrmOverview();
  }, [fetchLiveData, fetchCrmOverview]);

  const openDeals = deals.filter((d) => d.stage !== 'lost' && d.stage !== 'won');
  const openPipelineValue = openDeals.reduce((sum, d) => sum + Number(d.value || 0), 0);
  const wonDeals = deals.filter((d) => d.stage === 'won');
  const wonRevenue = wonDeals.reduce((sum, d) => sum + Number(d.value || 0), 0);
  const overdueTasks = tasks.filter((t) => t.status !== 'completed' && new Date(t.dueDate) < new Date());

  const recentLeads = leads.slice(0, 5);

  const kpis = overview?.kpis;
  const totalLeads = kpis?.totalLeads ?? leads.length;
  const activeLeads = kpis?.activeLeads ?? leads.filter(l => (l.status as any) !== 'LOST' && (l.status as any) !== 'SPAM').length;
  const totalSessions = kpis?.totalSessions ?? 0;
  const interactiveVisitors = kpis?.interactiveVisitors ?? 0;
  const arLaunchAttempts = kpis?.arLaunchAttempts ?? 0;
  const qrAttributedVisits = kpis?.qrAttributedVisits ?? 0;
  const conversionRate = kpis?.leadConversionRate !== undefined ? `${kpis.leadConversionRate}%` : '0.0%';

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto font-sans select-none">
      {/* Live Error Notification if present */}
      {liveError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-2xl flex items-center justify-between text-xs">
          <span>{liveError} — Showing cached session data.</span>
          <button 
            onClick={() => fetchLiveData()}
            className="flex items-center gap-1 font-bold underline hover:text-amber-700"
          >
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      )}

      {/* 1. Unified Executive Command Ribbon */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 md:p-6 shadow-2xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F4B400] animate-pulse" />
              <span className="text-[11px] font-black uppercase tracking-wider text-[#D97706]">
                I3DION Spatial Lens Intelligence
              </span>
              {isLoadingLive && <span className="text-[10px] text-amber-600 font-bold animate-pulse ml-1">(Live Updating...)</span>}
            </div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              Turn 3D Experiences into Closed Deals
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Real-time pipeline visibility, customer intent telemetry, and conversion velocity across spatial catalogs.
            </p>
          </div>

          {/* View Switcher & Action Shortcuts */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold text-slate-600">
              <button
                onClick={() => setHomeViewMode('overall')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  homeViewMode === 'overall' ? 'bg-white text-slate-950 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                <Layers size={13} />
                <span>Overall View</span>
              </button>
              <button
                onClick={() => {
                  setHomeViewMode('project');
                  setActiveView('projects');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  homeViewMode === 'project' ? 'bg-white text-slate-950 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                <Box size={13} />
                <span>Project View</span>
              </button>
            </div>

            <button
              onClick={() => setActiveView('deals')}
              className="flex items-center gap-1.5 bg-[#F4B400] hover:bg-[#D97706] text-slate-950 font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-2xs active:scale-95"
            >
              <Briefcase size={14} />
              <span>Pipeline Kanban</span>
            </button>
          </div>
        </div>

        {/* Commercial Metrics Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
          <div className="bg-slate-50/70 rounded-2xl p-3.5 border border-slate-100">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Active Pipeline</span>
            <span className="text-xl font-black text-slate-900 tracking-tight mt-0.5 block">${openPipelineValue.toLocaleString()}</span>
            <span className="text-[10px] text-amber-600 font-semibold">{openDeals.length} active opportunities</span>
          </div>

          <div className="bg-slate-50/70 rounded-2xl p-3.5 border border-slate-100">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Won Revenue</span>
            <span className="text-xl font-black text-emerald-600 tracking-tight mt-0.5 block">${wonRevenue.toLocaleString()}</span>
            <span className="text-[10px] text-emerald-700 font-semibold">{wonDeals.length} closed won deals</span>
          </div>

          <div className="bg-slate-50/70 rounded-2xl p-3.5 border border-slate-100">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Client Accounts</span>
            <span className="text-xl font-black text-slate-900 tracking-tight mt-0.5 block">{accounts.length}</span>
            <span className="text-[10px] text-slate-500 font-semibold">{accounts.filter(a => a.tier === 'Enterprise').length} Enterprise tier</span>
          </div>

          <div className="bg-slate-50/70 rounded-2xl p-3.5 border border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Action Items</span>
              <span className={`text-xl font-black tracking-tight mt-0.5 block ${overdueTasks.length > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                {overdueTasks.length > 0 ? `${overdueTasks.length} Overdue` : 'All Caught Up'}
              </span>
              <span className="text-[10px] text-slate-500 font-semibold">{tasks.length} total tasks</span>
            </div>
            {overdueTasks.length > 0 && (
              <button
                onClick={() => setActiveView('tasks')}
                className="bg-rose-50 text-rose-700 hover:bg-rose-100 text-[11px] font-bold px-2 py-1 rounded-lg border border-rose-200 transition"
              >
                Review
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Small Set of 6 KPI Cards Matching Reference Image 1 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* KPI 1: Total Leads */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-[#D97706] flex items-center justify-center">
              <Users size={18} />
            </div>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              <ArrowUpRight size={12} /> Live
            </span>
          </div>
          <div className="mt-3">
            <span className="block text-[11px] font-bold text-slate-400">Total Leads</span>
            <span className="text-xl font-black text-slate-900 tracking-tight mt-0.5 block">{totalLeads}</span>
            <span className="text-[10px] font-medium text-slate-400 mt-1 block">Inbound inquiries</span>
          </div>
        </div>

        {/* KPI 2: Active Leads */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <TrendingUp size={18} />
            </div>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded">
              <ArrowUpRight size={12} /> Active
            </span>
          </div>
          <div className="mt-3">
            <span className="block text-[11px] font-bold text-slate-400">Active Leads</span>
            <span className="text-xl font-black text-slate-900 tracking-tight mt-0.5 block">{activeLeads}</span>
            <span className="text-[10px] font-medium text-slate-400 mt-1 block">In sales pipeline</span>
          </div>
        </div>

        {/* KPI 3: QR Attributed Visits */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <QrCode size={18} />
            </div>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              <ArrowUpRight size={12} /> Traceable
            </span>
          </div>
          <div className="mt-3">
            <span className="block text-[11px] font-bold text-slate-400">QR Visits</span>
            <span className="text-xl font-black text-slate-900 tracking-tight mt-0.5 block">{qrAttributedVisits}</span>
            <span className="text-[10px] font-medium text-slate-400 mt-1 block">QR landings</span>
          </div>
        </div>

        {/* KPI 4: Total Sessions */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Eye size={18} />
            </div>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
              <ArrowUpRight size={12} /> 30d
            </span>
          </div>
          <div className="mt-3">
            <span className="block text-[11px] font-bold text-slate-400">Total Sessions</span>
            <span className="text-xl font-black text-slate-900 tracking-tight mt-0.5 block">{totalSessions}</span>
            <span className="text-[10px] font-medium text-slate-400 mt-1 block">Visitor journeys</span>
          </div>
        </div>

        {/* KPI 5: AR Experiences */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Smartphone size={18} />
            </div>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
              <ArrowUpRight size={12} /> Mobile
            </span>
          </div>
          <div className="mt-3">
            <span className="block text-[11px] font-bold text-slate-400">AR Intent</span>
            <span className="text-xl font-black text-slate-900 tracking-tight mt-0.5 block">{arLaunchAttempts}</span>
            <span className="text-[10px] font-medium text-slate-400 mt-1 block">Launch attempts</span>
          </div>
        </div>

        {/* KPI 6: Conversion Rate */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <PieChart size={18} />
            </div>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              <ArrowUpRight size={12} /> SQL
            </span>
          </div>
          <div className="mt-3">
            <span className="block text-[11px] font-bold text-slate-400">Conversion Rate</span>
            <span className="text-xl font-black text-slate-900 tracking-tight mt-0.5 block">{conversionRate}</span>
            <span className="text-[10px] font-medium text-slate-400 mt-1 block">Lead / session ratio</span>
          </div>
        </div>
      </div>

      {/* 3. Primary Visualizations Grid (Lead Trend, Leads by Source, Top Projects) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Lead Trend Line Chart (6 cols on lg) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-4 bg-[#F4B400] rounded-sm" />
              <h2 className="font-bold text-slate-900 text-sm">Lead Trend</h2>
            </div>

            <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F4B400]" />
                Total Leads
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                Qualified Leads
              </span>
            </div>
          </div>

          {/* SVG Smooth Line Chart */}
          <div className="h-52 w-full pt-2">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 500 180">
              <defs>
                <linearGradient id="yellowGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F4B400" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#F4B400" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="40" y1="20" x2="480" y2="20" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="40" y1="60" x2="480" y2="60" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="40" y1="100" x2="480" y2="100" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="40" y1="140" x2="480" y2="140" stroke="#E2E8F0" strokeWidth="1" />

              {/* Y Axis Labels */}
              <text x="25" y="24" fill="#94A3B8" fontSize="10" fontWeight="600" textAnchor="end">200</text>
              <text x="25" y="64" fill="#94A3B8" fontSize="10" fontWeight="600" textAnchor="end">150</text>
              <text x="25" y="104" fill="#94A3B8" fontSize="10" fontWeight="600" textAnchor="end">100</text>
              <text x="25" y="144" fill="#94A3B8" fontSize="10" fontWeight="600" textAnchor="end">0</text>

              {/* Total Leads Area & Line */}
              <path
                d="M 40 120 Q 90 80, 140 100 T 240 60 T 340 90 T 440 30 L 440 140 L 40 140 Z"
                fill="url(#yellowGradient)"
              />
              <path
                d="M 40 120 Q 90 80, 140 100 T 240 60 T 340 90 T 440 30"
                fill="none"
                stroke="#F4B400"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Qualified Leads Area & Line */}
              <path
                d="M 40 135 Q 90 115, 140 120 T 240 95 T 340 110 T 440 70 L 440 140 L 40 140 Z"
                fill="url(#blueGradient)"
              />
              <path
                d="M 40 135 Q 90 115, 140 120 T 240 95 T 340 110 T 440 70"
                fill="none"
                stroke="#3B82F6"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Data Points */}
              <circle cx="140" cy="100" r="4" fill="#F4B400" stroke="#FFF" strokeWidth="2" />
              <circle cx="240" cy="60" r="4" fill="#F4B400" stroke="#FFF" strokeWidth="2" />
              <circle cx="340" cy="90" r="4" fill="#F4B400" stroke="#FFF" strokeWidth="2" />
              <circle cx="440" cy="30" r="5" fill="#F4B400" stroke="#FFF" strokeWidth="2" />

              {/* X Axis Date Labels */}
              <text x="40" y="160" fill="#94A3B8" fontSize="10" fontWeight="600" textAnchor="middle">Jun 01</text>
              <text x="120" y="160" fill="#94A3B8" fontSize="10" fontWeight="600" textAnchor="middle">Jun 08</text>
              <text x="200" y="160" fill="#94A3B8" fontSize="10" fontWeight="600" textAnchor="middle">Jun 15</text>
              <text x="280" y="160" fill="#94A3B8" fontSize="10" fontWeight="600" textAnchor="middle">Jun 22</text>
              <text x="360" y="160" fill="#94A3B8" fontSize="10" fontWeight="600" textAnchor="middle">Jun 28</text>
              <text x="440" y="160" fill="#94A3B8" fontSize="10" fontWeight="600" textAnchor="middle">Jun 30</text>
            </svg>
          </div>
        </div>

        {/* Leads by Source Donut Chart (3 cols on lg) */}
        <div className="lg:col-span-3 bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-4 bg-[#F4B400] rounded-sm" />
            <h2 className="font-bold text-slate-900 text-sm">Leads by Source</h2>
          </div>

          <div className="relative flex items-center justify-center py-2">
            <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="38" stroke="#3B82F6" strokeWidth="16" fill="transparent" strokeDasharray="238.7" strokeDashoffset="83" />
              <circle cx="50" cy="50" r="38" stroke="#F4B400" strokeWidth="16" fill="transparent" strokeDasharray="238.7" strokeDashoffset="136" />
              <circle cx="50" cy="50" r="38" stroke="#10B981" strokeWidth="16" fill="transparent" strokeDasharray="238.7" strokeDashoffset="180" />
              <circle cx="50" cy="50" r="38" stroke="#8B5CF6" strokeWidth="16" fill="transparent" strokeDasharray="238.7" strokeDashoffset="210" />
            </svg>

            {/* Center Label */}
            <div className="absolute text-center leading-none">
              <span className="text-base font-black text-slate-900 block">1,248</span>
              <span className="text-[10px] font-bold text-slate-400 block mt-0.5">Total Leads</span>
            </div>
          </div>

          <div className="space-y-1.5 text-xs font-semibold text-slate-600">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" />
                Website
              </span>
              <span className="font-bold text-slate-900">35%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F4B400]" />
                QR Code
              </span>
              <span className="font-bold text-slate-900">22%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                AR Experience
              </span>
              <span className="font-bold text-slate-900">18%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]" />
                Direct / Partner
              </span>
              <span className="font-bold text-slate-900">25%</span>
            </div>
          </div>
        </div>

        {/* Top Projects Progress Bars (4 cols on lg) */}
        <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-4 bg-[#F4B400] rounded-sm" />
              <h2 className="font-bold text-slate-900 text-sm">Top Projects</h2>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">Views & Leads</span>
          </div>

          <div className="space-y-3.5">
            {projects.map((proj) => (
              <div key={proj.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">{proj.name}</span>
                  <div className="flex items-center gap-3 text-slate-500 font-semibold">
                    <span>{proj.viewsCount.toLocaleString()} views</span>
                    <span className="font-bold text-slate-900">{proj.leadsCount} leads</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#F4B400] rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (proj.viewsCount / 4320) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Bottom Row: Recent Leads & Latest Activity (Matching Reference Image 1) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Leads Table (8 cols on lg) */}
        <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-4 bg-[#F4B400] rounded-sm" />
              <h2 className="font-bold text-slate-900 text-sm">Recent Leads</h2>
            </div>
            <button
              onClick={() => setActiveView('leads')}
              className="text-xs font-bold text-[#D97706] hover:underline"
            >
              View All ({leads.length})
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-medium">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Company</th>
                  <th className="py-2.5 px-3">Product / Project</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {recentLeads.map((l) => (
                  <tr
                    key={l.id}
                    onClick={() => openLeadDrawer(l.id)}
                    className="hover:bg-amber-50/40 cursor-pointer transition"
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 font-bold text-[10px] flex items-center justify-center">
                          {l.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-bold text-slate-900">{l.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-600">{l.company}</td>
                    <td className="py-3 px-3 text-slate-600">{l.productProject}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          l.status === 'New'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : l.status === 'Qualified'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : l.status === 'Contacted'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : l.status === 'In Progress'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : l.status === 'Converted'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400 font-medium">{l.date}</td>
                    <td className="py-3 px-3 text-right">
                      <button className="p-1 text-slate-400 hover:text-slate-800 rounded">
                        <MoreVertical size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Latest Activity Feed (4 cols on lg) */}
        <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-4 bg-[#F4B400] rounded-sm" />
              <h2 className="font-bold text-slate-900 text-sm">Latest Activity</h2>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">Live Feed</span>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                <Users size={15} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800 truncate">New lead captured from website</p>
                <p className="text-[11px] text-slate-400">Rahul Sharma • Sharma Engineering</p>
                <span className="text-[10px] text-slate-400 block mt-0.5 font-semibold">2 minutes ago</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-[#D97706] flex items-center justify-center shrink-0 mt-0.5">
                <Eye size={15} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800 truncate">3D Product model viewed (4m 12s)</p>
                <p className="text-[11px] text-slate-400">Industrial Compressor</p>
                <span className="text-[10px] text-slate-400 block mt-0.5 font-semibold">12 minutes ago</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                <Smartphone size={15} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800 truncate">AR experience opened</p>
                <p className="text-[11px] text-slate-400">HVAC System AR Floor Placement</p>
                <span className="text-[10px] text-slate-400 block mt-0.5 font-semibold">28 minutes ago</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                <TrendingUp size={15} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800 truncate">Lead status updated to Qualified</p>
                <p className="text-[11px] text-slate-400">Priya Mehta • Mehta Corp</p>
                <span className="text-[10px] text-slate-400 block mt-0.5 font-semibold">1 hour ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
