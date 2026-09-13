import React from 'react';
import { useLensStore } from '../store/useLensStore';
import { Bookmark, Play, Trash2, Calendar, User } from 'lucide-react';

export const LensSavedViewsView: React.FC = () => {
  const { savedViews, applySavedView, deleteSavedView } = useLensStore();

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto font-sans select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Saved Views & Filter Presets</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Reopen customized filter combinations, dashboard query layouts, and data exploration states with 1 click.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {savedViews.map((sv) => (
          <div key={sv.id} className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs space-y-4 hover:shadow-md transition">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-amber-50 text-[#D97706] flex items-center justify-center font-bold">
                  <Bookmark size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{sv.name}</h3>
                  <span className="text-[10px] text-slate-400 font-semibold">{sv.type}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs font-semibold text-slate-600 space-y-1">
              {sv.filterState.statusFilter !== 'all' && (
                <div className="flex justify-between">
                  <span>Status Filter:</span> <span className="text-[#D97706] font-bold">{sv.filterState.statusFilter}</span>
                </div>
              )}
              {sv.filterState.sourceFilter !== 'all' && (
                <div className="flex justify-between">
                  <span>Source Filter:</span> <span className="text-slate-900">{sv.filterState.sourceFilter}</span>
                </div>
              )}
              {sv.filterState.projectFilter !== 'all' && (
                <div className="flex justify-between">
                  <span>Project Filter:</span> <span className="text-slate-900">{sv.filterState.projectFilter}</span>
                </div>
              )}
              <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                <span>Created by {sv.createdBy}</span>
                <span>{sv.createdAt}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => deleteSavedView(sv.id)}
                className="text-xs font-bold text-slate-400 hover:text-rose-600"
              >
                Delete
              </button>
              <button
                onClick={() => applySavedView(sv)}
                className="flex items-center gap-1.5 bg-[#F4B400] hover:bg-[#D97706] text-slate-950 font-bold text-xs px-4 py-1.5 rounded-xl transition shadow-2xs"
              >
                <Play size={12} className="fill-current" />
                <span>Apply Filter Preset</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
