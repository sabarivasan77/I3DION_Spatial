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
  Code2,
  Terminal,
  Loader2,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useFlowDesignerStore } from '../store/useFlowDesignerStore';

const SAMPLE_PAYLOADS = [
  {
    name: '3D RFQ Lead',
    payload: {
      eventName: 'rfq_submitted',
      productName: 'Executive Ergonomic Chair Pro',
      dwellDurationSeconds: 125,
      contact: {
        name: 'Sarah Chen',
        email: 'sarah.chen@acmedesign.com',
        company: 'Acme Architecture',
      },
      viewerSessionId: 'sess_99341',
    },
  },
  {
    name: 'Hotspot Engagement',
    payload: {
      eventName: 'hotspot_clicked',
      hotspotId: 'hs_lumbar_adjustment',
      modelId: 'mod_chair_v4',
      dwellDurationSeconds: 45,
      viewerSessionId: 'sess_11204',
    },
  },
  {
    name: 'Inbound Webhook',
    payload: {
      source: 'hubspot',
      dealStage: 'proposal_requested',
      amount: 15000,
      customerEmail: 'procurement@megacorp.com',
    },
  },
];

export const FlowTestConsole: React.FC = () => {
  const {
    isTestConsoleOpen,
    isTesting,
    latestTestRun,
    executeTestRun,
    resetExecutionState,
    setTestConsoleOpen,
  } = useFlowDesignerStore();

  const [payloadText, setPayloadText] = useState(
    JSON.stringify(SAMPLE_PAYLOADS[0].payload, null, 2)
  );
  const [expandedStepIndex, setExpandedStepIndex] = useState<number | null>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);

  if (!isTestConsoleOpen) return null;

  const handleRun = () => {
    try {
      setJsonError(null);
      const parsed = JSON.parse(payloadText);
      executeTestRun(parsed);
    } catch (err: any) {
      setJsonError('Invalid JSON payload: ' + err.message);
    }
  };

  const handleSelectSample = (sample: typeof SAMPLE_PAYLOADS[0]) => {
    setPayloadText(JSON.stringify(sample.payload, null, 2));
    setJsonError(null);
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 h-80 bg-slate-900 border-t border-slate-800 text-slate-100 flex flex-col z-30 shadow-2xl animate-in slide-in-from-bottom-2">
      {/* Top Header */}
      <div className="h-10 px-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-cyan-400" />
          <span className="font-semibold text-slate-200">Diagnostics & Test Execution Console</span>

          {latestTestRun && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                latestTestRun.status === 'completed'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : 'bg-rose-950 text-rose-400 border border-rose-800'
              }`}
            >
              {latestTestRun.status} • {latestTestRun.totalDurationMs}ms
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetExecutionState}
            className="p-1 text-slate-400 hover:text-slate-200 transition"
            title="Reset Execution State"
          >
            <RotateCcw size={14} />
          </button>
          <button
            onClick={() => setTestConsoleOpen(false)}
            className="p-1 text-slate-400 hover:text-slate-200 transition"
            title="Close Console"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Main Body: 2 Columns */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Input Payload Editor */}
        <div className="w-1/3 border-r border-slate-800 flex flex-col bg-slate-950/40">
          <div className="p-2 border-b border-slate-800/80 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Trigger Input Payload (JSON)
            </span>
            <div className="flex items-center gap-1">
              {SAMPLE_PAYLOADS.map((s) => (
                <button
                  key={s.name}
                  onClick={() => handleSelectSample(s)}
                  className="px-2 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 p-2 relative font-mono text-xs">
            <textarea
              value={payloadText}
              onChange={(e) => setPayloadText(e.target.value)}
              className="w-full h-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono text-xs resize-none"
              spellCheck={false}
            />
            {jsonError && (
              <div className="absolute bottom-3 left-3 right-3 p-1.5 rounded bg-rose-950 border border-rose-800 text-[11px] text-rose-300">
                {jsonError}
              </div>
            )}
          </div>

          <div className="p-2 border-t border-slate-800/80 flex justify-end">
            <button
              onClick={handleRun}
              disabled={isTesting}
              className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white font-semibold text-xs flex items-center gap-1.5 transition shadow-xs"
            >
              {isTesting ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} className="fill-white" />}
              <span>{isTesting ? 'Simulating Run...' : 'Run Test'}</span>
            </button>
          </div>
        </div>

        {/* Right: Step Telemetry & Timeline */}
        <div className="flex-1 flex flex-col bg-slate-900 overflow-y-auto">
          <div className="p-2 border-b border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
            <span>Execution Timeline</span>
            {latestTestRun && (
              <span>
                {latestTestRun.steps.length} Steps Executed • Total: {latestTestRun.totalDurationMs}ms
              </span>
            )}
          </div>

          <div className="flex-1 p-3 space-y-2 overflow-y-auto">
            {!latestTestRun && !isTesting && (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs gap-2">
                <Play size={24} className="text-slate-600" />
                <p>Click "Run Test" to simulate and monitor step execution in real time.</p>
              </div>
            )}

            {isTesting && (
              <div className="p-4 flex items-center justify-center gap-3 text-cyan-400 text-xs">
                <Loader2 size={18} className="animate-spin" />
                <span>Executing workflow DAG steps with live telemetry...</span>
              </div>
            )}

            {latestTestRun && (
              <div className="space-y-2">
                {latestTestRun.steps.map((step, idx) => {
                  const isExpanded = expandedStepIndex === idx;
                  const isSuccess = step.status === 'succeeded';

                  return (
                    <div
                      key={step.nodeId + '_' + idx}
                      className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/40"
                    >
                      <button
                        onClick={() => setExpandedStepIndex(isExpanded ? null : idx)}
                        className="w-full px-3 py-2 flex items-center justify-between hover:bg-slate-800/50 transition text-left"
                      >
                        <div className="flex items-center gap-2.5">
                          {isSuccess ? (
                            <CheckCircle2 size={15} className="text-emerald-400" />
                          ) : (
                            <AlertTriangle size={15} className="text-rose-400" />
                          )}

                          <span className="font-mono text-xs font-semibold text-slate-200">
                            {idx + 1}. {step.output?.step || step.nodeId}
                          </span>

                          <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                            {step.nodeType}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                            <Clock size={12} />
                            {step.durationMs}ms
                          </span>
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="p-3 border-t border-slate-800/80 bg-slate-950/70 font-mono text-xs">
                          <div className="mb-2 text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                            Step Output Telemetry:
                          </div>
                          <pre className="text-slate-300 text-[11px] overflow-x-auto p-2 bg-slate-900 rounded border border-slate-800">
                            {JSON.stringify(step.output || { error: step.error }, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
