import React from 'react';
import { useEngineStore } from '../store/useEngineStore';
import { Play, Sparkles, Box, FileText, Mail, Maximize2, RotateCcw, Smartphone } from 'lucide-react';

export const MiniLivePreview: React.FC = () => {
  const { currentProject, triggerLogicEvent, setIsRunning, runtimeVars } = useEngineStore();

  const handleAction = (actionName: string) => {
    setIsRunning(true);
    triggerLogicEvent(actionName);
  };

  return (
    <div className="w-80 lg:w-96 h-full bg-slate-900 border-l border-slate-700/80 flex flex-col overflow-hidden select-none shadow-2xl relative">
      {/* Header */}
      <div className="px-3 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs font-bold text-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Preview (Mini)</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400">
          <button title="Reset Scene" className="p-1 hover:text-white rounded hover:bg-slate-800">
            <RotateCcw size={13} />
          </button>
          <button title="Fullscreen Preview" className="p-1 hover:text-white rounded hover:bg-slate-800">
            <Maximize2 size={13} />
          </button>
        </div>
      </div>

      {/* Mini Viewport Body */}
      <div className="flex-1 relative bg-slate-900 overflow-hidden flex flex-col justify-between p-4">
        {/* Background 3D Model Image */}
        <div className="absolute inset-0 z-0 flex items-center justify-center opacity-80">
          <img
            src={currentProject.thumbnailUrl}
            alt="Mini 3D Model"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        </div>

        {/* Top Info Badge */}
        <div className="relative z-10">
          <div className="font-bold text-white text-sm">{currentProject.name}</div>
          <div className="text-[11px] text-slate-300 mt-0.5 line-clamp-1">
            {currentProject.description || 'High performance industrial 3D model.'}
          </div>
          {runtimeVars.machineState === 'running' && (
            <div className="mt-2 inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>State: RUNNING (1450 RPM)</span>
            </div>
          )}
        </div>

        {/* Interactive Overlay Buttons Stack (matching reference image) */}
        <div className="relative z-10 space-y-2 mt-auto pt-4">
          <button
            onClick={() => handleAction('btnStart')}
            className="w-full py-2 px-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-white font-bold text-xs flex items-center gap-2 transition active:scale-95 shadow-md backdrop-blur-md"
          >
            <Play size={14} className="text-[#E94B4B] fill-[#E94B4B]" />
            <span>Play Animation</span>
          </button>

          <button
            onClick={() => handleAction('btnExplode')}
            className="w-full py-2 px-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 font-bold text-xs flex items-center gap-2 transition active:scale-95 shadow-md backdrop-blur-md"
          >
            <Box size={14} className="text-sky-400" />
            <span>Explode View</span>
          </button>

          <button
            onClick={() => handleAction('btnAR')}
            className="w-full py-2 px-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 font-bold text-xs flex items-center gap-2 transition active:scale-95 shadow-md backdrop-blur-md"
          >
            <Smartphone size={14} className="text-purple-400" />
            <span>AR View</span>
          </button>

          <button
            onClick={() => handleAction('btnQuote')}
            className="w-full py-2 px-3 rounded-xl bg-[#E94B4B] hover:bg-[#D63B3B] text-white font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-lg"
          >
            <Mail size={14} />
            <span>Request Quote</span>
          </button>
        </div>
      </div>
    </div>
  );
};
