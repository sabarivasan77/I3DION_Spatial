import React, { useState } from 'react';
import { useLensStore } from '../store/useLensStore';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import {
  TrendingUp,
  Clock,
  Sparkles,
  Maximize2,
  Calendar,
  Layers,
  Smartphone,
  Eye,
  CheckCircle2,
  Search,
  ArrowUpRight,
  RefreshCw,
  Share2,
  Download
} from 'lucide-react';

const COLORS = ['#F4B400', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899', '#F97316'];

const TIME_SERIES_TELEMETRY = [
  { time: '09:00', dwellSec: 140, visitors: 42, arLaunches: 18 },
  { time: '11:00', dwellSec: 220, visitors: 88, arLaunches: 36 },
  { time: '13:00', dwellSec: 310, visitors: 145, arLaunches: 62 },
  { time: '15:00', dwellSec: 280, visitors: 132, arLaunches: 58 },
  { time: '17:00', dwellSec: 360, visitors: 194, arLaunches: 84 },
  { time: '19:00', dwellSec: 290, visitors: 160, arLaunches: 66 },
  { time: '21:00', dwellSec: 180, visitors: 95, arLaunches: 41 }
];

const HOTSPOT_INTERACTION_DATA = [
  { part: 'Turbine Rotor', clicks: 840, dwell: '3m 12s' },
  { part: 'Thermal Casing', clicks: 620, dwell: '2m 18s' },
  { part: 'Hydraulic Seals', clicks: 540, dwell: '1m 54s' },
  { part: 'Control Unit', clicks: 490, dwell: '2m 05s' },
  { part: 'Exhaust Valve', clicks: 380, dwell: '1m 32s' }
];

const DEVICE_BREAKDOWN_DATA = [
  { name: 'Desktop Web 3D', value: 48 },
  { name: 'Mobile Safari QuickLook', value: 24 },
  { name: 'Android SceneViewer', value: 16 },
  { name: 'Meta Quest WebXR', value: 12 }
];

const CONVERSION_FUNNEL = [
  { stage: '1. Model Viewport Loaded', count: 18450, rate: '100%', drop: '0%' },
  { stage: '2. 3D Orbit Interaction (>10s)', count: 12620, rate: '68.4%', drop: '-31.6%' },
  { stage: '3. Part Hotspot Inspected', count: 7840, rate: '42.5%', drop: '-25.9%' },
  { stage: '4. WebXR AR Placement', count: 3420, rate: '18.5%', drop: '-24.0%' },
  { stage: '5. Inbound Commercial Lead', count: 975, rate: '5.3%', drop: '-13.2%' },
  { stage: '6. Won Enterprise Contract', count: 278, rate: '1.5%', drop: '-3.8%' }
];

export const LensAnalyticsView: React.FC = () => {
  const { projects, togglePresentationMode, fetchLiveData, isLoadingLive } = useLensStore();
  const [timeSlicer, setTimeSlicer] = useState<'today' | '7d' | '30d' | 'qtd' | 'ytd'>('30d');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProjects = projects.filter((p) => {
    const matchesCat = categoryFilter === 'all' || p.category.toLowerCase().includes(categoryFilter.toLowerCase());
    const matchesQuery = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto font-sans select-none">
      {/* Power BI Workspace Header & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border border-slate-200/90 rounded-2xl p-4 md:p-5 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-wider text-[#D97706]">
              Power BI Deep-Dive Telemetry Engine
            </span>
            {isLoadingLive && <span className="text-[10px] text-amber-600 font-bold animate-pulse">(Refreshing...)</span>}
          </div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
            Spatial Telemetry & 3D Analytics Workspace
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Real-time WebXR dwell times, interactive hotspot heatmaps, device attribution, and catalog conversion velocity.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Time Slicer Pills */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold text-slate-600">
            {(['today', '7d', '30d', 'qtd', 'ytd'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeSlicer(t)}
                className={`px-3 py-1.5 rounded-lg transition uppercase text-[10px] tracking-wider ${
                  timeSlicer === t ? 'bg-[#F4B400] text-slate-950 font-black shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => fetchLiveData()}
            className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition"
            title="Refresh Live Data"
          >
            <RefreshCw size={13} className={isLoadingLive ? 'animate-spin text-[#F4B400]' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Presentation View Toggle */}
          <button
            onClick={togglePresentationMode}
            className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition active:scale-95"
            title="Launch Fullscreen Executive Boardroom View"
          >
            <Maximize2 size={14} />
            <span>Boardroom View</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip with Animated Accent Borders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs hover:shadow-md transition-all duration-300 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Avg Session Dwell</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              ↑ 18.4%
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">4m 18s</div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Average time spent interacting in 3D canvas.</p>
          <div className="w-full h-1 bg-amber-100 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-[#F4B400] w-[78%] rounded-full animate-pulse" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs hover:shadow-md transition-all duration-300 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Hotspot Click Rate</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              ↑ 22.1%
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">68.4%</div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Visitors inspecting exploded parts & specs.</p>
          <div className="w-full h-1 bg-blue-100 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-[#3B82F6] w-[68%] rounded-full" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs hover:shadow-md transition-all duration-300 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">WebXR & AR Placements</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              ↑ 34.6%
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">3,420</div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Anchored floor experiences via mobile/headset.</p>
          <div className="w-full h-1 bg-emerald-100 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-emerald-500 w-[84%] rounded-full" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs hover:shadow-md transition-all duration-300 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Catalog Conversion</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              ↑ 5.8%
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">28.5%</div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Visitors converting into qualified RFQ leads.</p>
          <div className="w-full h-1 bg-purple-100 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-purple-500 w-[58%] rounded-full" />
          </div>
        </div>
      </div>

      {/* Main Charts Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Interactive Dwell Time & Sessions Timeline (8 Cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-slate-900 text-base tracking-tight">
                3D Interaction Dwell Time & Concurrent Visitors
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Telemetry time-series tracking engagement peaks across published spatial experiences.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F4B400]" /> Dwell Secs
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" /> Active Visitors
              </span>
            </div>
          </div>

          <div className="h-72 w-full pt-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={TIME_SERIES_TELEMETRY} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="amberGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F4B400" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#F4B400" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="time" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#FFF',
                    fontSize: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)'
                  }}
                  itemStyle={{ color: '#F4B400' }}
                />
                <Area
                  type="monotone"
                  dataKey="dwellSec"
                  stroke="#F4B400"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#amberGradient)"
                  name="Dwell (sec)"
                />
                <Area
                  type="monotone"
                  dataKey="visitors"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#blueGradient)"
                  name="Visitors"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Device & Platform Distribution (4 Cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="font-extrabold text-slate-900 text-base tracking-tight">Platform & Device Split</h2>
            <p className="text-xs text-slate-400 font-medium">Telemetry breakdown by client runtime.</p>
          </div>

          <div className="h-52 w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={DEVICE_BREAKDOWN_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {DEVICE_BREAKDOWN_DATA.map((_, index) => (
                    <Cell key={`device-cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`${val}%`, 'Share']}
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#FFF',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-black text-slate-900 leading-none">100%</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Verified</span>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            {DEVICE_BREAKDOWN_DATA.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                  <span>{item.name}</span>
                </div>
                <span className="font-bold text-slate-900">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 3: Hotspot Feature Inspection Heatmap (6 Cols) */}
        <div className="lg:col-span-6 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-slate-900 text-base tracking-tight">
                Top Inspected 3D Hotspots & Assemblies
              </h2>
              <p className="text-xs text-slate-400 font-medium">Components capturing the highest customer dwell time.</p>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#D97706] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Live Heatmap
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={HOTSPOT_INTERACTION_DATA} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis dataKey="part" type="category" stroke="#64748B" fontSize={11} tickLine={false} width={110} />
                <Tooltip
                  formatter={(val: any) => [`${val} total clicks`, 'Clicks']}
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#FFF',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="clicks" fill="#F4B400" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Stepped Conversion Funnel (6 Cols) */}
        <div className="lg:col-span-6 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-slate-900 text-base tracking-tight">
                3D-to-Deal Commercial Funnel
              </h2>
              <p className="text-xs text-slate-400 font-medium">Conversion drop-offs from initial 3D load to contract.</p>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              28.5% Net Win
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {CONVERSION_FUNNEL.map((step, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                  <span className="truncate">{step.stage}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-medium">{step.count.toLocaleString()}</span>
                    <span className="font-extrabold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                      {step.rate}
                    </span>
                  </div>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-[#F4B400] to-amber-600 rounded-full transition-all duration-700"
                    style={{ width: step.rate }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Projects Telemetry Matrix Table */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              3D Project Telemetry Breakdown
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              Granular engagement and conversion statistics across active 3D models.
            </p>
          </div>

          {/* Table Search & Slicer Filter */}
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search models..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:border-[#F4B400] w-48"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs font-bold border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#F4B400] text-slate-700 bg-white"
            >
              <option value="all">All Categories</option>
              <option value="heavy machinery">Heavy Machinery</option>
              <option value="commercial building">Commercial Building</option>
              <option value="hydraulic">Hydraulic Systems</option>
              <option value="robotics">Robotics</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-medium">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold">
                <th className="py-3 px-3">Project Title</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Total 3D Views</th>
                <th className="py-3 px-3">WebXR Sessions</th>
                <th className="py-3 px-3">Captured Leads</th>
                <th className="py-3 px-3">Conversion Rate</th>
                <th className="py-3 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredProjects.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition">
                  <td className="py-3.5 px-3 font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#F4B400]" />
                    <span>{p.name}</span>
                  </td>
                  <td className="py-3.5 px-3 text-slate-500 font-semibold">{p.category}</td>
                  <td className="py-3.5 px-3 font-extrabold text-slate-900">{p.viewsCount.toLocaleString()}</td>
                  <td className="py-3.5 px-3 font-bold text-amber-700">{p.arSessionsCount.toLocaleString()}</td>
                  <td className="py-3.5 px-3 font-bold text-emerald-600">{p.leadsCount}</td>
                  <td className="py-3.5 px-3 font-black text-slate-900">
                    <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200">
                      {p.conversionRate}%
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                        p.status === 'Published'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
