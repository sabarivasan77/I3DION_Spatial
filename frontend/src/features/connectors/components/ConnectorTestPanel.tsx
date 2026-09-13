import React, { useState } from 'react';
import { ConnectorDefinition } from '../types/dataBridgeTypes';
import { useDataBridgeStore } from '../store/useDataBridgeStore';
import { ResponseViewer } from './ResponseViewer';
import { Play, RotateCcw } from 'lucide-react';

interface ConnectorTestPanelProps {
  connector: ConnectorDefinition;
}

export const ConnectorTestPanel: React.FC<ConnectorTestPanelProps> = ({ connector }) => {
  const { executeTest, isTesting, activeResponse, clearActiveResponse } = useDataBridgeStore();
  const [testVariables, setTestVariables] = useState<Record<string, string>>({
    productId: '123',
    customerName: 'Acme Corp',
    email: 'contact@acme.com',
    sku: 'COMPRESSOR-01',
  });

  const handleVariableChange = (key: string, val: string) => {
    setTestVariables(prev => ({ ...prev, [key]: val }));
  };

  const handleRunTest = () => {
    executeTest(connector.id, testVariables);
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Test Control Bar */}
      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Test Console</h3>
            <p className="text-[11px] text-slate-400">Run live connector requests with test input variables</p>
          </div>

          <div className="flex items-center gap-2">
            {activeResponse && (
              <button
                onClick={clearActiveResponse}
                className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
              >
                <RotateCcw size={13} /> Reset
              </button>
            )}
            <button
              onClick={handleRunTest}
              disabled={isTesting || connector.state === 'DISABLED'}
              className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-lg shadow-cyan-900/30 transition disabled:opacity-50"
            >
              <Play size={14} fill="currentColor" />
              {isTesting ? 'Executing...' : 'Run Test Request'}
            </button>
          </div>
        </div>

        {/* Dynamic Test Input Variables */}
        <div className="pt-2 border-t border-slate-800">
          <label className="text-[11px] font-medium text-slate-400 block mb-2">Test Variables (Runtime Binding Mock)</label>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(testVariables).map(([key, val]) => (
              <div key={key} className="space-y-0.5">
                <span className="text-[10px] font-mono text-cyan-400 block truncate">{key}</span>
                <input
                  type="text"
                  value={val}
                  onChange={(e) => handleVariableChange(key, e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded px-2 py-1 font-mono focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Response Preview View */}
      <div className="flex-1 min-h-[300px]">
        <ResponseViewer response={activeResponse} isTesting={isTesting} />
      </div>
    </div>
  );
};
