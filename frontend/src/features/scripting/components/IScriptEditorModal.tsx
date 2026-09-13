import React, { useState, useEffect } from 'react';
import { IScriptToolbar } from './IScriptToolbar';
import { IScriptEditor } from './IScriptEditor';
import { IScriptProblems } from './IScriptProblems';
import { LogicCraftBridge } from '../integration/logicCraftBridge';
import { IScriptValidator } from '../validation/iscriptValidator';
import { IScriptParser } from '../parser/iscriptParser';
import { IScriptRuntimeAdapter } from '../runtime/iscriptRuntimeAdapter';
import { useLogicCraftStore } from '../../logic/store/useLogicCraftStore';
import { useRuntimeStore } from '../../logic/runtime/runtimeContext';
import { IScriptProblem } from '../types/iscriptTypes';
import { BookOpen, Sparkles } from 'lucide-react';

export interface IScriptEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IScriptEditorModal: React.FC<IScriptEditorModalProps> = ({ isOpen, onClose }) => {
  const getActiveGraph = useLogicCraftStore((s) => s.getActiveGraph);
  const deserializeGraph = useLogicCraftStore((s) => s.deserializeGraphIntoActive);

  const [scriptText, setScriptText] = useState<string>('');
  const [problems, setProblems] = useState<IScriptProblem[]>([]);

  useEffect(() => {
    if (isOpen) {
      const activeGraph = getActiveGraph();
      const initialScript = LogicCraftBridge.graphToIScript(activeGraph);
      setScriptText(initialScript);

      const parser = new IScriptParser();
      const program = parser.parse(initialScript);
      setProblems(IScriptValidator.validate(program, parser.problems));
    }
  }, [isOpen, getActiveGraph]);

  if (!isOpen) return null;

  const handleScriptChange = (newVal: string) => {
    setScriptText(newVal);
    const parser = new IScriptParser();
    const program = parser.parse(newVal);
    setProblems(IScriptValidator.validate(program, parser.problems));
  };

  const handleFormat = () => {
    // Simple deterministic formatting: uppercase keywords, indent DO blocks
    const lines = scriptText.split('\n');
    let inDoBlock = false;
    const formatted = lines
      .map((line) => {
        let trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return line;

        if (trimmed.startsWith('WHEN ')) {
          inDoBlock = false;
          return trimmed.toUpperCase();
        }
        if (trimmed === 'DO' || trimmed === 'do') {
          inDoBlock = true;
          return 'DO';
        }
        if (inDoBlock) {
          return `    ${trimmed}`;
        }
        return trimmed;
      })
      .join('\n');

    handleScriptChange(formatted);
  };

  const handleSyncVisual = () => {
    const { graph, problems: parseProblems } = LogicCraftBridge.iscriptToGraph(scriptText);
    if (parseProblems.length === 0) {
      deserializeGraph(JSON.stringify(graph));
    }
  };

  const handleRunScript = () => {
    const outcome = IScriptRuntimeAdapter.executeScript(scriptText);
    setProblems(outcome.problems);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-in fade-in select-none">
      <div className="flex h-[94vh] w-full max-w-7xl flex-col rounded-2xl bg-slate-900 shadow-2xl overflow-hidden border border-purple-900/50 text-slate-100">
        {/* Toolbar Header */}
        <IScriptToolbar
          onRun={handleRunScript}
          onFormat={handleFormat}
          onSyncVisual={handleSyncVisual}
          onLoadExample={(exText) => handleScriptChange(exText)}
          onClose={onClose}
        />

        {/* Main Body Workspace */}
        <div className="relative flex flex-1 overflow-hidden">
          {/* Left Command Palette / Reference Sidebar */}
          <div className="w-64 border-r border-slate-800 bg-slate-950 p-4 flex flex-col justify-between overflow-y-auto no-scrollbar font-sans">
            <div>
              <div className="flex items-center gap-2 mb-3 text-xs font-bold text-purple-400 uppercase tracking-wider">
                <BookOpen size={14} />
                <span>Command Vocabulary</span>
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <h4 className="font-bold text-slate-300 text-[11px] uppercase">Triggers</h4>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">WHEN &lt;widget&gt; IS CLICKED</p>
                  <p className="text-[10px] text-slate-500 font-mono">WHEN &lt;model&gt; IS LOADED</p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-300 text-[11px] uppercase">Actions</h4>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">SHOW &lt;widget&gt;</p>
                  <p className="text-[10px] text-slate-500 font-mono">HIDE &lt;widget&gt;</p>
                  <p className="text-[10px] text-slate-500 font-mono">PLAY ANIMATION "Open" ON &lt;model&gt;</p>
                  <p className="text-[10px] text-slate-500 font-mono">SET CAMERA "Front" ON &lt;model&gt;</p>
                  <p className="text-[10px] text-slate-500 font-mono">FOCUS OBJECT "Impeller_01" ON &lt;model&gt;</p>
                  <p className="text-[10px] text-slate-500 font-mono">WAIT 2 SECONDS</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-purple-900/40 bg-purple-950/30 p-3 text-[11px] text-purple-300">
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <Sparkles size={13} className="text-purple-400" />
                <span>Visual Dual-Sync</span>
              </div>
              <p className="text-[10px] text-purple-300/80 leading-relaxed">
                Click "Sync to Visual" to reflect text instructions as visual nodes in LogicCraft.
              </p>
            </div>
          </div>

          {/* Center Code Editor */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <IScriptEditor value={scriptText} onChange={handleScriptChange} />
          </div>
        </div>

        {/* Bottom Diagnostics Problems Panel */}
        <IScriptProblems problems={problems} />
      </div>
    </div>
  );
};
