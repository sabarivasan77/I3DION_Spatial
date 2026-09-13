import React, { useState } from 'react';
import { useLogicCraftStore } from '../store/useLogicCraftStore';
import { useLogicStore } from '../store/useLogicStore';
import { LogicToolbar } from './LogicToolbar';
import { LogicNodeLibrary } from './LogicNodeLibrary';
import { LogicCanvas } from './LogicCanvas';
import { LogicInspector } from './LogicInspector';
import { LogicMiniMap } from './LogicMiniMap';
import { LogicDebugPanel } from './LogicDebugPanel';
import { LogicRuleBuilder } from './LogicRuleBuilder';
import { X, Code2, Zap, Layers } from 'lucide-react';

export const LogicCraftPanel: React.FC = () => {
  const craftStore = useLogicCraftStore();
  const ruleStore = useLogicStore();
  const [activeTab, setActiveTab] = useState<'graph' | 'rules'>('graph');

  const isOpen = craftStore.isLogicPanelOpen || ruleStore.isLogicPanelOpen;

  if (!isOpen) return null;

  const handleClose = () => {
    craftStore.closeLogicPanel();
    ruleStore.closeLogicPanel();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-in fade-in select-none">
      <div className="flex h-[94vh] w-full max-w-7xl flex-col rounded-2xl bg-slate-900 shadow-2xl overflow-hidden border border-slate-800 text-slate-100">
        {/* Top Header / View Switcher */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-md">
              <Zap size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">
                  I3DION LogicCraft
                </h2>
                <span className="rounded-full bg-indigo-950 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-300 border border-indigo-800">
                  Phase 5 — Runtime Engine
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Connect triggers, conditions, 3D animations, and widget actions without traditional coding
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center rounded-xl border border-slate-800 bg-slate-950 p-1">
              <button
                type="button"
                onClick={() => setActiveTab('graph')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  activeTab === 'graph'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers size={14} />
                <span>Node Canvas</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('rules')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  activeTab === 'rules'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Zap size={14} />
                <span>Rules List</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* View Mode Content */}
        {activeTab === 'graph' ? (
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Toolbar */}
            <LogicToolbar />

            {/* Main Visual Node Workspace */}
            <div className="relative flex flex-1 overflow-hidden">
              {/* Left Node Library */}
              <LogicNodeLibrary />

              {/* Center Node Canvas */}
              <div className="relative flex-1 flex flex-col overflow-hidden">
                <LogicCanvas />
                <LogicMiniMap />
              </div>

              {/* Right Logic Inspector */}
              <LogicInspector />
            </div>

            {/* Bottom Runtime Console & Debug Logs */}
            <LogicDebugPanel />
          </div>
        ) : (
          /* Rules List Mode */
          <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto p-6 bg-slate-950">
            <div className="flex items-center justify-between rounded-xl border border-purple-900/50 bg-purple-950/30 p-3.5 text-xs text-purple-200">
              <div className="flex items-center gap-2">
                <Code2 size={18} className="text-purple-400" />
                <span>
                  <strong>iScript AST Sync:</strong> Both visual rules and node graphs compile into standard deterministic <strong>I3DION Script (iScript)</strong> AST nodes.
                </span>
              </div>
            </div>

            {ruleStore.rules && ruleStore.rules.length > 0 ? (
              ruleStore.rules.map((rule) => <LogicRuleBuilder key={rule.id} rule={rule} />)
            ) : (
              <div className="flex h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/50 text-center">
                <Zap size={36} className="mb-2 text-slate-600" />
                <h3 className="text-sm font-bold text-slate-400">No Quick Rules Configured</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Switch to the "Node Canvas" view to build visual graph flows.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

