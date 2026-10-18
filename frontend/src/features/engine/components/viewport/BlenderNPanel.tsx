import React, { useState } from 'react';
import { useEngineStore } from '../../store/useEngineStore';
import { ChevronRight, ChevronDown, RotateCcw, Eye, EyeOff, Box } from 'lucide-react';

interface BlenderNPanelProps {
  onCameraView: (view: 'perspective' | 'top' | 'front' | 'right' | 'ortho') => void;
}

export const BlenderNPanel: React.FC<BlenderNPanelProps> = ({ onCameraView }) => {
  const {
    currentProject,
    selectedNodeId,
    updateSceneNodeTransform,
    toggleNodeVisibility,
    isNPanelOpen,
    toggleNPanel,
    activeBlenderTool,
    renameSceneNode
  } = useEngineStore();

  const [activeTab, setActiveTab] = useState<'item' | 'tool' | 'view'>('item');
  const [transformCollapsed, setTransformCollapsed] = useState(false);
  const [dimensionsCollapsed, setDimensionsCollapsed] = useState(false);

  if (!isNPanelOpen) {
    return (
      <button
        onClick={toggleNPanel}
        title="Open Sidebar [N]"
        className="absolute top-12 right-0 z-20 bg-[#282828]/90 border-l border-y border-[#1e1e1e] text-[#aaa] hover:text-white px-1.5 py-3 rounded-l shadow-xl backdrop-blur-md text-[10px] font-bold writing-vertical transition"
      >
        <span>&lt; N</span>
      </button>
    );
  }

  const selectedNode = currentProject.sceneGraph.find((n) => n.id === selectedNodeId);

  const handlePosChange = (axis: 'x' | 'y' | 'z', val: number) => {
    if (!selectedNode) return;
    updateSceneNodeTransform(selectedNode.id, {
      position: { ...selectedNode.transform.position, [axis]: val },
    });
  };

  const handleRotChange = (axis: 'x' | 'y' | 'z', val: number) => {
    if (!selectedNode) return;
    updateSceneNodeTransform(selectedNode.id, {
      rotation: { ...selectedNode.transform.rotation, [axis]: val },
    });
  };

  const handleScaleChange = (axis: 'x' | 'y' | 'z', val: number) => {
    if (!selectedNode) return;
    updateSceneNodeTransform(selectedNode.id, {
      scale: { ...selectedNode.transform.scale, [axis]: val },
    });
  };

  const resetAllTransforms = () => {
    if (!selectedNode) return;
    updateSceneNodeTransform(selectedNode.id, {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
    });
  };

  return (
    <div className="absolute top-10 right-0 bottom-7 w-64 bg-[#282828]/95 border-l border-[#1e1e1e] z-20 flex flex-col shadow-2xl backdrop-blur-md select-none text-xs text-[#cfcfcf] font-sans">
      {/* Header Tabs: Item | Tool | View */}
      <div className="flex items-center justify-between border-b border-[#1e1e1e] bg-[#222]">
        <div className="flex flex-1 items-center">
          <button
            onClick={() => setActiveTab('item')}
            className={`flex-1 py-1.5 text-center font-semibold text-[11px] transition border-b-2 ${
              activeTab === 'item'
                ? 'border-[#ea7600] text-white bg-[#282828]'
                : 'border-transparent text-[#888] hover:text-[#ccc]'
            }`}
          >
            Item
          </button>
          <button
            onClick={() => setActiveTab('tool')}
            className={`flex-1 py-1.5 text-center font-semibold text-[11px] transition border-b-2 ${
              activeTab === 'tool'
                ? 'border-[#ea7600] text-white bg-[#282828]'
                : 'border-transparent text-[#888] hover:text-[#ccc]'
            }`}
          >
            Tool
          </button>
          <button
            onClick={() => setActiveTab('view')}
            className={`flex-1 py-1.5 text-center font-semibold text-[11px] transition border-b-2 ${
              activeTab === 'view'
                ? 'border-[#ea7600] text-white bg-[#282828]'
                : 'border-transparent text-[#888] hover:text-[#ccc]'
            }`}
          >
            View
          </button>
        </div>

        <button
          onClick={toggleNPanel}
          title="Close Sidebar [N]"
          className="px-2 py-1.5 text-[#888] hover:text-white hover:bg-[#333]"
        >
          <ChevronRight size={13} />
        </button>
      </div>

      {/* Tab Content Body */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-3">
        {activeTab === 'item' ? (
          selectedNode ? (
            <>
              {/* Selected Object Name */}
              <div className="bg-[#202020] p-2 rounded border border-[#1a1a1a] flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Box size={13} className="text-[#ea7600]" />
                  <input
                    type="text"
                    value={selectedNode.name}
                    onChange={(e) => renameSceneNode(selectedNode.id, e.target.value)}
                    className="bg-transparent border-b border-transparent focus:border-[#ea7600] text-white font-semibold text-xs focus:outline-none px-1"
                  />
                </div>
                <button
                  onClick={() => toggleNodeVisibility(selectedNode.id)}
                  title={selectedNode.visible ? 'Hide Object' : 'Show Object'}
                  className="text-[#888] hover:text-white"
                >
                  {selectedNode.visible ? <Eye size={13} /> : <EyeOff size={13} className="text-amber-500" />}
                </button>
              </div>

              {/* TRANSFORM COLLAPSIBLE SECTION */}
              <div className="bg-[#242424] rounded border border-[#1e1e1e] overflow-hidden">
                <button
                  onClick={() => setTransformCollapsed(!transformCollapsed)}
                  className="w-full px-2.5 py-1.5 flex items-center justify-between bg-[#1f1f1f] text-[11px] font-bold text-[#e0e0e0] hover:bg-[#272727]"
                >
                  <span className="flex items-center gap-1">
                    {transformCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                    <span>Transform</span>
                  </span>
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      resetAllTransforms();
                    }}
                    title="Reset All Transforms"
                    className="text-[#777] hover:text-white inline-flex items-center cursor-pointer"
                  >
                    <RotateCcw size={11} />
                  </span>
                </button>

                {!transformCollapsed && (
                  <div className="p-2 space-y-2.5 text-[11px]">
                    {/* Location */}
                    <div className="space-y-1">
                      <div className="text-[10px] font-semibold text-[#888] uppercase tracking-wider">
                        Location (m)
                      </div>
                      <div className="space-y-1">
                        {(['x', 'y', 'z'] as const).map((axis) => {
                          const val = selectedNode.transform.position[axis] || 0;
                          const color =
                            axis === 'x'
                              ? 'border-l-rose-500 text-rose-400'
                              : axis === 'y'
                              ? 'border-l-emerald-500 text-emerald-400'
                              : 'border-l-sky-500 text-sky-400';
                          return (
                            <div key={axis} className="flex items-center bg-[#1d1d1d] rounded border border-[#181818] overflow-hidden">
                              <span className={`w-5 px-1 py-0.5 text-center font-bold uppercase border-l-2 ${color} bg-[#272727]`}>
                                {axis}
                              </span>
                              <input
                                type="number"
                                step={0.1}
                                value={parseFloat(val.toFixed(3))}
                                onChange={(e) => handlePosChange(axis, parseFloat(e.target.value) || 0)}
                                className="flex-1 bg-transparent px-2 py-0.5 text-right text-white focus:outline-none focus:bg-[#2b2b2b]"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Rotation */}
                    <div className="space-y-1">
                      <div className="text-[10px] font-semibold text-[#888] uppercase tracking-wider">
                        Rotation (°)
                      </div>
                      <div className="space-y-1">
                        {(['x', 'y', 'z'] as const).map((axis) => {
                          const val = selectedNode.transform.rotation[axis] || 0;
                          const color =
                            axis === 'x'
                              ? 'border-l-rose-500 text-rose-400'
                              : axis === 'y'
                              ? 'border-l-emerald-500 text-emerald-400'
                              : 'border-l-sky-500 text-sky-400';
                          return (
                            <div key={axis} className="flex items-center bg-[#1d1d1d] rounded border border-[#181818] overflow-hidden">
                              <span className={`w-5 px-1 py-0.5 text-center font-bold uppercase border-l-2 ${color} bg-[#272727]`}>
                                {axis}
                              </span>
                              <input
                                type="number"
                                step={5}
                                value={parseFloat(val.toFixed(1))}
                                onChange={(e) => handleRotChange(axis, parseFloat(e.target.value) || 0)}
                                className="flex-1 bg-transparent px-2 py-0.5 text-right text-white focus:outline-none focus:bg-[#2b2b2b]"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Scale */}
                    <div className="space-y-1">
                      <div className="text-[10px] font-semibold text-[#888] uppercase tracking-wider">
                        Scale
                      </div>
                      <div className="space-y-1">
                        {(['x', 'y', 'z'] as const).map((axis) => {
                          const val = selectedNode.transform.scale[axis] ?? 1;
                          const color =
                            axis === 'x'
                              ? 'border-l-rose-500 text-rose-400'
                              : axis === 'y'
                              ? 'border-l-emerald-500 text-emerald-400'
                              : 'border-l-sky-500 text-sky-400';
                          return (
                            <div key={axis} className="flex items-center bg-[#1d1d1d] rounded border border-[#181818] overflow-hidden">
                              <span className={`w-5 px-1 py-0.5 text-center font-bold uppercase border-l-2 ${color} bg-[#272727]`}>
                                {axis}
                              </span>
                              <input
                                type="number"
                                step={0.1}
                                value={parseFloat(val.toFixed(3))}
                                onChange={(e) => handleScaleChange(axis, parseFloat(e.target.value) || 0.1)}
                                className="flex-1 bg-transparent px-2 py-0.5 text-right text-white focus:outline-none focus:bg-[#2b2b2b]"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* DIMENSIONS */}
              <div className="bg-[#242424] rounded border border-[#1e1e1e] overflow-hidden">
                <button
                  onClick={() => setDimensionsCollapsed(!dimensionsCollapsed)}
                  className="w-full px-2.5 py-1.5 flex items-center justify-between bg-[#1f1f1f] text-[11px] font-bold text-[#e0e0e0] hover:bg-[#272727]"
                >
                  <span className="flex items-center gap-1">
                    {dimensionsCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                    <span>Dimensions (m)</span>
                  </span>
                </button>
                {!dimensionsCollapsed && (
                  <div className="p-2 space-y-1 text-[11px]">
                    <div className="flex justify-between py-0.5 px-1 bg-[#1d1d1d] rounded">
                      <span className="text-rose-400 font-bold">X:</span>
                      <span className="font-mono text-white">{(selectedNode.transform.scale.x * 2).toFixed(2)} m</span>
                    </div>
                    <div className="flex justify-between py-0.5 px-1 bg-[#1d1d1d] rounded">
                      <span className="text-emerald-400 font-bold">Y:</span>
                      <span className="font-mono text-white">{(selectedNode.transform.scale.y * 2).toFixed(2)} m</span>
                    </div>
                    <div className="flex justify-between py-0.5 px-1 bg-[#1d1d1d] rounded">
                      <span className="text-sky-400 font-bold">Z:</span>
                      <span className="font-mono text-white">{(selectedNode.transform.scale.z * 2).toFixed(2)} m</span>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-[#777] text-xs">
              <Box size={24} className="mx-auto mb-2 text-[#555]" />
              <div>No object selected</div>
              <div className="text-[10px] mt-1 text-[#666]">Click an object in the viewport to inspect transforms</div>
            </div>
          )
        ) : activeTab === 'tool' ? (
          <div className="space-y-3">
            <div className="bg-[#202020] p-2.5 rounded border border-[#1a1a1a]">
              <div className="text-[10px] font-bold text-[#888] uppercase tracking-wider mb-1">
                Active Tool
              </div>
              <div className="text-sm font-bold text-[#ea7600] capitalize">
                {activeBlenderTool} Tool
              </div>
              <div className="text-[11px] text-[#888] mt-1">
                {activeBlenderTool === 'move' && 'Translates selected objects along global or local axes. [G]'}
                {activeBlenderTool === 'rotate' && 'Rotates selected objects around pivot point. [R]'}
                {activeBlenderTool === 'scale' && 'Rescales selected objects proportionally or per-axis. [S]'}
                {activeBlenderTool === 'select' && 'Selects objects by clicking or box selecting. [B / W]'}
                {activeBlenderTool === 'cursor' && 'Places the 3D Cursor at clicked position.'}
                {activeBlenderTool === 'transform' && 'Unified translate, rotate, and scale gizmo.'}
                {activeBlenderTool === 'measure' && 'Measures distances between two clicked points.'}
                {activeBlenderTool === 'add' && 'Adds primitives into current scene.'}
              </div>
            </div>
          </div>
        ) : (
          /* VIEW TAB */
          <div className="space-y-3">
            <div className="bg-[#202020] p-2.5 rounded border border-[#1a1a1a] space-y-2">
              <div className="text-[10px] font-bold text-[#888] uppercase tracking-wider">
                View Angles
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => onCameraView('top')}
                  className="px-2 py-1.5 bg-[#2a2a2a] hover:bg-[#ea7600] hover:text-white rounded text-center font-semibold transition"
                >
                  Top (Num 7)
                </button>
                <button
                  onClick={() => onCameraView('front')}
                  className="px-2 py-1.5 bg-[#2a2a2a] hover:bg-[#ea7600] hover:text-white rounded text-center font-semibold transition"
                >
                  Front (Num 1)
                </button>
                <button
                  onClick={() => onCameraView('right')}
                  className="px-2 py-1.5 bg-[#2a2a2a] hover:bg-[#ea7600] hover:text-white rounded text-center font-semibold transition"
                >
                  Right (Num 3)
                </button>
                <button
                  onClick={() => onCameraView('perspective')}
                  className="px-2 py-1.5 bg-[#2a2a2a] hover:bg-[#ea7600] hover:text-white rounded text-center font-semibold transition"
                >
                  Persp/Ortho
                </button>
              </div>
            </div>

            <div className="bg-[#202020] p-2.5 rounded border border-[#1a1a1a] space-y-2 text-[11px]">
              <div className="text-[10px] font-bold text-[#888] uppercase tracking-wider">
                Camera Settings
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#888]">Focal Length:</span>
                <span className="font-mono text-white">50.0 mm</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#888]">Clip Start:</span>
                <span className="font-mono text-white">0.01 m</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#888]">Clip End:</span>
                <span className="font-mono text-white">1000.0 m</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
