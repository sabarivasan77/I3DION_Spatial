import React from 'react';
import { useLogicCraftStore } from '../store/useLogicCraftStore';
import { logicNodeRegistry } from '../registry/logicNodeRegistry';
import { TargetWidgetPicker } from './TargetWidgetPicker';
import { Sliders, Trash2, Copy } from 'lucide-react';

export const LogicInspector: React.FC = () => {
  const {
    getActiveGraph,
    selectedNodeId,
    updateNodeProperties,
    deleteNode,
    duplicateNode,
  } = useLogicCraftStore();

  const activeGraph = getActiveGraph();
  const selectedNode = activeGraph.nodes.find((n) => n.id === selectedNodeId);

  if (!selectedNode) {
    return (
      <aside className="flex h-full w-80 flex-col items-center justify-center border-l border-slate-800 bg-slate-900 p-6 text-center text-slate-500">
        <Sliders size={32} className="mb-2 text-slate-700" />
        <h3 className="text-xs font-bold text-slate-400">No Node Selected</h3>
        <p className="mt-1 text-[11px] text-slate-500">
          Click any logic node on the canvas to configure its parameters.
        </p>
      </aside>
    );
  }

  const def = logicNodeRegistry.get(selectedNode.type);
  const schemas = def?.propertySchema || [];

  return (
    <aside className="flex h-full w-80 flex-col border-l border-slate-800 bg-slate-900 text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 p-4">
        <div>
          <h2 className="text-sm font-bold text-white">{selectedNode.name}</h2>
          <p className="text-[10px] font-mono text-slate-500">{selectedNode.id}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => duplicateNode(selectedNode.id)}
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
            title="Duplicate Node"
          >
            <Copy size={15} />
          </button>
          <button
            type="button"
            onClick={() => deleteNode(selectedNode.id)}
            className="rounded p-1 text-slate-400 hover:bg-red-900/50 hover:text-red-400"
            title="Delete Node"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Node Description */}
      {def?.description && (
        <div className="border-b border-slate-800/80 bg-slate-950/40 p-3 text-[11px] text-slate-400 leading-relaxed">
          {def.description}
        </div>
      )}

      {/* Properties Controls */}
      <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto p-4">
        {schemas.length > 0 ? (
          schemas.map((item) => {
            const currentValue = selectedNode.properties?.[item.name] ?? item.default ?? '';

            if (item.type === 'widget_picker') {
              return (
                <TargetWidgetPicker
                  key={item.name}
                  label={item.label}
                  value={currentValue}
                  onChange={(val) => updateNodeProperties(selectedNode.id, { [item.name]: val })}
                />
              );
            }

            if (item.type === 'boolean') {
              return (
                <div key={item.name} className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">{item.label}</label>
                  <input
                    type="checkbox"
                    checked={Boolean(currentValue)}
                    onChange={(e) => updateNodeProperties(selectedNode.id, { [item.name]: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-0"
                  />
                </div>
              );
            }

            if (item.type === 'select' && item.options) {
              return (
                <div key={item.name} className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-slate-300">{item.label}</label>
                  <select
                    value={currentValue}
                    onChange={(e) => updateNodeProperties(selectedNode.id, { [item.name]: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                  >
                    {item.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              );
            }

            return (
              <div key={item.name} className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-slate-300">{item.label}</label>
                <input
                  type={item.type === 'number' ? 'number' : 'text'}
                  value={currentValue}
                  onChange={(e) =>
                    updateNodeProperties(selectedNode.id, {
                      [item.name]: item.type === 'number' ? Number(e.target.value) : e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            );
          })
        ) : (
          <div className="py-4 text-center text-xs text-slate-500">
            This node has no configurable parameters.
          </div>
        )}
      </div>
    </aside>
  );
};
