import React, { useState } from 'react';
import { NormalizedResponse } from '../types/dataBridgeTypes';
import { sanitizeHeadersForDisplay } from '../security/credentialPolicy';
import { CheckCircle2, AlertTriangle, Clock, Layers, FileCode } from 'lucide-react';

interface ResponseViewerProps {
  response: NormalizedResponse | null;
  isTesting?: boolean;
}

export const ResponseViewer: React.FC<ResponseViewerProps> = ({ response, isTesting }) => {
  const [activeTab, setActiveTab] = useState<'BODY' | 'HEADERS' | 'ERROR'>('BODY');

  if (isTesting) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-slate-400 bg-slate-950/60 rounded-xl border border-slate-800">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-medium">Executing API Connector Request...</p>
        <span className="text-[11px] text-slate-500 mt-1">Applying credentials & dynamic variable bindings</span>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-slate-500 bg-slate-950/40 rounded-xl border border-dashed border-slate-800 text-center">
        <FileCode size={32} className="mb-2 text-slate-600" />
        <p className="text-xs font-medium text-slate-400">No Execution Results Yet</p>
        <span className="text-[11px] text-slate-500 max-w-xs mt-1">
          Click "Test Request" to run this connector and inspect normalized status, duration, and response payload.
        </span>
      </div>
    );
  }

  const isSuccess = response.ok;
  const statusColor = isSuccess
    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    : 'bg-rose-500/20 text-rose-400 border-rose-500/30';

  const sanitizedHeaders = sanitizeHeadersForDisplay(response.headers);

  return (
    <div className="h-full flex flex-col bg-slate-950/90 rounded-xl border border-slate-800 overflow-hidden">
      {/* Header bar */}
      <div className="px-4 py-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`px-2.5 py-1 rounded text-xs font-bold border flex items-center gap-1.5 ${statusColor}`}>
            {isSuccess ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
            {response.status > 0 ? `${response.status} ${response.statusText || ''}` : 'NETWORK ERROR'}
          </span>

          <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
            <Clock size={13} className="text-slate-500" />
            {response.durationMs}ms
          </span>
        </div>

        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('BODY')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition ${
              activeTab === 'BODY' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Response Body
          </button>
          <button
            onClick={() => setActiveTab('HEADERS')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition ${
              activeTab === 'HEADERS' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Headers ({Object.keys(sanitizedHeaders).length})
          </button>
          {response.error && (
            <button
              onClick={() => setActiveTab('ERROR')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                activeTab === 'ERROR' ? 'bg-rose-950 text-rose-300' : 'text-rose-400 hover:text-rose-300'
              }`}
            >
              Error Details
            </button>
          )}
        </div>
      </div>

      {/* Content view */}
      <div className="flex-1 overflow-auto p-4 text-xs font-mono">
        {activeTab === 'BODY' && (
          <pre className="text-slate-300 leading-relaxed whitespace-pre-wrap select-text">
            {typeof response.data === 'object' ? JSON.stringify(response.data, null, 2) : String(response.data || '')}
          </pre>
        )}

        {activeTab === 'HEADERS' && (
          <div className="space-y-1.5">
            {Object.entries(sanitizedHeaders).map(([key, val]) => (
              <div key={key} className="flex border-b border-slate-900 pb-1">
                <span className="w-1/3 text-cyan-400 font-semibold truncate">{key}:</span>
                <span className="flex-1 text-slate-300 truncate">{val}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'ERROR' && response.error && (
          <div className="space-y-3 text-slate-300">
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg">
              <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-1">
                Code: {response.error.code}
              </h4>
              <p className="text-xs text-rose-200 font-sans">{response.error.message}</p>
              {response.error.retryAfter !== undefined && (
                <p className="text-[11px] text-amber-300 mt-2 font-sans">
                  Retry-After: {response.error.retryAfter} seconds
                </p>
              )}
            </div>

            {response.error.details && (
              <div>
                <span className="text-slate-400 block mb-1">Error Diagnostics Payload:</span>
                <pre className="p-3 bg-slate-900 rounded border border-slate-800 text-slate-400 text-[11px]">
                  {JSON.stringify(response.error.details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
