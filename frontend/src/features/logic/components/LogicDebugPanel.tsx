import React, { useState } from 'react';
import { useRuntimeStore } from '../runtime/runtimeContext';
import { useLogicCraftStore } from '../store/useLogicCraftStore';
import { runtimeEngine } from '../runtime/runtimeEngine';
import {
  Terminal,
  Play,
  Square,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Trash2,
} from 'lucide-react';

export const LogicDebugPanel: React.FC = () => {
  const {
    state,
    logs,
    variables,
    activeNodeId,
    transientWidgetOverrides,
    stopExecution,
    resetRuntime,
    clearLogs,
  } = useRuntimeStore();

  const activeGraph = useLogicCraftStore((s) => s.getActiveGraph());
  const [isExpanded, setIsExpanded] = useState(true);
  const [logFilter, setLogFilter] = useState<'ALL' | 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR'>('ALL');

  const filteredLogs = logs.filter((log) => logFilter === 'ALL' || log.status === logFilter);

  const getStatusBadge = () => {
    switch (state) {
      case 'RUNNING':
        return <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-bold text-emerald-400 border border-emerald-500/30 animate-pulse">RUNNING</span>;
      case 'ERROR':
        return <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[11px] font-bold text-red-400 border border-red-500/30">ERROR</span>;
      case 'STOPPED':
        return <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-bold text-amber-400 border border-amber-500/30">STOPPED</span>;
      case 'COMPLETED':
        return <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[11px] font-bold text-blue-400 border border-blue-500/30">COMPLETED</span>;
      default:
        return <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-400 border border-slate-700">IDLE</span>;
    }
  };

  const getLogIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />;
      case 'ERROR':
        return <XCircle size={13} className="text-red-400 shrink-0 mt-0.5" />;
      case 'WARNING':
        return <AlertTriangle size={13} className="text-amber-400 shrink-0 mt-0.5" />;
      default:
        return <Info size={13} className="text-blue-400 shrink-0 mt-0.5" />;
    }
  };

  return (
    <div className="border-t border-slate-800 bg-slate-900 font-mono text-xs select-none">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-950/80 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Terminal size={15} className="text-indigo-400" />
            <span className="font-bold text-slate-200">Runtime Console</span>
          </div>
          {getStatusBadge()}
          {activeNodeId && (
            <span className="text-[11px] text-slate-400">
              Active Node: <span className="text-indigo-300 font-semibold">{activeNodeId}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const triggers = activeGraph.nodes.filter((n) => n.inputPorts.length === 0);
              if (triggers.length > 0) {
                runtimeEngine.triggerManualPreview(triggers[0].id);
              }
            }}
            className="flex items-center gap-1 rounded bg-indigo-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-indigo-500 shadow-sm"
            title="Test Run First Trigger"
          >
            <Play size={12} /> Test Run
          </button>

          <button
            type="button"
            onClick={stopExecution}
            className="flex items-center gap-1 rounded bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-700"
            title="Stop Current Execution"
          >
            <Square size={12} /> Stop
          </button>

          <button
            type="button"
            onClick={resetRuntime}
            className="flex items-center gap-1 rounded bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-700"
            title="Reset Runtime Baseline State"
          >
            <RotateCcw size={12} /> Reset
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            {isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>
      </div>

      {/* Expanded Logs Body */}
      {isExpanded && (
        <div className="flex h-44 overflow-hidden">
          {/* Logs List Column */}
          <div className="flex-1 flex flex-col border-r border-slate-800 bg-slate-950/40">
            {/* Filter Sub-bar */}
            <div className="flex items-center justify-between border-b border-slate-800/80 px-3 py-1 bg-slate-900/50 text-[10px]">
              <div className="flex items-center gap-1">
                {(['ALL', 'INFO', 'SUCCESS', 'WARNING', 'ERROR'] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setLogFilter(filter)}
                    className={`rounded px-2 py-0.5 font-semibold transition-all ${
                      logFilter === filter
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={clearLogs}
                className="text-slate-500 hover:text-slate-300 p-0.5"
                title="Clear Logs"
              >
                <Trash2 size={12} />
              </button>
            </div>

            {/* Scrollable Logs */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-1">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-2 rounded px-2 py-1 bg-slate-900/40 hover:bg-slate-800/60 transition-colors border border-slate-800/40 text-[11px]"
                  >
                    {getLogIcon(log.status)}
                    <span className="text-slate-500 shrink-0 text-[10px]">{log.timestamp}</span>
                    {log.nodeName && (
                      <span className="font-bold text-indigo-300 shrink-0">[{log.nodeName}]:</span>
                    )}
                    <span
                      className={`break-all ${
                        log.status === 'ERROR'
                          ? 'text-red-300 font-semibold'
                          : log.status === 'SUCCESS'
                          ? 'text-emerald-300'
                          : log.status === 'WARNING'
                          ? 'text-amber-300'
                          : 'text-slate-300'
                      }`}
                    >
                      {log.message}
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex h-full items-center justify-center text-[11px] text-slate-600">
                  No execution log events recorded.
                </div>
              )}
            </div>
          </div>

          {/* Runtime State & Variables Sidebar */}
          <div className="w-72 bg-slate-900/80 p-3 overflow-y-auto no-scrollbar space-y-3">
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Runtime Variables ({Object.keys(variables).length})
              </h4>
              {Object.keys(variables).length > 0 ? (
                <div className="space-y-1">
                  {Object.entries(variables).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between rounded bg-slate-950 px-2 py-1 text-[11px]">
                      <span className="text-indigo-400 font-medium">{k}</span>
                      <span className="text-slate-300 truncate max-w-[120px]">{JSON.stringify(v)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-slate-600">No runtime variables defined.</p>
              )}
            </div>

            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Transient Overrides ({Object.keys(transientWidgetOverrides).length})
              </h4>
              {Object.keys(transientWidgetOverrides).length > 0 ? (
                <div className="space-y-1">
                  {Object.entries(transientWidgetOverrides).map(([widgetId, ov]) => (
                    <div key={widgetId} className="rounded bg-slate-950 p-1.5 text-[10px] border border-slate-800">
                      <span className="font-bold text-slate-300">{widgetId}</span>
                      {ov.hidden !== undefined && (
                        <div className="text-slate-400">hidden: {String(ov.hidden)}</div>
                      )}
                      {ov.text !== undefined && (
                        <div className="text-indigo-300 truncate">text: "{ov.text}"</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-slate-600">No active widget property overrides.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
