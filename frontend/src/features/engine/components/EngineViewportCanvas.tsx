import React, { useState } from 'react';
import { useEngineStore } from '../store/useEngineStore';
import { MousePointer, Move, RotateCw, Maximize2, Box, Eye, Layers, Grid, SlidersHorizontal, Cpu, Play } from 'lucide-react';

export const EngineViewportCanvas: React.FC = () => {
  const { currentProject, selectedNodeId, setSelectedNodeId, gizmoMode, setGizmoMode, renderMode, setRenderMode } = useEngineStore();
  const [cameraPreset, setCameraPreset] = useState<'Perspective' | 'Top' | 'Front' | 'Right'>('Perspective');

  const selectedNode = currentProject.sceneGraph.find((n) => n.id === selectedNodeId);

  return (
    <div className="flex-1 h-full bg-slate-900 relative overflow-hidden flex flex-col select-none">
      {/* 1. Top Viewport Controls Bar */}
      <div className="absolute top-3 left-4 z-20 flex items-center gap-2">
        {/* Camera Preset Selector Dropdown */}
        <div className="relative">
          <select
            value={cameraPreset}
            onChange={(e) => setCameraPreset(e.target.value as any)}
            className="bg-slate-900/90 text-white font-bold text-xs px-3 py-1.5 rounded-lg border border-slate-700/80 shadow-lg backdrop-blur-md focus:outline-none cursor-pointer"
          >
            <option value="Perspective">Perspective ▾</option>
            <option value="Top">Top</option>
            <option value="Front">Front</option>
            <option value="Right">Right</option>
          </select>
        </div>

        {/* Viewport Presets Bar */}
        <div className="hidden sm:flex items-center bg-slate-900/90 border border-slate-700/80 rounded-lg p-0.5 shadow-lg backdrop-blur-md text-xs font-bold text-slate-300">
          <button
            onClick={() => setCameraPreset('Top')}
            className={`px-2.5 py-1 rounded ${cameraPreset === 'Top' ? 'bg-[#E94B4B] text-white' : 'hover:text-white'}`}
          >
            Top
          </button>
          <button
            onClick={() => setCameraPreset('Front')}
            className={`px-2.5 py-1 rounded ${cameraPreset === 'Front' ? 'bg-[#E94B4B] text-white' : 'hover:text-white'}`}
          >
            Front
          </button>
          <button
            onClick={() => setCameraPreset('Right')}
            className={`px-2.5 py-1 rounded ${cameraPreset === 'Right' ? 'bg-[#E94B4B] text-white' : 'hover:text-white'}`}
          >
            Right
          </button>
        </div>
      </div>

      {/* Top Right Viewport View Modes */}
      <div className="absolute top-3 right-4 z-20 flex items-center gap-2">
        <div className="flex items-center bg-slate-900/90 border border-slate-700/80 rounded-lg p-0.5 shadow-lg backdrop-blur-md text-xs font-bold text-slate-300">
          <button
            onClick={() => setRenderMode('solid')}
            className={`px-3 py-1 rounded transition ${renderMode === 'solid' ? 'bg-[#E94B4B] text-white shadow-sm' : 'hover:text-white'}`}
          >
            Solid
          </button>
          <button
            onClick={() => setRenderMode('wireframe')}
            className={`px-3 py-1 rounded transition ${renderMode === 'wireframe' ? 'bg-[#E94B4B] text-white shadow-sm' : 'hover:text-white'}`}
          >
            Wireframe
          </button>
          <button
            onClick={() => setRenderMode('xray')}
            className={`px-3 py-1 rounded transition ${renderMode === 'xray' ? 'bg-[#E94B4B] text-white shadow-sm' : 'hover:text-white'}`}
          >
            X-Ray
          </button>
        </div>
      </div>

      {/* 2. Left Floating Gizmo / Transformation Toolbar */}
      <div className="absolute top-16 left-4 z-20 flex flex-col bg-slate-900/90 border border-slate-700/80 rounded-xl p-1 shadow-2xl backdrop-blur-md space-y-1">
        <button
          onClick={() => setGizmoMode('translate')}
          title="Translate Gizmo"
          className={`p-2 rounded-lg transition ${gizmoMode === 'translate' ? 'bg-[#E94B4B] text-white' : 'text-slate-400 hover:text-white'}`}
        >
          <MousePointer size={16} />
        </button>
        <button
          onClick={() => setGizmoMode('translate')}
          title="Move Object (G)"
          className={`p-2 rounded-lg transition ${gizmoMode === 'translate' ? 'bg-[#E94B4B] text-white' : 'text-slate-400 hover:text-white'}`}
        >
          <Move size={16} />
        </button>
        <button
          onClick={() => setGizmoMode('rotate')}
          title="Rotate Object (R)"
          className={`p-2 rounded-lg transition ${gizmoMode === 'rotate' ? 'bg-[#E94B4B] text-white' : 'text-slate-400 hover:text-white'}`}
        >
          <RotateCw size={16} />
        </button>
        <button
          onClick={() => setGizmoMode('scale')}
          title="Scale Object (S)"
          className={`p-2 rounded-lg transition ${gizmoMode === 'scale' ? 'bg-[#E94B4B] text-white' : 'text-slate-400 hover:text-white'}`}
        >
          <Maximize2 size={16} />
        </button>
      </div>

      {/* 3. Central Interactive 3D Canvas Representation */}
      <div className="flex-1 w-full h-full relative flex items-center justify-center bg-radial from-slate-800 via-slate-900 to-slate-950">
        {/* Background Industrial 3D Model Rendering */}
        <div className="relative max-w-4xl w-full h-[80%] flex items-center justify-center">
          <img
            src="https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80"
            alt="3D Industrial Assembly"
            className={`max-h-full max-w-full object-contain rounded-2xl shadow-2xl transition duration-500 ${
              renderMode === 'wireframe' ? 'opacity-40 invert filter saturate-200 contrast-150' : renderMode === 'xray' ? 'opacity-60 contrast-125 saturate-50' : ''
            }`}
          />

          {/* Interactive Bounding Box & Annotations Callout Pins */}
          <div
            onClick={() => setSelectedNodeId('node_motor')}
            className={`absolute right-[22%] top-[28%] cursor-pointer transition group ${
              selectedNodeId === 'node_motor' ? 'scale-105' : ''
            }`}
          >
            {/* Red Bounding Box & Callout Label matching reference image */}
            <div className="relative">
              <span className="bg-[#E94B4B] text-white font-bold text-xs px-3 py-1 rounded-md shadow-lg border border-white/20 flex items-center gap-1.5 animate-pulse">
                Motor
              </span>
              <div className="w-3 h-3 bg-[#E94B4B] rounded-full absolute -bottom-4 left-1/2 -translate-x-1/2 border-2 border-white shadow-md" />
            </div>
          </div>

          <div
            onClick={() => setSelectedNodeId('node_inlet_pipe')}
            className="absolute left-[30%] top-[38%] cursor-pointer transition group"
          >
            <div className="relative flex items-center gap-2">
              <span className="bg-rose-950/90 text-rose-100 font-bold text-xs px-3 py-1 rounded-md shadow-lg border border-rose-500/30">
                Inlet
              </span>
              <div className="w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white shadow-md" />
            </div>
          </div>

          <div
            onClick={() => setSelectedNodeId('node_base')}
            className="absolute left-[54%] bottom-[20%] cursor-pointer transition group"
          >
            <div className="relative flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white shadow-md" />
              <span className="bg-rose-950/90 text-rose-100 font-bold text-xs px-3 py-1 rounded-md shadow-lg border border-rose-500/30">
                Base
              </span>
            </div>
          </div>
        </div>

        {/* 4. Bottom Left Viewport Coordinates Axis Gizmo */}
        <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1 font-mono text-[10px] font-black">
          <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-700/80 px-2 py-1 rounded-md text-slate-300">
            <span className="text-rose-500">X</span>
            <span className="text-emerald-500">Y</span>
            <span className="text-sky-500">Z</span>
          </div>
        </div>
      </div>
    </div>
  );
};
