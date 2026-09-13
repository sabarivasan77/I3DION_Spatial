import React from 'react';
import { useLensStore } from '../store/useLensStore';
import { Box, Eye, Users, Smartphone, TrendingUp, Filter, ArrowRight } from 'lucide-react';

export const LensProjectsView: React.FC = () => {
  const { projects, selectedProjectId, setSelectedProjectId, setFilters, setActiveView } = useLensStore();

  const activeProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  const handleSelectProject = (projId: string, projName: string) => {
    setSelectedProjectId(projId);
    setFilters({ projectFilter: projName });
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto font-sans select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Project-Wise Intelligence</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Isolate performance, views, AR activations, and lead pipeline for specific 3D projects.
          </p>
        </div>
      </div>

      {/* Project Selection Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {projects.map((p) => {
          const isSelected = activeProject.id === p.id;
          return (
            <div
              key={p.id}
              onClick={() => handleSelectProject(p.id, p.name)}
              className={`p-4 rounded-2xl border cursor-pointer transition text-left space-y-2.5 ${
                isSelected
                  ? 'border-[#F4B400] bg-amber-50/60 shadow-md ring-2 ring-amber-200'
                  : 'border-slate-200 bg-white hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                  isSelected ? 'bg-[#F4B400] text-slate-950' : 'bg-slate-100 text-slate-600'
                }`}>
                  <Box size={16} />
                </div>
                <span className="text-[10px] font-bold text-slate-400">{p.status}</span>
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 truncate">{p.name}</h3>
                <p className="text-[10px] text-slate-500">{p.category}</p>
              </div>
              <div className="pt-2 border-t border-slate-100/80 flex items-center justify-between text-[11px] font-semibold text-slate-600">
                <span>{p.viewsCount.toLocaleString()} views</span>
                <span className="font-bold text-emerald-600">{p.leadsCount} leads</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deep Dive Panel for Selected Project */}
      {activeProject && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-[#D97706] tracking-wider">
                Active Project Intelligence Context
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-0.5">{activeProject.name}</h2>
              <p className="text-xs text-slate-500 font-medium">{activeProject.category} • Updated {activeProject.updatedAt}</p>
            </div>

            <button
              onClick={() => {
                setFilters({ projectFilter: activeProject.name });
                setActiveView('leads');
              }}
              className="flex items-center gap-1.5 bg-[#F4B400] hover:bg-[#D97706] text-slate-950 font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition"
            >
              <span>View Leads for {activeProject.name}</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase">3D Canvas Views</span>
              <span className="text-2xl font-black text-slate-900 block">{activeProject.viewsCount.toLocaleString()}</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase">Captured Leads</span>
              <span className="text-2xl font-black text-slate-900 block">{activeProject.leadsCount}</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase">AR Sessions</span>
              <span className="text-2xl font-black text-rose-600 block">{activeProject.arSessionsCount}</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase">Conversion Rate</span>
              <span className="text-2xl font-black text-emerald-600 block">{activeProject.conversionRate}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
