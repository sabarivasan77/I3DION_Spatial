import React, { useState } from 'react';
import { useStudioStore } from '../store/useStudioStore';
import { LogicCanvas } from '../../logic/components/LogicCanvas';
import { LogicNodeLibrary } from '../../logic/components/LogicNodeLibrary';
import { LogicInspector } from '../../logic/components/LogicInspector';
import { LogicToolbar } from '../../logic/components/LogicToolbar';
import { IScriptEditor } from '../../scripting/components/IScriptEditor';
import { IScriptProblems } from '../../scripting/components/IScriptProblems';
import { IScriptParser } from '../../scripting/parser/iscriptParser';
import { IScriptValidator } from '../../scripting/validation/iscriptValidator';
import { IScriptProblem } from '../../scripting/types/iscriptTypes';
import { LogicCraftBridge } from '../../scripting/integration/logicCraftBridge';
import { useLogicCraftStore } from '../../logic/store/useLogicCraftStore';
import { Code2, Workflow, FileText, ArrowRight } from 'lucide-react';

export const SpatialLogicSection: React.FC = () => {
  const { experience } = useStudioStore();
  const widgets = experience.widgets || [];

  const [selectedTargetId, setSelectedTargetId] = useState<string>(
    widgets.length > 0 ? widgets[0].id : 'scene_global'
  );
  const [activeSubTab, setActiveSubTab] = useState<'nodes' | 'iscript'>('nodes');

  const getActiveGraph = useLogicCraftStore((s) => s.getActiveGraph);
  const deserializeGraph = useLogicCraftStore((s) => s.deserializeGraphIntoActive);

  const [scriptText, setScriptText] = useState<string>(() => {
    const graph = getActiveGraph();
    return LogicCraftBridge.graphToIScript(graph);
  });

  const [problems, setProblems] = useState<IScriptProblem[]>([]);

  const selectedWidget = widgets.find((w) => w.id === selectedTargetId);

  const handleScriptChange = (newVal: string) => {
    setScriptText(newVal);
    const parser = new IScriptParser();
    const program = parser.parse(newVal);
    setProblems(IScriptValidator.validate(program, parser.problems));
  };

  const handleSyncToVisualNodes = () => {
    const { graph, problems: parseProblems } = LogicCraftBridge.iscriptToGraph(scriptText);
    if (parseProblems.length === 0) {
      deserializeGraph(JSON.stringify(graph));
      setActiveSubTab('nodes');
    }
  };

  return (
    <div className="flex flex-1 flex-col h-full bg-slate-50 text-slate-800 select-none overflow-hidden">
      {/* Section Header & Target Selector */}
      <div className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
              <Workflow size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Spatial Logic & Functions</h2>
              <p className="text-[11px] text-slate-500">Configure visual node flows and custom function scripts</p>
            </div>
          </div>

          {/* Model / Widget Target Selector */}
          <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
            <span className="text-xs font-semibold text-slate-500">Select Model / Entity:</span>
            <select
              value={selectedTargetId}
              onChange={(e) => setSelectedTargetId(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none"
            >
              {widgets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name || w.id} ({w.type})
                </option>
              ))}
              <option value="scene_global">Global Scene (Root Handler)</option>
            </select>
          </div>
        </div>

        {/* View Mode Toggle: Visual Nodes vs iScript */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100 p-1">
            <button
              onClick={() => setActiveSubTab('nodes')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition ${
                activeSubTab === 'nodes'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Workflow size={14} />
              <span>Visual Nodes</span>
            </button>

            <button
              onClick={() => setActiveSubTab('iscript')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition ${
                activeSubTab === 'iscript'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Code2 size={14} />
              <span>Function Script (iScript)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Body */}
      {activeSubTab === 'nodes' ? (
        <div className="flex flex-1 flex-col overflow-hidden bg-white">
          <LogicToolbar />
          <div className="relative flex flex-1 overflow-hidden">
            <LogicNodeLibrary />
            <div className="relative flex-1 flex flex-col overflow-hidden border-r border-slate-200">
              <LogicCanvas />
            </div>
            <LogicInspector />
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col overflow-hidden bg-slate-50 p-6">
          <div className="flex flex-1 flex-col rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <FileText size={15} className="text-blue-600" />
                <span>Function Routine for: <strong>{selectedWidget?.name || 'Global Scene'}</strong></span>
              </div>
              <button
                onClick={handleSyncToVisualNodes}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
              >
                <span>Compile to Visual Nodes</span>
                <ArrowRight size={13} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col">
              <IScriptEditor
                value={scriptText}
                onChange={handleScriptChange}
              />
              {problems.length > 0 && (
                <div className="h-32 border-t border-slate-200">
                  <IScriptProblems problems={problems} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
