import React from 'react';
import { useCommunicationStore } from '../store/communicationStore';
import { mediaStreamManager } from '../webrtc/mediaStreamManager';
import { webrtcSessionManager } from '../webrtc/webrtcSessionManager';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  Users,
  PhoneOff,
  Radio,
} from 'lucide-react';

export const CommunicationBar: React.FC = () => {
  const {
    connectionState,
    localMedia,
    localAudioLevel,
    participants,
    isBarOpen,
    spatialAudioSettings,
    updateSpatialAudioSettings,
    toggleParticipantPanel,
  } = useCommunicationStore();

  if (!isBarOpen || connectionState === 'disconnected') {
    return null;
  }

  const participantCount = participants.size;

  const handleToggleMic = async () => {
    if (!localMedia.isMicEnabled) {
      const stream = await mediaStreamManager.acquireMicrophone();
      if (stream) {
        webrtcSessionManager.notifyMediaStateChange();
      }
    } else {
      const nextMute = !localMedia.isMuted;
      mediaStreamManager.toggleMicrophoneMute(nextMute);
      webrtcSessionManager.notifyMediaStateChange();
    }
  };

  const handleToggleCamera = async () => {
    if (localMedia.isVideoEnabled) {
      mediaStreamManager.stopCamera();
    } else {
      await mediaStreamManager.acquireCamera();
    }
    webrtcSessionManager.notifyMediaStateChange();
  };

  const handleToggleScreenShare = async () => {
    if (localMedia.isScreenSharing) {
      mediaStreamManager.stopScreenShare();
    } else {
      await mediaStreamManager.acquireScreenShare();
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 rounded-2xl border border-slate-700/80 bg-slate-900/90 px-4 py-2 text-white shadow-2xl backdrop-blur-md select-none">
      {/* Live Status Pill */}
      <div className="flex items-center gap-2 pr-3 border-r border-slate-800">
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            connectionState === 'connected'
              ? 'bg-emerald-500 animate-pulse'
              : 'bg-amber-500 animate-ping'
          }`}
        />
        <span className="text-[11px] font-bold font-mono text-slate-300 uppercase tracking-wider">
          {connectionState}
        </span>
      </div>

      {/* Mic Button & Audio Meter */}
      <div className="relative flex items-center">
        <button
          onClick={handleToggleMic}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
            localMedia.isMuted
              ? 'bg-rose-600/90 text-white hover:bg-rose-500'
              : 'bg-emerald-600/90 text-white hover:bg-emerald-500'
          }`}
          title={localMedia.isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
        >
          {localMedia.isMuted ? <MicOff size={15} /> : <Mic size={15} />}
          <span>{localMedia.isMuted ? 'Muted' : 'Mic On'}</span>
        </button>

        {/* Live Audio Energy Indicator Bar */}
        {!localMedia.isMuted && localMedia.isMicEnabled && (
          <div className="absolute -top-1.5 inset-x-2 h-1 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full bg-emerald-400 transition-all duration-75"
              style={{ width: `${localAudioLevel}%` }}
            />
          </div>
        )}
      </div>

      {/* Push To Talk */}
      <button
        onMouseDown={() => mediaStreamManager.toggleMicrophoneMute(false)}
        onMouseUp={() => mediaStreamManager.toggleMicrophoneMute(true)}
        className="rounded-xl border border-slate-700 bg-slate-800/80 px-2.5 py-2 text-xs font-mono text-slate-300 hover:bg-slate-700 transition"
        title="Hold down to talk"
      >
        PTT
      </button>

      {/* Camera Toggle */}
      <button
        onClick={handleToggleCamera}
        className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
          localMedia.isVideoEnabled
            ? 'bg-blue-600 text-white hover:bg-blue-500'
            : 'border border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700'
        }`}
        title={localMedia.isVideoEnabled ? 'Disable Camera' : 'Enable Camera'}
      >
        {localMedia.isVideoEnabled ? <Video size={15} /> : <VideoOff size={15} />}
        <span>{localMedia.isVideoEnabled ? 'Camera On' : 'Camera'}</span>
      </button>

      {/* Spatial Voice Toggle */}
      <button
        onClick={() =>
          updateSpatialAudioSettings({ isEnabled: !spatialAudioSettings.isEnabled })
        }
        className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
          spatialAudioSettings.isEnabled
            ? 'bg-purple-600/90 text-white hover:bg-purple-500'
            : 'border border-slate-700 bg-slate-800/80 text-slate-400 hover:bg-slate-700'
        }`}
        title="Toggle 3D Spatial Audio Attenuation"
      >
        <Radio size={15} />
        <span>3D Audio</span>
      </button>

      {/* Screen Share */}
      <button
        onClick={handleToggleScreenShare}
        className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
          localMedia.isScreenSharing
            ? 'bg-amber-600 text-white hover:bg-amber-500'
            : 'border border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700'
        }`}
        title="Share Screen"
      >
        <Monitor size={15} />
        <span>Screen</span>
      </button>

      {/* Participants Drawer Button */}
      <button
        onClick={toggleParticipantPanel}
        className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
        title="Open Live Participants Panel"
      >
        <Users size={15} className="text-blue-400" />
        <span className="font-mono text-xs">{participantCount}</span>
      </button>

      {/* Leave Call Button */}
      <button
        onClick={() => webrtcSessionManager.leaveSession()}
        className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white shadow-md hover:bg-rose-500 transition"
        title="Leave Voice/Video Session"
      >
        <PhoneOff size={15} />
        <span>Leave</span>
      </button>
    </div>
  );
};
