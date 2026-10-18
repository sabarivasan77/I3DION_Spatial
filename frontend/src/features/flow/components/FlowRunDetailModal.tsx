import React, { useState } from 'react';
import {
  X,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronRight,
  ChevronDown,
  Copy,
  Check,
  Code2,
  FileText,
  User,
  Zap,
  Loader2,
} from 'lucide-react';

interface StepResult {
  stepIndex: number;
  nodeId: string;
  nodeType: string;
  label?: string;
  status: 'succeeded' | 'failed' | 'skipped' | 'running';
  output?: Record<string, any>;
  durationMs: number;
}

interface RunDetail {
  id: string;
  flow_id: string;
  flow_name?: string;
  flow_version?: number;
  status: 'completed' | 'failed' | 'running' | 'cancelled' | 'pending';
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
  error?: string;
  trigger_payload: Record<string, any>;
  step_results: StepResult[];
  triggered_by_name?: string;
}

interface FlowRunDetailModalProps {
  run: RunDetail | null;
  onClose: () => void;
  onRetry: (runId: string) => void;
}

export const FlowRunDetailModal: React.FC<FlowRunDetailModalProps> = ({
  run,
  onClose,
  onRetry,
}) => {
  const [activeTab, setActiveTab] = useState<'steps' | 'payload'>('steps');
  const [expandedStepIndex, setExpandedStepIndex] = useState<number | null>(0);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  if (!run) return null;

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(JSON.stringify(run.trigger_payload, null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const handleRetryClick = async () => {
    setIsRetrying(true);
    try {
      await onRetry(run.id);
    } finally {
      setIsRetrying(false);
    }
  };

  const isCompleted = run.status === 'completed';
  const isFailed = run.status === 'failed';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isCompleted
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                  : isFailed
                  ? 'bg-rose-50 text-rose-600 border border-rose-200'
                  : 'bg-cyan-50 text-cyan-600 border border-cyan-200'
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 size={22} />
              ) : isFailed ? (
                <AlertTriangle size={22} />
              ) : (
                <Loader2 size={22} className="animate-spin" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">
                  {run.flow_name || 'Workflow Execution'}
                </h3>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    isCompleted
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : isFailed
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                  }`}
                >
                  {run.status}
                </span>
                <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                  v{run.flow_version || 1}.0
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                <span className="font-mono text-slate-400 text-[11px]">ID: {run.id}</span>
                <span>•</span>
                <span className="flex items-center gap-1 font-mono">
                  <Clock size={12} />
                  {run.duration_ms != null ? `${run.duration_ms}ms` : 'In progress'}
                </span>
                <span>•</span>
                <span>{new Date(run.started_at).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* View Tabs */}
        <div className="px-5 border-b border-slate-200 flex items-center gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('steps')}
            className={`py-3 border-b-2 transition ${
              activeTab === 'steps'
                ? 'border-cyan-600 text-cyan-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Execution Steps ({run.step_results?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('payload')}
            className={`py-3 border-b-2 transition ${
              activeTab === 'payload'
                ? 'border-cyan-600 text-cyan-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Trigger Input Payload
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'steps' ? (
            <div className="space-y-3">
              {run.step_results?.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No step results recorded for this run.
                </div>
              ) : (
                run.step_results.map((step, idx) => {
                  const isExpanded = expandedStepIndex === idx;
                  const isStepSuccess = step.status === 'succeeded';
                  const isStepSkipped = step.status === 'skipped';
                  const isStepFailed = step.status === 'failed';

                  return (
                    <div
                      key={step.nodeId + '_' + idx}
                      className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs"
                    >
                      <button
                        onClick={() => setExpandedStepIndex(isExpanded ? null : idx)}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition text-left"
                      >
                        <div className="flex items-center gap-3">
                          {isStepSuccess ? (
                            <CheckCircle2 size={16} className="text-emerald-500" />
                          ) : isStepSkipped ? (
                            <span className="w-4 h-4 rounded-full border border-slate-300 text-slate-400 text-[10px] flex items-center justify-center font-bold">
                              -
                            </span>
                          ) : isStepFailed ? (
                            <AlertTriangle size={16} className="text-rose-500" />
                          ) : (
                            <Loader2 size={16} className="animate-spin text-cyan-600" />
                          )}

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-slate-900">
                                {idx + 1}. {step.label || step.nodeId}
                              </span>
                              <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                {step.nodeType}
                              </span>
                              {isStepSkipped && (
                                <span className="text-[10px] font-medium text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.2 rounded">
                                  Skipped branch
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                            <Clock size={12} />
                            {step.durationMs}ms
                          </span>
                          {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="p-4 border-t border-slate-100 bg-slate-50 text-xs font-mono">
                          <div className="mb-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            Step Output Telemetry:
                          </div>
                          <pre className="p-3 rounded-lg bg-slate-900 text-slate-200 text-xs overflow-x-auto shadow-inner">
                            {JSON.stringify(step.output || {}, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {run.error && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    <AlertTriangle size={15} />
                    <span>Run Error Details:</span>
                  </div>
                  <pre className="font-mono text-xs overflow-x-auto text-rose-700">{run.error}</pre>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Raw JSON Payload
                </span>
                <button
                  onClick={handleCopyPayload}
                  className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1 transition"
                >
                  {copiedPayload ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  <span>{copiedPayload ? 'Copied' : 'Copy Payload'}</span>
                </button>
              </div>

              <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto shadow-inner">
                {JSON.stringify(run.trigger_payload || {}, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Triggered by: <span className="font-medium text-slate-700">{run.triggered_by_name || 'System Event'}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRetryClick}
              disabled={isRetrying}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
            >
              {isRetrying ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
              <span>Re-Run with Same Payload</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
