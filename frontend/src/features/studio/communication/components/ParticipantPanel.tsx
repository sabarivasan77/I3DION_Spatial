import React from 'react';
import { useCommunicationStore } from '../store/communicationStore';
import { ParticipantTile } from './ParticipantTile';
import { Users, X, Volume2, Radio, Sliders } from 'lucide-react';

export const ParticipantPanel: React.FC = () => {
  const {
    participants,
    remoteStreams,
    remoteScreenStreams,
    isParticipantPanelOpen,
    toggleParticipantPanel,
    spatialAudioSettings,
    updateSpatialAudioSettings,
  } = useCommunicationStore();

  if (!isParticipantPanelOpen) return null;

  const participantList = Array.from(participants.values());

  return (
    <aside className="fixed right-0 top-16 bottom-0 z-40 w-80 border-l border-slate-800 bg-slate-900/95 p-4 text-slate-200 shadow-2xl backdrop-blur-lg flex flex-col justify-between select-none">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400">
              <Users size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Live Spatial Session</h2>
              <span className="text-[10px] font-mono text-slate-400">
                {participantList.length} Connected Participant{participantList.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>
          <button
            onClick={toggleParticipantPanel}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Spatial Voice Control Settings */}
        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <Radio size={14} className="text-blue-400" /> 3D Viewport Spatial Voice
            </span>
            <input
              type="checkbox"
              checked={spatialAudioSettings.isEnabled}
              onChange={(e) => updateSpatialAudioSettings({ isEnabled: e.target.checked })}
              className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
          </div>

          {/* Master Volume Slider */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
              <span className="flex items-center gap-1">
                <Volume2 size={12} /> Master Volume
              </span>
              <span>{Math.round(spatialAudioSettings.masterVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={spatialAudioSettings.masterVolume}
              onChange={(e) =>
                updateSpatialAudioSettings({ masterVolume: parseFloat(e.target.value) })
              }
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* Proximity Distance Range */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
              <span className="flex items-center gap-1">
                <Sliders size={12} /> Proximity Distance Range
              </span>
              <span>{spatialAudioSettings.proximityRange}m</span>
            </div>
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              value={spatialAudioSettings.proximityRange}
              onChange={(e) =>
                updateSpatialAudioSettings({ proximityRange: parseInt(e.target.value, 10) })
              }
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
        </div>

        {/* Participant Cards List */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-3 max-h-[calc(100vh-320px)] pr-1">
          {participantList.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 font-mono">
              No participants connected.
            </div>
          ) : (
            participantList.map((participant) => (
              <ParticipantTile
                key={participant.actorId}
                participant={participant}
                stream={remoteStreams.get(participant.actorId)}
                screenStream={remoteScreenStreams.get(participant.actorId)}
              />
            ))
          )}
        </div>
      </div>
    </aside>
  );
};
