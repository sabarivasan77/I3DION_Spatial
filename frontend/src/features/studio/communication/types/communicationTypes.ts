export type CommunicationState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'failed';

export interface SpatialPosition {
  x: number;
  y: number;
  z: number;
}

export interface CommunicationParticipant {
  participantId: string;
  actorId: string;
  displayName: string;
  avatarUrl?: string;
  isOnline: boolean;
  isMuted: boolean;
  isSpeaking: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  audioLevel: number; // 0 - 100
  position?: SpatialPosition;
  color?: string;
}

export interface LocalMediaState {
  isMicEnabled: boolean;
  isMuted: boolean;
  isPushToTalkActive: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  hasMicPermission: boolean | null;
  hasCameraPermission: boolean | null;
  selectedAudioInput?: string;
  selectedVideoInput?: string;
  selectedAudioOutput?: string;
  errorMessage?: string | null;
}

export interface SpatialAudioSettings {
  isEnabled: boolean;
  masterVolume: number; // 0 - 1
  proximityRange: number; // in meters/units (default: 15)
  attenuationModel: 'linear' | 'inverse' | 'exponential';
  rolloffFactor: number;
}

export type WebRTCSignalingType =
  | 'WEBRTC_OFFER'
  | 'WEBRTC_ANSWER'
  | 'WEBRTC_ICE_CANDIDATE'
  | 'WEBRTC_PEER_JOINED'
  | 'WEBRTC_PEER_LEFT'
  | 'MEDIA_STATE_CHANGED'
  | 'SCREEN_SHARE_STARTED'
  | 'SCREEN_SHARE_STOPPED'
  | 'SPATIAL_POSITION_UPDATE';

export interface WebRTCSignalingPacket {
  type: WebRTCSignalingType;
  experienceId: string;
  companyId: string;
  senderActorId: string;
  targetActorId?: string; // If null, broadcast to room
  timestamp: number;
  payload: any;
}

export interface MediaDeviceOption {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
}
