import React, { useRef, useState } from 'react';
import { useLogicCraftStore } from '../store/useLogicCraftStore';
import { useStudioStore } from '../../studio/store/useStudioStore';
import { useRuntimeStore } from '../runtime/runtimeContext';
import { runtimeEngine } from '../runtime/runtimeEngine';
import { executeLogicGraph } from '../engine/logicExecutor';
import {
  Zap,
  Plus,
  Play,
  Square,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Download,
  Upload,
  Undo2,
  Redo2,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';

export const LogicToolbar: React.FC = () => {
  const {
    graphs,
    activeGraphId,
    history,
    zoomLevel,
    closeLogicPanel,
    createGraph,
    selectGraph,
    validateActiveGraph,
    serializeActiveGraph,
    deserializeGraphIntoActive,
    undo,
    redo,
    zoomIn,
    zoomOut,
    resetZoom,
  } = useLogicCraftStore();

  const { mode, setMode, stopExecution, resetRuntime } = useRuntimeStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [validationModal, setValidationModal] = useState<{ open: boolean; valid: boolean; errors: string[]; warnings?: string[] } | null>(null);
  const [testRunLogs, setTestRunLogs] = useState<any[] | null>(null);

  const activeGraph = graphs.find((g) => g.id === activeGraphId) || graphs[0];

  const handleTogglePreviewMode = () => {
    if (mode === 'EDITOR') {
      const success = runtimeEngine.initialize(activeGraph);
      if (success) {
        setMode('PREVIEW');
      }
    } else {
      runtimeEngine.stop();
      setMode('EDITOR');
    }
  };

  const handleValidate = () => {
    const activeWidgets = useStudioStore.getState().experience?.widgets || [];
    const result = validateActiveGraph(activeWidgets);
    setValidationModal({ open: true, valid: result.valid, errors: result.errors, warnings: result.warnings });
  };

  const handleRunTest = async () => {
    const logs = await executeLogicGraph(
      activeGraph,
      { eventName: 'onClick', widgetId: 'widget_button_initial' },
      {}
    );
    setTestRunLogs(logs);
  };

  const handleExportJSON = () => {
    const json = serializeActiveGraph();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logicraft_graph_${activeGraph.id}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const content = evt.target?.result as string;
        if (content) {
          deserializeGraphIntoActive(content);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-900 px-6 text-slate-100 shadow-md">
      {/* Brand & Graph Selection */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg">
            <Zap size={20} />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">I3DION LogicCraft</h1>
            <p className="text-[10px] font-mono text-indigo-400">Visual Rule Graph Engine v1.0</p>
          </div>
        </div>

        {/* Graph Dropdown & Create Trigger */}
        <div className="flex items-center gap-2 pl-4 border-l border-slate-800">
          <select
            value={activeGraphId}
            onChange={(e) => selectGraph(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
          >
            {graphs.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} ({g.nodes.length} nodes)
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => createGraph()}
            className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white"
            title="Create New Logic Graph"
          >
            <Plus size={14} />
            <span>New Graph</span>
          </button>
        </div>
      </div>

      {/* Toolbar Controls */}
      <div className="flex items-center gap-2">
        {/* Runtime Mode Toggle */}
        <button
          type="button"
          onClick={handleTogglePreviewMode}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold shadow-md transition-all ${
            mode === 'PREVIEW'
              ? 'bg-amber-500 text-white hover:bg-amber-600 animate-pulse'
              : 'bg-emerald-600 text-white hover:bg-emerald-500'
          }`}
          title={mode === 'PREVIEW' ? 'Exit Runtime Preview' : 'Start Runtime Preview'}
        >
          {mode === 'PREVIEW' ? <EyeOff size={15} /> : <Eye size={15} />}
          <span>{mode === 'PREVIEW' ? 'Exit Preview' : '▶ Live Preview'}</span>
        </button>

        {/* Stop & Reset Controls */}
        {mode === 'PREVIEW' && (
          <div className="flex items-center gap-1 border-r border-slate-800 pr-2">
            <button
              type="button"
              onClick={stopExecution}
              className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-300 hover:bg-slate-700 hover:text-white"
              title="Stop Execution"
            >
              <Square size={14} />
            </button>
            <button
              type="button"
              onClick={resetRuntime}
              className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-300 hover:bg-slate-700 hover:text-white"
              title="Reset Runtime State"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        )}

        {/* Undo / Redo */}
        <div className="flex items-center border-r border-slate-800 pr-3">
          <button
            type="button"
            onClick={undo}
            disabled={history.past.length === 0}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={16} />
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={history.future.length === 0}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 size={16} />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950 p-1">
          <button type="button" onClick={zoomOut} className="px-1.5 text-xs font-bold text-slate-400 hover:text-white">-</button>
          <button type="button" onClick={resetZoom} className="px-1.5 text-[11px] font-mono text-slate-300">{Math.round(zoomLevel * 100)}%</button>
          <button type="button" onClick={zoomIn} className="px-1.5 text-xs font-bold text-slate-400 hover:text-white">+</button>
        </div>

        {/* Validate Graph */}
        <button
          type="button"
          onClick={handleValidate}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700"
        >
          <CheckCircle2 size={14} className="text-emerald-400" />
          <span>Validate</span>
        </button>

        {/* Test Run Execution */}
        <button
          type="button"
          onClick={handleRunTest}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md hover:bg-indigo-500"
        >
          <Play size={14} />
          <span>Test Flow</span>
        </button>

        {/* JSON Export/Import */}
        <button
          type="button"
          onClick={handleExportJSON}
          className="p-2 text-slate-400 hover:text-white"
          title="Export Logic Graph JSON"
        >
          <Download size={16} />
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-slate-400 hover:text-white"
          title="Import Logic Graph JSON"
        >
          <Upload size={16} />
        </button>
        <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportJSON} className="hidden" />

        {/* Close Modal */}
        <button
          type="button"
          onClick={closeLogicPanel}
          className="ml-2 rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <X size={20} />
        </button>
      </div>

      {/* Validation Feedback Modal */}
      {validationModal?.open && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              {validationModal.valid ? (
                <CheckCircle2 size={24} className="text-emerald-400" />
              ) : (
                <AlertTriangle size={24} className="text-amber-400" />
              )}
              <h3 className="text-base font-bold text-white">
                {validationModal.valid ? 'Logic Graph Valid' : 'Validation Issues Detected'}
              </h3>
            </div>

            <div className="mt-4 space-y-2 text-xs">
              {validationModal.valid ? (
                <p className="text-slate-300">
                  All node properties, port connections, and widget references are valid!
                </p>
              ) : (
                <div className="rounded-lg bg-red-950/40 p-3 border border-red-800/40 text-red-300 space-y-1">
                  {validationModal.errors.map((err, idx) => (
                    <div key={idx}>• {err}</div>
                  ))}
                </div>
              )}

              {validationModal.warnings && validationModal.warnings.length > 0 && (
                <div className="rounded-lg bg-amber-950/40 p-3 border border-amber-800/40 text-amber-300 space-y-1">
                  {validationModal.warnings.map((warn, idx) => (
                    <div key={idx}>⚠ {warn}</div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setValidationModal(null)}
              className="mt-6 w-full rounded-lg bg-slate-800 py-2 text-xs font-semibold text-white hover:bg-slate-700"
            >
              Close Feedback
            </button>
          </div>
        </div>
      )}

      {/* Test Execution Log Output Modal */}
      {testRunLogs && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Play size={18} className="text-indigo-400" />
              Flow Execution Test Trace
            </h3>
            <div className="no-scrollbar mt-4 max-h-60 overflow-y-auto space-y-2 font-mono text-[11px]">
              {testRunLogs.map((log, i) => (
                <div key={i} className="rounded bg-slate-950 p-2 border border-slate-800">
                  <span className="text-indigo-400">[{log.status.toUpperCase()}]</span>{' '}
                  <span className="text-white">{log.nodeName}</span> ({log.nodeType}): {log.details}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setTestRunLogs(null)}
              className="mt-6 w-full rounded-lg bg-indigo-600 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
            >
              Close Execution Trace
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
