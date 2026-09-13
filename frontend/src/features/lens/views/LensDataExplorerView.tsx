import React, { useState } from 'react';
import { useLensStore } from '../store/useLensStore';
import { Database, Lock, ShieldCheck, Download, Search, Table, Eye } from 'lucide-react';

export const LensDataExplorerView: React.FC = () => {
  const { datasets } = useLensStore();
  const [selectedDatasetId, setSelectedDatasetId] = useState(datasets[0]?.id || 'ds_leads_vault');
  const [searchQuery, setSearchQuery] = useState('');

  const activeDataset = datasets.find((d) => d.id === selectedDatasetId) || datasets[0];

  const filteredData = activeDataset.sampleData.filter((row) => {
    if (!searchQuery) return true;
    return Object.values(row).some((val) => String(val).toLowerCase().includes(searchQuery.toLowerCase()));
  });

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto font-sans select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Vault Data Explorer</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Inspect authorized datasets, schemas, field types, and raw records exposed via Vault.
          </p>
        </div>
      </div>

      {/* Dataset Selection Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {datasets.map((d) => {
          const isSelected = d.id === activeDataset.id;
          return (
            <div
              key={d.id}
              onClick={() => setSelectedDatasetId(d.id)}
              className={`p-4 rounded-2xl border cursor-pointer transition space-y-2 ${
                isSelected
                  ? 'border-[#F4B400] bg-amber-50/60 ring-2 ring-amber-200 shadow-md'
                  : 'border-slate-200 bg-white hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database size={16} className={isSelected ? 'text-[#D97706]' : 'text-slate-400'} />
                  <h3 className="font-bold text-slate-900 text-xs">{d.name}</h3>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {d.accessLevel}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 pt-1">
                <span>{d.recordsCount.toLocaleString()} records</span>
                <span>Sync: {d.updatedAt}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Dataset Record Viewer Table */}
      {activeDataset && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{activeDataset.name}</h2>
                <span className="text-xs text-slate-400 font-semibold">({activeDataset.source})</span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Schema Fields: {activeDataset.fields.map((f) => `${f.name} (${f.type})`).join(', ')}
              </p>
            </div>

            <div className="relative w-64">
              <Search size={14} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search dataset records..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#F4B400]"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-medium">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold">
                  {activeDataset.fields.map((f) => (
                    <th key={f.name} className="py-2.5 px-3">
                      {f.name} <span className="text-[9px] text-slate-300 font-normal">({f.type})</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {filteredData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    {activeDataset.fields.map((f) => (
                      <td key={f.name} className="py-2.5 px-3">
                        {String(row[f.name] ?? '-')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
