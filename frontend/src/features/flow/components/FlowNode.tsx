import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import {
  GitBranch,
  Clock,
  StopCircle,
  Layers,
  Sliders,
  Mail,
  Bell,
  Users,
  Send,
  Zap,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  LucideIcon,
} from 'lucide-react';
import type { FlowNodeData } from '../types/flow';

const ICON_MAP: Record<string, LucideIcon> = {
  condition: GitBranch,
  delay: Clock,
  terminate: StopCircle,
  compose: Layers,
  set_variable: Sliders,
  send_email: Mail,
  send_notification: Bell,
  auto_assign_lead: Users,
  webhook_dispatch: Send,
  trigger: Zap,
};

const CATEGORY_STYLES: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  trigger: {
    bg: 'bg-cyan-50/90',
    border: 'border-cyan-400',
    text: 'text-cyan-700',
    badge: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  },
  logic: {
    bg: 'bg-purple-50/90',
    border: 'border-purple-400',
    text: 'text-purple-700',
    badge: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  data: {
    bg: 'bg-blue-50/90',
    border: 'border-blue-400',
    text: 'text-blue-700',
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  communication: {
    bg: 'bg-emerald-50/90',
    border: 'border-emerald-400',
    text: 'text-emerald-700',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  ecosystem: {
    bg: 'bg-amber-50/90',
    border: 'border-amber-400',
    text: 'text-amber-700',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  integration: {
    bg: 'bg-indigo-50/90',
    border: 'border-indigo-400',
    text: 'text-indigo-700',
    badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  },
};

export const FlowNode = memo(({ data, selected }: NodeProps<any>) => {
  const nodeData = data as FlowNodeData;
  const category = nodeData.category || 'logic';
  const style = CATEGORY_STYLES[category] || CATEGORY_STYLES.logic;
  const Icon = ICON_MAP[nodeData.type] || Zap;
  const isCondition = nodeData.type === 'condition';
  const isTerminate = nodeData.type === 'terminate';
  const isTrigger = category === 'trigger';

  const executionStatus = nodeData.executionStatus || 'idle';
  const durationMs = nodeData.durationMs;

  return (
    <div
      className={`min-w-[240px] max-w-[280px] rounded-2xl border-2 bg-white shadow-md transition-all duration-150 ${
        selected ? 'border-cyan-500 ring-4 ring-cyan-500/20 shadow-xl' : 'border-slate-200 hover:border-slate-300'
      } ${
        executionStatus === 'running'
          ? 'ring-4 ring-cyan-400/50 animate-pulse border-cyan-500'
          : executionStatus === 'succeeded'
          ? 'border-emerald-500 bg-emerald-50/10'
          : executionStatus === 'failed'
          ? 'border-rose-500 bg-rose-50/10'
          : ''
      }`}
    >
      {/* Target Handle (Input) — unless it's a root trigger */}
      {!isTrigger && (
        <Handle
          type="target"
          position={Position.Top}
          id="in"
          className="h-3 w-3 rounded-full border-2 border-white bg-slate-400 transition hover:scale-125 hover:bg-cyan-500"
        />
      )}

      {/* Node Header */}
      <div className={`flex items-center justify-between border-b px-3.5 py-2.5 rounded-t-2xl ${style.bg} ${style.border}`}>
        <div className="flex items-center gap-2 min-w-0">
          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white shadow-xs ${style.text}`}>
            <Icon size={16} />
          </div>
          <span className="text-xs font-bold text-slate-800 truncate">{nodeData.label}</span>
        </div>

        {/* Execution status indicator */}
        <div className="shrink-0 flex items-center gap-1.5 ml-2">
          {executionStatus === 'running' && (
            <RefreshCw size={14} className="text-cyan-600 animate-spin" />
          )}
          {executionStatus === 'succeeded' && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-100/90 px-1.5 py-0.5 rounded-full border border-emerald-300">
              <CheckCircle2 size={11} />
              {durationMs !== undefined ? `${durationMs}ms` : 'Done'}
            </span>
          )}
          {executionStatus === 'failed' && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded-full border border-rose-300">
              <AlertCircle size={11} />
              Failed
            </span>
          )}
          {executionStatus === 'idle' && (
            <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${style.badge}`}>
              {nodeData.type}
            </span>
          )}
        </div>
      </div>

      {/* Node Body / Parameters Preview */}
      <div className="p-3 text-slate-600 text-[11px] space-y-1 font-mono">
        {isCondition && (
          <div className="bg-slate-50 p-1.5 rounded border border-slate-100 text-slate-700">
            <span className="text-purple-600 font-bold">IF</span>{' '}
            <span className="text-slate-900 font-semibold">{String(nodeData.params?.field || 'field')}</span>{' '}
            <span className="text-slate-500">{String(nodeData.params?.operator || 'equals')}</span>{' '}
            <span className="text-slate-900 font-bold">{String(nodeData.params?.value ?? 'value')}</span>
          </div>
        )}

        {nodeData.type === 'send_email' && (
          <div className="truncate text-slate-600">
            <span className="font-semibold text-slate-500">To:</span> {String(nodeData.params?.recipientEmail || 'client@email.com')}
          </div>
        )}

        {nodeData.type === 'send_notification' && (
          <div className="truncate text-slate-600">
            <span className="font-semibold text-slate-500">Title:</span> {String(nodeData.params?.title || 'Notification')}
          </div>
        )}

        {nodeData.type === 'auto_assign_lead' && (
          <div className="truncate text-slate-600">
            <span className="font-semibold text-slate-500">Status:</span> {String(nodeData.params?.status || 'QUALIFIED')}
          </div>
        )}

        {nodeData.type === 'delay' && (
          <div className="truncate text-slate-600">
            <span className="font-semibold text-slate-500">Wait:</span> {String(nodeData.params?.durationSeconds || 5)}s
          </div>
        )}

        {nodeData.outputSummary && (
          <div className="mt-1 border-t border-slate-100 pt-1 text-[10px] text-emerald-700 font-sans">
            ✓ {nodeData.outputSummary}
          </div>
        )}
      </div>

      {/* Output Handles */}
      {isCondition ? (
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-4 py-1.5 rounded-b-2xl relative text-[10px] font-bold">
          <div className="flex items-center gap-1 text-emerald-600">
            <span>True</span>
            <Handle
              type="source"
              position={Position.Bottom}
              id="true"
              style={{ left: '30%' }}
              className="h-3 w-3 rounded-full border-2 border-white bg-emerald-500 transition hover:scale-125"
            />
          </div>
          <div className="flex items-center gap-1 text-rose-600">
            <span>False</span>
            <Handle
              type="source"
              position={Position.Bottom}
              id="false"
              style={{ left: '70%' }}
              className="h-3 w-3 rounded-full border-2 border-white bg-rose-500 transition hover:scale-125"
            />
          </div>
        </div>
      ) : !isTerminate ? (
        <Handle
          type="source"
          position={Position.Bottom}
          id="out"
          className="h-3 w-3 rounded-full border-2 border-white bg-slate-400 transition hover:scale-125 hover:bg-cyan-500"
        />
      ) : null}
    </div>
  );
});

FlowNode.displayName = 'FlowNode';
