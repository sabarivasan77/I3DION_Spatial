import React, { useState } from 'react';
import { useLensStore } from '../store/useLensStore';
import { Filter, RotateCcw, Bookmark, Check, ChevronDown } from 'lucide-react';

export const LensFilterBar: React.FC = () => {
  const { filters, setFilters, resetFilters, saveCurrentView, projects } = useLensStore();
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState('');

  const activeFilterCount =
    (filters.projectFilter !== 'all' ? 1 : 0) +
    (filters.productFilter !== 'all' ? 1 : 0) +
    (filters.sourceFilter !== 'all' ? 1 : 0) +
    (filters.statusFilter !== 'all' ? 1 : 0) +
    (filters.assignedUserFilter !== 'all' ? 1 : 0) +
    (filters.searchKeyword ? 1 : 0);

  const handleSaveFilterSet = () => {
    if (saveName.trim()) {
      saveCurrentView(saveName.trim(), 'Leads Filter');
      setSaveName('');
      setShowSaveModal(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Filters Controls Row */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Range Selector */}
          <div className="flex flex-col">
            <label className="text-[10px] font-bold uppercase text-slate-400 mb-1">Date Range</label>
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters({ dateRange: e.target.value as any })}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#F4B400]"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="ytd">Year to Date</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex flex-col">
            <label className="text-[10px] font-bold uppercase text-slate-400 mb-1">Status</label>
            <select
              value={filters.statusFilter}
              onChange={(e) => setFilters({ statusFilter: e.target.value })}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#F4B400]"
            >
              <option value="all">All Statuses</option>
              <option value="New">New</option>
              <option value="Qualified">Qualified</option>
              <option value="Contacted">Contacted</option>
              <option value="In Progress">In Progress</option>
              <option value="Converted">Converted</option>
              <option value="Lost">Lost</option>
            </select>
          </div>

          {/* Source Filter */}
          <div className="flex flex-col">
            <label className="text-[10px] font-bold uppercase text-slate-400 mb-1">Source</label>
            <select
              value={filters.sourceFilter}
              onChange={(e) => setFilters({ sourceFilter: e.target.value })}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#F4B400]"
            >
              <option value="all">All Sources</option>
              <option value="Website">Website</option>
              <option value="QR Code">QR Code</option>
              <option value="AR Experience">AR Experience</option>
              <option value="Direct">Direct Contact</option>
              <option value="Partner">Partner</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Project Filter */}
          <div className="flex flex-col">
            <label className="text-[10px] font-bold uppercase text-slate-400 mb-1">Project</label>
            <select
              value={filters.projectFilter}
              onChange={(e) => setFilters({ projectFilter: e.target.value })}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#F4B400]"
            >
              <option value="all">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Product Filter */}
          <div className="flex flex-col">
            <label className="text-[10px] font-bold uppercase text-slate-400 mb-1">Product</label>
            <select
              value={filters.productFilter}
              onChange={(e) => setFilters({ productFilter: e.target.value })}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#F4B400]"
            >
              <option value="all">All Products</option>
              <option value="Industrial Compressor">Industrial Compressor</option>
              <option value="HVAC System">HVAC System</option>
              <option value="Valve Assembly">Valve Assembly</option>
              <option value="Factory Line">Factory Line</option>
              <option value="Pump Series">Pump Series</option>
            </select>
          </div>

          {/* Assigned To Filter */}
          <div className="flex flex-col">
            <label className="text-[10px] font-bold uppercase text-slate-400 mb-1">Assigned To</label>
            <select
              value={filters.assignedUserFilter}
              onChange={(e) => setFilters({ assignedUserFilter: e.target.value })}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#F4B400]"
            >
              <option value="all">All Users</option>
              <option value="Anita Patil">Anita Patil</option>
              <option value="Michael Kim">Michael Kim</option>
              <option value="Sarah Lee">Sarah Lee</option>
              <option value="Daniel Turner">Daniel Turner</option>
              <option value="Rahul Sharma">Rahul Sharma</option>
            </select>
          </div>
        </div>

        {/* Action Buttons Right */}
        <div className="flex items-center gap-2 self-end">
          <button
            onClick={() => setShowSaveModal(true)}
            className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-[#D97706] hover:bg-amber-100 font-bold text-xs px-3 py-1.5 rounded-xl transition shadow-2xs"
          >
            <Bookmark size={13} />
            <span>Save Filter Set</span>
          </button>

          {activeFilterCount > 0 && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-slate-500 hover:text-slate-900 font-bold text-xs px-2.5 py-1.5 rounded-xl transition"
            >
              <RotateCcw size={13} />
              <span>Reset ({activeFilterCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Save Filter Set Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Save Current Filter Set</h3>
              <button onClick={() => setShowSaveModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Filter Preset Name</label>
              <input
                type="text"
                placeholder="e.g. Qualified Website Leads Q3"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#F4B400]"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFilterSet}
                className="px-4 py-1.5 rounded-xl bg-[#F4B400] hover:bg-[#D97706] text-slate-950 font-bold text-xs shadow-sm"
              >
                Save Filter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
