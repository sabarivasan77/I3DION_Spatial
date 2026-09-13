import React, { useState } from 'react';
import { useLogicCraftStore } from '../store/useLogicCraftStore';
import { logicNodeRegistry } from '../registry/logicNodeRegistry';
import { NodeCategory, LogicNodeDefinition } from '../types/logic';
import {
  Search,
  Zap,
  MousePointerClick,
  Sparkles,
  Box,
  MousePointer,
  MapPin,
  Play,
  CheckCircle2,
  Send,
  ListOrdered,
  Clock,
  GitFork,
  Database,
  HelpCircle,
  Eye,
  Camera,
  Plus,
} from 'lucide-react';

const CATEGORIES: { key: 'all' | NodeCategory; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'triggers', label: 'Triggers' },
  { key: 'logic', label: 'Logic' },
  { key: 'conditions', label: 'Conditions' },
  { key: 'actions', label: 'Actions' },
  { key: '3d', label: '3D' },
];

export const LogicNodeLibrary: React.FC = () => {
  const { addNode, selectedNodeId, getActiveGraph } = useLogicCraftStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | NodeCategory>('all');

  const allNodes = logicNodeRegistry.getAll();
  const activeGraph = getActiveGraph();
  const selectedNode = activeGraph.nodes.find((n) => n.id === selectedNodeId);
  const selectedDef = selectedNode ? logicNodeRegistry.get(selectedNode.type) : null;

  const filteredNodes = allNodes.filter((node) => {
    const matchesCategory =
      activeCategory === 'all' || node.category === activeCategory;
    const matchesSearch =
      node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getNodeIcon = (iconName?: string) => {
    switch (iconName) {
      case 'MousePointerClick': return <MousePointerClick size={16} className="text-amber-400" />;
      case 'Sparkles': return <Sparkles size={16} className="text-blue-400" />;
      case 'Box': return <Box size={16} className="text-indigo-400" />;
      case 'MousePointer': return <MousePointer size={16} className="text-cyan-400" />;
      case 'MapPin': return <MapPin size={16} className="text-sky-400" />;
      case 'Play': return <Play size={16} className="text-emerald-400" />;
      case 'CheckCircle2': return <CheckCircle2 size={16} className="text-emerald-400" />;
      case 'Send': return <Send size={16} className="text-blue-400" />;
      case 'ListOrdered': return <ListOrdered size={16} className="text-violet-400" />;
      case 'Clock': return <Clock size={16} className="text-amber-400" />;
      case 'GitFork': return <GitFork size={16} className="text-orange-400" />;
      case 'Database': return <Database size={16} className="text-purple-400" />;
      case 'HelpCircle': return <HelpCircle size={16} className="text-blue-400" />;
      case 'Eye': return <Eye size={16} className="text-emerald-400" />;
      case 'Camera': return <Camera size={16} className="text-indigo-400" />;
      default: return <Zap size={16} className="text-slate-400" />;
    }
  };

  return (
    <aside className="flex h-full w-80 flex-col border-r border-slate-800 bg-slate-900 text-slate-100">
      {/* Search Header */}
      <div className="border-b border-slate-800 p-4">
        <h2 className="flex items-center gap-2 text-xs font-bold text-white">
          <Zap size={16} className="text-indigo-400" />
          Logic Node Library
        </h2>
        <div className="relative mt-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search nodes (e.g. animation, click)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="no-scrollbar flex gap-1 overflow-x-auto border-b border-slate-800 p-2.5 bg-slate-950/40">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            type="button"
            onClick={() => setActiveCategory(cat.key)}
            className={`whitespace-nowrap rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
              activeCategory === cat.key
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Contextual Suggestions Box */}
      {selectedDef && selectedDef.suggestedNextNodes && selectedDef.suggestedNextNodes.length > 0 && (
        <div className="border-b border-slate-800 bg-indigo-950/30 p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-300">
            <Sparkles size={13} className="text-indigo-400 animate-pulse" />
            <span>Suggested Next Actions for "{selectedDef.name}":</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {selectedDef.suggestedNextNodes.map((nodeType) => {
              const suggestedDef = logicNodeRegistry.get(nodeType);
              if (!suggestedDef) return null;
              return (
                <button
                  key={nodeType}
                  type="button"
                  onClick={() => addNode(nodeType)}
                  className="inline-flex items-center gap-1 rounded bg-indigo-900/60 px-2 py-1 text-[10px] font-semibold text-indigo-200 border border-indigo-700/50 hover:bg-indigo-600 hover:text-white transition-all"
                >
                  <Plus size={10} />
                  {suggestedDef.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Node Cards List */}
      <div className="no-scrollbar flex-1 space-y-2.5 overflow-y-auto p-4">
        {filteredNodes.length > 0 ? (
          filteredNodes.map((node: LogicNodeDefinition) => (
            <div
              key={node.type}
              onClick={() => addNode(node.type)}
              className="group relative flex cursor-pointer items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3 transition-all hover:border-indigo-500/60 hover:bg-slate-800/40 hover:shadow-md"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 shadow-inner">
                {getNodeIcon(node.iconName)}
              </div>
              <div className="flex-1 pr-6">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">
                    {node.name}
                  </h3>
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-mono text-slate-400 capitalize">
                    {node.category}
                  </span>
                </div>
                <p className="mt-0.5 text-[10px] text-slate-400 line-clamp-2 leading-tight">
                  {node.description}
                </p>
              </div>
              <button
                type="button"
                className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-lg bg-slate-800 text-slate-400 opacity-0 group-hover:bg-indigo-600 group-hover:text-white group-hover:opacity-100 transition-all"
                title={`Add ${node.name}`}
              >
                <Plus size={14} />
              </button>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-xs text-slate-500">No matching logic nodes found.</div>
        )}
      </div>
    </aside>
  );
};
