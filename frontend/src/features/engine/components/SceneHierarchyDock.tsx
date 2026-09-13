import React, { useState } from 'react';
import { useEngineStore } from '../store/useEngineStore';
import { SceneNode } from '../types/engineTypes';
import {
  Layers,
  Search,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Lock,
  Box,
  Camera,
  Sun,
  Grid,
  MoreHorizontal
} from 'lucide-react';

export const SceneHierarchyDock: React.FC = () => {
  const { currentProject, selectedNodeId, setSelectedNodeId, toggleNodeVisibility, deleteSceneNode, addSceneNode } = useEngineStore();
  const [search, setSearch] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({ root_compressor: true });

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getNodeIcon = (type: SceneNode['type']) => {
    switch (type) {
      case 'camera':
        return <Camera size={14} className="text-amber-500" />;
      case 'light':
        return <Sun size={14} className="text-yellow-500" />;
      case 'group':
        return <Layers size={14} className="text-sky-500" />;
      default:
        return <Box size={14} className="text-[#E94B4B]" />;
    }
  };

  const handleAddMesh = () => {
    const newId = `node_${Date.now()}`;
    addSceneNode({
      id: newId,
      name: `Part_${currentProject.sceneGraph.length + 1}`,
      type: 'mesh',
      parent: 'root_compressor',
      visible: true,
      transform: { position: { x: 0, y: 1, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }
    });
  };

  const filteredNodes = currentProject.sceneGraph.filter((n) => n.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex-1 flex flex-col h-full bg-white select-none text-xs">
      {/* Search Header */}
      <div className="p-3 border-b border-slate-200 flex items-center justify-between gap-2">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search objects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#E94B4B]"
          />
        </div>
        <button
          onClick={handleAddMesh}
          title="Add 3D Part"
          className="p-1.5 rounded-lg bg-rose-50 text-[#E94B4B] hover:bg-[#E94B4B] hover:text-white transition font-bold"
        >
          <Plus size={15} />
        </button>
      </div>

      {/* Tree View */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {filteredNodes.map((node) => {
          const isSelected = selectedNodeId === node.id;
          const isGroup = node.type === 'group';
          const isExpanded = expandedNodes[node.id];

          return (
            <div
              key={node.id}
              onClick={() => setSelectedNodeId(node.id)}
              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition ${
                isSelected
                  ? 'bg-rose-50 text-[#E94B4B] font-bold border border-[#E94B4B]/30'
                  : 'hover:bg-slate-50 text-slate-700'
              }`}
              style={{ paddingLeft: node.parent ? '1.5rem' : '0.625rem' }}
            >
              <div className="flex items-center gap-2 truncate">
                {isGroup && (
                  <button onClick={(e) => toggleExpand(node.id, e)} className="text-slate-400 hover:text-slate-700">
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                )}
                {getNodeIcon(node.type)}
                <span className="truncate">{node.name}</span>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleNodeVisibility(node.id);
                  }}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded"
                >
                  {node.visible ? <Eye size={13} className="text-slate-500" /> : <EyeOff size={13} className="text-rose-400" />}
                </button>
                {node.id !== 'root_compressor' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSceneNode(node.id);
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
