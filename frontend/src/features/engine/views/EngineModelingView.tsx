import React, { useState, useEffect, useRef } from 'react';
import { useEngineStore } from '../store/useEngineStore';
import { SceneHierarchyDock } from '../components/SceneHierarchyDock';
import { EngineViewportCanvas } from '../components/EngineViewportCanvas';
import { PropertiesInspectorDock } from '../components/PropertiesInspectorDock';
import {
  Layers,
  Box,
  ChevronLeft,
  ChevronRight,
  Plus,
  Compass,
  Sliders,
  Palette,
  Eye,
  EyeOff,
  Maximize2,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronUp,
  Circle,
  Repeat
} from 'lucide-react';

export const EngineModelingView: React.FC = () => {
  const {
    currentProject,
    selectedNodeId,
    setSelectedNodeId,
    isLeftDockOpen,
    toggleLeftDock,
    isRightDockOpen,
    toggleRightDock,
    addPrimitive,
    updateNodeMaterial,
    addConsoleLog,
    blenderWorkspace,
    setBlenderWorkspace,
    isTimelineOpen,
    toggleTimeline,
    currentFrame,
    setCurrentFrame,
    isPlayingAnimation,
    setIsPlayingAnimation
  } = useEngineStore();

  const [leftTab, setLeftTab] = useState<'hierarchy' | 'primitives'>('hierarchy');
  const animationFrameRef = useRef<number | null>(null);

  const selectedNode = currentProject.sceneGraph.find((n) => n.id === selectedNodeId) || null;

  // Real-time animation playback loop (1 - 250 frames at 30 fps)
  useEffect(() => {
    if (isPlayingAnimation) {
      const interval = setInterval(() => {
        setCurrentFrame((currentFrame % 250) + 1);
      }, 33.3); // ~30 fps
      return () => clearInterval(interval);
    }
  }, [isPlayingAnimation, currentFrame, setCurrentFrame]);

  const workspacesList: { id: typeof blenderWorkspace; label: string }[] = [
    { id: 'layout', label: 'Layout' },
    { id: 'modeling', label: 'Modeling' },
    { id: 'sculpting', label: 'Sculpting' },
    { id: 'shading', label: 'Shading' },
    { id: 'animation', label: 'Animation' },
    { id: 'geometry', label: 'Geometry Nodes' },
    { id: 'scripting', label: 'Scripting' }
  ];

  const primitivesList: { type: 'cube' | 'sphere' | 'cylinder' | 'torus' | 'cone' | 'monkey'; label: string; desc: string }[] = [
    { type: 'cube', label: 'Cube (Mesh)', desc: 'Standard 2x2x2 Box primitive' },
    { type: 'sphere', label: 'UV Sphere', desc: '32-segment quad sphere' },
    { type: 'cylinder', label: 'Cylinder', desc: 'Radial 32-facet cylinder' },
    { type: 'torus', label: 'Torus', desc: 'Radial revolving ring geometry' },
    { type: 'cone', label: 'Cone', desc: 'Tapered conical apex primitive' },
    { type: 'monkey', label: 'Suzanne Monkey', desc: 'Blender mascot test geometry' }
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none relative bg-slate-100">
      {/* 1. BLENDER WORKSPACES HEADER BAR */}
      <div className="h-8 bg-[#202020] border-b border-[#141414] flex items-center justify-between px-3 text-[#cfcfcf] text-xs font-sans shrink-0 z-20">
        <div className="flex items-center gap-1 overflow-x-auto">
          {workspacesList.map((ws) => (
            <button
              key={ws.id}
              onClick={() => setBlenderWorkspace(ws.id)}
              className={`px-3 py-1 rounded text-xs font-semibold transition ${
                blenderWorkspace === ws.id
                  ? 'bg-[#3c3c3c] text-white shadow-xs font-bold'
                  : 'text-[#888] hover:text-[#eee] hover:bg-[#2a2a2a]'
              }`}
            >
              {ws.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-[11px] text-[#888]">
          <span className="font-mono">Engine: Blender Workbench 3D</span>
        </div>
      </div>

      {/* 2. MAIN 3-PANE WORKSPACE BODY */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* LEFT OUTLINER & SCENE HIERARCHY DOCK */}
        {isLeftDockOpen ? (
          <div className="w-80 bg-white border-r border-slate-200 flex flex-col shrink-0 z-10 transition-all duration-200">
            {/* Tab Switcher Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-600 px-2">
              <div className="flex flex-1 items-center">
                <button
                  onClick={() => setLeftTab('hierarchy')}
                  className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 transition ${
                    leftTab === 'hierarchy'
                      ? 'bg-white text-[#E94B4B] border-b-2 border-[#E94B4B]'
                      : 'hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  <Layers size={14} />
                  <span>Outliner ({currentProject.sceneGraph.length})</span>
                </button>

                <button
                  onClick={() => setLeftTab('primitives')}
                  className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 transition ${
                    leftTab === 'primitives'
                      ? 'bg-white text-[#E94B4B] border-b-2 border-[#E94B4B]'
                      : 'hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  <Plus size={14} />
                  <span>Add Mesh</span>
                </button>
              </div>
              <button
                onClick={toggleLeftDock}
                title="Collapse Outliner"
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded transition ml-1"
              >
                <ChevronLeft size={16} />
              </button>
            </div>

            {/* Left Dock Content */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {leftTab === 'hierarchy' ? (
                <SceneHierarchyDock />
              ) : (
                <div className="p-3 space-y-3 overflow-y-auto text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Mesh Primitives</span>
                    <span className="text-[10px] text-slate-400">Blender CAD Engine</span>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {primitivesList.map((prim) => (
                      <button
                        key={prim.type}
                        onClick={() => addPrimitive(prim.type)}
                        className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:border-[#E94B4B] hover:bg-rose-50 text-left font-semibold flex items-center gap-3 transition group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[#E94B4B] group-hover:scale-105 transition shadow-xs">
                          <Box size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-slate-800 text-xs">{prim.label}</div>
                          <div className="text-[10px] text-slate-400 truncate">{prim.desc}</div>
                        </div>
                        <Plus size={14} className="text-slate-400 group-hover:text-[#E94B4B] transition" />
                      </button>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-[11px] text-slate-500 space-y-1">
                      <div className="font-bold text-slate-700 flex items-center gap-1.5">
                        <Compass size={13} className="text-[#E94B4B]" />
                        <span>3D Cursor Placement</span>
                      </div>
                      <div>Primitives spawn at the current 3D cursor position with bidirectional transform synchronization.</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Collapsed Outliner Strip */
          <div className="w-10 bg-white border-r border-slate-200 flex flex-col items-center py-3 z-10 shrink-0">
            <button
              onClick={toggleLeftDock}
              title="Expand Outliner"
              className="p-1.5 text-slate-600 hover:bg-rose-50 hover:text-[#E94B4B] rounded-lg transition"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* CENTER: Blender-Inspired 3D Viewport with N-Panel and ToolShelf */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          <EngineViewportCanvas />
        </div>

        {/* RIGHT INSPECTOR DOCK: Object & Material Properties (Blender Vertical Tab Strip) */}
        {isRightDockOpen ? (
          <div className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0 z-10 transition-all duration-200">
            <PropertiesInspectorDock />
          </div>
        ) : (
          /* Collapsed Inspector Strip */
          <div className="w-10 bg-white border-l border-slate-200 flex flex-col items-center py-3 z-10 shrink-0">
            <button
              onClick={toggleRightDock}
              title="Expand Inspector"
              className="p-1.5 text-slate-600 hover:bg-rose-50 hover:text-[#E94B4B] rounded-lg transition"
            >
              <ChevronLeft size={16} />
            </button>
          </div>
        )}
      </div>

      {/* 3. BLENDER TIMELINE / DOPE SHEET ANIMATION SCRUBBER (BOTTOM DOCK) */}
      {(isTimelineOpen || blenderWorkspace === 'animation') && (
        <div className="h-16 bg-[#252525] border-t border-[#181818] flex flex-col justify-between px-3 py-1.5 select-none text-[#cfcfcf] text-xs font-sans shrink-0 z-20 shadow-2xl">
          {/* Controls Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentFrame(1)}
                title="Jump to Start (Shift+Left)"
                className="p-1 text-[#aaa] hover:text-white rounded hover:bg-[#333]"
              >
                <SkipBack size={13} />
              </button>

              <button
                onClick={() => setIsPlayingAnimation(!isPlayingAnimation)}
                title={isPlayingAnimation ? 'Pause (Space)' : 'Play Animation (Space)'}
                className="p-1.5 bg-[#ea7600] text-white rounded font-bold hover:bg-[#d46a00] shadow-xs"
              >
                {isPlayingAnimation ? <Pause size={13} /> : <Play size={13} className="fill-current" />}
              </button>

              <button
                onClick={() => setCurrentFrame(250)}
                title="Jump to End (Shift+Right)"
                className="p-1 text-[#aaa] hover:text-white rounded hover:bg-[#333]"
              >
                <SkipForward size={13} />
              </button>

              <div className="h-4 w-px bg-[#3a3a3a] mx-1" />

              {/* Current Frame Counter */}
              <div className="flex items-center gap-1 font-mono text-[11px]">
                <span className="text-[#888]">Frame:</span>
                <input
                  type="number"
                  min="1"
                  max="250"
                  value={currentFrame}
                  onChange={(e) => setCurrentFrame(Math.max(1, Math.min(250, parseInt(e.target.value) || 1)))}
                  className="w-14 px-1 py-0.5 bg-[#181818] border border-[#3a3a3a] rounded text-[#ea7600] font-bold text-center focus:outline-none"
                />
                <span className="text-[#666]">/ 250</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-[#888]">
              <span className="flex items-center gap-1">
                <Circle size={8} className="fill-rose-500 text-rose-500" />
                <span>Auto-Keying</span>
              </span>
              <span>FPS: 30</span>
              <button onClick={toggleTimeline} className="hover:text-white">
                ✕
              </button>
            </div>
          </div>

          {/* Scrubber Slider Track */}
          <div className="w-full relative flex items-center">
            <input
              type="range"
              min="1"
              max="250"
              value={currentFrame}
              onChange={(e) => setCurrentFrame(parseInt(e.target.value))}
              className="w-full accent-[#ea7600] h-1.5 bg-[#181818] rounded cursor-pointer"
            />
          </div>
        </div>
      )}
    </div>
  );
};
