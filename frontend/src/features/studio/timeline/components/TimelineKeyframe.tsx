import React from 'react';
import { TimelineKeyframe as KeyframeType } from '../types/timelineTypes';
import { useTimelineStore } from '../store/timelineStore';

interface TimelineKeyframeProps {
  keyframe: KeyframeType;
  trackId: string;
  maxDuration: number;
}

export const TimelineKeyframePin: React.FC<TimelineKeyframeProps> = ({ keyframe, trackId, maxDuration }) => {
  const { selectedKeyframeId, selectKeyframe } = useTimelineStore();
  const isSelected = selectedKeyframeId === keyframe.id;

  const leftPercent = Math.min(100, Math.max(0, (keyframe.time / maxDuration) * 100));

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        selectKeyframe(keyframe.id, trackId);
      }}
      title={`Time: ${keyframe.time.toFixed(2)}s | Interp: ${keyframe.interpolation}`}
      className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rotate-45 cursor-pointer transition-transform border ${
        isSelected
          ? 'bg-amber-400 border-white scale-125 z-20 shadow-lg shadow-amber-500/50'
          : 'bg-cyan-500 border-cyan-300 hover:scale-110 hover:bg-cyan-400 z-10'
      }`}
      style={{ left: `${leftPercent}%` }}
    />
  );
};
