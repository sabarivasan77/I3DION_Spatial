import React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { CircuitChipData, PortType } from './types';
import { Zap, Play, Activity, Box, GitBranch } from 'lucide-react';

const portColors: Record<PortType, string> = {
  exec: 'border-amber-400 bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]',
  data: 'border-cyan-400 bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]',
  vector3: 'border-purple-400 bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]',
  boolean: 'border-emerald-400 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]',
  number: 'border-blue-400 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]',
  string: 'border-rose-400 bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]',
};

const chipIcons: Record<string, any> = {
  event: Zap,
  action: Play,
  transform: Box,
  condition: GitBranch,
  variable: Activity,
};

export const CircuitChipNode: React.FC<NodeProps<CircuitChipData>> = ({ data, selected }) => {
  const IconComponent = chipIcons[data.chipType] || Activity;

  return (
    <div
      className={`relative min-w-[220px] rounded-xl border backdrop-blur-md bg-slate-900/90 text-white shadow-xl transition-all duration-150 ${
        selected
          ? 'border-cyan-400 ring-2 ring-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
          : 'border-slate-700/80 hover:border-slate-600'
      }`}
    >
      {/* Node Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-800 bg-slate-950/60 rounded-t-xl">
        <div
          className={`p-1 rounded-md ${
            data.chipType === 'event'
              ? 'bg-amber-500/20 text-amber-400'
              : data.chipType === 'action'
              ? 'bg-cyan-500/20 text-cyan-400'
              : data.chipType === 'transform'
              ? 'bg-purple-500/20 text-purple-400'
              : 'bg-slate-800 text-slate-300'
          }`}
        >
          <IconComponent className="w-3.5 h-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold tracking-wide text-slate-200 truncate">{data.label}</div>
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">{data.category || data.chipType}</div>
        </div>
      </div>

      {/* Node Body & Ports */}
      <div className="py-2.5 px-3 space-y-2">
        {/* Input Ports */}
        {data.inputs?.map((port) => (
          <div key={port.id} className="relative flex items-center gap-2 py-0.5">
            <Handle
              type="target"
              position={Position.Left}
              id={port.id}
              className={`!w-2.5 !h-2.5 !-left-4 rounded-full border-2 ${portColors[port.type] || portColors.data}`}
            />
            <span className="text-[11px] text-slate-300 font-mono">{port.name}</span>
            <span className="text-[9px] text-slate-500 ml-auto font-mono">{port.type}</span>
          </div>
        ))}

        {/* Output Ports */}
        {data.outputs?.map((port) => (
          <div key={port.id} className="relative flex items-center justify-end gap-2 py-0.5 text-right">
            <span className="text-[9px] text-slate-500 font-mono">{port.type}</span>
            <span className="text-[11px] text-slate-200 font-mono font-medium">{port.name}</span>
            <Handle
              type="source"
              position={Position.Right}
              id={port.id}
              className={`!w-2.5 !h-2.5 !-right-4 rounded-full border-2 ${portColors[port.type] || portColors.data}`}
            />
          </div>
        ))}
      </div>

      {/* Node Footer Indicator */}
      <div className="px-3 py-1 bg-slate-950/40 border-t border-slate-800/60 rounded-b-xl flex items-center justify-between text-[10px] text-slate-500 font-mono">
        <span>CIRCUIT CHIP</span>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
      </div>
    </div>
  );
};
