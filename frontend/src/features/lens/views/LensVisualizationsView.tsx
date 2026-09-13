import React, { useState } from 'react';
import { useLensStore } from '../store/useLensStore';
import { ChartType, LensVisualization } from '../types/lensTypes';
import {
  Plus,
  PieChart,
  BarChart,
  LineChart,
  Grid,
  Trash2,
  Copy,
  Edit,
  Move,
  Save,
  Check,
  X
} from 'lucide-react';

export const LensVisualizationsView: React.FC = () => {
  const {
    visualizations,
    datasets,
    addVisualization,
    deleteVisualization,
    updateVisualizationPosition
  } = useLensStore();

  const [showBuilderModal, setShowBuilderModal] = useState(false);

  // Builder Form State
  const [title, setTitle] = useState('');
  const [datasetId, setDatasetId] = useState('ds_leads_vault');
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [primaryMetric, setPrimaryMetric] = useState('Leads Count');
  const [groupByField, setGroupByField] = useState('Source');

  const handleSaveVisualization = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addVisualization({
      title: title.trim(),
      datasetId,
      chartType,
      primaryMetric,
      groupByField,
      description: `Custom ${chartType} visualization created from ${datasetId}`,
      position: { x: 0, y: visualizations.length * 4, w: 6, h: 4 }
    });

    setTitle('');
    setShowBuilderModal(false);
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto font-sans select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Visualization Builder & Custom Dashboard</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Build, drag, resize, and save custom Power BI inspired chart tiles connected to Vault data.
          </p>
        </div>

        <button
          onClick={() => setShowBuilderModal(true)}
          className="flex items-center justify-center gap-2 bg-[#F4B400] hover:bg-[#D97706] text-slate-950 font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition active:scale-95 shrink-0"
        >
          <Plus size={16} />
          <span>Add Custom Visualization</span>
        </button>
      </div>

      {/* Grid of Saved Custom Visualization Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visualizations.map((vis) => (
          <div
            key={vis.id}
            className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs space-y-4 hover:shadow-md transition relative group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-4 bg-[#F4B400] rounded-sm" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{vis.title}</h3>
                  <p className="text-[10px] text-slate-400">{vis.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                <button
                  onClick={() => deleteVisualization(vis.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                  title="Delete tile"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {/* Dynamic Render based on Chart Type */}
            <div className="h-44 bg-slate-50 rounded-2xl p-4 flex items-center justify-center border border-slate-100">
              {vis.chartType === 'line' || vis.chartType === 'area' ? (
                <svg className="w-full h-full" viewBox="0 0 100 40">
                  <path d="M0 30 Q25 10, 50 20 T100 5" fill="none" stroke="#F4B400" strokeWidth="3" />
                </svg>
              ) : vis.chartType === 'donut' || vis.chartType === 'pie' ? (
                <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="35" stroke="#F4B400" strokeWidth="14" fill="transparent" strokeDasharray="220" strokeDashoffset="60" />
                  <circle cx="50" cy="50" r="35" stroke="#3B82F6" strokeWidth="14" fill="transparent" strokeDasharray="220" strokeDashoffset="140" />
                </svg>
              ) : (
                <div className="w-full space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>Website</span> <span>35%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-[#F4B400] w-[35%]" />
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>QR Code</span> <span>22%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[22%]" />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 pt-1 border-t border-slate-100">
              <span>Metric: {vis.primaryMetric}</span>
              <span className="uppercase text-[9px] font-bold bg-amber-50 text-[#D97706] px-1.5 py-0.5 rounded border border-amber-200">
                {vis.chartType}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Builder Modal */}
      {showBuilderModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">Create Visualization</h3>
              <button onClick={() => setShowBuilderModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveVisualization} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Visualization Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Monthly AR Placement Growth"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-[#F4B400]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Select Vault Dataset</label>
                <select
                  value={datasetId}
                  onChange={(e) => setDatasetId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-[#F4B400]"
                >
                  {datasets.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.recordsCount} records)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Chart Type</label>
                  <select
                    value={chartType}
                    onChange={(e) => setChartType(e.target.value as ChartType)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-[#F4B400]"
                  >
                    <option value="bar">Bar Chart</option>
                    <option value="line">Line Chart</option>
                    <option value="area">Area Chart</option>
                    <option value="donut">Donut Chart</option>
                    <option value="progress">Progress Bar</option>
                    <option value="kpi">KPI Tile</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Primary Metric</label>
                  <input
                    type="text"
                    value={primaryMetric}
                    onChange={(e) => setPrimaryMetric(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-[#F4B400]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBuilderModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#F4B400] hover:bg-[#D97706] text-slate-950 font-bold shadow-md"
                >
                  Save to Dashboard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
