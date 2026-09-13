import React from 'react';
import { TimelineTrack as TrackType } from '../types/timelineTypes';
import { TimelineKeyframePin } from './TimelineKeyframe';
import { useTimelineStore } from '../store/timelineStore';
import { Trash2, Plus } from 'lucide-react';
import { useStudioStore } from '../../store/useStudioStore';

interface TimelineTrackRowProps {
  track: TrackType;
  maxDuration: number;
}

export const TimelineTrackRow: React.FC<TimelineTrackRowProps> = ({ track, maxDuration }) => {
  const { deleteTrack, addKeyframe, currentTime } = useTimelineStore();
  const { experience } = useStudioStore();

  const handleAddKeyframeAtCurrentTime = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Get current node value if available
    const node = experience.widgets.find((w) => w.id === track.targetId);
    let val: any = { x: 0, y: 0, z: 0 };
    if (node) {
      if (track.property === 'position3D') val = node.properties.position3D || { x: 0, y: 0, z: 0 };
      else if (track.property === 'rotation3D') val = node.properties.rotation3D || { x: 0, y: 0, z: 0 };
      else if (track.property === 'scale3D') val = node.properties.scale3D || { x: 1, y: 1, z: 1 };
      else if (track.property === 'opacity') val = node.properties.opacity !== undefined ? node.properties.opacity : 1;
      else if (track.property === 'visible') val = node.properties.visible !== false;
    }

    addKeyframe(track.id, parseFloat(currentTime.toFixed(2)), val);
  };

  return (
    <div className="flex items-center h-9 border-b border-slate-800 hover:bg-slate-800/30 transition text-xs">
      {/* Track Title */}
      <div className="w-56 px-3 flex items-center justify-between border-r border-slate-800 shrink-0 text-slate-300 font-mono text-[11px] truncate">
        <div className="truncate flex items-center gap-1.5" title={`${track.targetName} (${track.property})`}>
          <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
          <span className="font-semibold text-slate-200">{track.targetName || track.targetId}</span>
          <span className="text-slate-500 text-[10px]">.{track.property}</span>
        </div>
        <div className="flex items-center gap-1 opacity-60 hover:opacity-100 transition">
          <button
            onClick={handleAddKeyframeAtCurrentTime}
            title="Add Keyframe at Playhead"
            className="p-1 hover:bg-slate-700 rounded text-cyan-400"
          >
            <Plus size={12} />
          </button>
          <button
            onClick={() => deleteTrack(track.id)}
            title="Delete Track"
            className="p-1 hover:bg-slate-700 rounded text-rose-400"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Track Timeline Track Area */}
      <div className="flex-1 relative h-full bg-slate-950/40 px-2 flex items-center">
        {/* Track Line */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[1px] bg-slate-800" />

        {/* Keyframe Pins */}
        {track.keyframes.map((kf) => (
          <TimelineKeyframePin key={kf.id} keyframe={kf} trackId={track.id} maxDuration={maxDuration} />
        ))}
      </div>
    </div>
  );
};
