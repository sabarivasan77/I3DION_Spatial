import React, { useState } from 'react';
import { useEngineStore } from '../store/useEngineStore';
import {
  Wrench,
  Globe,
  Sun,
  Box,
  Sliders,
  Palette,
  Layers,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Sparkles,
  Maximize2
} from 'lucide-react';

export const PropertiesInspectorDock: React.FC = () => {
  const {
    currentProject,
    selectedNodeId,
    updateSceneNodeTransform,
    toggleNodeVisibility,
    updateNodeMaterial,
    addConsoleLog
  } = useEngineStore();

  const [activeBlenderTab, setActiveBlenderTab] = useState<'object' | 'modifiers' | 'materials' | 'world' | 'scene' | 'tool'>('object');

  // Modifiers state
  const [activeModifiers, setActiveModifiers] = useState<
    { id: string; type: 'subdiv' | 'bevel' | 'mirror' | 'wireframe'; name: string; levels: number; width?: number }[]
  >([
    { id: 'mod_1', type: 'subdiv', name: 'Subdivision Surface', levels: 2 }
  ]);
  const [selectedModifierType, setSelectedModifierType] = useState<'subdiv' | 'bevel' | 'mirror' | 'wireframe'>('subdiv');

  // World settings state
  const [worldPreset, setWorldPreset] = useState<'studio' | 'sunset' | 'cleanroom' | 'cyberpunk'>('studio');
  const [ambientIntensity, setAmbientIntensity] = useState<number>(0.8);

  const selectedNode = currentProject.sceneGraph.find((n) => n.id === selectedNodeId) || currentProject.sceneGraph[0];

  const handlePosChange = (axis: 'x' | 'y' | 'z', val: number) => {
    if (!selectedNode) return;
    updateSceneNodeTransform(selectedNode.id, {
      position: { ...selectedNode.transform.position, [axis]: val }
    });
  };

  const handleRotChange = (axis: 'x' | 'y' | 'z', val: number) => {
    if (!selectedNode) return;
    updateSceneNodeTransform(selectedNode.id, {
      rotation: { ...selectedNode.transform.rotation, [axis]: val }
    });
  };

  const handleScaleChange = (axis: 'x' | 'y' | 'z', val: number) => {
    if (!selectedNode) return;
    updateSceneNodeTransform(selectedNode.id, {
      scale: { ...selectedNode.transform.scale, [axis]: val }
    });
  };

  const resetTransform = () => {
    if (!selectedNode) return;
    updateSceneNodeTransform(selectedNode.id, {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 }
    });
    addConsoleLog('info', `Reset transform for object [${selectedNode.name}].`);
  };

  const handleAddModifier = () => {
    const modNames = {
      subdiv: 'Subdivision Surface',
      bevel: 'Bevel',
      mirror: 'Mirror',
      wireframe: 'Wireframe'
    };
    const newMod = {
      id: `mod_${Date.now()}`,
      type: selectedModifierType,
      name: modNames[selectedModifierType],
      levels: 1,
      width: 0.05
    };
    setActiveModifiers([...activeModifiers, newMod]);
    addConsoleLog('info', `Added modifier [${newMod.name}] to ${selectedNode?.name}.`);
  };

  if (!selectedNode) {
    return (
      <div className="flex-1 bg-white p-4 text-center text-xs text-slate-400">
        Select an object in the 3D scene to inspect Blender properties.
      </div>
    );
  }

  const mat = selectedNode.material || { color: '#E94B4B', roughness: 0.35, metalness: 0.25 };

  return (
    <div className="flex-1 flex h-full bg-white select-none text-xs border-l border-slate-200 overflow-hidden">
      {/* 1. Authentic Blender Vertical Icon Tab Strip */}
      <div className="w-11 bg-slate-50 border-r border-slate-200 flex flex-col items-center py-2 gap-1.5 shrink-0">
        <button
          onClick={() => setActiveBlenderTab('tool')}
          title="Active Tool & Workspace Settings"
          className={`p-2 rounded-lg transition ${
            activeBlenderTab === 'tool' ? 'bg-[#E94B4B] text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          <Wrench size={15} />
        </button>

        <button
          onClick={() => setActiveBlenderTab('scene')}
          title="Scene Properties (Units & Gravity)"
          className={`p-2 rounded-lg transition ${
            activeBlenderTab === 'scene' ? 'bg-[#E94B4B] text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          <Globe size={15} />
        </button>

        <button
          onClick={() => setActiveBlenderTab('world')}
          title="World Properties (HDRI & Environment Lighting)"
          className={`p-2 rounded-lg transition ${
            activeBlenderTab === 'world' ? 'bg-[#E94B4B] text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          <Sun size={15} />
        </button>

        <div className="w-6 h-px bg-slate-200 my-1" />

        <button
          onClick={() => setActiveBlenderTab('object')}
          title="Object Properties (Transform & Relations)"
          className={`p-2 rounded-lg transition ${
            activeBlenderTab === 'object' ? 'bg-[#E94B4B] text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          <Box size={15} />
        </button>

        <button
          onClick={() => setActiveBlenderTab('modifiers')}
          title="Modifier Properties (Subdiv, Bevel, Mirror)"
          className={`p-2 rounded-lg transition ${
            activeBlenderTab === 'modifiers' ? 'bg-[#E94B4B] text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          <Sliders size={15} />
        </button>

        <button
          onClick={() => setActiveBlenderTab('materials')}
          title="Material Properties (Principled BSDF)"
          className={`p-2 rounded-lg transition ${
            activeBlenderTab === 'materials' ? 'bg-[#E94B4B] text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          <Palette size={15} />
        </button>
      </div>

      {/* 2. Main Content Inspector Panel */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* TAB 1: OBJECT PROPERTIES */}
        {activeBlenderTab === 'object' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Box size={14} className="text-[#E94B4B]" />
                <span className="font-bold text-slate-800 text-xs">{selectedNode.name}</span>
              </div>
              <span className="font-mono text-[10px] text-slate-400">{selectedNode.type}</span>
            </div>

            {/* Transform Coordinates Box */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
              <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between font-bold text-slate-800">
                <span>Transform (Location, Rotation, Scale)</span>
                <button onClick={resetTransform} title="Reset Transforms" className="text-slate-400 hover:text-rose-600 transition">
                  <RotateCcw size={12} />
                </button>
              </div>

              <div className="p-3 space-y-3">
                {/* Location X, Y, Z */}
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Location</div>
                  <div className="grid grid-cols-3 gap-1.5 font-mono">
                    {(['x', 'y', 'z'] as const).map((axis) => (
                      <div key={axis} className="flex items-center bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">
                        <span className={`text-[10px] font-bold uppercase mr-1.5 ${axis === 'x' ? 'text-rose-500' : axis === 'y' ? 'text-emerald-500' : 'text-sky-500'}`}>
                          {axis}
                        </span>
                        <input
                          type="number"
                          step="0.1"
                          value={Number(selectedNode.transform.position[axis]).toFixed(2)}
                          onChange={(e) => handlePosChange(axis, parseFloat(e.target.value) || 0)}
                          className="w-full bg-transparent text-slate-800 text-xs focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rotation X, Y, Z */}
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Rotation (Euler °)</div>
                  <div className="grid grid-cols-3 gap-1.5 font-mono">
                    {(['x', 'y', 'z'] as const).map((axis) => (
                      <div key={axis} className="flex items-center bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">
                        <span className={`text-[10px] font-bold uppercase mr-1.5 ${axis === 'x' ? 'text-rose-500' : axis === 'y' ? 'text-emerald-500' : 'text-sky-500'}`}>
                          {axis}
                        </span>
                        <input
                          type="number"
                          step="5"
                          value={Number(selectedNode.transform.rotation[axis]).toFixed(1)}
                          onChange={(e) => handleRotChange(axis, parseFloat(e.target.value) || 0)}
                          className="w-full bg-transparent text-slate-800 text-xs focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Scale X, Y, Z */}
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Scale</div>
                  <div className="grid grid-cols-3 gap-1.5 font-mono">
                    {(['x', 'y', 'z'] as const).map((axis) => (
                      <div key={axis} className="flex items-center bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">
                        <span className={`text-[10px] font-bold uppercase mr-1.5 ${axis === 'x' ? 'text-rose-500' : axis === 'y' ? 'text-emerald-500' : 'text-sky-500'}`}>
                          {axis}
                        </span>
                        <input
                          type="number"
                          step="0.1"
                          value={Number(selectedNode.transform.scale[axis]).toFixed(2)}
                          onChange={(e) => handleScaleChange(axis, parseFloat(e.target.value) || 1)}
                          className="w-full bg-transparent text-slate-800 text-xs focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Visibility & Display */}
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">Viewport Visibility</span>
                <button
                  onClick={() => toggleNodeVisibility(selectedNode.id)}
                  className="flex items-center gap-1 px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700 font-bold"
                >
                  {selectedNode.visible ? <Eye size={12} className="text-emerald-600" /> : <EyeOff size={12} className="text-slate-400" />}
                  <span>{selectedNode.visible ? 'Visible' : 'Hidden'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MODIFIERS (BLENDER WORKFLOW) */}
        {activeBlenderTab === 'modifiers' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Sliders size={14} className="text-[#E94B4B]" />
                <span>Modifiers Stack</span>
              </span>
            </div>

            {/* Add Modifier Controls */}
            <div className="flex gap-2">
              <select
                value={selectedModifierType}
                onChange={(e) => setSelectedModifierType(e.target.value as any)}
                className="flex-1 p-1.5 bg-white border border-slate-200 rounded text-slate-800 font-semibold"
              >
                <option value="subdiv">Subdivision Surface</option>
                <option value="bevel">Bevel</option>
                <option value="wireframe">Wireframe</option>
                <option value="mirror">Mirror</option>
              </select>
              <button
                onClick={handleAddModifier}
                className="px-3 py-1.5 bg-[#E94B4B] text-white font-bold rounded flex items-center gap-1 shadow-xs hover:bg-[#D63B3B] transition"
              >
                <Plus size={13} />
                <span>Add</span>
              </button>
            </div>

            {/* Active Modifiers List */}
            <div className="space-y-2.5">
              {activeModifiers.map((mod) => (
                <div key={mod.id} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                  <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between font-bold text-slate-800">
                    <div className="flex items-center gap-1.5">
                      <Sliders size={12} className="text-[#E94B4B]" />
                      <span>{mod.name}</span>
                    </div>
                    <button
                      onClick={() => setActiveModifiers(activeModifiers.filter((m) => m.id !== mod.id))}
                      className="text-slate-400 hover:text-rose-600 transition"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 font-medium">Levels Viewport:</span>
                      <input
                        type="number"
                        min="1"
                        max="4"
                        value={mod.levels}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 1;
                          setActiveModifiers(activeModifiers.map((m) => (m.id === mod.id ? { ...m, levels: val } : m)));
                        }}
                        className="w-16 px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-slate-800 font-bold"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: MATERIALS (PRINCIPLED BSDF) */}
        {activeBlenderTab === 'materials' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Palette size={14} className="text-[#E94B4B]" />
                <span>Principled BSDF Shader</span>
              </span>
            </div>

            {/* Base Color Swatch */}
            <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-3 shadow-2xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Base Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={mat.color || '#E94B4B'}
                    onChange={(e) => updateNodeMaterial(selectedNode.id, { color: e.target.value })}
                    className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={mat.color || '#E94B4B'}
                    onChange={(e) => updateNodeMaterial(selectedNode.id, { color: e.target.value })}
                    className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-slate-800 font-mono text-xs uppercase"
                  />
                </div>
              </div>

              {/* Metallic Slider */}
              <div>
                <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-1">
                  <span>Metallic</span>
                  <span className="font-mono text-slate-800 font-bold">{(mat.metalness ?? 0.3).toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={mat.metalness ?? 0.3}
                  onChange={(e) => updateNodeMaterial(selectedNode.id, { metalness: parseFloat(e.target.value) })}
                  className="w-full accent-[#E94B4B] cursor-pointer"
                />
              </div>

              {/* Roughness Slider */}
              <div>
                <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-1">
                  <span>Roughness</span>
                  <span className="font-mono text-slate-800 font-bold">{(mat.roughness ?? 0.4).toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={mat.roughness ?? 0.4}
                  onChange={(e) => updateNodeMaterial(selectedNode.id, { roughness: parseFloat(e.target.value) })}
                  className="w-full accent-[#E94B4B] cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: WORLD (HDRI & LIGHTING) */}
        {activeBlenderTab === 'world' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Sun size={14} className="text-[#E94B4B]" />
                <span>World Environment & HDRI</span>
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-3 shadow-2xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Lighting Preset</label>
                <select
                  value={worldPreset}
                  onChange={(e) => {
                    const preset = e.target.value as any;
                    setWorldPreset(preset);
                    addConsoleLog('info', `Switched World environment lighting to: ${preset}.`);
                  }}
                  className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-slate-800 font-semibold"
                >
                  <option value="studio">Studio Neutral (5500K)</option>
                  <option value="sunset">Warm Sunset (3200K)</option>
                  <option value="cleanroom">Cleanroom High-Key (6500K)</option>
                  <option value="cyberpunk">Dark Cyberpunk Neon</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-1">
                  <span>Ambient Light Intensity</span>
                  <span className="font-mono text-slate-800 font-bold">{ambientIntensity.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="2.5"
                  step="0.1"
                  value={ambientIntensity}
                  onChange={(e) => setAmbientIntensity(parseFloat(e.target.value))}
                  className="w-full accent-[#E94B4B] cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SCENE SETTINGS */}
        {activeBlenderTab === 'scene' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Globe size={14} className="text-[#E94B4B]" />
                <span>Scene & Units</span>
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">Unit System:</span>
                <span className="font-bold text-slate-800">Metric (Meters)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">Gravity:</span>
                <span className="font-mono text-slate-800">-9.81 m/s² (Z)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">Active Camera:</span>
                <span className="font-mono text-slate-800">Camera_Main</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: TOOL SETTINGS */}
        {activeBlenderTab === 'tool' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Wrench size={14} className="text-[#E94B4B]" />
                <span>Active Tool Settings</span>
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">Transform Orientation:</span>
                <span className="font-bold text-slate-800">Global</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">Pivot Point:</span>
                <span className="font-bold text-slate-800">Median Point</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
