import React, { useState } from 'react';
import { useEngineStore } from '../store/useEngineStore';
import {
  Layout,
  Cpu,
  Monitor,
  Tablet,
  Smartphone,
  Play,
  Save,
  CheckCircle,
  Clock,
  ChevronDown,
  FolderKanban,
  Edit2,
  Check,
  Zap,
  ArrowLeft,
  Plus
} from 'lucide-react';

export const EngineHeader: React.FC = () => {
  const {
    currentProject,
    activeMode,
    setActiveMode,
    viewportDevice,
    setViewportDevice,
    zoomLevel,
    autosaveStatus,
    saveCurrentProject,
    setIsRunning,
    triggerLogicEvent
  } = useEngineStore();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [projectTitle, setProjectTitle] = useState(currentProject.name);

  const handleTitleSubmit = () => {
    if (projectTitle.trim()) {
      useEngineStore.setState((s) => ({
        currentProject: { ...s.currentProject, name: projectTitle }
      }));
    }
    setIsEditingTitle(false);
  };

  const isWorkspaceMode = activeMode === 'workspace';

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 select-none shrink-0 shadow-sm z-30">
      {/* 1. Left Branding & Navigation Context */}
      <div className="flex items-center gap-4">
        {/* Brand Icon & Name */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#E94B4B] flex items-center justify-center text-white shadow-sm font-black text-sm tracking-wide">
            3D
          </div>
          <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm tracking-tight">
            <span>I3DION</span>
            <span className="text-[#E94B4B] font-semibold">Spatial Engine</span>
          </div>
        </div>

        <div className="h-5 w-px bg-slate-200" />

        {/* Global Navigation Controls */}
        <div className="flex items-center gap-2">
          <a
            href="/hub"
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 text-xs font-semibold flex items-center gap-1.5 transition"
            title="Exit Engine to Spatial Hub"
          >
            <ArrowLeft size={14} />
            <span className="hidden md:inline">Hub</span>
          </a>

          <button
            onClick={() => setActiveMode('workspace')}
            className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition ${
              isWorkspaceMode
                ? 'bg-rose-50 border-[#E94B4B]/40 text-[#E94B4B] font-bold'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
            title="Projects Workspace"
          >
            <FolderKanban size={14} />
            <span className="hidden sm:inline">Workspace</span>
          </button>

          {/* Active Project Title (Visible ONLY in Editor Modes) */}
          {!isWorkspaceMode && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 pl-1">
              <span className="text-slate-300">•</span>
              {isEditingTitle ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                    autoFocus
                    className="px-2 py-0.5 border border-[#E94B4B] rounded text-slate-900 font-bold focus:outline-none text-xs"
                  />
                  <button onClick={handleTitleSubmit} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
                    <Check size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setProjectTitle(currentProject.name);
                    setIsEditingTitle(true);
                  }}
                  className="flex items-center gap-1 font-semibold text-slate-800 hover:text-[#E94B4B] transition group"
                >
                  <span>{currentProject.name}</span>
                  <Edit2 size={12} className="opacity-0 group-hover:opacity-100 transition text-slate-400" />
                </button>
              )}

              <span className="text-slate-300">•</span>
              <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-200">
                {currentProject.status}
              </span>

              {/* Autosave status indicator */}
              <span className="hidden md:flex items-center gap-1 text-[11px] text-slate-400 ml-1">
                {autosaveStatus === 'saved' ? (
                  <>
                    <CheckCircle size={12} className="text-emerald-500" />
                    <span>Saved</span>
                  </>
                ) : autosaveStatus === 'saving' ? (
                  <>
                    <Clock size={12} className="animate-spin text-amber-500" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Clock size={12} className="text-amber-500" />
                    <span>Unsaved changes</span>
                  </>
                )}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Center Section */}
      {isWorkspaceMode ? (
        <div className="hidden md:block font-bold text-slate-700 text-xs tracking-wide">
          Spatial Experience Projects
        </div>
      ) : (
        /* Editor Mode Switcher Pills */
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
          <button
            onClick={() => setActiveMode('ui')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
              activeMode === 'ui'
                ? 'bg-[#E94B4B] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Layout size={14} />
            <span>UI Editor</span>
          </button>
          <button
            onClick={() => setActiveMode('logic')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
              activeMode === 'logic'
                ? 'bg-[#E94B4B] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Cpu size={14} />
            <span>Logic Editor</span>
          </button>
        </div>
      )}

      {/* 3. Right Action & Profile Section */}
      <div className="flex items-center gap-3">
        {!isWorkspaceMode && (
          <>
            {/* Device Viewport Target */}
            <div className="hidden lg:flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5">
              <button
                onClick={() => setViewportDevice('desktop')}
                className={`p-1.5 rounded transition ${viewportDevice === 'desktop' ? 'bg-white shadow-sm text-[#E94B4B]' : 'text-slate-400 hover:text-slate-700'}`}
                title="Desktop View (100%)"
              >
                <Monitor size={14} />
              </button>
              <button
                onClick={() => setViewportDevice('tablet')}
                className={`p-1.5 rounded transition ${viewportDevice === 'tablet' ? 'bg-white shadow-sm text-[#E94B4B]' : 'text-slate-400 hover:text-slate-700'}`}
                title="Tablet View (768px)"
              >
                <Tablet size={14} />
              </button>
              <button
                onClick={() => setViewportDevice('mobile')}
                className={`p-1.5 rounded transition ${viewportDevice === 'mobile' ? 'bg-white shadow-sm text-[#E94B4B]' : 'text-slate-400 hover:text-slate-700'}`}
                title="Mobile View (375px)"
              >
                <Smartphone size={14} />
              </button>
            </div>

            {/* Zoom Selector */}
            <div className="hidden xl:flex items-center gap-1 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
              <span>{zoomLevel}%</span>
              <ChevronDown size={12} className="text-slate-400" />
            </div>

            <div className="h-5 w-px bg-slate-200 hidden sm:block" />

            {/* Primary Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsRunning(true);
                  triggerLogicEvent('btnStart');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-[#E94B4B] font-bold text-xs transition active:scale-95 shadow-sm"
              >
                <Zap size={14} className="fill-[#E94B4B]" />
                <span>Run</span>
              </button>

              <button
                onClick={() => setActiveMode('preview')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition active:scale-95 shadow-sm"
              >
                <Play size={14} />
                <span>Preview</span>
              </button>

              <button
                onClick={saveCurrentProject}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E94B4B] hover:bg-[#D63B3B] text-white font-bold text-xs shadow-md transition active:scale-95"
              >
                <Save size={14} />
                <span>Save</span>
              </button>
            </div>
          </>
        )}

        {/* User Avatar */}
        <div className="flex items-center gap-2 ml-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-sm">
            JD
          </div>
          <div className="hidden xl:block text-left text-xs leading-tight">
            <div className="font-bold text-slate-900">John Doe</div>
            <div className="text-[10px] text-slate-400">Acme Industries</div>
          </div>
        </div>
      </div>
    </header>
  );
};
