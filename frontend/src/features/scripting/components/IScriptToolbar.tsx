import React from 'react';
import { Code2, Play, Sparkles, X, Layers } from 'lucide-react';

export interface IScriptToolbarProps {
  onRun: () => void;
  onFormat: () => void;
  onSyncVisual: () => void;
  onLoadExample: (exampleText: string) => void;
  onClose: () => void;
}

export const IScriptToolbar: React.FC<IScriptToolbarProps> = ({
  onRun,
  onFormat,
  onSyncVisual,
  onLoadExample,
  onClose,
}) => {
  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-purple-900/50 bg-slate-950 px-6 text-slate-100 shadow-md select-none">
      {/* Brand & Language Title */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-lg">
          <Code2 size={22} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-white">I3DION Script (iScript)</h1>
            <span className="rounded-full bg-purple-950 px-2.5 py-0.5 text-[11px] font-semibold text-purple-300 border border-purple-800">
              Phase 6 — Sentential Code Language
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Write human-readable sentence commands for OmniStudio widgets and 3D models
          </p>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-3">
        {/* Quick Insert Examples Dropdown */}
        <select
          onChange={(e) => {
            if (e.target.value) {
              onLoadExample(e.target.value);
              e.target.value = '';
            }
          }}
          className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 focus:border-purple-500 focus:outline-none"
        >
          <option value="">Load Example Snippet...</option>
          <option value={'# Product Animation Example\nWHEN Button_01 IS CLICKED\nDO\n    PLAY ANIMATION "Open" ON Model_01\n    WAIT 2 SECONDS\n    SHOW Widget_02\n'}>
            1. Show & Animation Sequence
          </option>
          <option value={'# 3D Mesh Object Focus\nWHEN Hotspot_01 IS CLICKED\nDO\n    FOCUS OBJECT "Impeller_01" ON Model_01\n    SET CAMERA "Isometric" ON Model_01\n'}>
            2. 3D Object Focus & Camera
          </option>
          <option value={'# Variable & Condition Branch\nSET VARIABLE mode TO "demo"\n\nIF mode IS "demo"\nDO\n    SHOW Widget_02\n'}>
            3. Variables & Conditions
          </option>
        </select>

        {/* Sync to Visual Node Canvas */}
        <button
          type="button"
          onClick={onSyncVisual}
          className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-950/60 px-3 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-900/80 transition-all"
          title="Synchronize iScript to LogicCraft Visual Graph Canvas"
        >
          <Layers size={15} />
          <span>Sync to Visual</span>
        </button>

        {/* Format Script */}
        <button
          type="button"
          onClick={onFormat}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-all"
          title="Format Code Indentation and Keywords"
        >
          <Sparkles size={15} className="text-purple-400" />
          <span>Format</span>
        </button>

        {/* Run Script */}
        <button
          type="button"
          onClick={onRun}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:from-purple-500 hover:to-indigo-500 transition-all active:scale-95"
        >
          <Play size={15} />
          <span>▶ Run Script</span>
        </button>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-all ml-2"
        >
          <X size={20} />
        </button>
      </div>
    </header>
  );
};
