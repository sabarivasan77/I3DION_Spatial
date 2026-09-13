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
      return 'border-emerald-500 ring-4 ring-emerald-500/60 shadow-emerald-500/30 animate-pulse';
    }
    if (isSelected) {
      return 'border-blue-600 ring-2 ring-blue-500/40 shadow-lg';
    }
    return 'border-slate-200 hover:border-slate-300 shadow-md';
  };

  const getHeaderBandStyle = (category?: string, nodeType?: string) => {
    if (category === 'triggers' || nodeType === 'on_click') {
      return 'bg-rose-50 border-rose-200 text-rose-800';
    }
    if (nodeType === 'play_animation') {
      return 'bg-emerald-50 border-emerald-200 text-emerald-800';
    }
    if (nodeType === 'condition' || category === 'conditions') {
      return 'bg-amber-50 border-amber-200 text-amber-800';
    }
    if (nodeType === 'show_tooltip' || nodeType === 'show_panel') {
      return 'bg-purple-50 border-purple-200 text-purple-800';
    }
    if (nodeType === 'set_camera') {
      return 'bg-teal-50 border-teal-200 text-teal-800';
    }
    if (category === 'actions' || category === '3d') {
      return 'bg-blue-50 border-blue-200 text-blue-800';
    }
    return 'bg-slate-50 border-slate-200 text-slate-800';
  };

  const getNodeIcon = (iconName?: string) => {
    switch (iconName) {
      case 'MousePointerClick': return <MousePointerClick size={15} className="text-rose-600" />;
      case 'Sparkles': return <Sparkles size={15} className="text-blue-600" />;
      case 'Box': return <Box size={15} className="text-indigo-600" />;
      case 'MousePointer': return <MousePointer size={15} className="text-cyan-600" />;
      case 'MapPin': return <MapPin size={15} className="text-sky-600" />;
      case 'Play': return <Play size={15} className="text-emerald-600" />;
      case 'CheckCircle2': return <CheckCircle2 size={15} className="text-emerald-600" />;
      case 'Send': return <Send size={15} className="text-blue-600" />;
      case 'ListOrdered': return <ListOrdered size={15} className="text-violet-600" />;
      case 'Clock': return <Clock size={15} className="text-amber-600" />;
      case 'GitFork': return <GitFork size={15} className="text-orange-600" />;
      case 'Database': return <Database size={15} className="text-purple-600" />;
      case 'HelpCircle': return <HelpCircle size={15} className="text-purple-600" />;
      case 'Equal': return <Equal size={15} className="text-slate-600" />;
      case 'Slash': return <Slash size={15} className="text-slate-600" />;
      case 'ChevronRight': return <ChevronRight size={15} className="text-slate-600" />;
      case 'ChevronLeft': return <ChevronLeft size={15} className="text-slate-600" />;
      case 'Check': return <Check size={15} className="text-emerald-600" />;
      case 'X': return <X size={15} className="text-red-600" />;
      case 'Eye': return <Eye size={15} className="text-purple-600" />;
      case 'EyeOff': return <EyeOff size={15} className="text-rose-600" />;
      case 'RefreshCw': return <RefreshCw size={15} className="text-blue-600" />;
      case 'Type': return <Type size={15} className="text-slate-600" />;
      case 'Square': return <Square size={15} className="text-red-600" />;
      case 'Pause': return <Pause size={15} className="text-amber-600" />;
      case 'Camera': return <Camera size={15} className="text-teal-600" />;
      case 'Maximize2': return <Maximize2 size={15} className="text-cyan-600" />;
      case 'ExternalLink': return <ExternalLink size={15} className="text-blue-600" />;
      default: return <Box size={15} className="text-slate-600" />;
    }
  };

  const getPortColor = (type: PortDataType) => {
    switch (type) {
      case 'FLOW': return 'bg-amber-500 border-amber-600';
      case 'EVENT': return 'bg-rose-500 border-rose-600';
      case 'BOOLEAN': return 'bg-emerald-500 border-emerald-600';
      case 'WIDGET': return 'bg-indigo-500 border-indigo-600';
      case 'OBJECT': return 'bg-blue-500 border-blue-600';
      case 'NUMBER': return 'bg-purple-500 border-purple-600';
      case 'STRING': return 'bg-sky-500 border-sky-600';
      default: return 'bg-slate-400 border-slate-500';
    }
  };

  return (
    <div
      style={{
        transform: `translate(${node.position.x}px, ${node.position.y}px)`,
      }}
      onMouseDown={(e) => onMouseDownNode(node.id, e)}
      onClick={(e) => onSelect(node.id, e)}
      className={`absolute z-10 w-72 rounded-xl border bg-white text-slate-800 transition-all select-none cursor-grab active:cursor-grabbing ${getNodeBorderClass()}`}
    >
      {/* Node Header Band */}
      <div className={`flex items-center justify-between border-b px-3.5 py-2.5 rounded-t-xl ${getHeaderBandStyle(def?.category, node.type)}`}>
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white shadow-2xs">
            {getNodeIcon(def?.iconName)}
          </div>
          <div>
            <h3 className="text-xs font-bold leading-tight">{node.name}</h3>
          </div>
        </div>
        <span className="text-[10px] font-medium opacity-75 capitalize">
          {node.type.replace('_', ' ')}
        </span>
      </div>

      {/* Inputs / Fields Body */}
      <div className="p-3 space-y-2 text-xs">
        {node.type === 'on_click' && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-slate-500">Mesh:</span>
            <select className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none">
              <option value="Valve_Handle">Valve_Handle</option>
              <option value="Valve_Base">Valve_Base</option>
            </select>
          </div>
        )}

        {node.type === 'play_animation' && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-slate-500">Target:</span>
              <select className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none">
                <option value="Valve_Handle">Valve_Handle</option>
              </select>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-slate-500">Animation:</span>
              <select className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none">
                <option value="Open">Open</option>
                <option value="Close">Close</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500">Loop:</span>
              <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-0" />
            </div>
          </div>
        )}

        {node.type === 'show_tooltip' && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-slate-500">Text:</span>
              <input defaultValue="Valve Opened" className="w-28 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-800 focus:bg-white focus:outline-none" />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-slate-500">Duration (s):</span>
              <input type="number" defaultValue={3} className="w-16 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-800 focus:bg-white focus:outline-none" />
            </div>
          </div>
        )}

        {node.type === 'condition' && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-slate-500">Variable:</span>
              <input defaultValue="pressure" className="w-28 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-800 focus:bg-white focus:outline-none" />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-slate-500">Operator:</span>
              <select className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-800 focus:bg-white focus:outline-none">
                <option value=">">&gt;</option>
                <option value="<">&lt;</option>
                <option value="==">==</option>
              </select>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-slate-500">Value:</span>
              <input type="number" defaultValue={50} className="w-16 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-800 focus:bg-white focus:outline-none" />
            </div>
          </div>
        )}

        {node.type === 'set_camera' && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-slate-500">Preset:</span>
              <select className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-800 focus:bg-white focus:outline-none">
                <option value="Overview">Overview</option>
                <option value="Focus_Valve">Focus Valve</option>
              </select>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-slate-500">Duration (s):</span>
              <input type="number" defaultValue={1.5} className="w-16 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-800 focus:bg-white focus:outline-none" />
            </div>
          </div>
        )}

        {!['on_click', 'play_animation', 'show_tooltip', 'condition', 'set_camera'].includes(node.type) && (
          <p className="text-[11px] text-slate-500 leading-tight">{def?.description}</p>
        )}
      </div>

      {/* Ports Section */}
      <div className="flex justify-between border-t border-slate-100 p-2.5 bg-slate-50/60 rounded-b-xl">
        {/* Input Ports Left */}
        <div className="flex flex-col gap-2">
          {node.inputPorts?.map((port: LogicPortDef) => (
            <div key={port.id} className="relative flex items-center gap-1.5">
              <button
                type="button"
                data-port-id={port.id}
                onMouseDown={(e) => onStartConnection(node.id, port.id, false, e)}
                onMouseUp={(e) => onEndConnection(node.id, port.id, false, e)}
                className={`h-3 w-3 rounded-full border transition-transform hover:scale-125 ${getPortColor(port.type)}`}
                title={`Input Port: ${port.label}`}
              />
              <span className="text-[10px] font-bold text-slate-600">{port.label}</span>
            </div>
          ))}
        </div>

        {/* Output Ports Right */}
        <div className="flex flex-col gap-2 items-end ml-auto">
          {node.outputPorts?.map((port: LogicPortDef) => (
            <div key={port.id} className="relative flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-600">{port.label}</span>
              <button
                type="button"
                data-port-id={port.id}
                onMouseDown={(e) => onStartConnection(node.id, port.id, true, e)}
                onMouseUp={(e) => onEndConnection(node.id, port.id, true, e)}
                className={`h-3 w-3 rounded-full border transition-transform hover:scale-125 ${getPortColor(port.type)}`}
                title={`Output Port: ${port.label}`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

