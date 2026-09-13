import React from 'react';
import { useStudioStore } from '../store/useStudioStore';
import { useCollaborationStore } from '../collaboration/store/collaborationStore';
import {
  Menu,
  Undo2,
  Redo2,
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
  Film,
  Play,
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
    history,
    zoomLevel,
    isTimelineOpen,
    toggleTimeline,
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
    <header className="flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6 shadow-sm select-none shrink-0 z-20">
      {/* Left: Hamburger Drawer Trigger & Brand Badge & Workspace Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('i3dion:open_app_menu'))}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition shadow-sm"
          title="Open Main Navigation Drawer"
        >
          <Menu size={18} />
        </button>

        <button
          onClick={openDashboard}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm hover:bg-slate-800 transition"
          title="Open Workspace Dashboard"
        >
          <FolderKanban size={18} />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-slate-900">
              {currentDocument?.name || experience.name}
            </h1>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 font-mono border border-slate-200">
              v{currentDocument?.currentVersion || experience.version}
            </span>
          </div>

          {/* Cloud Save Status & Sync */}
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
        <div className="ml-2 hidden md:flex items-center rounded-xl border border-slate-200 bg-slate-100 p-1">
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
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
              canvasViewport === 'desktop'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Desktop Viewport"
          >
            <Monitor size={14} />
            <span className="hidden lg:inline">Desktop</span>
          </button>
          <button
            type="button"
            onClick={() => setCanvasViewport('tablet')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
              canvasViewport === 'tablet'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Tablet Viewport"
          >
            <Tablet size={14} />
            <span className="hidden lg:inline">Tablet</span>
          </button>
          <button
            type="button"
            onClick={() => setCanvasViewport('mobile')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
              canvasViewport === 'mobile'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Mobile Viewport"
          >
            <Smartphone size={14} />
            <span className="hidden lg:inline">Mobile</span>
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
            className="px-1.5 text-[11px] font-mono font-semibold text-slate-700 hover:text-blue-600"
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
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={16} />
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={history.future.length === 0}
            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 size={16} />
          </button>
        </div>

        {/* Timeline Toggle Drawer Button */}
        <button
          type="button"
          onClick={toggleTimeline}
          className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold shadow-sm transition-all ${
            isTimelineOpen
              ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
          title="Toggle Animation Timeline Drawer"
        >
          <Film size={14} className={isTimelineOpen ? 'text-blue-600' : 'text-slate-500'} />
          <span className="hidden sm:inline">Timeline</span>
        </button>

        {/* Version History */}
        <button
          type="button"
          onClick={openVersionHistory}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          title="Version History"
        >
          <History size={14} className="text-slate-500" />
          <span className="hidden sm:inline">Versions</span>
        </button>

        {/* PROMINENT PREVIEW BUTTON */}
        <button
          type="button"
          onClick={() => setPreview(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition active:scale-95"
          title="Enter Customer Preview Mode"
        >
          <Play size={14} fill="currentColor" />
          <span>Preview</span>
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
          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition"
        >
          <Send size={14} />
          <span>Publish</span>
        </button>
      </div>
    </header>
  );
};

