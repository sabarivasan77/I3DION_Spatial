import React from 'react';
import { useStudioStore } from '../store/useStudioStore';
import { useCollaborationStore } from '../collaboration/store/collaborationStore';
import {
  Undo2,
  Redo2,
  Eye,
  EyeOff,
  Monitor,
  Tablet,
  Smartphone,
  History,
  FolderKanban,
  AlertTriangle,
  Cloud,
  RefreshCw,
  Send,
  Maximize2,
  Workflow,
  Box,
} from 'lucide-react';

export interface StudioHeaderProps {
  sectionView?: 'canvas' | 'fullCanvas' | 'logic';
  onSectionViewChange?: (view: 'canvas' | 'fullCanvas' | 'logic') => void;
  onOpenIScript?: () => void;
}

export const StudioHeader: React.FC<StudioHeaderProps> = ({
  sectionView = 'canvas',
  onSectionViewChange,
}) => {
  const {
    experience,
    canvasViewport,
    isPreview,
    history,
    zoomLevel,
    setCanvasViewport,
    setPreview,
    zoomIn,
    zoomOut,
    resetZoom,
    undo,
    redo,
  } = useStudioStore();

  const {
    saveStatus,
    currentDocument,
    collaborators,
    saveCurrentExperience,
    openVersionHistory,
    openPublishModal,
    openDashboard,
    resolveConflict,
  } = useCollaborationStore();

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm select-none shrink-0">
      {/* Left: Brand Badge & Title & Workspace Dashboard */}
      <div className="flex items-center gap-3">
        <button
          onClick={openDashboard}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm hover:bg-slate-800 transition"
          title="Open Experience Workspace Dashboard"
        >
          <FolderKanban size={18} />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-slate-900">
              {currentDocument?.name || experience.name}
            </h1>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 font-mono border border-slate-200">
              v{currentDocument?.currentVersion || experience.version}
            </span>
          </div>

          {/* Cloud Save Status & Collaborator Avatars */}
          <div className="flex items-center gap-3 text-xs text-slate-500 font-mono mt-0.5">
            {saveStatus === 'saving' && (
              <span className="flex items-center gap-1 text-amber-600 font-medium">
                <RefreshCw size={11} className="animate-spin" /> Saving...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <Cloud size={12} /> Cloud Saved
              </span>
            )}
            {saveStatus === 'conflict' && (
              <button
                onClick={() => resolveConflict('reload')}
                className="flex items-center gap-1 text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 animate-pulse"
                title="Conflict detected! Click to reload latest"
              >
                <AlertTriangle size={12} /> Conflict! Reload
              </button>
            )}

            {collaborators.length > 0 && (
              <div
                className="flex items-center gap-1.5 ml-2 border-l border-slate-200 pl-3 cursor-pointer hover:opacity-80 transition"
                title="Active Collaborators"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                <span className="text-[10px] text-slate-500 font-bold">● SYNCED</span>
              </div>
            )}
          </div>
        </div>

        {/* WORKSPACE SECTION SWITCHER: Canvas Design | Full Canvas | Logic & Functions */}
        <div className="ml-4 flex items-center rounded-xl border border-slate-200 bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => onSectionViewChange && onSectionViewChange('canvas')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              sectionView === 'canvas'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Box size={14} />
            <span>Canvas Design</span>
          </button>

          <button
            type="button"
            onClick={() => onSectionViewChange && onSectionViewChange('fullCanvas')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              sectionView === 'fullCanvas'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Maximize2 size={14} />
            <span>Full Canvas</span>
          </button>

          <button
            type="button"
            onClick={() => onSectionViewChange && onSectionViewChange('logic')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              sectionView === 'logic'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Workflow size={14} />
            <span>Logic & Functions</span>
          </button>
        </div>
      </div>

      {/* Center Viewport & Zoom Controls */}
      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            onClick={() => setCanvasViewport('desktop')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium transition-all ${
              canvasViewport === 'desktop'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Monitor size={14} />
            <span>Desktop</span>
          </button>
          <button
            type="button"
            onClick={() => setCanvasViewport('tablet')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium transition-all ${
              canvasViewport === 'tablet'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Tablet size={14} />
            <span>Tablet</span>
          </button>
          <button
            type="button"
            onClick={() => setCanvasViewport('mobile')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium transition-all ${
              canvasViewport === 'mobile'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone size={14} />
            <span>Mobile</span>
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            onClick={zoomOut}
            className="rounded-lg p-1 text-slate-600 hover:bg-white hover:text-slate-900"
          >
            <span className="text-xs font-bold font-mono px-1">-</span>
          </button>
          <button
            type="button"
            onClick={resetZoom}
            className="px-2 text-[11px] font-mono font-semibold text-slate-700 hover:text-blue-600"
          >
            {Math.round(zoomLevel * 100)}%
          </button>
          <button
            type="button"
            onClick={zoomIn}
            className="rounded-lg p-1 text-slate-600 hover:bg-white hover:text-slate-900"
          >
            <span className="text-xs font-bold font-mono px-1">+</span>
          </button>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Undo / Redo */}
        <div className="flex items-center border-r border-slate-200 pr-2">
          <button
            type="button"
            onClick={undo}
            disabled={history.past.length === 0}
            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30"
          >
            <Undo2 size={16} />
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={history.future.length === 0}
            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30"
          >
            <Redo2 size={16} />
          </button>
        </div>

        {/* Version History */}
        <button
          type="button"
          onClick={openVersionHistory}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          <History size={14} className="text-slate-500" />
          <span>Versions</span>
        </button>

        {/* Preview Toggle */}
        <button
          type="button"
          onClick={() => setPreview(!isPreview)}
          className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold shadow-sm transition-all ${
            isPreview
              ? 'bg-amber-500 text-white hover:bg-amber-600'
              : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          {isPreview ? <EyeOff size={15} /> : <Eye size={15} />}
          {isPreview ? 'Exit Preview' : 'Preview'}
        </button>

        {/* Save Draft Button */}
        <button
          type="button"
          onClick={() => saveCurrentExperience()}
          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
        >
          Save Draft
        </button>

        {/* Publish Button */}
        <button
          type="button"
          onClick={openPublishModal}
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
        >
          <Send size={14} />
          Publish
        </button>
      </div>
    </header>
  );
};
