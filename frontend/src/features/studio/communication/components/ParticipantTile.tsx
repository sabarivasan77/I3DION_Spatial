import React, { useEffect, useRef } from 'react';
import { CommunicationParticipant } from '../types/communicationTypes';
import { MicOff, VideoOff, Monitor } from 'lucide-react';
import { VoiceIndicator } from './VoiceIndicator';

export interface ParticipantTileProps {
  participant: CommunicationParticipant;
  stream?: MediaStream | null;
  screenStream?: MediaStream | null;
}

export const ParticipantTile: React.FC<ParticipantTileProps> = ({
  participant,
  stream,
  screenStream,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const screenRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    if (screenRef.current && screenStream) {
      screenRef.current.srcObject = screenStream;
    }
  }, [screenStream]);

  return (
    <div
      className={`relative overflow-hidden rounded-xl border bg-slate-900 shadow-md transition-all ${
        participant.isSpeaking
          ? 'border-emerald-500 ring-2 ring-emerald-500/30'
          : 'border-slate-800'
      }`}
    >
      {/* Active Screen Share View */}
      {participant.isScreenSharing && screenStream ? (
        <div className="relative h-40 w-full bg-black">
          <video ref={screenRef} autoPlay playsInline className="h-full w-full object-contain" />
          <div className="absolute top-2 left-2 flex items-center gap-1.5 rounded bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
            <Monitor size={12} /> Screen Share
          </div>
        </div>
      ) : participant.isVideoEnabled && stream ? (
        <div className="relative h-36 w-full bg-black">
          <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />
        </div>
      ) : (
        /* Avatar Fallback */
        <div className="flex h-24 w-full flex-col items-center justify-center bg-slate-800/80 p-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 font-bold text-white font-mono shadow">
            {participant.displayName.charAt(0).toUpperCase()}
            {participant.isSpeaking && (
              <span className="absolute -inset-1 rounded-full border-2 border-emerald-400 animate-ping opacity-75" />
            )}
          </div>
          <span className="mt-1.5 text-xs font-semibold text-slate-200 truncate max-w-[120px]">
            {participant.displayName}
          </span>
        </div>
      )}

      {/* Footer Status Bar */}
      <div className="flex items-center justify-between border-t border-slate-800/80 bg-slate-950/80 px-3 py-1.5 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <VoiceIndicator
            isSpeaking={participant.isSpeaking}
            isMuted={participant.isMuted}
            audioLevel={participant.audioLevel}
            size="sm"
          />
          <span className="font-mono text-[11px] text-slate-300 truncate max-w-[100px]">
            {participant.displayName}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-slate-400">
          {participant.isMuted && <MicOff size={13} className="text-rose-400" />}
          {!participant.isVideoEnabled && <VideoOff size={13} className="text-slate-500" />}
          {participant.isScreenSharing && <Monitor size={13} className="text-emerald-400" />}
        </div>
      </div>
    </div>
  );
};
