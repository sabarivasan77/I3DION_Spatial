import React from 'react';
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
  Sparkles
} from 'lucide-react';

export const LensHomeView: React.FC = () => {
  const {
    homeViewMode,
    setHomeViewMode,
    leads,
    projects,
    openLeadDrawer,
    setActiveView
  } = useLensStore();

  const recentLeads = leads.slice(0, 5);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto font-sans select-none">
      {/* 1. Hero Banner Inspired by Reference Image 1 */}
      <div className="relative overflow-hidden rounded-3xl bg-amber-500/10 border border-amber-200/80 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xs">
        <div className="space-y-3 z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/90 border border-amber-200 px-3 py-1 text-xs font-bold text-[#D97706] shadow-2xs">
            <Sparkles size={13} className="text-[#F4B400]" />
            <span>I3DION Spatial Lens Intelligence</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">
            Turn Your Data into Meaningful Insights
          </h1>
          <p className="text-xs md:text-sm font-medium text-slate-600 leading-relaxed">
            Track leads, analyze performance and unlock opportunities across all your 3D experiences.
          </p>

          {/* View Switcher Pills */}
          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={() => setHomeViewMode('overall')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-2xs ${
                homeViewMode === 'overall'
                  ? 'bg-[#F4B400] text-slate-950 shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Layers size={14} />
              <span>Overall View</span>
            </button>

            <button
              onClick={() => {
                setHomeViewMode('project');
                setActiveView('projects');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                homeViewMode === 'project'
                  ? 'bg-[#F4B400] text-slate-950 shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Box size={14} />
              <span>Project View</span>
            </button>
          </div>
        </div>

        {/* Banner Right Badge (Data powered by I3DION Vault) */}
        <div className="bg-white/90 border border-slate-200/90 rounded-2xl p-4 shadow-sm space-y-2 shrink-0 z-10">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">
            Data powered by
          </span>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#F4B400] text-slate-950 font-black text-xs flex items-center justify-center">
              3D
            </div>
            <div className="leading-none">
              <span className="font-extrabold text-slate-900 text-xs block">I3DION Vault</span>
              <span className="text-[10px] text-slate-400 font-medium">Secure • Centralized • Reliable</span>
            </div>
          </div>
        </div>

        {/* Subtle Background Pattern graphic */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-amber-100/50 to-transparent pointer-events-none" />
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
              <ArrowUpRight size={12} /> 12%
            </span>
          </div>
          <div className="mt-3">
            <span className="block text-[11px] font-bold text-slate-400">Total Leads</span>
            <span className="text-xl font-black text-slate-900 tracking-tight mt-0.5 block">1,248</span>
            <span className="text-[10px] font-medium text-slate-400 mt-1 block">vs last 30 days</span>
          </div>
        </div>

        {/* KPI 2: Qualified Leads */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <TrendingUp size={18} />
            </div>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              <ArrowUpRight size={12} /> 8%
            </span>
          </div>
          <div className="mt-3">
            <span className="block text-[11px] font-bold text-slate-400">Qualified Leads</span>
            <span className="text-xl font-black text-slate-900 tracking-tight mt-0.5 block">312</span>
            <span className="text-[10px] font-medium text-slate-400 mt-1 block">vs last 30 days</span>
          </div>
        </div>

        {/* KPI 3: Total Projects */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Box size={18} />
            </div>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              <ArrowUpRight size={12} /> 27%
            </span>
          </div>
          <div className="mt-3">
            <span className="block text-[11px] font-bold text-slate-400">Total Projects</span>
            <span className="text-xl font-black text-slate-900 tracking-tight mt-0.5 block">28</span>
            <span className="text-[10px] font-medium text-slate-400 mt-1 block">vs last 30 days</span>
          </div>
        </div>

        {/* KPI 4: Total Views */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Eye size={18} />
            </div>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              <ArrowUpRight size={12} /> 18%
            </span>
          </div>
          <div className="mt-3">
            <span className="block text-[11px] font-bold text-slate-400">Total Views</span>
            <span className="text-xl font-black text-slate-900 tracking-tight mt-0.5 block">12,486</span>
            <span className="text-[10px] font-medium text-slate-400 mt-1 block">vs last 30 days</span>
          </div>
        </div>

        {/* KPI 5: AR Experiences */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Smartphone size={18} />
            </div>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              <ArrowUpRight size={12} /> 23%
            </span>
          </div>
          <div className="mt-3">
            <span className="block text-[11px] font-bold text-slate-400">AR Experiences</span>
            <span className="text-xl font-black text-slate-900 tracking-tight mt-0.5 block">3,276</span>
            <span className="text-[10px] font-medium text-slate-400 mt-1 block">vs last 30 days</span>
          </div>
        </div>

        {/* KPI 6: Conversion Rate */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <PieChart size={18} />
            </div>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              <ArrowUpRight size={12} /> 5%
            </span>
          </div>
          <div className="mt-3">
            <span className="block text-[11px] font-bold text-slate-400">Conversion Rate</span>
            <span className="text-xl font-black text-slate-900 tracking-tight mt-0.5 block">25.0%</span>
            <span className="text-[10px] font-medium text-slate-400 mt-1 block">vs last 30 days</span>
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
