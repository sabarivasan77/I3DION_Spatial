import React, { useState } from 'react';
import { useLogicCraftStore } from '../store/useLogicCraftStore';
import { logicNodeRegistry } from '../registry/logicNodeRegistry';
import { LogicNodeDefinition } from '../types/logic';
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
  ChevronDown,
  ChevronRight,
  Sliders,
  Layers,
} from 'lucide-react';

interface CategoryGroup {
  id: string;
  name: string;
  count: number;
}

export const LogicNodeLibrary: React.FC = () => {
  const { addNode, selectedNodeId, getActiveGraph } = useLogicCraftStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    Events: true,
    Actions: true,
    Logic: true,
    Data: false,
    UI: false,
    Advanced: false,
  });

  const allNodes = logicNodeRegistry.getAll();
  const activeGraph = getActiveGraph();
  const selectedNode = activeGraph.nodes.find((n) => n.id === selectedNodeId);
  const selectedDef = selectedNode ? logicNodeRegistry.get(selectedNode.type) : null;

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const getNodeIcon = (iconName?: string) => {
    switch (iconName) {
      case 'MousePointerClick': return <MousePointerClick size={14} className="text-red-500" />;
      case 'Sparkles': return <Sparkles size={14} className="text-blue-500" />;
      case 'Box': return <Box size={14} className="text-indigo-500" />;
      case 'MousePointer': return <MousePointer size={14} className="text-cyan-500" />;
      case 'MapPin': return <MapPin size={14} className="text-sky-500" />;
      case 'Play': return <Play size={14} className="text-emerald-500" />;
      case 'CheckCircle2': return <CheckCircle2 size={14} className="text-emerald-500" />;
      case 'Send': return <Send size={14} className="text-blue-500" />;
      case 'ListOrdered': return <ListOrdered size={14} className="text-violet-500" />;
      case 'Clock': return <Clock size={14} className="text-amber-500" />;
      case 'GitFork': return <GitFork size={14} className="text-orange-500" />;
      case 'Database': return <Database size={14} className="text-purple-500" />;
      case 'HelpCircle': return <HelpCircle size={14} className="text-blue-500" />;
      case 'Eye': return <Eye size={14} className="text-emerald-500" />;
      case 'Camera': return <Camera size={14} className="text-indigo-500" />;
      default: return <Zap size={14} className="text-slate-500" />;
    }
  };

  // Group nodes into Events, Actions, Logic, Data, UI, Advanced
  const getCategoryName = (cat: string) => {
    switch (cat) {
      case 'triggers': return 'Events';
      case 'actions':
      case '3d': return 'Actions';
      case 'conditions':
      case 'logic': return 'Logic';
      default: return 'Advanced';
    }
  };

  const nodeGroups: Record<string, LogicNodeDefinition[]> = {
    Events: [],
    Actions: [],
    Logic: [],
    Data: [
      { type: 'get_var', name: 'Get Variable', description: 'Read state variable', category: 'logic', iconName: 'Database', inputPorts: [], outputPorts: [], defaultProperties: {} },
      { type: 'set_var', name: 'Set Variable', description: 'Modify state variable', category: 'logic', iconName: 'Database', inputPorts: [], outputPorts: [], defaultProperties: {} },
    ],
    UI: [
      { type: 'show_panel', name: 'Show UI Panel', description: 'Display HUD panel', category: 'actions', iconName: 'Eye', inputPorts: [], outputPorts: [], defaultProperties: {} },
      { type: 'show_tooltip', name: 'Show Tooltip', description: 'Show text tooltip', category: 'actions', iconName: 'HelpCircle', inputPorts: [], outputPorts: [], defaultProperties: {} },
    ],
    Advanced: [
      { type: 'call_function', name: 'Call Function', description: 'Execute iScript routine', category: 'logic', iconName: 'Sparkles', inputPorts: [], outputPorts: [], defaultProperties: {} },
    ],
  };

  allNodes.forEach((node) => {
    const group = getCategoryName(node.category);
    if (!nodeGroups[group]) nodeGroups[group] = [];
    nodeGroups[group].push(node);
  });

  return (
    <aside className="flex h-full w-64 flex-col border-r border-slate-200 bg-white text-slate-800 shrink-0">
      {/* Search Header */}
      <div className="border-b border-slate-200 p-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Suggested Actions if Node Selected */}
      {selectedDef && selectedDef.suggestedNextNodes && selectedDef.suggestedNextNodes.length > 0 && (
        <div className="border-b border-slate-200 bg-blue-50/60 p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-700">
            <Sparkles size={12} className="text-blue-500 animate-pulse" />
            <span>Suggested for "{selectedDef.name}":</span>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {selectedDef.suggestedNextNodes.map((nodeType) => {
              const suggestedDef = logicNodeRegistry.get(nodeType);
              if (!suggestedDef) return null;
              return (
                <button
                  key={nodeType}
                  type="button"
                  onClick={() => addNode(nodeType)}
                  className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 text-[10px] font-medium text-blue-700 border border-blue-200 shadow-2xs hover:bg-blue-600 hover:text-white transition-all"
                >
                  <Plus size={10} />
                  {suggestedDef.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Categorized Accordion Tree */}
      <div className="no-scrollbar flex-1 space-y-1 overflow-y-auto p-2">
        {Object.entries(nodeGroups).map(([categoryName, nodes]) => {
          const filtered = nodes.filter(
            (n) =>
              n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              n.description.toLowerCase().includes(searchQuery.toLowerCase())
          );
          if (searchQuery && filtered.length === 0) return null;

          const isExpanded = expandedCategories[categoryName];

          return (
            <div key={categoryName} className="rounded-lg border border-transparent">
              {/* Category Accordion Header */}
              <button
                type="button"
                onClick={() => toggleCategory(categoryName)}
                className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  {isExpanded ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
                  <span>{categoryName}</span>
                </div>
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                  {filtered.length}
                </span>
              </button>

              {/* Category Items */}
              {isExpanded && (
                <div className="mt-1 space-y-1 pl-3">
                  {filtered.map((node) => (
                    <div
                      key={node.type}
                      onClick={() => addNode(node.type)}
                      className="group flex cursor-pointer items-center justify-between rounded-lg border border-slate-100 bg-slate-50/70 px-2.5 py-1.5 text-xs transition-all hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-2xs"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex h-5 w-5 items-center justify-center rounded bg-white shadow-2xs">
                          {getNodeIcon(node.iconName)}
                        </div>
                        <span className="font-medium text-slate-700 group-hover:text-blue-600">
                          {node.name}
                        </span>
                      </div>
                      <Plus size={13} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
};

