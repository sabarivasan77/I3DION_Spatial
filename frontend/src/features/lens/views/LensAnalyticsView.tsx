import React from 'react';
import { useLensStore } from '../store/useLensStore';
import { LensFilterBar } from '../components/LensFilterBar';
import { BarChart3, TrendingUp, Eye, Smartphone, Zap, ArrowUpRight } from 'lucide-react';

export const LensAnalyticsView: React.FC = () => {
  const { projects } = useLensStore();

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto font-sans select-none">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Analytics Workspace</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Deep-dive performance telemetry, hotspot click maps, and 3D session duration metrics.
          </p>
        </div>
      </div>

      <LensFilterBar />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Avg Interactive Session</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">↑ 14%</span>
          </div>
          <div className="text-3xl font-black text-slate-900">4m 12s</div>
          <p className="text-xs text-slate-500 font-medium">Average time spent interacting with 3D models.</p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Hotspot Click Rate</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">↑ 22%</span>
          </div>
          <div className="text-3xl font-black text-slate-900">68.4%</div>
          <p className="text-xs text-slate-500 font-medium">Visitors who clicked interactive model hotspots.</p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">AR Floor Placements</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">↑ 31%</span>
          </div>
          <div className="text-3xl font-black text-slate-900">3,276</div>
          <p className="text-xs text-slate-500 font-medium">Successful WebXR & mobile AR floor anchors.</p>
        </div>
      </div>

      {/* Projects Telemetry Table */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900">3D Project Engagement Breakdowns</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-medium">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold">
                <th className="py-2.5 px-3">Project Title</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Views</th>
                <th className="py-2.5 px-3">AR Sessions</th>
                <th className="py-2.5 px-3">Leads</th>
                <th className="py-2.5 px-3">Conversion Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {projects.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="py-3 px-3 font-bold text-slate-900">{p.name}</td>
                  <td className="py-3 px-3 text-slate-500">{p.category}</td>
                  <td className="py-3 px-3 font-semibold">{p.viewsCount.toLocaleString()}</td>
                  <td className="py-3 px-3 font-semibold text-rose-600">{p.arSessionsCount}</td>
                  <td className="py-3 px-3 font-semibold text-emerald-600">{p.leadsCount}</td>
                  <td className="py-3 px-3 font-extrabold text-slate-900">{p.conversionRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
