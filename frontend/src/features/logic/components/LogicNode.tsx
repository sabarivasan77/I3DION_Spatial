import React from 'react';
import { LogicGraphNode, LogicPortDef, PortDataType } from '../types/logic';
import { logicNodeRegistry } from '../registry/logicNodeRegistry';
import { useRuntimeStore } from '../runtime/runtimeContext';
import {
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
  Equal,
  Slash,
  ChevronRight,
  ChevronLeft,
  Check,
  X,
  Eye,
  EyeOff,
  RefreshCw,
  Type,
  Square,
  Pause,
  Camera,
  Maximize2,
  ExternalLink,
} from 'lucide-react';

export interface LogicNodeProps {
  node: LogicGraphNode;
  isSelected: boolean;
  onSelect: (id: string, e: React.MouseEvent) => void;
  onMouseDownNode: (id: string, e: React.MouseEvent) => void;
  onStartConnection: (nodeId: string, portId: string, isOutput: boolean, e: React.MouseEvent) => void;
  onEndConnection: (nodeId: string, portId: string, isOutput: boolean, e: React.MouseEvent) => void;
}

export const LogicNode: React.FC<LogicNodeProps> = ({
  node,
  isSelected,
  onSelect,
  onMouseDownNode,
  onStartConnection,
  onEndConnection,
}) => {
  const def = logicNodeRegistry.get(node.type);
  const activeNodeId = useRuntimeStore((s) => s.activeNodeId);
  const completedNodeIds = useRuntimeStore((s) => s.completedNodeIds);
  const runtimeState = useRuntimeStore((s) => s.state);

  const isActiveNode = activeNodeId === node.id;
  const isCompletedNode = completedNodeIds.includes(node.id);
  const isErrorState = runtimeState === 'ERROR' && isActiveNode;

  const getNodeBorderClass = () => {
    if (isErrorState) {
      return 'border-red-500 ring-4 ring-red-500/50 shadow-red-500/20 animate-pulse';
    }
    if (isActiveNode) {
      return 'border-emerald-400 ring-4 ring-emerald-500/60 shadow-emerald-500/30 animate-pulse';
    }
    if (isCompletedNode) {
      return 'border-indigo-400 ring-2 ring-indigo-500/40 shadow-indigo-500/10';
    }
    if (isSelected) {
      return 'border-blue-500 ring-2 ring-blue-500/50 shadow-blue-500/10';
    }
    return 'border-slate-800 hover:border-slate-700';
  };

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
      case 'Equal': return <Equal size={16} className="text-slate-300" />;
      case 'Slash': return <Slash size={16} className="text-slate-300" />;
      case 'ChevronRight': return <ChevronRight size={16} className="text-slate-300" />;
      case 'ChevronLeft': return <ChevronLeft size={16} className="text-slate-300" />;
      case 'Check': return <Check size={16} className="text-emerald-400" />;
      case 'X': return <X size={16} className="text-red-400" />;
      case 'Eye': return <Eye size={16} className="text-emerald-400" />;
      case 'EyeOff': return <EyeOff size={16} className="text-rose-400" />;
      case 'RefreshCw': return <RefreshCw size={16} className="text-blue-400" />;
      case 'Type': return <Type size={16} className="text-slate-300" />;
      case 'Square': return <Square size={16} className="text-red-400" />;
      case 'Pause': return <Pause size={16} className="text-amber-400" />;
      case 'Camera': return <Camera size={16} className="text-indigo-400" />;
      case 'Maximize2': return <Maximize2 size={16} className="text-cyan-400" />;
      case 'ExternalLink': return <ExternalLink size={16} className="text-blue-400" />;
      default: return <Box size={16} className="text-slate-400" />;
    }
  };

  const getPortColor = (type: PortDataType) => {
    switch (type) {
      case 'FLOW': return 'bg-amber-400 border-amber-500';
      case 'EVENT': return 'bg-blue-400 border-blue-500';
      case 'BOOLEAN': return 'bg-emerald-400 border-emerald-500';
      case 'WIDGET': return 'bg-indigo-400 border-indigo-500';
      case 'OBJECT': return 'bg-cyan-400 border-cyan-500';
      case 'NUMBER': return 'bg-purple-400 border-purple-500';
      case 'STRING': return 'bg-sky-400 border-sky-500';
      default: return 'bg-slate-400 border-slate-500';
    }
  };

  const getCategoryBadgeColor = (category?: string) => {
    switch (category) {
      case 'triggers': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'logic': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'conditions': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'actions': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case '3d': return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      default: return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  return (
    <div
      style={{
        transform: `translate(${node.position.x}px, ${node.position.y}px)`,
      }}
      onMouseDown={(e) => onMouseDownNode(node.id, e)}
      onClick={(e) => onSelect(node.id, e)}
      className={`absolute z-10 w-72 rounded-2xl border bg-slate-900 shadow-2xl transition-all select-none cursor-grab active:cursor-grabbing ${getNodeBorderClass()}`}
    >
      {/* Node Header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 bg-slate-950/60 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 border border-slate-800">
            {getNodeIcon(def?.iconName)}
          </div>
          <div>
            <h3 className="text-xs font-bold text-white leading-none">{node.name}</h3>
            <span className="text-[9px] font-mono text-slate-500">{node.type}</span>
          </div>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold border uppercase tracking-wider ${getCategoryBadgeColor(def?.category)}`}>
          {def?.category || 'node'}
        </span>
      </div>

      {/* Node Description & Target Property Summary */}
      <div className="px-4 py-2.5 bg-slate-900/80">
        <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
          {def?.description}
        </p>
        {node.properties?.targetWidgetId && (
          <div className="mt-2 rounded bg-slate-950 px-2 py-1 text-[10px] font-mono text-blue-400 truncate border border-slate-800">
            Target: {node.properties.targetWidgetId}
          </div>
        )}
      </div>

      {/* Ports Section */}
      <div className="flex justify-between border-t border-slate-800/60 p-3 bg-slate-950/40 rounded-b-2xl">
        {/* Input Ports Left */}
        <div className="flex flex-col gap-2.5">
          {node.inputPorts?.map((port: LogicPortDef) => (
            <div key={port.id} className="relative flex items-center gap-2">
              <button
                type="button"
                data-port-id={port.id}
                onMouseDown={(e) => onStartConnection(node.id, port.id, false, e)}
                onMouseUp={(e) => onEndConnection(node.id, port.id, false, e)}
                className={`h-3.5 w-3.5 rounded-full border-2 transition-transform hover:scale-125 ${getPortColor(port.type)}`}
                title={`Input Port: ${port.label} (${port.type})`}
              />
              <span className="text-[10px] font-semibold text-slate-300">{port.label}</span>
            </div>
          ))}
        </div>

        {/* Output Ports Right */}
        <div className="flex flex-col gap-2.5 items-end ml-auto">
          {node.outputPorts?.map((port: LogicPortDef) => (
            <div key={port.id} className="relative flex items-center gap-2">
              <span className="text-[10px] font-semibold text-slate-300">{port.label}</span>
              <button
                type="button"
                data-port-id={port.id}
                onMouseDown={(e) => onStartConnection(node.id, port.id, true, e)}
                onMouseUp={(e) => onEndConnection(node.id, port.id, true, e)}
                className={`h-3.5 w-3.5 rounded-full border-2 transition-transform hover:scale-125 ${getPortColor(port.type)}`}
                title={`Output Port: ${port.label} (${port.type})`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
