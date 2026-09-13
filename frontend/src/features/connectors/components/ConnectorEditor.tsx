import React, { useState } from 'react';
import { ConnectorDefinition } from '../types/dataBridgeTypes';
import { validateConnector } from '../validation/connectorValidation';
import { RequestBuilder } from './RequestBuilder';
import { AuthenticationPanel } from './AuthenticationPanel';
import { MappingPanel } from './MappingPanel';
import { ConnectorTestPanel } from './ConnectorTestPanel';
import { Save, AlertCircle, Send, ShieldCheck, GitPullRequest, Play } from 'lucide-react';

interface ConnectorEditorProps {
  connector: ConnectorDefinition;
  onSave: (connector: ConnectorDefinition) => void;
}

export const ConnectorEditor: React.FC<ConnectorEditorProps> = ({ connector, onSave }) => {
  const [draft, setDraft] = useState<ConnectorDefinition>(connector);
  const [activeTab, setActiveTab] = useState<'REQUEST' | 'AUTH' | 'MAPPING' | 'TEST'>('REQUEST');

  // Keep draft updated when connector prop changes
  React.useEffect(() => {
    setDraft(connector);
  }, [connector.id]);

  const validation = validateConnector(draft);

  const handleSave = () => {
    if (!validation.isValid) return;
    onSave({ ...draft, state: draft.state === 'DRAFT' ? 'ACTIVE' : draft.state });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
      {/* Connector Header & Controls */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="Connector Name"
            className="text-base font-bold text-slate-100 bg-transparent border-b border-transparent hover:border-slate-700 focus:border-cyan-500 focus:outline-none px-1 py-0.5"
          />
          <span className="text-xs font-mono text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
            ID: {draft.id}
          </span>
          <span className="text-xs font-medium text-slate-400">
            v{draft.version}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
            <label className="text-[11px] text-slate-400 px-2 font-medium">Timeout:</label>
            <input
              type="number"
              value={draft.timeoutMs}
              onChange={(e) => setDraft({ ...draft, timeoutMs: parseInt(e.target.value, 10) || 10000 })}
              className="w-16 bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded px-1.5 py-0.5 font-mono text-center"
            />
            <span className="text-[11px] text-slate-500 pr-1">ms</span>
          </div>

          <button
            onClick={handleSave}
            disabled={!validation.isValid}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Save size={14} />
            Save Changes
          </button>
        </div>
      </div>

      {/* Validation Warning Alert */}
      {!validation.isValid && (
        <div className="bg-rose-500/10 border-b border-rose-500/20 p-2.5 px-4 flex items-center gap-2 text-rose-300 text-xs">
          <AlertCircle size={15} className="shrink-0" />
          <span>
            {validation.errors.map(e => e.message).join(' | ')}
          </span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-800 bg-slate-900/40 px-4">
        <button
          onClick={() => setActiveTab('REQUEST')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition ${
            activeTab === 'REQUEST'
              ? 'border-cyan-500 text-cyan-400 bg-slate-800/40'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Send size={14} /> Request Builder
        </button>

        <button
          onClick={() => setActiveTab('AUTH')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition ${
            activeTab === 'AUTH'
              ? 'border-cyan-500 text-cyan-400 bg-slate-800/40'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck size={14} /> Authentication ({draft.authentication.mode})
        </button>

        <button
          onClick={() => setActiveTab('MAPPING')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition ${
            activeTab === 'MAPPING'
              ? 'border-cyan-500 text-cyan-400 bg-slate-800/40'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <GitPullRequest size={14} /> Response Mapping ({draft.responseMappings?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('TEST')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition ${
            activeTab === 'TEST'
              ? 'border-cyan-500 text-cyan-400 bg-slate-800/40'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Play size={14} /> Test Console
        </button>
      </div>

      {/* Active Tab Panel */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'REQUEST' && (
          <RequestBuilder connector={draft} onChange={setDraft} />
        )}

        {activeTab === 'AUTH' && (
          <AuthenticationPanel connector={draft} onChange={setDraft} />
        )}

        {activeTab === 'MAPPING' && (
          <MappingPanel connector={draft} onChange={setDraft} />
        )}

        {activeTab === 'TEST' && (
          <ConnectorTestPanel connector={draft} />
        )}
      </div>
    </div>
  );
};
