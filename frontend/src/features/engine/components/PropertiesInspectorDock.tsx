import React, { useState } from 'react';
import { useEngineStore } from '../store/useEngineStore';
import { ChevronDown, ChevronRight, RotateCcw, Sliders, Palette, Film, Zap } from 'lucide-react';

export const PropertiesInspectorDock: React.FC = () => {
  const { currentProject, selectedNodeId, updateSceneNodeTransform, toggleNodeVisibility } = useEngineStore();
  const [activeTab, setActiveTab] = useState<'properties' | 'materials' | 'animations' | 'events'>('properties');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    general: true,
    transform: true,
    material: true,
    animation: true,
    interactivity: false
  });

  const selectedNode = currentProject.sceneGraph.find((n) => n.id === selectedNodeId) || currentProject.sceneGraph[0];

  const toggleSection = (sec: string) => {
    setOpenSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

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
  };

  if (!selectedNode) {
    return (
      <div className="flex-1 bg-white p-4 text-center text-xs text-slate-400">
        Select an object in the scene to inspect properties.
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white select-none text-xs border-l border-slate-200 overflow-y-auto">
      {/* Tabs Header */}
      <div className="flex items-center border-b border-slate-200 bg-slate-50 text-slate-600 font-bold">
        <button
          onClick={() => setActiveTab('properties')}
          className={`flex-1 py-2.5 text-center border-b-2 transition ${
            activeTab === 'properties' ? 'border-[#E94B4B] text-[#E94B4B] bg-white' : 'border-transparent hover:bg-slate-100'
          }`}
        >
          Properties
        </button>
        <button
          onClick={() => setActiveTab('materials')}
          className={`flex-1 py-2.5 text-center border-b-2 transition ${
            activeTab === 'materials' ? 'border-[#E94B4B] text-[#E94B4B] bg-white' : 'border-transparent hover:bg-slate-100'
          }`}
        >
          Materials
        </button>
        <button
          onClick={() => setActiveTab('animations')}
          className={`flex-1 py-2.5 text-center border-b-2 transition ${
            activeTab === 'animations' ? 'border-[#E94B4B] text-[#E94B4B] bg-white' : 'border-transparent hover:bg-slate-100'
          }`}
        >
          Animations
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`flex-1 py-2.5 text-center border-b-2 transition ${
            activeTab === 'events' ? 'border-[#E94B4B] text-[#E94B4B] bg-white' : 'border-transparent hover:bg-slate-100'
          }`}
        >
          Events
        </button>
      </div>

      {/* Main Content Area */}
      <div className="p-3 space-y-4">
        {/* GENERAL SECTION */}
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <button
            onClick={() => toggleSection('general')}
            className="w-full px-3 py-2 bg-slate-50 flex items-center justify-between font-bold text-slate-800 hover:bg-slate-100 transition"
          >
            <span>› General</span>
            {openSections.general ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          {openSections.general && (
            <div className="p-3 space-y-2.5 bg-white">
              <div className="grid grid-cols-3 items-center gap-2">
                <span className="text-slate-500 font-medium">Name</span>
                <input
                  type="text"
                  value={selectedNode.name}
                  readOnly
                  className="col-span-2 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-slate-800 font-semibold focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-3 items-center gap-2">
                <span className="text-slate-500 font-medium">Type</span>
                <span className="col-span-2 capitalize font-bold text-slate-700">{selectedNode.type}</span>
              </div>
              <div className="grid grid-cols-3 items-center gap-2">
                <span className="text-slate-500 font-medium">ID</span>
                <span className="col-span-2 font-mono text-[11px] text-slate-400">{selectedNode.id}</span>
              </div>
              <div className="grid grid-cols-3 items-center gap-2">
                <span className="text-slate-500 font-medium">Parent</span>
                <span className="col-span-2 text-slate-600">{selectedNode.parent || 'None (Scene Root)'}</span>
              </div>
              <div className="grid grid-cols-3 items-center gap-2 pt-1 border-t border-slate-100">
                <span className="text-slate-500 font-medium">Visible</span>
                <input
                  type="checkbox"
                  checked={selectedNode.visible}
                  onChange={() => toggleNodeVisibility(selectedNode.id)}
                  className="accent-[#E94B4B] w-4 h-4 rounded cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* TRANSFORM SECTION */}
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <button
            onClick={() => toggleSection('transform')}
            className="w-full px-3 py-2 bg-slate-50 flex items-center justify-between font-bold text-slate-800 hover:bg-slate-100 transition"
          >
            <span>› Transform</span>
            {openSections.transform ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          {openSections.transform && (
            <div className="p-3 space-y-3 bg-white">
              {/* Position X, Y, Z */}
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-slate-500">Position</div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">
                    <span className="font-bold text-rose-500 text-[10px]">X</span>
                    <input
                      type="number"
                      step="0.1"
                      value={selectedNode.transform.position.x}
                      onChange={(e) => handlePosChange('x', parseFloat(e.target.value) || 0)}
                      className="w-full bg-transparent text-right font-mono focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">
                    <span className="font-bold text-emerald-500 text-[10px]">Y</span>
                    <input
                      type="number"
                      step="0.1"
                      value={selectedNode.transform.position.y}
                      onChange={(e) => handlePosChange('y', parseFloat(e.target.value) || 0)}
                      className="w-full bg-transparent text-right font-mono focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">
                    <span className="font-bold text-sky-500 text-[10px]">Z</span>
                    <input
                      type="number"
                      step="0.1"
                      value={selectedNode.transform.position.z}
                      onChange={(e) => handlePosChange('z', parseFloat(e.target.value) || 0)}
                      className="w-full bg-transparent text-right font-mono focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Rotation X, Y, Z */}
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-slate-500">Rotation</div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">
                    <span className="font-bold text-rose-500 text-[10px]">X</span>
                    <input
                      type="number"
                      step="1"
                      value={selectedNode.transform.rotation.x}
                      onChange={(e) => handleRotChange('x', parseFloat(e.target.value) || 0)}
                      className="w-full bg-transparent text-right font-mono focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">
                    <span className="font-bold text-emerald-500 text-[10px]">Y</span>
                    <input
                      type="number"
                      step="1"
                      value={selectedNode.transform.rotation.y}
                      onChange={(e) => handleRotChange('y', parseFloat(e.target.value) || 0)}
                      className="w-full bg-transparent text-right font-mono focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">
                    <span className="font-bold text-sky-500 text-[10px]">Z</span>
                    <input
                      type="number"
                      step="1"
                      value={selectedNode.transform.rotation.z}
                      onChange={(e) => handleRotChange('z', parseFloat(e.target.value) || 0)}
                      className="w-full bg-transparent text-right font-mono focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Scale X, Y, Z */}
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-slate-500">Scale</div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">
                    <span className="font-bold text-rose-500 text-[10px]">X</span>
                    <input
                      type="number"
                      step="0.1"
                      value={selectedNode.transform.scale.x}
                      onChange={(e) => handleScaleChange('x', parseFloat(e.target.value) || 1)}
                      className="w-full bg-transparent text-right font-mono focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">
                    <span className="font-bold text-emerald-500 text-[10px]">Y</span>
                    <input
                      type="number"
                      step="0.1"
                      value={selectedNode.transform.scale.y}
                      onChange={(e) => handleScaleChange('y', parseFloat(e.target.value) || 1)}
                      className="w-full bg-transparent text-right font-mono focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">
                    <span className="font-bold text-sky-500 text-[10px]">Z</span>
                    <input
                      type="number"
                      step="0.1"
                      value={selectedNode.transform.scale.z}
                      onChange={(e) => handleScaleChange('z', parseFloat(e.target.value) || 1)}
                      className="w-full bg-transparent text-right font-mono focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={resetTransform}
                className="w-full py-1.5 mt-2 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-[#E94B4B] border border-slate-200 rounded-lg font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <RotateCcw size={12} />
                <span>Reset Transform</span>
              </button>
            </div>
          )}
        </div>

        {/* MATERIAL SECTION */}
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <button
            onClick={() => toggleSection('material')}
            className="w-full px-3 py-2 bg-slate-50 flex items-center justify-between font-bold text-slate-800 hover:bg-slate-100 transition"
          >
            <span>› Material</span>
            {openSections.material ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          {openSections.material && (
            <div className="p-3 space-y-2 bg-white">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Color</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-slate-700">{selectedNode.material?.color || '#E94B4B'}</span>
                  <div
                    className="w-5 h-5 rounded border border-slate-300 shadow-inner"
                    style={{ backgroundColor: selectedNode.material?.color || '#E94B4B' }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-500 font-medium">Roughness</span>
                <span className="font-mono font-bold text-slate-700">{selectedNode.material?.roughness ?? 0.3}</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-500 font-medium">Metalness</span>
                <span className="font-mono font-bold text-slate-700">{selectedNode.material?.metalness ?? 0.7}</span>
              </div>
            </div>
          )}
        </div>

        {/* ANIMATION SECTION */}
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <button
            onClick={() => toggleSection('animation')}
            className="w-full px-3 py-2 bg-slate-50 flex items-center justify-between font-bold text-slate-800 hover:bg-slate-100 transition"
          >
            <span>› Animation</span>
            {openSections.animation ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          {openSections.animation && (
            <div className="p-3 space-y-2 bg-white">
              <div className="text-slate-500 font-medium">Active Clip</div>
              <select className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded font-semibold text-slate-800 focus:outline-none">
                {selectedNode.animationClips?.map((clip) => (
                  <option key={clip} value={clip}>
                    {clip}
                  </option>
                )) || <option value="none">No animations</option>}
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
