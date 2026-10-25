import React, { useState } from 'react';
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
  Maximize2
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
    addConsoleLog
  } = useEngineStore();

  const [leftTab, setLeftTab] = useState<'hierarchy' | 'primitives'>('hierarchy');
  const [showAddMenu, setShowAddMenu] = useState(false);

  const selectedNode = currentProject.sceneGraph.find((n) => n.id === selectedNodeId) || null;

  const primitivesList: { type: 'cube' | 'sphere' | 'cylinder' | 'torus' | 'cone' | 'monkey'; label: string; desc: string }[] = [
    { type: 'cube', label: 'Cube (Mesh)', desc: 'Standard 2x2x2 Box primitive' },
    { type: 'sphere', label: 'UV Sphere', desc: '32-segment quad sphere' },
    { type: 'cylinder', label: 'Cylinder', desc: 'Radial 32-facet cylinder' },
    { type: 'torus', label: 'Torus', desc: 'Radial revolving ring geometry' },
    { type: 'cone', label: 'Cone', desc: 'Tapered conical apex primitive' },
    { type: 'monkey', label: 'Suzanne Monkey', desc: 'Blender mascot test geometry' }
  ];

  return (
    <div className="flex-1 flex h-full overflow-hidden select-none relative bg-slate-100">
      {/* 1. LEFT OUTLINER & SCENE HIERARCHY DOCK */}
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

      {/* 2. CENTER: Blender-Inspired 3D Viewport with N-Panel and ToolShelf */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <EngineViewportCanvas />
      </div>

      {/* 3. RIGHT INSPECTOR DOCK: Object & Material Properties */}
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
  );
};
