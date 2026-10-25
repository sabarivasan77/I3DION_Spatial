import React, { useState } from 'react';
import { useLensStore } from '../store/useLensStore';
import { ChartType, LensVisualization } from '../types/lensTypes';
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
  Plus,
  Trash2,
  Maximize2,
  Lock,
  Unlock,
  RotateCcw,
  Monitor,
  LayoutGrid,
  Tv,
  GripVertical,
  X
} from 'lucide-react';

const COLORS = ['#F4B400', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899', '#06B6D4'];

// Sample realistic datasets for charts
const SAMPLE_TREND_DATA = [
  { day: 'Mon', totalLeads: 24, qualified: 14, revenue: 12000 },
  { day: 'Tue', totalLeads: 38, qualified: 22, revenue: 19500 },
  { day: 'Wed', totalLeads: 45, qualified: 28, revenue: 26000 },
  { day: 'Thu', totalLeads: 42, qualified: 25, revenue: 23400 },
  { day: 'Fri', totalLeads: 58, qualified: 39, revenue: 38000 },
  { day: 'Sat', totalLeads: 64, qualified: 44, revenue: 42500 },
  { day: 'Sun', totalLeads: 71, qualified: 52, revenue: 49000 }
];

const SAMPLE_DONUT_DATA = [
  { name: 'Web 3D Canvas', value: 42 },
  { name: 'QR Landing Codes', value: 28 },
  { name: 'Mobile WebXR', value: 18 },
  { name: 'Direct Inbound', value: 12 }
];

const SAMPLE_DWELL_DATA = [
  { component: 'Casing & Frame', seconds: 142 },
  { component: 'Turbine Rotor', seconds: 285 },
  { component: 'Hydraulic Valve', seconds: 196 },
  { component: 'Control Panel', seconds: 224 },
  { component: 'Exhaust System', seconds: 168 }
];

const SAMPLE_FUNNEL_DATA = [
  { step: '1. Model Viewport Loaded', count: 12480, rate: '100%' },
  { step: '2. 3D Orbit Interaction (>10s)', count: 8520, rate: '68.2%' },
  { step: '3. Hotspot Inspected / Exploded', count: 5290, rate: '42.4%' },
  { step: '4. WebXR AR Placement', count: 2840, rate: '22.8%' },
  { step: '5. Commercial Inquiry / Lead', count: 712, rate: '5.7%' }
];

export const LensVisualizationsView: React.FC = () => {
  const {
    visualizations,
    datasets,
    projects,
    addVisualization,
    deleteVisualization,
    reorderVisualizations,
    updateVisualizationSize,
    resetVisualizationsToDefault,
    isEditingLayout,
    setIsEditingLayout,
    canvasLayoutMode,
    setCanvasLayoutMode,
    togglePresentationMode
  } = useLensStore();

  const [showBuilderModal, setShowBuilderModal] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Builder Form State
  const [title, setTitle] = useState('');
  const [datasetId, setDatasetId] = useState('ds_leads_vault');
  const [chartType, setChartType] = useState<ChartType>('area');
  const [primaryMetric, setPrimaryMetric] = useState('Total Leads');
  const [colSpan, setColSpan] = useState<number>(6);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (!isEditingLayout) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (!isEditingLayout || draggedIndex === null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    if (!isEditingLayout || draggedIndex === null) return;
    e.preventDefault();
    if (draggedIndex !== targetIndex) {
      reorderVisualizations(draggedIndex, targetIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleSaveVisualization = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addVisualization({
      title: title.trim(),
      datasetId,
      chartType,
      primaryMetric,
      description: `Custom ${chartType} visualization connected to ${datasetId}`,
      position: { x: 0, y: visualizations.length * 4, w: colSpan, h: 4 }
    });

    setTitle('');
    setShowBuilderModal(false);
  };

  const getColSpanClass = (w: number) => {
    switch (w) {
      case 4:
        return 'col-span-12 lg:col-span-4';
      case 6:
        return 'col-span-12 lg:col-span-6';
      case 8:
        return 'col-span-12 lg:col-span-8';
      case 12:
      default:
        return 'col-span-12';
    }
  };

  const renderChartContent = (vis: LensVisualization) => {
    switch (vis.chartType) {
      case 'area':
      case 'line':
        return (
          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={SAMPLE_TREND_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id={`amberGrad-${vis.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F4B400" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#F4B400" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id={`blueGrad-${vis.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} tickLine={false} />
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
                  dataKey="totalLeads"
                  stroke="#F4B400"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill={`url(#amberGrad-${vis.id})`}
                  name="Total Leads"
                />
                <Area
                  type="monotone"
                  dataKey="qualified"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill={`url(#blueGrad-${vis.id})`}
                  name="Qualified Leads"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        );

      case 'bar':
        return (
          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={SAMPLE_DWELL_DATA} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis dataKey="component" type="category" stroke="#64748B" fontSize={11} tickLine={false} width={100} />
                <Tooltip
                  formatter={(val: any) => [`${val}s average dwell`, 'Dwell Time']}
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#FFF',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="seconds" fill="#F4B400" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );

      case 'donut':
      case 'pie':
        return (
          <div className="h-56 w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={SAMPLE_DONUT_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {SAMPLE_DONUT_DATA.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Attributed</span>
            </div>
          </div>
        );

      case 'funnel':
        return (
          <div className="h-56 w-full flex flex-col justify-center space-y-2.5 px-2">
            {SAMPLE_FUNNEL_DATA.map((step, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span className="truncate max-w-[240px]">{step.step}</span>
                  <span className="text-slate-900 font-extrabold">{step.count.toLocaleString()} ({step.rate})</span>
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
        );

      case 'kpi':
        return (
          <div className="h-56 w-full flex flex-col items-center justify-center text-center p-4 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Composite Health Index</span>
            <div className="text-5xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-2">
              <span>94.6</span>
              <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                +18.4%
              </span>
            </div>
            <p className="text-xs font-medium text-slate-500 max-w-xs">
              Exceptional 3D engagement velocity across enterprise machinery catalogs.
            </p>
            <div className="pt-2 flex items-center justify-center gap-4 text-xs font-bold text-slate-600">
              <div>
                <span className="text-slate-400 block text-[10px]">AVG ORBIT</span>
                <span>4m 12s</span>
              </div>
              <div className="w-px h-6 bg-slate-200" />
              <div>
                <span className="text-slate-400 block text-[10px]">AR LAUNCH</span>
                <span>72.1%</span>
              </div>
              <div className="w-px h-6 bg-slate-200" />
              <div>
                <span className="text-slate-400 block text-[10px]">CONVERSION</span>
                <span>28.5%</span>
              </div>
            </div>
          </div>
        );

      case 'progress':
      default:
        return (
          <div className="h-56 w-full flex flex-col justify-center space-y-3 px-2">
            {projects.slice(0, 4).map((p) => (
              <div key={p.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                  <span className="truncate">{p.name}</span>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="text-slate-500">{p.viewsCount.toLocaleString()} views</span>
                    <span className="font-bold text-emerald-600">{p.conversionRate}% conv</span>
                  </div>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#F4B400] rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(p.conversionRate * 2.8, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        );
    }
  };

  return (
    <div
      className={`p-6 md:p-8 space-y-6 font-sans select-none transition-all duration-300 ${
        canvasLayoutMode === 'fit-window'
          ? 'max-w-none w-full'
          : canvasLayoutMode === '16-9'
          ? 'max-w-[1440px] mx-auto bg-slate-900/5 p-6 rounded-3xl border border-slate-200/60 shadow-inner'
          : 'max-w-[1600px] mx-auto'
      }`}
    >
      {/* Power BI Studio Action Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border border-slate-200/90 rounded-2xl p-4 md:p-5 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#F4B400] animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-wider text-[#D97706]">
              Power BI Interactive Analytics Studio
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
            Customizable Executive Canvas
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Drag, rearrange, resize, and connect visual tiles. Switch between Window Fit, 16:9, or Fullscreen Presentation.
          </p>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Screen Layout Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold text-slate-600">
            <button
              onClick={() => setCanvasLayoutMode('fluid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                canvasLayoutMode === 'fluid' ? 'bg-white text-slate-950 shadow-xs' : 'hover:text-slate-900'
              }`}
              title="Fluid responsive layout"
            >
              <LayoutGrid size={13} />
              <span className="hidden sm:inline">Fluid</span>
            </button>
            <button
              onClick={() => setCanvasLayoutMode('fit-window')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                canvasLayoutMode === 'fit-window' ? 'bg-white text-slate-950 shadow-xs' : 'hover:text-slate-900'
              }`}
              title="Fit to Window Screen"
            >
              <Monitor size={13} />
              <span className="hidden sm:inline">Fit Screen</span>
            </button>
            <button
              onClick={() => setCanvasLayoutMode('16-9')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                canvasLayoutMode === '16-9' ? 'bg-white text-slate-950 shadow-xs' : 'hover:text-slate-900'
              }`}
              title="16:9 Presentation Canvas"
            >
              <Tv size={13} />
              <span className="hidden sm:inline">16:9</span>
            </button>
          </div>

          {/* Edit Layout Toggle */}
          <button
            onClick={() => setIsEditingLayout(!isEditingLayout)}
            className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl border transition ${
              isEditingLayout
                ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs ring-2 ring-amber-300'
                : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
            }`}
          >
            {isEditingLayout ? <Unlock size={14} /> : <Lock size={14} />}
            <span>{isEditingLayout ? 'Lock Layout' : 'Edit Layout'}</span>
          </button>

          {/* Fullscreen Presentation Mode Button */}
          <button
            onClick={togglePresentationMode}
            className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition active:scale-95"
            title="Open Fullscreen Executive Boardroom View"
          >
            <Maximize2 size={14} />
            <span className="hidden sm:inline">Presentation View</span>
          </button>

          {/* Add Tile Button */}
          <button
            onClick={() => setShowBuilderModal(true)}
            className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-[#F4B400] hover:bg-[#D97706] text-slate-950 shadow-xs transition active:scale-95"
          >
            <Plus size={15} />
            <span>Add Visual</span>
          </button>

          {/* Reset Defaults */}
          <button
            onClick={resetVisualizationsToDefault}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
            title="Reset layout to default Power BI tiles"
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>

      {/* Edit Mode Notice Banner */}
      {isEditingLayout && (
        <div className="bg-amber-50 border border-amber-200/90 rounded-2xl px-4 py-2.5 flex items-center justify-between text-xs text-amber-900 font-medium animate-fadeIn">
          <div className="flex items-center gap-2">
            <GripVertical size={16} className="text-[#D97706]" />
            <span>
              <strong>Interactive Layout Mode Active:</strong> Drag cards by the grip handle to reorder. Use the column pills (1/3, 1/2, 2/3, Full) to resize cards in real-time.
            </span>
          </div>
          <button
            onClick={() => setIsEditingLayout(false)}
            className="text-xs font-bold bg-[#F4B400] hover:bg-[#D97706] text-slate-950 px-3 py-1 rounded-lg"
          >
            Done Editing
          </button>
        </div>
      )}

      {/* Grid Canvas with Drag & Drop */}
      <div className="grid grid-cols-12 gap-6 transition-all duration-300">
        {visualizations.map((vis, index) => {
          const isBeingDragged = draggedIndex === index;
          const isDragOver = dragOverIndex === index;

          return (
            <div
              key={vis.id}
              draggable={isEditingLayout}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`${getColSpanClass(vis.position.w || 6)} transition-all duration-300 ${
                isBeingDragged ? 'opacity-40 scale-95 border-amber-400' : ''
              } ${
                isDragOver ? 'ring-2 ring-[#F4B400] scale-102 border-[#F4B400]' : ''
              }`}
            >
              <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between h-full relative group">
                {/* Tile Header Bar */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    {isEditingLayout && (
                      <div
                        className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-slate-400 hover:text-slate-700 rounded transition"
                        title="Drag to reposition tile"
                      >
                        <GripVertical size={18} />
                      </div>
                    )}
                    <div className="w-2 h-4 bg-[#F4B400] rounded-xs shrink-0" />
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm tracking-tight leading-tight">
                        {vis.title}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-medium">{vis.description}</p>
                    </div>
                  </div>

                  {/* Actions / Sizing Controls */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isEditingLayout && (
                      <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-600">
                        <button
                          onClick={() => updateVisualizationSize(vis.id, 4)}
                          className={`px-1.5 py-0.5 rounded ${
                            vis.position.w === 4 ? 'bg-white text-slate-950 shadow-2xs' : 'hover:text-slate-900'
                          }`}
                          title="1/3 Width (4 cols)"
                        >
                          1/3
                        </button>
                        <button
                          onClick={() => updateVisualizationSize(vis.id, 6)}
                          className={`px-1.5 py-0.5 rounded ${
                            vis.position.w === 6 ? 'bg-white text-slate-950 shadow-2xs' : 'hover:text-slate-900'
                          }`}
                          title="Half Width (6 cols)"
                        >
                          1/2
                        </button>
                        <button
                          onClick={() => updateVisualizationSize(vis.id, 8)}
                          className={`px-1.5 py-0.5 rounded ${
                            vis.position.w === 8 ? 'bg-white text-slate-950 shadow-2xs' : 'hover:text-slate-900'
                          }`}
                          title="2/3 Width (8 cols)"
                        >
                          2/3
                        </button>
                        <button
                          onClick={() => updateVisualizationSize(vis.id, 12)}
                          className={`px-1.5 py-0.5 rounded ${
                            vis.position.w === 12 ? 'bg-white text-slate-950 shadow-2xs' : 'hover:text-slate-900'
                          }`}
                          title="Full Width (12 cols)"
                        >
                          Full
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => deleteVisualization(vis.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                      title="Remove visual"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Render Dynamic Recharts Content */}
                <div className="flex-1 my-2 bg-slate-50/50 rounded-2xl p-2 border border-slate-100 flex items-center justify-center min-h-[220px]">
                  {renderChartContent(vis)}
                </div>

                {/* Tile Footer Meta */}
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 pt-3 border-t border-slate-100 mt-2">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Metric: <strong className="text-slate-700">{vis.primaryMetric}</strong></span>
                  </span>
                  <span className="uppercase text-[9px] font-extrabold bg-amber-50 text-[#D97706] px-2 py-0.5 rounded-md border border-amber-200">
                    {vis.chartType}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Builder Modal */}
      {showBuilderModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-6 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-black text-slate-900 text-lg">Add Visual Tile</h3>
                <p className="text-xs text-slate-400 font-medium">Select chart engine, metric bindings, and width.</p>
              </div>
              <button
                onClick={() => setShowBuilderModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveVisualization} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Visual Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 3D Model Exploded View Interactions"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-[#F4B400] text-xs font-semibold"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Data Source</label>
                <select
                  value={datasetId}
                  onChange={(e) => setDatasetId(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-[#F4B400] text-xs font-semibold"
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
                  <label className="block text-slate-700 font-bold mb-1.5">Chart Type</label>
                  <select
                    value={chartType}
                    onChange={(e) => setChartType(e.target.value as ChartType)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-[#F4B400] text-xs font-semibold"
                  >
                    <option value="area">Area Chart (Gradient)</option>
                    <option value="bar">Bar Chart (Horizontal/Clustered)</option>
                    <option value="donut">Donut Chart (Channels)</option>
                    <option value="funnel">Funnel Conversion Block</option>
                    <option value="kpi">KPI Metric Card</option>
                    <option value="progress">Ranked Progress Matrix</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">Canvas Width</label>
                  <select
                    value={colSpan}
                    onChange={(e) => setColSpan(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-[#F4B400] text-xs font-semibold"
                  >
                    <option value={4}>Compact 1/3 Width</option>
                    <option value={6}>Standard Half Width</option>
                    <option value={8}>Wide 2/3 Width</option>
                    <option value={12}>Full Hero Width</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Primary Metric</label>
                <input
                  type="text"
                  value={primaryMetric}
                  onChange={(e) => setPrimaryMetric(e.target.value)}
                  placeholder="e.g. Average Dwell Seconds"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-[#F4B400] text-xs font-semibold"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBuilderModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#F4B400] hover:bg-[#D97706] text-slate-950 font-bold shadow-md transition active:scale-95"
                >
                  Add to Canvas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
