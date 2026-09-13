import React, { useState } from 'react';
import { useStudioStore } from '../store/useStudioStore';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  Grid,
  ChevronsUp,
  ChevronUp,
  ChevronDown,
  ChevronsDown,
  FolderPlus,
  FolderMinus,
  Lock,
  EyeOff,
} from 'lucide-react';

export const AlignmentToolbar: React.FC = () => {
  const {
    selectedWidgetId,
    selectedWidgetIds,
    updateWidgetProperties,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    groupSelectedWidgets,
    ungroupSelectedWidgets,
    toggleLockWidget,
    toggleHideWidget,
  } = useStudioStore();
  const [snapToGrid, setSnapToGrid] = useState(true);

  if (selectedWidgetIds.length === 0) return null;

  const handleAlign = (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    selectedWidgetIds.forEach((id) => {
      if (type === 'left') updateWidgetProperties(id, { textAlign: 'left', alignSelf: 'flex-start' });
      if (type === 'center') updateWidgetProperties(id, { textAlign: 'center', alignSelf: 'center' });
      if (type === 'right') updateWidgetProperties(id, { textAlign: 'right', alignSelf: 'flex-end' });
    });
  };

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 p-1.5 rounded-xl shadow-2xl backdrop-blur-md text-white select-none">
      <span className="text-[10px] font-mono text-cyan-400 px-2 font-bold border-r border-slate-800">
        {selectedWidgetIds.length} Selected
      </span>

      {/* Alignment Buttons */}
      <button
        onClick={() => handleAlign('left')}
        title="Align Left"
        className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition"
      >
        <AlignLeft size={14} />
      </button>
      <button
        onClick={() => handleAlign('center')}
        title="Align Center"
        className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition"
      >
        <AlignCenter size={14} />
      </button>
      <button
        onClick={() => handleAlign('right')}
        title="Align Right"
        className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition"
      >
        <AlignRight size={14} />
      </button>

      <div className="h-4 w-[1px] bg-slate-800 my-auto" />

      <button
        onClick={() => handleAlign('top')}
        title="Align Top"
        className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition"
      >
        <AlignStartVertical size={14} />
      </button>
      <button
        onClick={() => handleAlign('middle')}
        title="Align Middle"
        className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition"
      >
        <AlignCenterVertical size={14} />
      </button>
      <button
        onClick={() => handleAlign('bottom')}
        title="Align Bottom"
        className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition"
      >
        <AlignEndVertical size={14} />
      </button>

      <div className="h-4 w-[1px] bg-slate-800 my-auto" />

      {/* Layer Ordering Buttons */}
      <button
        onClick={() => bringToFront()}
        title="Bring to Front"
        className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition"
      >
        <ChevronsUp size={14} />
      </button>
      <button
        onClick={() => bringForward()}
        title="Bring Forward"
        className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition"
      >
        <ChevronUp size={14} />
      </button>
      <button
        onClick={() => sendBackward()}
        title="Send Backward"
        className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition"
      >
        <ChevronDown size={14} />
      </button>
      <button
        onClick={() => sendToBack()}
        title="Send to Back"
        className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition"
      >
        <ChevronsDown size={14} />
      </button>

      <div className="h-4 w-[1px] bg-slate-800 my-auto" />

      {/* Group & Ungroup */}
      {selectedWidgetIds.length > 1 && (
        <button
          onClick={() => groupSelectedWidgets()}
          title="Group Selected Widgets"
          className="p-1.5 hover:bg-slate-800 rounded text-cyan-400 hover:text-white transition flex items-center gap-1 text-[11px]"
        >
          <FolderPlus size={14} />
          <span>Group</span>
        </button>
      )}

      {selectedWidgetId && (
        <button
          onClick={() => ungroupSelectedWidgets()}
          title="Ungroup Container"
          className="p-1.5 hover:bg-slate-800 rounded text-amber-400 hover:text-white transition"
        >
          <FolderMinus size={14} />
        </button>
      )}

      <div className="h-4 w-[1px] bg-slate-800 my-auto" />

      {/* Lock & Hide */}
      {selectedWidgetId && (
        <>
          <button
            onClick={() => toggleLockWidget(selectedWidgetId)}
            title="Lock Widget Position"
            className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-amber-400 transition"
          >
            <Lock size={14} />
          </button>
          <button
            onClick={() => toggleHideWidget(selectedWidgetId)}
            title="Toggle Widget Visibility"
            className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-rose-400 transition"
          >
            <EyeOff size={14} />
          </button>
          <div className="h-4 w-[1px] bg-slate-800 my-auto" />
        </>
      )}

      {/* Grid Snap Toggle */}
      <button
        onClick={() => setSnapToGrid(!snapToGrid)}
        title={snapToGrid ? 'Snap to Grid: ON' : 'Snap to Grid: OFF'}
        className={`p-1.5 rounded transition flex items-center gap-1 text-[11px] font-medium ${
          snapToGrid ? 'bg-cyan-600/30 text-cyan-400 border border-cyan-500/40' : 'text-slate-400 hover:bg-slate-800'
        }`}
      >
        <Grid size={14} />
        <span>Snap</span>
      </button>
    </div>
  );
};

