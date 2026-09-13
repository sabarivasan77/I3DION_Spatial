import React, { useEffect, useRef } from 'react';
import { useCommunicationStore } from '../store/communicationStore';
import { Video, VideoOff, Mic, MicOff, Maximize2, Minimize2 } from 'lucide-react';
import { mediaStreamManager } from '../webrtc/mediaStreamManager';
import { webrtcSessionManager } from '../webrtc/webrtcSessionManager';

export const LocalMediaPreview: React.FC = () => {
  const { localMedia, localStream, isLocalPreviewExpanded, toggleLocalPreview } =
    useCommunicationStore();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream;
    }
  }, [localStream, localMedia.isVideoEnabled]);

  if (!localMedia.isVideoEnabled && !localStream) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-20 right-6 z-40 overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/95 shadow-2xl backdrop-blur-md transition-all ${
        isLocalPreviewExpanded ? 'w-64 h-48' : 'w-36 h-24'
      }`}
    >
      {/* Video Element */}
      {localMedia.isVideoEnabled ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full object-cover transform -scale-x-100"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center bg-slate-800 text-slate-400">
          <VideoOff size={24} className="mb-1 text-slate-500" />
          <span className="text-[11px] font-medium font-mono">Camera Off</span>
        </div>
      )}

      {/* Overlay Badge & Controls */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between p-2 bg-gradient-to-b from-black/70 to-transparent">
        <span className="text-[10px] font-bold font-mono text-white bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700">
          YOU
        </span>
        <button
          onClick={toggleLocalPreview}
          className="rounded bg-black/50 p-1 text-slate-300 hover:text-white transition"
          title={isLocalPreviewExpanded ? 'Minimize Preview' : 'Maximize Preview'}
        >
          {isLocalPreviewExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
        </button>
      </div>

      {/* Mute/Camera Quick Toggles */}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 p-1.5 bg-gradient-to-t from-black/80 to-transparent">
        <button
          onClick={() => {
            const nextMute = !localMedia.isMuted;
            mediaStreamManager.toggleMicrophoneMute(nextMute);
            webrtcSessionManager.notifyMediaStateChange();
          }}
          className={`rounded-full p-1.5 text-white transition ${
            localMedia.isMuted ? 'bg-rose-600 hover:bg-rose-500' : 'bg-slate-700 hover:bg-slate-600'
          }`}
          title={localMedia.isMuted ? 'Unmute Mic' : 'Mute Mic'}
        >
          {localMedia.isMuted ? <MicOff size={13} /> : <Mic size={13} />}
        </button>

        <button
          onClick={async () => {
            if (localMedia.isVideoEnabled) {
              mediaStreamManager.stopCamera();
            } else {
              await mediaStreamManager.acquireCamera();
            }
            webrtcSessionManager.notifyMediaStateChange();
          }}
          className={`rounded-full p-1.5 text-white transition ${
            localMedia.isVideoEnabled
              ? 'bg-blue-600 hover:bg-blue-500'
              : 'bg-slate-700 hover:bg-slate-600'
          }`}
          title={localMedia.isVideoEnabled ? 'Disable Camera' : 'Enable Camera'}
        >
          {localMedia.isVideoEnabled ? <Video size={13} /> : <VideoOff size={13} />}
        </button>
      </div>
    </div>
  );
};
