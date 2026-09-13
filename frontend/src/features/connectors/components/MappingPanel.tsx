import React from 'react';
import { ConnectorDefinition, ResponseMapping } from '../types/dataBridgeTypes';
import { Plus, Trash2, GitPullRequest } from 'lucide-react';

interface MappingPanelProps {
  connector: ConnectorDefinition;
  onChange: (updated: ConnectorDefinition) => void;
}

export const MappingPanel: React.FC<MappingPanelProps> = ({ connector, onChange }) => {
  const mappings = connector.responseMappings || [];

  const handleAddMapping = () => {
    const newMapping: ResponseMapping = {
      id: `m_${Date.now().toString().slice(-4)}`,
      jsonPath: '',
      targetVariable: '',
    };
    onChange({ ...connector, responseMappings: [...mappings, newMapping] });
  };

  const handleUpdateMapping = (index: number, updated: Partial<ResponseMapping>) => {
    const newMappings = [...mappings];
    newMappings[index] = { ...newMappings[index], ...updated };
    onChange({ ...connector, responseMappings: newMappings });
  };

  const handleDeleteMapping = (index: number) => {
    const newMappings = mappings.filter((_, i) => i !== index);
    onChange({ ...connector, responseMappings: newMappings });
  };

  return (
    <div className="space-y-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <GitPullRequest className="text-cyan-400" size={18} />
          <div>
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Response Data Mapping</h3>
            <p className="text-[11px] text-slate-400">Map API JSON fields to OmniStudio widgets or variables</p>
          </div>
        </div>
        <button
          onClick={handleAddMapping}
          className="flex items-center gap-1 px-2.5 py-1 bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 border border-cyan-500/40 rounded-md text-xs font-medium transition"
        >
          <Plus size={13} /> Add Mapping
        </button>
      </div>

      {mappings.length === 0 ? (
        <div className="text-center p-6 text-xs text-slate-500 bg-slate-950/40 rounded-lg border border-dashed border-slate-800">
          No response mappings configured. Map JSON fields like <code className="text-cyan-400">product.name</code> to populate UI widgets.
        </div>
      ) : (
        <div className="space-y-2">
          {mappings.map((m, idx) => (
            <div key={m.id || idx} className="grid grid-cols-12 gap-2 bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 items-center">
              <div className="col-span-5">
                <label className="text-[10px] text-slate-400 block mb-0.5">Response JSON Path</label>
                <input
                  type="text"
                  value={m.jsonPath}
                  onChange={(e) => handleUpdateMapping(idx, { jsonPath: e.target.value })}
                  placeholder="product.name or items[0].price"
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded px-2 py-1 font-mono focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div className="col-span-1 text-center text-slate-500 font-bold">→</div>

              <div className="col-span-5">
                <label className="text-[10px] text-slate-400 block mb-0.5">Target Variable / Widget</label>
                <input
                  type="text"
                  value={m.targetVariable}
                  onChange={(e) => handleUpdateMapping(idx, { targetVariable: e.target.value })}
                  placeholder="productName or TextWidget_01.text"
                  className="w-full bg-slate-900 border border-slate-800 text-cyan-300 text-xs rounded px-2 py-1 font-mono focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div className="col-span-1 text-right">
                <button
                  onClick={() => handleDeleteMapping(idx)}
                  className="text-slate-500 hover:text-rose-400 p-1 rounded"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
