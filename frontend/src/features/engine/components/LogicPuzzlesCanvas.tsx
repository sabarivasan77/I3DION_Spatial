import React, { useState } from 'react';
import { useEngineStore } from '../store/useEngineStore';
import { LogicNode, LogicConnection } from '../types/engineTypes';
import {
  Zap,
  Play,
  HelpCircle,
  Box,
  Layout,
  Database,
  Repeat,
  Calculator,
  Code,
  Sliders,
  Plus,
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Trash2
} from 'lucide-react';

export const LogicPuzzlesCanvas: React.FC = () => {
  const { currentProject, addLogicNode, deleteLogicNode, updateLogicNodePosition, triggerLogicEvent, setIsRunning } =
    useEngineStore();

  const [activeCategory, setActiveCategory] = useState<string>('events');
  const [blockSearch, setBlockSearch] = useState<string>('');
  const [zoom, setZoom] = useState<number>(90);

  const categories = [
    { id: 'events', label: 'Events', icon: Zap, color: 'bg-rose-50 text-[#E94B4B] border-rose-200' },
    { id: 'actions', label: 'Actions', icon: Play, color: 'bg-amber-50 text-amber-600 border-amber-200' },
    { id: 'conditions', label: 'Conditions', icon: HelpCircle, color: 'bg-sky-50 text-sky-600 border-sky-200' },
    { id: 'objects', label: '3D Objects', icon: Box, color: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
    { id: 'ui', label: 'UI', icon: Layout, color: 'bg-purple-50 text-purple-600 border-purple-200' },
    { id: 'variables', label: 'Data & Variables', icon: Database, color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
    { id: 'loops', label: 'Loops', icon: Repeat, color: 'bg-teal-50 text-teal-600 border-teal-200' },
    { id: 'math', label: 'Math & Logic', icon: Calculator, color: 'bg-blue-50 text-blue-600 border-blue-200' },
    { id: 'functions', label: 'Functions', icon: Code, color: 'bg-pink-50 text-pink-600 border-pink-200' },
    { id: 'custom', label: 'Custom', icon: Sliders, color: 'bg-slate-50 text-slate-600 border-slate-200' }
  ];

  const handleAddBlock = (type: string, title: string, cat: any) => {
    const newNode: LogicNode = {
      id: `block_${Date.now()}`,
      type,
      category: cat,
      title,
      position: { x: 300 + Math.random() * 50, y: 150 + Math.random() * 50 },
      inputs: [{ id: 'in_1', name: 'Exec', type: 'flow' }],
      outputs: [{ id: 'out_1', name: 'Exec', type: 'flow' }],
      properties: {}
    };
    addLogicNode(newNode);
  };

  return (
    <div className="flex-1 h-full flex bg-slate-50 select-none overflow-hidden relative">
      {/* 1. Left Block Categories Sidebar */}
      <div className="w-56 bg-white border-r border-slate-200 flex flex-col shrink-0">
        {/* Search */}
        <div className="p-3 border-b border-slate-200">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search blocks..."
              value={blockSearch}
              onChange={(e) => setBlockSearch(e.target.value)}
              className="w-full pl-8 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#E94B4B]"
            />
          </div>
        </div>

        {/* Categories List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition ${
                  isActive ? `${cat.color} border shadow-xs` : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon size={14} />
                  <span>{cat.label}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Quick Add Palette */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/50 space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Click to Add</div>
          <button
            onClick={() => handleAddBlock('on_click', 'On Click Event', 'events')}
            className="w-full py-1.5 px-2 bg-white border border-rose-200 text-[#E94B4B] rounded-lg text-xs font-bold hover:bg-rose-50 transition text-left flex items-center justify-between"
          >
            <span>+ On Click</span>
            <Zap size={12} />
          </button>
          <button
            onClick={() => handleAddBlock('play_animation', 'Play Animation', 'actions')}
            className="w-full py-1.5 px-2 bg-white border border-amber-200 text-amber-700 rounded-lg text-xs font-bold hover:bg-amber-50 transition text-left flex items-center justify-between"
          >
            <span>+ Play Animation</span>
            <Play size={12} />
          </button>
        </div>
      </div>

      {/* 2. Main Logic Node Graph Canvas */}
      <div className="flex-1 h-full relative overflow-hidden bg-slate-100 flex flex-col">
        {/* Header Toolbar */}
        <div className="h-10 px-4 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between text-xs z-10">
          <div className="font-bold text-slate-700 flex items-center gap-2">
            <span>Interaction Logic (Puzzles)</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500 font-medium">Main Flow</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-lg px-2 py-0.5 text-slate-600 font-bold">
              <button onClick={() => setZoom(Math.max(50, zoom - 10))} className="hover:text-slate-900">
                <ZoomOut size={13} />
              </button>
              <span className="w-9 text-center">{zoom}%</span>
              <button onClick={() => setZoom(Math.min(150, zoom + 10))} className="hover:text-slate-900">
                <ZoomIn size={13} />
              </button>
            </div>

            {/* Run Logic Button */}
            <button
              onClick={() => {
                setIsRunning(true);
                triggerLogicEvent('btnStart');
              }}
              className="flex items-center gap-1.5 px-3 py-1 bg-[#E94B4B] hover:bg-[#D63B3B] text-white font-bold rounded-lg shadow-sm transition active:scale-95"
            >
              <Play size={12} className="fill-current" />
              <span>Run</span>
            </button>
          </div>
        </div>

        {/* Node Graph Interactive Space */}
        <div className="flex-1 w-full h-full relative p-8 overflow-auto bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]">
          {/* Render Nodes matching reference image logic workflow */}
          <div className="relative w-full h-full flex items-start gap-8">
            {currentProject.logicGraph.nodes.map((node) => {
              const isEvent = node.category === 'events';
              const isAction = node.category === 'actions';
              const isVariable = node.category === 'variables';
              const isUI = node.category === 'ui';

              const headerBg = isEvent
                ? 'bg-[#E94B4B] text-white'
                : isAction
                ? 'bg-amber-500 text-white'
                : isVariable
                ? 'bg-emerald-500 text-white'
                : isUI
                ? 'bg-purple-500 text-white'
                : 'bg-slate-700 text-white';

              return (
                <div
                  key={node.id}
                  className="w-56 bg-white rounded-2xl border border-slate-300 shadow-xl overflow-hidden hover:border-[#E94B4B] transition group"
                >
                  {/* Node Header */}
                  <div className={`px-3 py-2 ${headerBg} font-bold text-xs flex items-center justify-between shadow-xs`}>
                    <div className="flex items-center gap-1.5">
                      <Zap size={13} />
                      <span>{node.title}</span>
                    </div>
                    <button
                      onClick={() => deleteLogicNode(node.id)}
                      className="opacity-0 group-hover:opacity-100 hover:text-rose-200 transition"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>

                  {/* Node Properties Body */}
                  <div className="p-3 space-y-2 text-xs bg-slate-50/50">
                    {Object.entries(node.properties).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between text-slate-600 font-medium">
                        <span className="capitalize">{k}:</span>
                        <span className="font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200 font-mono text-[11px]">
                          {String(v)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Node Ports (Flow Sockets) */}
                  <div className="px-3 py-1.5 bg-slate-100/80 border-t border-slate-200 flex items-center justify-between text-[10px] font-bold text-slate-500">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-slate-400" />
                      <span>Exec</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>Exec</span>
                      <span className="w-2 h-2 rounded-full bg-[#E94B4B]" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Left Minimap Navigator */}
          <div className="absolute bottom-4 left-4 w-40 h-24 bg-white/90 border border-slate-300 rounded-xl p-2 shadow-xl backdrop-blur-md hidden sm:block">
            <div className="text-[10px] font-bold text-slate-400 mb-1">MINIMAP</div>
            <div className="w-full h-14 bg-slate-100 rounded border border-slate-200 flex items-center justify-center relative">
              <div className="w-12 h-6 border-2 border-[#E94B4B] rounded bg-rose-50/50" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
