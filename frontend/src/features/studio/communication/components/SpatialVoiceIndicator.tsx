import React from 'react';
import { useCommunicationStore } from '../store/communicationStore';
import { VoiceIndicator } from './VoiceIndicator';
import { Radio } from 'lucide-react';

export const SpatialVoiceIndicator: React.FC = () => {
  const { participants, currentActorId, spatialAudioSettings } = useCommunicationStore();

  const remoteParticipants = Array.from(participants.values()).filter(
    (p) => p.actorId !== currentActorId && p.position
  );

  if (remoteParticipants.length === 0 || !spatialAudioSettings.isEnabled) {
    return null;
  }

  return (
    <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 pointer-events-none select-none">
      {remoteParticipants.map((participant) => (
        <div
          key={participant.actorId}
          className="flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-900/90 px-3 py-1.5 text-xs text-white shadow-lg backdrop-blur-md"
        >
          <VoiceIndicator
            isSpeaking={participant.isSpeaking}
            isMuted={participant.isMuted}
            audioLevel={participant.audioLevel}
            size="sm"
          />
          <span className="font-semibold text-slate-200 font-mono text-[11px]">
            {participant.displayName}
          </span>
          <span className="flex items-center gap-1 text-[10px] font-mono text-purple-400 bg-purple-950/60 px-1.5 py-0.5 rounded-full border border-purple-800/50">
            <Radio size={11} /> 3D Audio
          </span>
        </div>
      ))}
    </div>
  );
};
