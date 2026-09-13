import React from 'react';
import { ConnectorDefinition, HttpMethod, KeyValuePair } from '../types/dataBridgeTypes';
import { Plus, Trash2, ShieldAlert } from 'lucide-react';

interface RequestBuilderProps {
  connector: ConnectorDefinition;
  onChange: (updated: ConnectorDefinition) => void;
}

export const RequestBuilder: React.FC<RequestBuilderProps> = ({ connector, onChange }) => {
  const handleMethodChange = (method: HttpMethod) => {
    onChange({ ...connector, method });
  };

  const handleHeaderAdd = () => {
    const newHeader: KeyValuePair = {
      id: `h_${Date.now().toString().slice(-4)}`,
      key: '',
      value: '',
      enabled: true,
      isSecret: false,
    };
    onChange({ ...connector, headers: [...connector.headers, newHeader] });
  };

  const handleHeaderUpdate = (index: number, updated: Partial<KeyValuePair>) => {
    const newHeaders = [...connector.headers];
    newHeaders[index] = { ...newHeaders[index], ...updated };
    onChange({ ...connector, headers: newHeaders });
  };

  const handleHeaderDelete = (index: number) => {
    const newHeaders = connector.headers.filter((_, i) => i !== index);
    onChange({ ...connector, headers: newHeaders });
  };

  const handleQueryAdd = () => {
    const newQuery: KeyValuePair = {
      id: `q_${Date.now().toString().slice(-4)}`,
      key: '',
      value: '',
      enabled: true,
    };
    onChange({ ...connector, queryParams: [...connector.queryParams, newQuery] });
  };

  const handleQueryUpdate = (index: number, updated: Partial<KeyValuePair>) => {
    const newQueries = [...connector.queryParams];
    newQueries[index] = { ...newQueries[index], ...updated };
    onChange({ ...connector, queryParams: newQueries });
  };

  const handleQueryDelete = (index: number) => {
    const newQueries = connector.queryParams.filter((_, i) => i !== index);
    onChange({ ...connector, queryParams: newQueries });
  };

  const isBodyAllowed = ['POST', 'PUT', 'PATCH'].includes(connector.method);

  return (
    <div className="space-[#1e293b] space-y-6">
      {/* Endpoint Configuration */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Endpoint URL</label>
        <div className="flex gap-2">
          <select
            value={connector.method}
            onChange={(e) => handleMethodChange(e.target.value as HttpMethod)}
            className="bg-slate-900 border border-slate-700 text-cyan-400 font-bold text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="PATCH">PATCH</option>
            <option value="DELETE">DELETE</option>
          </select>

          <input
            type="text"
            value={connector.baseUrl}
            onChange={(e) => onChange({ ...connector, baseUrl: e.target.value })}
            placeholder="https://api.example.com/v1"
            className="flex-1 bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-cyan-500 focus:outline-none font-mono"
          />

          <input
            type="text"
            value={connector.path}
            onChange={(e) => onChange({ ...connector, path: e.target.value })}
            placeholder="/products/{productId}"
            className="w-1/3 bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-cyan-500 focus:outline-none font-mono"
          />
        </div>
        <p className="text-[11px] text-slate-400">
          Use <code className="text-cyan-400">{"{{variableName}}"}</code> for dynamic variable substitution.
        </p>
      </div>

      {/* Query Parameters */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Query Parameters</label>
          <button
            onClick={handleQueryAdd}
            className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-medium"
          >
            <Plus size={13} /> Add Query Param
          </button>
        </div>

        {connector.queryParams.length === 0 ? (
          <div className="text-[11px] text-slate-500 italic p-3 bg-slate-900/50 rounded-lg border border-slate-800">
            No query parameters added.
          </div>
        ) : (
          <div className="space-y-1.5">
            {connector.queryParams.map((q, idx) => (
              <div key={q.id || idx} className="flex items-center gap-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                <input
                  type="checkbox"
                  checked={q.enabled}
                  onChange={(e) => handleQueryUpdate(idx, { enabled: e.target.checked })}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500/20"
                />
                <input
                  type="text"
                  value={q.key}
                  onChange={(e) => handleQueryUpdate(idx, { key: e.target.value })}
                  placeholder="Key (e.g. limit)"
                  className="w-1/3 bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded px-2.5 py-1 font-mono focus:ring-1 focus:ring-cyan-500"
                />
                <input
                  type="text"
                  value={q.value}
                  onChange={(e) => handleQueryUpdate(idx, { value: e.target.value })}
                  placeholder="Value or {{var}}"
                  className="flex-1 bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded px-2.5 py-1 font-mono focus:ring-1 focus:ring-cyan-500"
                />
                <button
                  onClick={() => handleQueryDelete(idx)}
                  className="text-slate-500 hover:text-rose-400 p-1"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Headers */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Headers</label>
          <button
            onClick={handleHeaderAdd}
            className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-medium"
          >
            <Plus size={13} /> Add Header
          </button>
        </div>

        {connector.headers.length === 0 ? (
          <div className="text-[11px] text-slate-500 italic p-3 bg-slate-900/50 rounded-lg border border-slate-800">
            No custom headers added.
          </div>
        ) : (
          <div className="space-y-1.5">
            {connector.headers.map((h, idx) => (
              <div key={h.id || idx} className="flex items-center gap-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                <input
                  type="checkbox"
                  checked={h.enabled}
                  onChange={(e) => handleHeaderUpdate(idx, { enabled: e.target.checked })}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500/20"
                />
                <input
                  type="text"
                  value={h.key}
                  onChange={(e) => handleHeaderUpdate(idx, { key: e.target.value })}
                  placeholder="Header Name"
                  className="w-1/3 bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded px-2.5 py-1 font-mono focus:ring-1 focus:ring-cyan-500"
                />
                <input
                  type={h.isSecret ? "password" : "text"}
                  value={h.value}
                  onChange={(e) => handleHeaderUpdate(idx, { value: e.target.value })}
                  placeholder="Header Value"
                  className="flex-1 bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded px-2.5 py-1 font-mono focus:ring-1 focus:ring-cyan-500"
                />
                <button
                  onClick={() => handleHeaderUpdate(idx, { isSecret: !h.isSecret })}
                  title={h.isSecret ? "Marked as Secret" : "Mark as Secret"}
                  className={`p-1 rounded text-xs font-semibold ${
                    h.isSecret ? 'text-amber-400 bg-amber-500/20' : 'text-slate-500 hover:text-slate-400'
                  }`}
                >
                  <ShieldAlert size={13} />
                </button>
                <button
                  onClick={() => handleHeaderDelete(idx)}
                  className="text-slate-500 hover:text-rose-400 p-1"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* JSON Request Body */}
      {isBodyAllowed && (
        <div className="space-y-2 pt-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
            Request Body (JSON)
          </label>
          <textarea
            value={connector.body || ''}
            onChange={(e) => onChange({ ...connector, body: e.target.value })}
            placeholder='{\n  "name": "{{productName}}",\n  "quantity": "{{quantity}}"\n}'
            rows={6}
            className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg p-3 font-mono focus:ring-1 focus:ring-cyan-500 focus:outline-none"
          />
        </div>
      )}
    </div>
  );
};
