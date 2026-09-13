import React, { useState } from 'react';
import { StudioWidgetNode } from '../types/studio';
import { useStudioStore } from '../store/useStudioStore';
import { CameraPreset, HotspotDefinition, Vector3D } from '../3d/types/threeTypes';
import { Box, RotateCcw, Plus, Trash2 } from 'lucide-react';

interface ThreePropertiesInspectorProps {
  node: StudioWidgetNode;
}

export const ThreePropertiesInspector: React.FC<ThreePropertiesInspectorProps> = ({ node }) => {
  const updateWidgetProperties = useStudioStore((s) => s.updateWidgetProperties);
  const [activeTab, setActiveTab] = useState<'MODEL' | 'TRANSFORM' | 'CAMERA' | 'LIGHTING' | 'ANIMATION' | 'HOTSPOTS'>('MODEL');

  const props = node.properties || {};
  const pos: Vector3D = props.position3D || { x: 0, y: 0, z: 0 };
  const rot: Vector3D = props.rotation3D || { x: 0, y: 0, z: 0 };
  const scale: Vector3D = props.scale3D || { x: 1, y: 1, z: 1 };
  const hotspots: HotspotDefinition[] = props.hotspots || [];

  const handleUpdate = (updated: Record<string, any>) => {
    updateWidgetProperties(node.id, updated);
  };

  const handlePosChange = (axis: 'x' | 'y' | 'z', val: number) => {
    handleUpdate({ position3D: { ...pos, [axis]: val } });
  };

  const handleRotChange = (axis: 'x' | 'y' | 'z', val: number) => {
    handleUpdate({ rotation3D: { ...rot, [axis]: val } });
  };

  const handleScaleChange = (axis: 'x' | 'y' | 'z', val: number) => {
    handleUpdate({ scale3D: { ...scale, [axis]: val } });
  };

  const handleResetTransforms = () => {
    handleUpdate({
      position3D: { x: 0, y: 0, z: 0 },
      rotation3D: { x: 0, y: 0, z: 0 },
      scale3D: { x: 1, y: 1, z: 1 },
    });
  };

  const handleAddHotspot = () => {
    const newHotspot: HotspotDefinition = {
      id: `hotspot_${Date.now().toString().slice(-4)}`,
      label: 'New Hotspot',
      description: 'Hotspot info detail',
      position: { x: 0, y: 0.5, z: 0 },
      visible: true,
      icon: 'pin',
    };
    handleUpdate({ hotspots: [...hotspots, newHotspot] });
  };

  const handleUpdateHotspot = (index: number, updated: Partial<HotspotDefinition>) => {
    const newHotspots = [...hotspots];
    newHotspots[index] = { ...newHotspots[index], ...updated };
    handleUpdate({ hotspots: newHotspots });
  };

  const handleDeleteHotspot = (index: number) => {
    const newHotspots = hotspots.filter((_, i) => i !== index);
    handleUpdate({ hotspots: newHotspots });
  };

  return (
    <div className="space-y-4 text-xs text-slate-300">
      {/* 3D Inspector Header */}
      <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
        <div className="flex items-center gap-2">
          <Box className="text-blue-400" size={16} />
          <span className="font-bold text-slate-100 uppercase tracking-wider">3D Model Properties</span>
        </div>
        <button
          onClick={handleResetTransforms}
          title="Reset Transforms"
          className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded"
        >
          <RotateCcw size={13} />
        </button>
      </div>

      {/* Sub-Tab Navigation */}
      <div className="grid grid-cols-3 gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800">
        <button
          onClick={() => setActiveTab('MODEL')}
          className={`py-1 rounded text-[11px] font-medium transition ${
            activeTab === 'MODEL' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Model
        </button>
        <button
          onClick={() => setActiveTab('TRANSFORM')}
          className={`py-1 rounded text-[11px] font-medium transition ${
            activeTab === 'TRANSFORM' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Transform
        </button>
        <button
          onClick={() => setActiveTab('CAMERA')}
          className={`py-1 rounded text-[11px] font-medium transition ${
            activeTab === 'CAMERA' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Camera
        </button>
        <button
          onClick={() => setActiveTab('LIGHTING')}
          className={`py-1 rounded text-[11px] font-medium transition ${
            activeTab === 'LIGHTING' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Lighting
        </button>
        <button
          onClick={() => setActiveTab('ANIMATION')}
          className={`py-1 rounded text-[11px] font-medium transition ${
            activeTab === 'ANIMATION' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Animation
        </button>
        <button
          onClick={() => setActiveTab('HOTSPOTS')}
          className={`py-1 rounded text-[11px] font-medium transition ${
            activeTab === 'HOTSPOTS' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Hotspots
        </button>
      </div>

      {/* MODEL TAB */}
      {activeTab === 'MODEL' && (
        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">Model Asset URL (GLB / GLTF)</label>
            <input
              type="text"
              value={props.modelUrl || ''}
              onChange={(e) => handleUpdate({ modelUrl: e.target.value })}
              placeholder="https://assets.example.com/compressor.glb"
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2.5 py-1.5 font-mono"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs font-medium text-slate-300">Auto Rotate Model</span>
            <input
              type="checkbox"
              checked={!!props.autoRotate}
              onChange={(e) => handleUpdate({ autoRotate: e.target.checked })}
              className="rounded border-slate-700 text-blue-500 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-300">Orbit Controls Enabled</span>
            <input
              type="checkbox"
              checked={props.controlsEnabled !== false}
              onChange={(e) => handleUpdate({ controlsEnabled: e.target.checked })}
              className="rounded border-slate-700 text-blue-500 focus:ring-blue-500/20"
            />
          </div>
        </div>
      )}

      {/* TRANSFORM TAB */}
      {activeTab === 'TRANSFORM' && (
        <div className="space-y-4">
          {/* Position */}
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider block">Position (X, Y, Z)</span>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-slate-500 block">X</label>
                <input
                  type="number"
                  step="0.1"
                  value={pos.x}
                  onChange={(e) => handlePosChange('x', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded px-2 py-1 font-mono text-center"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block">Y</label>
                <input
                  type="number"
                  step="0.1"
                  value={pos.y}
                  onChange={(e) => handlePosChange('y', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded px-2 py-1 font-mono text-center"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block">Z</label>
                <input
                  type="number"
                  step="0.1"
                  value={pos.z}
                  onChange={(e) => handlePosChange('z', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded px-2 py-1 font-mono text-center"
                />
              </div>
            </div>
          </div>

          {/* Rotation */}
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider block">Rotation (X, Y, Z)</span>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-slate-500 block">X</label>
                <input
                  type="number"
                  step="0.1"
                  value={rot.x}
                  onChange={(e) => handleRotChange('x', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded px-2 py-1 font-mono text-center"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block">Y</label>
                <input
                  type="number"
                  step="0.1"
                  value={rot.y}
                  onChange={(e) => handleRotChange('y', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded px-2 py-1 font-mono text-center"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block">Z</label>
                <input
                  type="number"
                  step="0.1"
                  value={rot.z}
                  onChange={(e) => handleRotChange('z', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded px-2 py-1 font-mono text-center"
                />
              </div>
            </div>
          </div>

          {/* Scale */}
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider block">Scale (X, Y, Z)</span>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-slate-500 block">X</label>
                <input
                  type="number"
                  step="0.1"
                  value={scale.x}
                  onChange={(e) => handleScaleChange('x', parseFloat(e.target.value) || 1)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded px-2 py-1 font-mono text-center"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block">Y</label>
                <input
                  type="number"
                  step="0.1"
                  value={scale.y}
                  onChange={(e) => handleScaleChange('y', parseFloat(e.target.value) || 1)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded px-2 py-1 font-mono text-center"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block">Z</label>
                <input
                  type="number"
                  step="0.1"
                  value={scale.z}
                  onChange={(e) => handleScaleChange('z', parseFloat(e.target.value) || 1)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded px-2 py-1 font-mono text-center"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CAMERA TAB */}
      {activeTab === 'CAMERA' && (
        <div className="space-y-3">
          <label className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider block">Camera Preset</label>
          <div className="grid grid-cols-2 gap-2">
            {(['Front', 'Back', 'Left', 'Right', 'Top', 'Bottom', 'Isometric', 'Custom'] as CameraPreset[]).map((cp) => (
              <button
                key={cp}
                onClick={() => handleUpdate({ cameraPreset: cp })}
                className={`py-1.5 px-3 rounded-lg text-xs font-medium border text-center transition ${
                  props.cameraPreset === cp
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {cp}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* LIGHTING TAB */}
      {activeTab === 'LIGHTING' && (
        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">Environment Preset</label>
            <select
              value={props.environmentPreset || 'city'}
              onChange={(e) => handleUpdate({ environmentPreset: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded p-2"
            >
              <option value="studio">Studio</option>
              <option value="city">City</option>
              <option value="sunset">Sunset</option>
              <option value="night">Night</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">Light Intensity ({props.lightIntensity || 1.2})</label>
            <input
              type="range"
              min="0.2"
              max="3.0"
              step="0.1"
              value={props.lightIntensity || 1.2}
              onChange={(e) => handleUpdate({ lightIntensity: parseFloat(e.target.value) })}
              className="w-full text-blue-500"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs font-medium text-slate-300">Enable Shadow Casting</span>
            <input
              type="checkbox"
              checked={props.shadowsEnabled !== false}
              onChange={(e) => handleUpdate({ shadowsEnabled: e.target.checked })}
              className="rounded border-slate-700 text-blue-500 focus:ring-blue-500/20"
            />
          </div>
        </div>
      )}

      {/* ANIMATION TAB */}
      {activeTab === 'ANIMATION' && (
        <div className="space-y-3">
          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 text-xs text-slate-400">
            Animations are automatically detected when a GLTF model containing animation clips is loaded. Use LogicCraft or iScript commands like <code className="text-blue-400">PLAY ANIMATION "Open"</code> to trigger playback.
          </div>
        </div>
      )}

      {/* HOTSPOTS TAB */}
      {activeTab === 'HOTSPOTS' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">3D Hotspots</span>
            <button
              onClick={handleAddHotspot}
              className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 font-medium"
            >
              <Plus size={13} /> Add Hotspot
            </button>
          </div>

          {hotspots.length === 0 ? (
            <div className="text-[11px] text-slate-500 italic p-3 bg-slate-900/50 rounded-lg border border-slate-800 text-center">
              No 3D hotspots added yet.
            </div>
          ) : (
            <div className="space-y-2">
              {hotspots.map((h, idx) => (
                <div key={h.id || idx} className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={h.label}
                      onChange={(e) => handleUpdateHotspot(idx, { label: e.target.value })}
                      placeholder="Hotspot Label"
                      className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded px-2 py-1 font-semibold"
                    />
                    <button
                      onClick={() => handleDeleteHotspot(idx)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-1">
                    <input
                      type="number"
                      step="0.1"
                      value={h.position.x}
                      onChange={(e) => handleUpdateHotspot(idx, { position: { ...h.position, x: parseFloat(e.target.value) || 0 } })}
                      className="bg-slate-950 border border-slate-800 text-slate-300 text-[11px] rounded px-1.5 py-0.5 text-center font-mono"
                    />
                    <input
                      type="number"
                      step="0.1"
                      value={h.position.y}
                      onChange={(e) => handleUpdateHotspot(idx, { position: { ...h.position, y: parseFloat(e.target.value) || 0 } })}
                      className="bg-slate-950 border border-slate-800 text-slate-300 text-[11px] rounded px-1.5 py-0.5 text-center font-mono"
                    />
                    <input
                      type="number"
                      step="0.1"
                      value={h.position.z}
                      onChange={(e) => handleUpdateHotspot(idx, { position: { ...h.position, z: parseFloat(e.target.value) || 0 } })}
                      className="bg-slate-950 border border-slate-800 text-slate-300 text-[11px] rounded px-1.5 py-0.5 text-center font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
