import React, { useState } from 'react';
import { useLogicCraftStore } from '../store/useLogicCraftStore';
import { logicNodeRegistry } from '../registry/logicNodeRegistry';
import { TargetWidgetPicker } from './TargetWidgetPicker';
import {
  Sliders,
  Trash2,
  Copy,
  Search,
  Box,
  Folder,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronDown,
  Globe,
  Variable,
  Zap,
} from 'lucide-react';

export const LogicInspector: React.FC = () => {
  const {
    getActiveGraph,
    selectedNodeId,
    updateNodeProperties,
    deleteNode,
    duplicateNode,
  } = useLogicCraftStore();

  const [activeRightTab, setActiveRightTab] = useState<'objects' | 'variables'>('objects');
  const [objectSearch, setObjectSearch] = useState('');
  const [selectedSceneObject, setSelectedSceneObject] = useState<string>('Valve_Handle');
  const [advancedExpanded, setAdvancedExpanded] = useState(false);

  const activeGraph = getActiveGraph();
  const selectedNode = activeGraph.nodes.find((n) => n.id === selectedNodeId);
  const def = selectedNode ? logicNodeRegistry.get(selectedNode.type) : null;
  const schemas = def?.propertySchema || [];

  return (
    <aside className="flex h-full w-80 flex-col border-l border-slate-200 bg-white text-slate-800 shrink-0 select-none">
      {/* TOP HALF: Scene Objects & Variables Tree */}
      <div className="flex h-1/2 flex-col border-b border-slate-200">
        {/* Tabs */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50 px-2 pt-2">
          <button
            onClick={() => setActiveRightTab('objects')}
            className={`flex-1 py-1.5 text-center text-xs font-bold transition-all border-b-2 ${
              activeRightTab === 'objects'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-md shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Scene Objects
          </button>
          <button
            onClick={() => setActiveRightTab('variables')}
            className={`flex-1 py-1.5 text-center text-xs font-bold transition-all border-b-2 ${
              activeRightTab === 'variables'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-md shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Variables
          </button>
        </div>

        {/* Tab Content */}
        {activeRightTab === 'objects' ? (
          <div className="flex flex-1 flex-col overflow-hidden p-2.5">
            {/* Search */}
            <div className="relative mb-2">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search objects..."
                value={objectSearch}
                onChange={(e) => setObjectSearch(e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-slate-50 py-1 pl-7 pr-2 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
              />
            </div>

            {/* Tree View */}
            <div className="no-scrollbar flex-1 space-y-1 overflow-y-auto font-mono text-[11px]">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-slate-700 font-semibold py-0.5">
                  <ChevronDown size={13} className="text-slate-400" />
                  <Box size={13} className="text-blue-500" />
                  <span>Compressor_Model.glb</span>
                </div>

                <div className="pl-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-600 py-0.5">
                    <ChevronDown size={13} className="text-slate-400" />
                    <Folder size={13} className="text-slate-400" />
                    <span>Root</span>
                  </div>

                  <div className="pl-3 space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-600 py-0.5">
                      <ChevronDown size={13} className="text-slate-400" />
                      <Folder size={13} className="text-slate-400" />
                      <span>Compressor_Body</span>
                    </div>

                    <div className="pl-3 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-600 py-0.5">
                        <ChevronDown size={13} className="text-slate-400" />
                        <Folder size={13} className="text-slate-400" />
                        <span>Valve_Group</span>
                      </div>

                      <div className="pl-3 space-y-0.5">
                        <div
                          onClick={() => setSelectedSceneObject('Valve_Handle')}
                          className={`flex items-center justify-between rounded px-1.5 py-1 cursor-pointer transition ${
                            selectedSceneObject === 'Valve_Handle'
                              ? 'bg-blue-100 text-blue-800 font-semibold'
                              : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <Box size={12} className="text-blue-600" />
                            <span>Valve_Handle</span>
                          </div>
                          <Eye size={12} className="text-slate-400 hover:text-slate-600" />
                        </div>

                        <div
                          onClick={() => setSelectedSceneObject('Valve_Base')}
                          className={`flex items-center justify-between rounded px-1.5 py-1 cursor-pointer transition ${
                            selectedSceneObject === 'Valve_Base'
                              ? 'bg-blue-100 text-blue-800 font-semibold'
                              : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <Box size={12} className="text-slate-400" />
                            <span>Valve_Base</span>
                          </div>
                          <Eye size={12} className="text-slate-400 hover:text-slate-600" />
                        </div>
                      </div>
                    </div>

                    {['Pipe_01', 'Pipe_02', 'Motor', 'Control_Panel'].map((item) => (
                      <div key={item} className="pl-3 flex items-center justify-between text-slate-600 py-0.5 hover:bg-slate-50 px-1 rounded cursor-pointer">
                        <div className="flex items-center gap-1.5">
                          <ChevronRight size={13} className="text-slate-400" />
                          <Folder size={13} className="text-slate-400" />
                          <span>{item}</span>
                        </div>
                        <Eye size={12} className="text-slate-400" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-slate-600 py-0.5 hover:bg-slate-50 px-1 rounded cursor-pointer">
                  <div className="flex items-center gap-1.5">
                    <ChevronRight size={13} className="text-slate-400" />
                    <Globe size={13} className="text-emerald-500" />
                    <span>Environment</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col p-3 space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-2">
              <div className="flex items-center gap-2">
                <Variable size={14} className="text-purple-600" />
                <span className="font-semibold text-slate-800">pressure</span>
              </div>
              <span className="rounded bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700">50 (number)</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-2">
              <div className="flex items-center gap-2">
                <Variable size={14} className="text-purple-600" />
                <span className="font-semibold text-slate-800">isOpen</span>
              </div>
              <span className="rounded bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700">true (boolean)</span>
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM HALF: Node Properties Inspector */}
      <div className="flex flex-1 flex-col overflow-hidden bg-white">
        {/* Inspector Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-3 py-2">
          <div className="flex items-center gap-1.5">
            <Sliders size={14} className="text-blue-600" />
            <h3 className="text-xs font-bold text-slate-800">Node Properties</h3>
          </div>
          {selectedNode && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => duplicateNode(selectedNode.id)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                title="Duplicate Node"
              >
                <Copy size={13} />
              </button>
              <button
                type="button"
                onClick={() => deleteNode(selectedNode.id)}
                className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                title="Delete Node"
              >
                <Trash2 size={13} />
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="no-scrollbar flex-1 overflow-y-auto p-3 space-y-3">
          {selectedNode ? (
            <>
              {/* Node Type Badge */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500">Node Type</label>
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded bg-red-100 text-red-600 font-bold">
                    <Zap size={12} />
                  </div>
                  <span className="text-xs font-bold text-slate-800">{selectedNode.name}</span>
                </div>
              </div>

              {/* Target Object Dropdown */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500">Target Object</label>
                <select
                  value={selectedNode.properties?.targetObject || 'Valve_Handle'}
                  onChange={(e) => updateNodeProperties(selectedNode.id, { targetObject: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none shadow-2xs"
                >
                  <option value="Valve_Handle">Valve_Handle</option>
                  <option value="Valve_Base">Valve_Base</option>
                  <option value="Pipe_01">Pipe_01</option>
                  <option value="Motor">Motor</option>
                </select>
              </div>

              {/* Dynamic Schemas */}
              {schemas.map((item) => {
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
                    <div key={item.name} className="flex items-center justify-between py-1">
                      <label className="text-xs font-semibold text-slate-700">{item.label}</label>
                      <input
                        type="checkbox"
                        checked={Boolean(currentValue)}
                        onChange={(e) => updateNodeProperties(selectedNode.id, { [item.name]: e.target.checked })}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-0"
                      />
                    </div>
                  );
                }

                if (item.type === 'select' && item.options) {
                  return (
                    <div key={item.name} className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-500">{item.label}</label>
                      <select
                        value={currentValue}
                        onChange={(e) => updateNodeProperties(selectedNode.id, { [item.name]: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none shadow-2xs"
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
                  <div key={item.name} className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-500">{item.label}</label>
                    <input
                      type={item.type === 'number' ? 'number' : 'text'}
                      value={currentValue}
                      onChange={(e) =>
                        updateNodeProperties(selectedNode.id, {
                          [item.name]: item.type === 'number' ? Number(e.target.value) : e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none shadow-2xs"
                    />
                  </div>
                );
              })}

              {/* Event Type */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500">Event Type</label>
                <select className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none shadow-2xs">
                  <option value="click">Click</option>
                  <option value="hover">Hover</option>
                  <option value="load">Load</option>
                </select>
              </div>

              {/* Debounce */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500">Debounce (ms)</label>
                <input
                  type="number"
                  defaultValue={0}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none shadow-2xs"
                />
              </div>

              {/* Advanced Collapsible Accordion */}
              <div className="border-t border-slate-100 pt-2">
                <button
                  type="button"
                  onClick={() => setAdvancedExpanded(!advancedExpanded)}
                  className="flex w-full items-center justify-between text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  <span>Advanced</span>
                  {advancedExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                {advancedExpanded && (
                  <div className="mt-2 space-y-2 text-[11px] text-slate-500 pl-2">
                    <div>Execution Priority: 1</div>
                    <div>Async Non-blocking: Enabled</div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              Select a node on the canvas to edit its properties.
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

