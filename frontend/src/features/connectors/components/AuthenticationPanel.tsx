import React from 'react';
import { ConnectorDefinition, AuthenticationMode } from '../types/dataBridgeTypes';
import { ShieldCheck, Lock } from 'lucide-react';

interface AuthenticationPanelProps {
  connector: ConnectorDefinition;
  onChange: (updated: ConnectorDefinition) => void;
}

export const AuthenticationPanel: React.FC<AuthenticationPanelProps> = ({ connector, onChange }) => {
  const auth = connector.authentication;

  const handleModeChange = (mode: AuthenticationMode) => {
    onChange({
      ...connector,
      authentication: {
        ...auth,
        mode,
      },
    });
  };

  return (
    <div className="space-y-5 bg-slate-900/40 p-4 rounded-xl border border-slate-800">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <ShieldCheck className="text-cyan-400" size={18} />
        <div>
          <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Authentication Policy</h3>
          <p className="text-[11px] text-slate-400">Configure credentials for secure API communication</p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-300">Authentication Mode</label>
        <select
          value={auth.mode}
          onChange={(e) => handleModeChange(e.target.value as AuthenticationMode)}
          className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg p-2.5 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
        >
          <option value="NONE">No Authentication (Public API)</option>
          <option value="API_KEY">API Key</option>
          <option value="BEARER_TOKEN">Bearer Token</option>
          <option value="BASIC_AUTH">Basic Authentication</option>
          <option value="OAUTH2">OAuth 2.0 (Extension Point)</option>
        </select>
      </div>

      {auth.mode === 'API_KEY' && (
        <div className="space-y-3 pt-2">
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Key Location</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="apiKeyIn"
                  value="HEADER"
                  checked={auth.apiKey?.in !== 'QUERY'}
                  onChange={() =>
                    onChange({
                      ...connector,
                      authentication: {
                        ...auth,
                        apiKey: { keyName: auth.apiKey?.keyName || 'X-API-KEY', keyValue: auth.apiKey?.keyValue || '', in: 'HEADER' },
                      },
                    })
                  }
                  className="text-cyan-500 focus:ring-cyan-500"
                />
                HTTP Header
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="apiKeyIn"
                  value="QUERY"
                  checked={auth.apiKey?.in === 'QUERY'}
                  onChange={() =>
                    onChange({
                      ...connector,
                      authentication: {
                        ...auth,
                        apiKey: { keyName: auth.apiKey?.keyName || 'api_key', keyValue: auth.apiKey?.keyValue || '', in: 'QUERY' },
                      },
                    })
                  }
                  className="text-cyan-500 focus:ring-cyan-500"
                />
                URL Query Parameter
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Key Name</label>
              <input
                type="text"
                value={auth.apiKey?.keyName || ''}
                onChange={(e) =>
                  onChange({
                    ...connector,
                    authentication: {
                      ...auth,
                      apiKey: { keyName: e.target.value, keyValue: auth.apiKey?.keyValue || '', in: auth.apiKey?.in || 'HEADER' },
                    },
                  })
                }
                placeholder="X-API-KEY or api_key"
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2 font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Secret Key Value</label>
              <input
                type="password"
                value={auth.apiKey?.keyValue || ''}
                onChange={(e) =>
                  onChange({
                    ...connector,
                    authentication: {
                      ...auth,
                      apiKey: { keyName: auth.apiKey?.keyName || '', keyValue: e.target.value, in: auth.apiKey?.in || 'HEADER' },
                    },
                  })
                }
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2 font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {auth.mode === 'BEARER_TOKEN' && (
        <div className="space-y-2 pt-2">
          <label className="text-xs font-medium text-slate-300 block">Bearer Token</label>
          <input
            type="password"
            value={auth.bearerToken?.token || ''}
            onChange={(e) =>
              onChange({
                ...connector,
                authentication: {
                  ...auth,
                  bearerToken: { token: e.target.value },
                },
              })
            }
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 font-mono"
          />
        </div>
      )}

      {auth.mode === 'BASIC_AUTH' && (
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Username</label>
            <input
              type="text"
              value={auth.basicAuth?.username || ''}
              onChange={(e) =>
                onChange({
                  ...connector,
                  authentication: {
                    ...auth,
                    basicAuth: { username: e.target.value, password: auth.basicAuth?.password || '' },
                  },
                })
              }
              placeholder="api_user"
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2 font-mono"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Password</label>
            <input
              type="password"
              value={auth.basicAuth?.password || ''}
              onChange={(e) =>
                onChange({
                  ...connector,
                  authentication: {
                    ...auth,
                    basicAuth: { username: auth.basicAuth?.username || '', password: e.target.value },
                  },
                })
              }
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2 font-mono"
            />
          </div>
        </div>
      )}

      {auth.mode === 'OAUTH2' && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-300 flex items-start gap-2">
          <Lock size={16} className="mt-0.5 shrink-0" />
          <div>
            <strong>OAuth 2.0 Architectural Placeholder:</strong> OAuth 2.0 authorization code grant token exchange hooks exist in the architecture. Full server-side flow deferred to future phase per Phase 7 boundaries.
          </div>
        </div>
      )}
    </div>
  );
};
