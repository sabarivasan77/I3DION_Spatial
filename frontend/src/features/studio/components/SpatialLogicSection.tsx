import React, { useState } from 'react';
import { useStudioStore } from '../store/useStudioStore';
import { LogicCanvas } from '../../logic/components/LogicCanvas';
import { LogicNodeLibrary } from '../../logic/components/LogicNodeLibrary';
import { LogicInspector } from '../../logic/components/LogicInspector';
import { IScriptEditor } from '../../scripting/components/IScriptEditor';
import { IScriptProblems } from '../../scripting/components/IScriptProblems';
import { IScriptParser } from '../../scripting/parser/iscriptParser';
import { IScriptValidator } from '../../scripting/validation/iscriptValidator';
import { IScriptProblem } from '../../scripting/types/iscriptTypes';
import { LogicCraftBridge } from '../../scripting/integration/logicCraftBridge';
import { useLogicCraftStore } from '../../logic/store/useLogicCraftStore';
import ThreeProduct from '../../../components/ThreeProduct';
import {
  Code2,
  Workflow,
  FileText,
  ArrowRight,
  Sparkles,
  Maximize2,
  Minus,
  Plus,
  Box,
  Hand,
  Search,
  Focus,
  Eye,
} from 'lucide-react';

export const SpatialLogicSection: React.FC = () => {
  const { experience } = useStudioStore();
  const widgets = experience.widgets || [];

  const [activeSubTab, setActiveSubTab] = useState<'nodes' | 'iscript'>('nodes');
  const [consoleTab, setConsoleTab] = useState<'console' | 'events'>('console');
  const [shadingMode, setShadingMode] = useState<string>('Realistic');

  const getActiveGraph = useLogicCraftStore((s) => s.getActiveGraph);
  const deserializeGraph = useLogicCraftStore((s) => s.deserializeGraphIntoActive);
  const zoomLevel = useLogicCraftStore((s) => s.zoomLevel);
  const setZoomLevel = useLogicCraftStore((s) => s.setZoomLevel);

  const [scriptText, setScriptText] = useState<string>(() => {
    const graph = getActiveGraph();
    return LogicCraftBridge.graphToIScript(graph);
  });

  const [problems, setProblems] = useState<IScriptProblem[]>([]);
  const selectedWidget = widgets.length > 0 ? widgets[0] : null;

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
    <div className="flex flex-1 flex-col h-full bg-slate-100 text-slate-800 select-none overflow-hidden">
      {/* Crafting Header Toolbar */}
      <div className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-5 shadow-2xs shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 text-white shadow-sm">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">3D Interaction Logic (Crafting)</h2>
            </div>
            <p className="text-[11px] text-slate-500">Connect events, actions and logic to create interactive 3D experiences</p>
          </div>
        </div>

        {/* Zoom & Viewport Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-1">
            <button
              onClick={() => setZoomLevel(1)}
              className="flex items-center gap-1 rounded bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-100"
            >
              <Focus size={13} />
              <span>Fit View</span>
            </button>

            <div className="h-4 w-[1px] bg-slate-200" />

            <button
              onClick={() => setZoomLevel(Math.max(0.4, zoomLevel - 0.1))}
              className="rounded p-1 text-slate-600 hover:bg-white hover:shadow-2xs"
            >
              <Minus size={13} />
            </button>
            <span className="w-12 text-center text-xs font-bold font-mono text-slate-700">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel(Math.min(2.0, zoomLevel + 0.1))}
              className="rounded p-1 text-slate-600 hover:bg-white hover:shadow-2xs"
            >
              <Plus size={13} />
            </button>

            <div className="h-4 w-[1px] bg-slate-200" />

            <button className="rounded p-1 text-slate-600 hover:bg-white hover:shadow-2xs">
              <Maximize2 size={13} />
            </button>
          </div>

          {/* Sub-tab Switcher: Visual Nodes vs iScript */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100 p-1">
            <button
              onClick={() => setActiveSubTab('nodes')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition ${
                activeSubTab === 'nodes'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Workflow size={13} />
              <span>Visual Nodes</span>
            </button>

            <button
              onClick={() => setActiveSubTab('iscript')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition ${
                activeSubTab === 'iscript'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Code2 size={13} />
              <span>Script (iScript)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Body */}
      {activeSubTab === 'nodes' ? (
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Main Workspace (Nodes Library + Graph Canvas + Right Inspector) */}
          <div className="relative flex flex-1 overflow-hidden">
            <LogicNodeLibrary />

            {/* Middle Section: Node Canvas + Bottom Split Row */}
            <div className="relative flex-1 flex flex-col overflow-hidden border-r border-slate-200">
              {/* Node Canvas (~65% Height) */}
              <div className="flex-1 overflow-hidden flex flex-col">
                <LogicCanvas />
              </div>

              {/* Bottom Split Row (~35% Height): 3D Model Preview + Console Logs */}
              <div className="h-64 border-t border-slate-200 bg-white flex shrink-0">
                {/* Left 60%: 3D Model Preview */}
                <div className="w-[60%] border-r border-slate-200 flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-1.5">
                    <div className="flex items-center gap-2">
                      <Box size={14} className="text-blue-600" />
                      <span className="text-xs font-bold text-slate-800">3D Model Preview</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={shadingMode}
                        onChange={(e) => setShadingMode(e.target.value)}
                        className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700 focus:outline-none"
                      >
                        <option value="Realistic">Realistic</option>
                        <option value="Wireframe">Wireframe</option>
                        <option value="Flat">Flat</option>
                      </select>
                      <button className="rounded p-1 text-slate-500 hover:bg-slate-200">
                        <Maximize2 size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Embedded 3D Canvas Area */}
                  <div className="relative flex-1 bg-slate-900 overflow-hidden">
                    {/* Viewport Overlay Tools */}
                    <div className="absolute left-3 top-3 z-10 flex flex-col gap-1.5 rounded-lg bg-slate-950/80 p-1 text-slate-300 border border-slate-800 backdrop-blur-xs">
                      <button className="rounded p-1 hover:bg-slate-800 hover:text-white" title="Orbit">
                        <Focus size={13} />
                      </button>
                      <button className="rounded p-1 hover:bg-slate-800 hover:text-white" title="Pan">
                        <Hand size={13} />
                      </button>
                      <button className="rounded p-1 hover:bg-slate-800 hover:text-white" title="Zoom">
                        <Search size={13} />
                      </button>
                      <button className="rounded p-1 hover:bg-slate-800 hover:text-white" title="Focus">
                        <Eye size={13} />
                      </button>
                    </div>

                    {/* ThreeProduct 3D Viewer Canvas */}
                    <div className="h-full w-full">
                      <ThreeProduct
                        modelUrl="/models/industrial_compressor.glb"
                        autoRotate={false}
                      />
                    </div>
                  </div>
                </div>

                {/* Right 40%: Console / Events Log */}
                <div className="w-[40%] flex flex-col overflow-hidden bg-white">
                  {/* Console Header Tabs */}
                  <div className="flex items-center border-b border-slate-200 bg-slate-50 px-3">
                    <button
                      onClick={() => setConsoleTab('console')}
                      className={`px-3 py-2 text-xs font-bold transition border-b-2 ${
                        consoleTab === 'console'
                          ? 'border-blue-600 text-blue-600 bg-white'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Console
                    </button>
                    <button
                      onClick={() => setConsoleTab('events')}
                      className={`px-3 py-2 text-xs font-bold transition border-b-2 ${
                        consoleTab === 'events'
                          ? 'border-blue-600 text-blue-600 bg-white'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Events
                    </button>
                  </div>

                  {/* Log Stream Output */}
                  <div className="no-scrollbar flex-1 overflow-y-auto p-3 font-mono text-[11px] space-y-1.5 bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">10:24:01</span>
                      <span className="rounded bg-blue-100 px-1 py-0.2 text-[9px] font-bold text-blue-700">[INFO]</span>
                      <span className="text-slate-700">Scene loaded successfully</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">10:24:02</span>
                      <span className="rounded bg-blue-100 px-1 py-0.2 text-[9px] font-bold text-blue-700">[INFO]</span>
                      <span className="text-slate-700">Logic graph initialized</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">10:24:02</span>
                      <span className="rounded bg-blue-100 px-1 py-0.2 text-[9px] font-bold text-blue-700">[INFO]</span>
                      <span className="text-slate-700">12 nodes active</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">10:24:05</span>
                      <span className="rounded bg-amber-100 px-1 py-0.2 text-[9px] font-bold text-amber-700">[EVENT]</span>
                      <span className="text-slate-800 font-semibold">Valve_Handle clicked</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">10:24:05</span>
                      <span className="rounded bg-emerald-100 px-1 py-0.2 text-[9px] font-bold text-emerald-700">[ACTION]</span>
                      <span className="text-slate-800">Play animation: Open</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">10:24:05</span>
                      <span className="rounded bg-purple-100 px-1 py-0.2 text-[9px] font-bold text-purple-700">[UI]</span>
                      <span className="text-slate-800">Show tooltip: Valve Opened</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">10:24:08</span>
                      <span className="rounded bg-blue-100 px-1 py-0.2 text-[9px] font-bold text-blue-700">[INFO]</span>
                      <span className="text-slate-700">Animation completed</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side Inspector & Scene Hierarchy Tree */}
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

