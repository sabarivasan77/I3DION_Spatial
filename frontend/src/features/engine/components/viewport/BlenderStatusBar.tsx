import React from 'react';
import { useEngineStore } from '../../store/useEngineStore';
import { Cloud, Check, Clock, AlertCircle } from 'lucide-react';

interface BlenderStatusBarProps {
  stats: {
    objectCount: number;
    vertexCount: number;
    faceCount: number;
    triangleCount: number;
    memoryMB: number;
  };
}

export const BlenderStatusBar: React.FC<BlenderStatusBarProps> = ({ stats }) => {
  const { currentProject, activeBlenderTool, autosaveStatus } = useEngineStore();

  return (
    <div className="h-6 bg-[#222] border-t border-[#181818] flex items-center justify-between px-3 select-none text-[#888] text-[10px] font-mono z-30">
      {/* 1. Left: Scene Geometry & Object Statistics */}
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1">
          <span className="text-[#aaa] font-bold">Objects:</span>
          <span className="text-white">{stats.objectCount}</span>
        </span>
        <span className="text-[#444]">•</span>
        <span className="flex items-center gap-1">
          <span className="text-[#aaa] font-bold">Verts:</span>
          <span className="text-white">{stats.vertexCount.toLocaleString()}</span>
        </span>
        <span className="text-[#444]">•</span>
        <span className="flex items-center gap-1">
          <span className="text-[#aaa] font-bold">Faces:</span>
          <span className="text-white">{stats.faceCount.toLocaleString()}</span>
        </span>
        <span className="text-[#444]">•</span>
        <span className="flex items-center gap-1">
          <span className="text-[#aaa] font-bold">Tris:</span>
          <span className="text-white">{stats.triangleCount.toLocaleString()}</span>
        </span>
        <span className="text-[#444]">•</span>
        <span className="flex items-center gap-1">
          <span className="text-[#aaa] font-bold">Mem:</span>
          <span className="text-white">{stats.memoryMB.toFixed(1)} MB</span>
        </span>
      </div>

      {/* 2. Center: Keyboard Shortcut Legend */}
      <div className="hidden lg:flex items-center gap-2 text-[#999]">
        <span><strong className="text-white">[G]</strong> Move</span>
        <span className="text-[#444]">|</span>
        <span><strong className="text-white">[R]</strong> Rotate</span>
        <span className="text-[#444]">|</span>
        <span><strong className="text-white">[S]</strong> Scale</span>
        <span className="text-[#444]">|</span>
        <span><strong className="text-white">[X]</strong> Delete</span>
        <span className="text-[#444]">|</span>
        <span><strong className="text-white">[Shift+D]</strong> Duplicate</span>
        <span className="text-[#444]">|</span>
        <span><strong className="text-white">[N]</strong> Sidebar</span>
        <span className="text-[#444]">|</span>
        <span><strong className="text-white">[Ctrl+S]</strong> Save to Vault</span>
      </div>

      {/* 3. Right: Active Tool & Autosave / Vault Sync */}
      <div className="flex items-center gap-2.5">
        <span className="px-1.5 py-0.5 rounded bg-[#2e2e2e] text-[#ea7600] font-sans font-bold text-[9px] uppercase tracking-wider">
          {activeBlenderTool}
        </span>

        <span className="flex items-center gap-1">
          {autosaveStatus === 'saved' ? (
            <>
              <Check size={11} className="text-emerald-400" />
              <span className="text-emerald-400 font-sans">Synced</span>
            </>
          ) : autosaveStatus === 'saving' ? (
            <>
              <Clock size={11} className="text-amber-400 animate-spin" />
              <span className="text-amber-400 font-sans">Syncing to Vault...</span>
            </>
          ) : (
            <>
              <AlertCircle size={11} className="text-slate-400" />
              <span className="text-slate-400 font-sans">Modified</span>
            </>
          )}
        </span>
      </div>
    </div>
  );
};
