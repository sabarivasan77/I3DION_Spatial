import React from 'react';
import { useDataBridgeStore } from '../store/useDataBridgeStore';
import { ConnectorDefinition, HttpMethod } from '../types/dataBridgeTypes';
import { Plus, Copy, Trash2, Power, Play, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  POST: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  PUT: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  PATCH: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  DELETE: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
};

export const ConnectorList: React.FC = () => {
  const {
    connectors,
    selectedConnectorId,
    selectConnector,
    saveConnector,
    deleteConnector,
    duplicateConnector,
    toggleConnectorState,
    executeTest,
  } = useDataBridgeStore();

  const handleCreateNew = () => {
    const newId = `connector_${Date.now().toString().slice(-6)}`;
    const newConnector: ConnectorDefinition = {
      id: newId,
      name: 'New Custom Connector',
      version: 1,
      method: 'GET',
      baseUrl: 'https://api.example.com/v1',
      path: '/data',
      headers: [{ id: 'h1', key: 'Content-Type', value: 'application/json', enabled: true }],
      queryParams: [],
      body: null,
      authentication: { mode: 'NONE' },
      timeoutMs: 10000,
      state: 'DRAFT',
      responseMappings: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveConnector(newConnector);
  };

  return (
    <div className="w-80 border-r border-slate-700/60 bg-slate-900/90 flex flex-col h-full">
      <div className="p-4 border-b border-slate-700/60 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wider">Connectors</h2>
          <p className="text-xs text-slate-400">DataBridge Connector Library</p>
        </div>
        <button
          onClick={handleCreateNew}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-md text-xs font-medium transition shadow-sm"
        >
          <Plus size={14} />
          New
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {connectors.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            No connectors configured yet. Click "+ New" to add one.
          </div>
        ) : (
          connectors.map((c) => {
            const isSelected = c.id === selectedConnectorId;
            const isEnabled = c.state !== 'DISABLED';

            return (
              <div
                key={c.id}
                onClick={() => selectConnector(c.id)}
                className={`group relative p-3 rounded-lg border text-left cursor-pointer transition ${
                  isSelected
                    ? 'bg-slate-800/90 border-cyan-500/60 shadow-md ring-1 ring-cyan-500/30'
                    : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/70 hover:border-slate-600'
                } ${!isEnabled ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                        METHOD_COLORS[c.method]
                      }`}
                    >
                      {c.method}
                    </span>
                    <span className="text-xs font-medium text-slate-200 truncate">{c.name}</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleConnectorState(c.id);
                    }}
                    title={isEnabled ? 'Disable Connector' : 'Enable Connector'}
                    className={`p-1 rounded transition ${
                      isEnabled ? 'text-emerald-400 hover:bg-emerald-500/20' : 'text-slate-500 hover:bg-slate-700'
                    }`}
                  >
                    <Power size={13} />
                  </button>
                </div>

                <div className="text-[11px] font-mono text-slate-400 truncate mb-2">
                  {c.baseUrl}{c.path}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-700/40 text-[10px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    {c.state === 'ACTIVE' && (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 size={11} /> Active
                      </span>
                    )}
                    {c.state === 'DRAFT' && (
                      <span className="flex items-center gap-1 text-amber-400">
                        <AlertCircle size={11} /> Draft
                      </span>
                    )}
                    {c.state === 'DISABLED' && (
                      <span className="flex items-center gap-1 text-slate-500">
                        <XCircle size={11} /> Disabled
                      </span>
                    )}
                    <span className="text-slate-500">• {c.authentication.mode}</span>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        executeTest(c.id);
                      }}
                      title="Run Test"
                      className="p-1 text-cyan-400 hover:bg-cyan-500/20 rounded"
                    >
                      <Play size={12} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicateConnector(c.id);
                      }}
                      title="Duplicate"
                      className="p-1 text-slate-400 hover:bg-slate-700 rounded"
                    >
                      <Copy size={12} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConnector(c.id);
                      }}
                      title="Delete"
                      className="p-1 text-rose-400 hover:bg-rose-500/20 rounded"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
