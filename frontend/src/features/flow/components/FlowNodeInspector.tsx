import React, { useState } from 'react';
import {
  X,
  Trash2,
  Sliders,
  Sparkles,
  HelpCircle,
  AlertTriangle,
  Code2,
} from 'lucide-react';
import type { CustomFlowNode } from '../types/flow';

interface FlowNodeInspectorProps {
  selectedNode: CustomFlowNode | null;
  onUpdateNode: (nodeId: string, updates: Partial<CustomFlowNode['data']>) => void;
  onDeleteNode: (nodeId: string) => void;
  onClose: () => void;
}

export const FlowNodeInspector: React.FC<FlowNodeInspectorProps> = ({
  selectedNode,
  onUpdateNode,
  onDeleteNode,
  onClose,
}) => {
  const [showVarPickerField, setShowVarPickerField] = useState<string | null>(null);

  if (!selectedNode) return null;

  const data = selectedNode.data;
  const params = data.params || {};
  const errorPolicy = data.errorPolicy || { retryCount: 0, timeoutSeconds: 30, onError: 'stop' };

  const updateParam = (field: string, value: any) => {
    onUpdateNode(selectedNode.id, {
      params: { ...params, [field]: value },
    });
  };

  const updateErrorPolicy = (key: string, value: any) => {
    onUpdateNode(selectedNode.id, {
      errorPolicy: { ...errorPolicy, [key]: value },
    });
  };

  const insertVariable = (targetField: string, token: string) => {
    const currentVal = String(params[targetField] || '');
    updateParam(targetField, `${currentVal}{{${token}}}`);
    setShowVarPickerField(null);
  };

  // Sample upstream variables available for insertion
  const sampleVariables = [
    { label: 'Trigger Lead Email', token: 'trigger.contact.email' },
    { label: 'Trigger Lead Name', token: 'trigger.contact.name' },
    { label: 'Trigger Product Name', token: 'trigger.productName' },
    { label: 'Trigger Dwell Time (s)', token: 'trigger.dwellDurationSeconds' },
    { label: 'Workflow Variable: leadScore', token: 'variables.leadScore' },
  ];

  return (
    <aside className="w-80 shrink-0 border-l border-slate-200 bg-white flex flex-col h-full overflow-y-auto select-none">
      {/* Inspector Header */}
      <div className="flex items-center justify-between border-b border-slate-100 p-4 bg-slate-50/70">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900">Step Inspector</span>
            <span className="rounded bg-slate-200/80 px-1.5 py-0.2 text-[9px] font-mono font-bold text-slate-600">
              {data.type}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 font-mono mt-0.5">ID: {selectedNode.id}</p>
        </div>

        <button
          onClick={onClose}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
        >
          <X size={16} />
        </button>
      </div>

      {/* Inspector Form Fields */}
      <div className="flex-1 p-4 space-y-4">
        {/* Step Label */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-700">Step Label</label>
          <input
            type="text"
            value={data.label}
            onChange={(e) => onUpdateNode(selectedNode.id, { label: e.target.value })}
            className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        {/* Condition Node Configuration */}
        {data.type === 'condition' && (
          <div className="space-y-3 rounded-xl bg-purple-50/40 border border-purple-200/80 p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Condition Rules</span>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-700">Field Name / Dynamic Chip</label>
                <button
                  type="button"
                  onClick={() => setShowVarPickerField(showVarPickerField === 'field' ? null : 'field')}
                  className="text-[10px] text-cyan-600 font-bold hover:underline flex items-center gap-0.5"
                >
                  <Code2 size={11} />
                  <span>{`{x}`} Variable</span>
                </button>
              </div>
              <input
                type="text"
                value={params.field || 'intent'}
                onChange={(e) => updateParam('field', e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-mono"
              />
              {showVarPickerField === 'field' && (
                <div className="rounded-lg bg-white border border-cyan-200 p-2 shadow-md space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Insert Output Chip:</span>
                  {sampleVariables.map((v) => (
                    <button
                      key={v.token}
                      onClick={() => insertVariable('field', v.token)}
                      className="w-full text-left text-[11px] px-1.5 py-0.5 rounded hover:bg-cyan-50 text-slate-700 truncate"
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Comparison Operator</label>
              <select
                value={params.operator || 'equals'}
                onChange={(e) => updateParam('operator', e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-mono"
              >
                <option value="equals">equals (=)</option>
                <option value="not_equals">not equals (!=)</option>
                <option value="greater_than">greater than (&gt;)</option>
                <option value="less_than">less than (&lt;)</option>
                <option value="contains">contains text</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Target Value</label>
              <input
                type="text"
                value={params.value ?? 'quote'}
                onChange={(e) => updateParam('value', e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-mono"
              />
            </div>
          </div>
        )}

        {/* Send Email Node Configuration */}
        {data.type === 'send_email' && (
          <div className="space-y-3 rounded-xl bg-emerald-50/40 border border-emerald-200/80 p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Email Dispatch Settings</span>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-700">Recipient Email</label>
                <button
                  type="button"
                  onClick={() => setShowVarPickerField(showVarPickerField === 'recipientEmail' ? null : 'recipientEmail')}
                  className="text-[10px] text-cyan-600 font-bold hover:underline flex items-center gap-0.5"
                >
                  <Code2 size={11} />
                  <span>{`{x}`} Variable</span>
                </button>
              </div>
              <input
                type="text"
                value={params.recipientEmail || 'customer@client.com'}
                onChange={(e) => updateParam('recipientEmail', e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
              />
              {showVarPickerField === 'recipientEmail' && (
                <div className="rounded-lg bg-white border border-cyan-200 p-2 shadow-md space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Insert Output Chip:</span>
                  {sampleVariables.map((v) => (
                    <button
                      key={v.token}
                      onClick={() => insertVariable('recipientEmail', v.token)}
                      className="w-full text-left text-[11px] px-1.5 py-0.5 rounded hover:bg-cyan-50 text-slate-700 truncate"
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Subject Line</label>
              <input
                type="text"
                value={params.subject || 'Your I3DION Spatial Quotation'}
                onChange={(e) => updateParam('subject', e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Message Body</label>
              <textarea
                rows={3}
                value={params.body || 'Hello {{trigger.contact.name}}, your 3D CAD quotation is ready.'}
                onChange={(e) => updateParam('body', e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs font-mono"
              />
            </div>
          </div>
        )}

        {/* Lead Assignment Configuration */}
        {data.type === 'auto_assign_lead' && (
          <div className="space-y-3 rounded-xl bg-amber-50/40 border border-amber-200/80 p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Lead Routing</span>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Assign Status</label>
              <select
                value={params.status || 'QUALIFIED'}
                onChange={(e) => updateParam('status', e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
              >
                <option value="NEW">NEW</option>
                <option value="CONTACTED">CONTACTED</option>
                <option value="QUALIFIED">QUALIFIED</option>
                <option value="OPPORTUNITY">OPPORTUNITY</option>
              </select>
            </div>
          </div>
        )}

        {/* Delay Configuration */}
        {data.type === 'delay' && (
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700">Duration (Seconds)</label>
            <input
              type="number"
              min={1}
              max={3600}
              value={params.durationSeconds || 5}
              onChange={(e) => updateParam('durationSeconds', parseInt(e.target.value, 10))}
              className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs"
            />
          </div>
        )}

        {/* In-App Notification Configuration */}
        {data.type === 'send_notification' && (
          <div className="space-y-2">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Notification Title</label>
              <input
                type="text"
                value={params.title || 'New Spatial Event'}
                onChange={(e) => updateParam('title', e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Notification Body</label>
              <textarea
                rows={2}
                value={params.body || 'Customer engaged with spatial model.'}
                onChange={(e) => updateParam('body', e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2 text-xs"
              />
            </div>
          </div>
        )}

        {/* Error & Retry Policy */}
        <div className="border-t border-slate-100 pt-3 space-y-2.5">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
            <Sliders size={13} className="text-slate-400" />
            <span>Timeout & Failure Policy</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[10px] text-slate-500">Retries</label>
              <select
                value={errorPolicy.retryCount || 0}
                onChange={(e) => updateErrorPolicy('retryCount', parseInt(e.target.value, 10))}
                className="w-full rounded-lg border border-slate-200 py-1 px-2 text-xs"
              >
                <option value={0}>0 (No retry)</option>
                <option value={1}>1 Retry</option>
                <option value={3}>3 Retries</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-500">On Error</label>
              <select
                value={errorPolicy.onError || 'stop'}
                onChange={(e) => updateErrorPolicy('onError', e.target.value)}
                className="w-full rounded-lg border border-slate-200 py-1 px-2 text-xs"
              >
                <option value="stop">Stop Run</option>
                <option value="continue">Continue</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Inspector Footer Actions */}
      <div className="border-t border-slate-100 p-3 bg-slate-50/70">
        <button
          type="button"
          onClick={() => onDeleteNode(selectedNode.id)}
          className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-white py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition"
        >
          <Trash2 size={13} />
          <span>Delete Step</span>
        </button>
      </div>
    </aside>
  );
};
