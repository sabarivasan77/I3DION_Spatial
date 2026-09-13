import React, { useRef } from 'react';
import { useStudioStore } from '../store/useStudioStore';
import { useCollaborationStore } from '../collaboration/store/collaborationStore';
import { useLogicStore } from '../../logic/store/useLogicStore';
import { useDataBridgeStore } from '../../connectors/store/useDataBridgeStore';
import {
  Undo2,
  Redo2,
  Eye,
  EyeOff,
  Monitor,
  Tablet,
  Smartphone,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  Check,
  Zap,
  Code2,
  Link2,
  History,
  FolderKanban,
  User,
  AlertTriangle,
  Cloud,
  RefreshCw,
  Send,
  Mic,
  Radio,
} from 'lucide-react';
import { useCommunicationStore } from '../communication/store/communicationStore';
import { webrtcSessionManager } from '../communication/webrtc/webrtcSessionManager';
import { useAuthStore } from '../../../store/authStore';

export interface StudioHeaderProps {
  onOpenIScript?: () => void;
}

export const StudioHeader: React.FC<StudioHeaderProps> = (props) => {
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
    openTemplateGallery,
    undo,
    redo,
    serializeExperience,
    deserializeExperience,
    loadInitialDefaults,
  } = useStudioStore();

  const {
    saveStatus,
    currentDocument,
    collaborators,
    saveCurrentExperience,
    openVersionHistory,
    openPublishModal,
    openDashboard,
    conflictState,
    resolveConflict,
  } = useCollaborationStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportJSON = () => {
    const json = serializeExperience();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omnistudio_experience_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          deserializeExperience(content);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm select-none">
      {/* Left: Brand Badge & Title & Workspace Dashboard */}
      <div className="flex items-center gap-3">
        <button
          onClick={openDashboard}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md hover:scale-105 transition"
          title="Open Experience Workspace Dashboard"
        >
          <FolderKanban size={19} />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-slate-900">
              {currentDocument?.name || experience.name}
            </h1>
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-600 font-mono">
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
                <AlertTriangle size={12} /> Conflict! Reload Latest
              </button>
            )}

            {/* Realtime Connection Indicator & Active Collaborators Stack */}
            {collaborators.length > 0 && (
              <div
                onClick={() => useRealtimeCollaborationStore.getState().togglePresenceDrawer()}
                className="flex items-center gap-1.5 ml-2 border-l border-slate-200 pl-3 cursor-pointer hover:opacity-80 transition"
                title="Click to view Active Collaborators Drawer"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                <span className="text-[10px] text-slate-500 font-bold">● SYNCED</span>
                <div className="flex -space-x-1.5 overflow-hidden ml-1">
                  {collaborators.map((col, idx) => (
                    <div
                      key={col.userId || idx}
                      title={`${col.name} (${col.editingSection || 'Viewing'})`}
                      className="inline-block h-5 w-5 rounded-full ring-2 ring-white bg-indigo-600 text-white text-[9px] font-bold font-mono flex items-center justify-center shadow"
                    >
                      {col.name ? col.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Starter Templates */}
        <button
          type="button"
          onClick={openTemplateGallery}
          className="ml-2 inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 shadow-sm transition-all"
        >
          <Sparkles size={14} className="text-blue-600" />
          <span>Starter Templates</span>
        </button>

        {/* Spatial Voice & Video Session Toggle */}
        <button
          type="button"
          onClick={async () => {
            const commStore = useCommunicationStore.getState();
            if (commStore.connectionState === 'disconnected') {
              const authUser = useAuthStore.getState().user;
              const expId = experience.id || 'exp-default';
              const companyId = authUser?.companyId || 'company-default';
              const actorId = authUser?.id || `user-${Math.floor(Math.random() * 1000)}`;
              const actorName = authUser?.name || 'Collaborator';
              await webrtcSessionManager.startSession(expId, companyId, actorId, actorName);
            } else {
              commStore.toggleBar();
            }
          }}
          className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-100 shadow-sm transition-all"
          title="Join or toggle 3D Spatial Voice & Video Session"
        >
          <Mic size={14} className="text-purple-600" />
          <span>Spatial Voice</span>
        </button>
      </div>

      {/* Center Viewport & Zoom Controls */}
      <div className="flex items-center gap-3">
        {/* Viewport Selector */}
        <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50/80 p-1 shadow-inner">
          <button
            type="button"
            onClick={() => setCanvasViewport('desktop')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              canvasViewport === 'desktop'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Desktop Viewport (1200px)"
          >
            <Monitor size={15} />
            <span>Desktop</span>
          </button>
          <button
            type="button"
            onClick={() => setCanvasViewport('tablet')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              canvasViewport === 'tablet'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Tablet Viewport (768px)"
          >
            <Tablet size={15} />
            <span>Tablet</span>
          </button>
          <button
            type="button"
            onClick={() => setCanvasViewport('mobile')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              canvasViewport === 'mobile'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Mobile Viewport (375px)"
          >
            <Smartphone size={15} />
            <span>Mobile</span>
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50/80 p-1">
          <button
            type="button"
            onClick={zoomOut}
            className="rounded-lg p-1 text-slate-600 hover:bg-white hover:text-slate-900"
            title="Zoom Out (-10%)"
          >
            <span className="text-xs font-bold font-mono px-1">-</span>
          </button>
          <button
            type="button"
            onClick={resetZoom}
            className="px-2 text-[11px] font-mono font-semibold text-slate-700 hover:text-blue-600"
            title="Reset Zoom (100%)"
          >
            {Math.round(zoomLevel * 100)}%
          </button>
          <button
            type="button"
            onClick={zoomIn}
            className="rounded-lg p-1 text-slate-600 hover:bg-white hover:text-slate-900"
            title="Zoom In (+10%)"
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
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={18} />
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={history.future.length === 0}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 size={18} />
          </button>
        </div>

        {/* Version History Modal Trigger */}
        <button
          type="button"
          onClick={openVersionHistory}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 font-mono"
          title="Open Experience Version History"
        >
          <History size={15} className="text-amber-500" />
          <span>Versions</span>
        </button>

        {/* LogicCraft / iScript / DataBridge */}
        <button
          type="button"
          onClick={() => useLogicStore.getState().openLogicPanel()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 shadow-sm"
          title="Open I3DION LogicCraft Visual Rule Builder"
        >
          <Zap size={15} className="text-indigo-600" />
          <span>LogicCraft</span>
        </button>

        <button
          type="button"
          onClick={() => props.onOpenIScript && props.onOpenIScript()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-100 shadow-sm"
          title="Open I3DION Script (iScript) Code Editor"
        >
          <Code2 size={15} className="text-purple-600" />
          <span>iScript</span>
        </button>

        <button
          type="button"
          onClick={() => useDataBridgeStore.getState().setModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 shadow-sm"
          title="Open I3DION DataBridge Connector Panel"
        >
          <Link2 size={15} className="text-emerald-600" />
          <span>DataBridge</span>
        </button>

        {/* Preview Toggle */}
        <button
          type="button"
          onClick={() => setPreview(!isPreview)}
          className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold shadow-sm transition-all ${
            isPreview
              ? 'bg-amber-500 text-white hover:bg-amber-600'
              : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          {isPreview ? <EyeOff size={16} /> : <Eye size={16} />}
          {isPreview ? 'Exit Preview' : 'Preview'}
        </button>

        {/* Save Draft Button */}
        <button
          type="button"
          onClick={() => saveCurrentExperience()}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-blue-600 active:scale-[0.98]"
        >
          <Sparkles size={15} />
          Save Draft
        </button>

        {/* Publish Button */}
        <button
          type="button"
          onClick={openPublishModal}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98]"
        >
          <Send size={15} />
          Publish
        </button>
      </div>
    </header>
  );
};
