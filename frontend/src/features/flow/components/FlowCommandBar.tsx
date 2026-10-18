import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Play,
  CheckCircle2,
  AlertCircle,
  Undo2,
  Redo2,
  Layers,
  Sliders,
  Terminal,
  UploadCloud,
  Loader2,
  FileCode2,
  Workflow,
  Clock,
} from 'lucide-react';
import { useFlowDesignerStore } from '../store/useFlowDesignerStore';

export const FlowCommandBar: React.FC = () => {
  const navigate = useNavigate();
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishSummary, setPublishSummary] = useState('');
  const [validationAlert, setValidationAlert] = useState<{ valid: boolean; message: string } | null>(null);

  const {
    currentFlow,
    isDirty,
    isSaving,
    isTesting,
    history,
    activeTab,
    isPaletteOpen,
    isInspectorOpen,
    isTestConsoleOpen,
    updateFlowMeta,
    saveFlow,
    publishFlow,
    executeTestRun,
    validateDAG,
    undo,
    redo,
    setActiveTab,
    setPaletteOpen,
    setInspectorOpen,
    setTestConsoleOpen,
  } = useFlowDesignerStore();

  const handleValidate = () => {
    const result = validateDAG();
    if (result.valid) {
      setValidationAlert({ valid: true, message: 'Valid DAG! No cycles found, trigger properly wired.' });
    } else {
      setValidationAlert({ valid: false, message: result.errors[0] || 'Validation failed' });
    }
    setTimeout(() => setValidationAlert(null), 4000);
  };

  const handleSave = async () => {
    const success = await saveFlow();
    if (success) {
      setValidationAlert({ valid: true, message: 'Flow saved successfully!' });
      setTimeout(() => setValidationAlert(null), 3000);
    }
  };

  const handlePublishSubmit = async () => {
    const success = await publishFlow(publishSummary || 'Published via Flow Designer');
    if (success) {
      setShowPublishModal(false);
      setPublishSummary('');
      setValidationAlert({ valid: true, message: 'Flow version published successfully!' });
      setTimeout(() => setValidationAlert(null), 3000);
    }
  };

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  return (
    <>
      <header className="h-16 px-4 bg-white/90 backdrop-blur-md border-b border-slate-200 flex items-center justify-between z-30 select-none shadow-xs">
        {/* Left: Navigation & Flow Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/flow')}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
            title="Back to Flows"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="h-6 w-px bg-slate-200" />

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={currentFlow?.name || 'Untitled Flow'}
                onChange={(e) => updateFlowMeta({ name: e.target.value })}
                className="text-sm font-semibold text-slate-900 bg-transparent hover:bg-slate-100 focus:bg-white focus:ring-1 focus:ring-cyan-500 rounded px-1.5 py-0.5 border border-transparent hover:border-slate-300 transition"
                placeholder="Flow Name..."
              />

              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  currentFlow?.status === 'published'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {currentFlow?.status || 'Draft'}
              </span>

              <span className="text-xs font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                v{currentFlow?.version || 1}.0
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isDirty ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'
                  }`}
                />
                {isDirty ? 'Unsaved edits' : 'Saved'}
              </span>
              <span>•</span>
              <span className="truncate max-w-[280px]">
                {currentFlow?.description || 'No description set'}
              </span>
            </div>
          </div>

          {/* View Tab Switcher: Canvas vs Runs */}
          <div className="hidden sm:flex items-center bg-slate-100 p-0.5 rounded-lg ml-3">
            <button
              onClick={() => setActiveTab('designer')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition ${
                activeTab === 'designer'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Workflow size={13} />
              <span>Canvas</span>
            </button>
            <button
              onClick={() => setActiveTab('runs')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition ${
                activeTab === 'runs'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Clock size={13} />
              <span>Runs</span>
            </button>
          </div>
        </div>

        {/* Center: Validation / Alert Notification */}
        {validationAlert && (
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border shadow-xs animate-in fade-in slide-in-from-top-1 ${
              validationAlert.valid
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {validationAlert.valid ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
            <span>{validationAlert.message}</span>
          </div>
        )}

        {/* Right: Actions and Toolbars */}
        <div className="flex items-center gap-2">
          {/* History Undo / Redo */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg mr-2">
            <button
              onClick={undo}
              disabled={!canUndo}
              className={`p-1.5 rounded-md transition ${
                canUndo ? 'text-slate-700 hover:bg-white shadow-2xs' : 'text-slate-300 cursor-not-allowed'
              }`}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 size={16} />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className={`p-1.5 rounded-md transition ${
                canRedo ? 'text-slate-700 hover:bg-white shadow-2xs' : 'text-slate-300 cursor-not-allowed'
              }`}
              title="Redo (Ctrl+Y)"
            >
              <Redo2 size={16} />
            </button>
          </div>

          {/* Toggle Panels */}
          <button
            onClick={() => setPaletteOpen(!isPaletteOpen)}
            className={`p-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition ${
              isPaletteOpen
                ? 'bg-cyan-50 border-cyan-200 text-cyan-800'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title="Toggle Action Palette"
          >
            <Layers size={15} />
            <span className="hidden md:inline">Palette</span>
          </button>

          <button
            onClick={() => setInspectorOpen(!isInspectorOpen)}
            className={`p-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition ${
              isInspectorOpen
                ? 'bg-cyan-50 border-cyan-200 text-cyan-800'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title="Toggle Step Inspector"
          >
            <Sliders size={15} />
            <span className="hidden md:inline">Inspector</span>
          </button>

          <button
            onClick={() => setTestConsoleOpen(!isTestConsoleOpen)}
            className={`p-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition ${
              isTestConsoleOpen
                ? 'bg-cyan-50 border-cyan-200 text-cyan-800'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title="Toggle Diagnostics Console"
          >
            <Terminal size={15} />
            <span className="hidden md:inline">Console</span>
          </button>

          <div className="h-6 w-px bg-slate-200 mx-1" />

          {/* Validate DAG */}
          <button
            onClick={handleValidate}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1.5 shadow-2xs transition"
          >
            <CheckCircle2 size={15} className="text-slate-400" />
            <span>Validate</span>
          </button>

          {/* Test Run Execution */}
          <button
            onClick={() => executeTestRun()}
            disabled={isTesting}
            className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
          >
            {isTesting ? <Loader2 size={15} className="animate-spin" /> : <Play size={14} className="fill-white" />}
            <span>Test Run</span>
          </button>

          {/* Save Draft */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 active:scale-95 text-slate-800 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
          >
            {isSaving ? <Loader2 size={15} className="animate-spin text-slate-500" /> : <Save size={15} />}
            <span>Save</span>
          </button>

          {/* Publish Flow Version */}
          <button
            onClick={() => setShowPublishModal(true)}
            className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
          >
            <UploadCloud size={15} />
            <span>Publish</span>
          </button>
        </div>
      </header>

      {/* Publish Flow Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600">
                <UploadCloud size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Publish Flow Version</h3>
                <p className="text-xs text-slate-500">
                  Freezes current DAG into an immutable published release.
                </p>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Change Summary / Release Notes
                </label>
                <textarea
                  value={publishSummary}
                  onChange={(e) => setPublishSummary(e.target.value)}
                  placeholder="e.g. Added dwell time condition and VIP lead routing"
                  rows={3}
                  className="w-full text-xs rounded-xl border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Target Version:</span>
                  <span className="font-mono font-medium text-slate-900">
                    v{(currentFlow?.version || 1) + 1}.0
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Steps:</span>
                  <span className="font-medium text-slate-900">
                    {useFlowDesignerStore.getState().nodes.length} nodes
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setShowPublishModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handlePublishSubmit}
                disabled={isSaving}
                className="px-4 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl transition flex items-center gap-1.5"
              >
                {isSaving && <Loader2 size={14} className="animate-spin" />}
                <span>Publish Version</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
