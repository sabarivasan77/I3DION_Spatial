import React from 'react';
import { useEngineStore } from '../store/useEngineStore';
import { ArrowLeft, Play, Box, Smartphone, Mail, FileText, Monitor, Tablet, RotateCcw } from 'lucide-react';

export const FullPreviewView: React.FC = () => {
  const { currentProject, setActiveMode, triggerLogicEvent, runtimeVars } = useEngineStore();

  const handleAction = (actionId: string) => {
    triggerLogicEvent(actionId);
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-slate-950 font-sans select-none flex flex-col items-center justify-center">
      {/* 1. Floating Top Left Exit Preview Button */}
      <div className="absolute top-4 left-4 z-50">
        <button
          onClick={() => setActiveMode('ui')}
          className="flex items-center gap-2 rounded-xl bg-slate-900/90 hover:bg-slate-900 border border-slate-700/80 px-4 py-2 text-xs font-bold text-white shadow-2xl backdrop-blur-md transition active:scale-95"
        >
          <ArrowLeft size={16} />
          <span>Exit Preview</span>
        </button>
      </div>

      {/* 2. Floating Top Right Viewport Indicators */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-300 backdrop-blur-md shadow-2xl font-bold">
        <Monitor size={14} className="text-[#E94B4B]" />
        <span>Full Runtime Preview (100%)</span>
      </div>

      {/* 3. Full Viewport WebGL Canvas Representation */}
      <div className="w-full h-full relative flex items-center justify-center">
        <img
          src={currentProject.thumbnailUrl}
          alt={currentProject.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-slate-950/40" />

        {/* Floating Product Interactive Card (Matching Reference Image D) */}
        <div className="absolute right-8 bottom-8 md:right-12 md:bottom-12 max-w-sm w-full bg-slate-900/90 border border-slate-700/80 p-6 rounded-2xl shadow-2xl backdrop-blur-xl space-y-4 text-white">
          <div>
            <h2 className="text-xl font-black tracking-tight">{currentProject.name}</h2>
            <p className="text-xs text-slate-300 mt-1 line-clamp-2">
              {currentProject.description || 'High performance industrial 3D model.'}
            </p>

            {runtimeVars.machineState === 'running' && (
              <div className="mt-3 inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>STATE: RUNNING (1450 RPM)</span>
              </div>
            )}
          </div>

          <div className="space-y-2.5 pt-2">
            <button
              onClick={() => handleAction('btnStart')}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold text-xs flex items-center gap-2.5 transition active:scale-95 shadow-md"
            >
              <Play size={16} className="text-[#E94B4B] fill-[#E94B4B]" />
              <span>Play Animation</span>
            </button>

            <button
              onClick={() => handleAction('btnExplode')}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold text-xs flex items-center gap-2.5 transition active:scale-95 shadow-md"
            >
              <Box size={16} className="text-sky-400" />
              <span>Explode View</span>
            </button>

            <button
              onClick={() => handleAction('btnAR')}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold text-xs flex items-center gap-2.5 transition active:scale-95 shadow-md"
            >
              <Smartphone size={16} className="text-purple-400" />
              <span>AR View</span>
            </button>

            <button
              onClick={() => handleAction('btnQuote')}
              className="w-full py-3 px-4 rounded-xl bg-[#E94B4B] hover:bg-[#D63B3B] text-white font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-xl"
            >
              <Mail size={16} />
              <span>Request Quote</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
