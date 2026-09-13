import React from 'react';
import { useDataBridgeStore } from '../store/useDataBridgeStore';
import { ConnectorList } from './ConnectorList';
import { ConnectorEditor } from './ConnectorEditor';
import { X, Network, Database } from 'lucide-react';

export const DataBridgeModal: React.FC = () => {
  const { isModalOpen, setModalOpen, connectors, selectedConnectorId, saveConnector } = useDataBridgeStore();

  if (!isModalOpen) return null;

  const activeConnector = connectors.find((c) => c.id === selectedConnectorId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-6">
      <div className="w-full max-w-6xl h-[85vh] bg-slate-950 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-cyan-600 to-blue-600 rounded-xl text-white shadow-md">
              <Network size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-100">I3DION DataBridge</h1>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded">
                  API Connector Engine
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Reusable API connectors for 3DION OmniStudio, LogicCraft, and iScript
              </p>
            </div>
          </div>

          <button
            onClick={() => setModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Main Body */}
        <div className="flex-1 flex overflow-hidden">
          <ConnectorList />

          <div className="flex-1 flex flex-col bg-slate-950">
            {activeConnector ? (
              <ConnectorEditor connector={activeConnector} onSave={saveConnector} />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
                <Database size={40} className="text-slate-700 mb-3" />
                <h3 className="text-sm font-semibold text-slate-400">No Connector Selected</h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Select an existing connector from the library on the left or create a new one to begin configuration.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
