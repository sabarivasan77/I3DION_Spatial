import React, { useEffect, useRef } from 'react';
import { useTimelineStore } from '../store/timelineStore';
import { TimelineTrackRow } from './TimelineTrack';
import { evaluateAndApplyTimeline } from '../evaluator/timelineEvaluator';
import { useStudioStore } from '../../store/useStudioStore';
import { AnimatableProperty } from '../types/timelineTypes';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Clock,
  Film,
  Trash2,
  X,
} from 'lucide-react';

export interface TimelinePanelProps {
  onClose?: () => void;
}

export const TimelinePanel: React.FC<TimelinePanelProps> = ({ onClose }) => {
  const {
    currentTime,
    isPlaying,
    speed,
    play,
    pause,
    stop,
    seek,
    setSpeed,
    getActiveTimeline,
    addTrack,
    selectedKeyframeId,
    selectedTrackId,
    updateKeyframe,
    deleteKeyframe,
  } = useTimelineStore();

  const { experience, selectedWidgetId, toggleTimeline } = useStudioStore();
  const animationFrameRef = useRef<number | null>(null);

  const activeTimeline = getActiveTimeline();
  const duration = activeTimeline ? activeTimeline.duration : 5.0;
  const tracks = activeTimeline ? activeTimeline.tracks : [];

  const handleClose = () => {
    if (onClose) onClose();
    else toggleTimeline();
  };

  // Animation Loop for Timeline Playback
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    let lastTime = performance.now();

    const updateLoop = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      const nextTime = currentTime + delta * speed;
      if (nextTime >= duration) {
        if (activeTimeline?.loop) {
          seek(0);
        } else {
          pause();
          seek(duration);
        }
      } else {
        seek(nextTime);
      }

      evaluateAndApplyTimeline(tracks, nextTime);
      animationFrameRef.current = requestAnimationFrame(updateLoop);
    };

    animationFrameRef.current = requestAnimationFrame(updateLoop);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, currentTime, speed, duration, tracks, seek, pause, activeTimeline?.loop]);

  // Handle Scrubbing
  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    seek(val);
    evaluateAndApplyTimeline(tracks, val);
  };

  const handleAddTrackForSelectedWidget = (property: AnimatableProperty) => {
    if (!selectedWidgetId) return;
    const node = experience.widgets.find((w) => w.id === selectedWidgetId);
    const name = node ? node.name : selectedWidgetId;
    addTrack(selectedWidgetId, property, name);
  };

  // Find selected keyframe details for Inspector
  let activeKfDetails: any = null;
  if (selectedKeyframeId && selectedTrackId && activeTimeline) {
    const tr = activeTimeline.tracks.find((t) => t.id === selectedTrackId);
    if (tr) {
      const kf = tr.keyframes.find((k) => k.id === selectedKeyframeId);
      if (kf) activeKfDetails = { kf, track: tr };
    }
  }

  return (
    <div className="border-t border-slate-200 bg-white flex flex-col h-64 select-none text-slate-800 shadow-xl z-30">
      {/* Top Header & Controls */}
      <div className="h-11 px-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono text-blue-600 text-xs font-bold mr-2">
            <Film size={15} />
            <span>TIMELINE AUTHORING</span>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm">
            {isPlaying ? (
              <button
                onClick={pause}
                title="Pause"
                className="p-1.5 hover:bg-slate-100 rounded text-amber-600 transition"
              >
                <Pause size={14} />
              </button>
            ) : (
              <button
                onClick={play}
                title="Play"
                className="p-1.5 hover:bg-slate-100 rounded text-emerald-600 transition"
              >
                <Play size={14} />
              </button>
            )}
            <button
              onClick={stop}
              title="Stop (Reset to 0s)"
              className="p-1.5 hover:bg-slate-100 rounded text-rose-600 transition"
            >
              <Square size={13} />
            </button>
            <button
              onClick={() => seek(0)}
              title="Seek to Start"
              className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition"
            >
              <RotateCcw size={13} />
            </button>
          </div>

          {/* Time & Speed Display */}
          <div className="flex items-center gap-2 font-mono text-xs text-slate-700">
            <Clock size={13} className="text-slate-400" />
            <span className="text-blue-600 font-bold">{currentTime.toFixed(2)}s</span>
            <span className="text-slate-400">/</span>
            <span className="text-slate-500">{duration.toFixed(2)}s</span>

            <select
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="bg-white border border-slate-200 rounded text-[11px] px-2 py-0.5 text-slate-700 ml-2 shadow-sm focus:outline-none"
            >
              <option value={0.5}>0.5x Speed</option>
              <option value={1.0}>1.0x Speed</option>
              <option value={1.5}>1.5x Speed</option>
              <option value={2.0}>2.0x Speed</option>
            </select>
          </div>
        </div>

        {/* Add Track & Close Drawer */}
        <div className="flex items-center gap-3">
          {selectedWidgetId && (
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-slate-500 mr-1 font-mono">Add Track:</span>
              <button
                onClick={() => handleAddTrackForSelectedWidget('position3D')}
                className="px-2 py-1 bg-white hover:bg-slate-100 text-blue-600 rounded text-[11px] font-mono border border-slate-200 transition shadow-sm"
              >
                + Position
              </button>
              <button
                onClick={() => handleAddTrackForSelectedWidget('rotation3D')}
                className="px-2 py-1 bg-white hover:bg-slate-100 text-blue-600 rounded text-[11px] font-mono border border-slate-200 transition shadow-sm"
              >
                + Rotation
              </button>
              <button
                onClick={() => handleAddTrackForSelectedWidget('scale3D')}
                className="px-2 py-1 bg-white hover:bg-slate-100 text-blue-600 rounded text-[11px] font-mono border border-slate-200 transition shadow-sm"
              >
                + Scale
              </button>
            </div>
          )}

          <button
            onClick={handleClose}
            title="Close Timeline Drawer"
            className="p-1.5 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-900 transition ml-2 flex items-center gap-1 font-sans text-xs font-semibold"
          >
            <X size={15} />
            <span>Close</span>
          </button>
        </div>
      </div>

      {/* Main Track View & Keyframe Inspector */}
      <div className="flex-1 flex overflow-hidden bg-white">
        {/* Track Rows Area */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Timeline Scrubber Header Bar */}
          <div className="h-7 border-b border-slate-200 flex items-center bg-slate-50 px-2 text-[10px] font-mono text-slate-500">
            <div className="w-56 px-3 border-r border-slate-200 shrink-0 font-bold">TARGET / PROPERTY</div>
            <div className="flex-1 relative flex items-center px-2">
              <input
                type="range"
                min={0}
                max={duration}
                step={0.01}
                value={currentTime}
                onChange={handleScrub}
                className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-200 rounded"
              />
            </div>
          </div>

          {/* Track List */}
          {tracks.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-slate-400 text-xs">
              <Film size={24} className="mb-2 opacity-40 text-blue-600" />
              <p className="font-semibold text-slate-600">No animation tracks in active timeline.</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Select a 3D model or widget on canvas and click <span className="text-blue-600 font-mono">+ Position / Rotation / Scale</span> above to start keyframing.
              </p>
            </div>
          ) : (
            tracks.map((track) => <TimelineTrackRow key={track.id} track={track} maxDuration={duration} />)
          )}
        </div>

        {/* Selected Keyframe Inspector Panel */}
        {activeKfDetails && (
          <div className="w-64 border-l border-slate-200 bg-slate-50 p-3 text-xs flex flex-col justify-between shrink-0">
            <div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2">
                <span className="font-bold text-blue-600 font-mono">KEYFRAME PROPERTIES</span>
                <button
                  onClick={() => deleteKeyframe(activeKfDetails.track.id, activeKfDetails.kf.id)}
                  title="Delete Keyframe"
                  className="p-1 hover:bg-slate-200 rounded text-rose-600"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              <div className="space-y-2 font-mono text-[11px]">
                <div>
                  <label className="text-slate-500 block mb-1">Time (seconds):</label>
                  <input
                    type="number"
                    step={0.1}
                    value={activeKfDetails.kf.time}
                    onChange={(e) =>
                      updateKeyframe(activeKfDetails.track.id, activeKfDetails.kf.id, {
                        time: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-slate-800 shadow-sm"
                  />
                </div>

                <div>
                  <label className="text-slate-500 block mb-1">Interpolation:</label>
                  <select
                    value={activeKfDetails.kf.interpolation || 'linear'}
                    onChange={(e) =>
                      updateKeyframe(activeKfDetails.track.id, activeKfDetails.kf.id, {
                        interpolation: e.target.value as any,
                      })
                    }
                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-slate-800 shadow-sm"
                  >
                    <option value="linear">Linear</option>
                    <option value="step">Step (Hold)</option>
                    <option value="ease-in">Ease In</option>
                    <option value="ease-out">Ease Out</option>
                    <option value="ease-in-out">Ease In Out</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 font-mono border-t border-slate-200 pt-2">
              Track: {activeKfDetails.track.targetName} ({activeKfDetails.track.property})
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

