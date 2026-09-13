import { create } from 'zustand';
import {
  CommunicationParticipant,
  CommunicationState,
  LocalMediaState,
  SpatialAudioSettings,
  SpatialPosition,
} from '../types/communicationTypes';

interface CommunicationStoreState {
  // Session & Connection
  connectionState: CommunicationState;
  activeExperienceId: string | null;
  activeCompanyId: string | null;
  currentActorId: string | null;

  // Local Media State
  localMedia: LocalMediaState;
  localStream: MediaStream | null;
  localScreenStream: MediaStream | null;
  localAudioLevel: number;

  // Remote Media Streams (actorId -> MediaStream)
  remoteStreams: Map<string, MediaStream>;
  remoteScreenStreams: Map<string, MediaStream>;

  // Spatial Audio Settings
  spatialAudioSettings: SpatialAudioSettings;

  // Participants (actorId -> Participant)
  participants: Map<string, CommunicationParticipant>;

  // UI Panels State
  isBarOpen: boolean;
  isParticipantPanelOpen: boolean;
  isLocalPreviewExpanded: boolean;

  // Actions
  setConnectionState: (state: CommunicationState) => void;
  initSession: (experienceId: string, companyId: string, actorId: string) => void;
  endSession: () => void;
  updateLocalMedia: (partial: Partial<LocalMediaState>) => void;
  setLocalStream: (stream: MediaStream | null) => void;
  setLocalScreenStream: (stream: MediaStream | null) => void;
  setLocalAudioLevel: (level: number) => void;

  setRemoteStream: (actorId: string, stream: MediaStream | null) => void;
  setRemoteScreenStream: (actorId: string, stream: MediaStream | null) => void;

  updateSpatialAudioSettings: (partial: Partial<SpatialAudioSettings>) => void;
  
  upsertParticipant: (participant: CommunicationParticipant) => void;
  removeParticipant: (actorId: string) => void;
  updateParticipantState: (actorId: string, partial: Partial<CommunicationParticipant>) => void;
  updateParticipantPosition: (actorId: string, position: SpatialPosition) => void;

  toggleBar: () => void;
  toggleParticipantPanel: () => void;
  toggleLocalPreview: () => void;
}

export const useCommunicationStore = create<CommunicationStoreState>((set, get) => ({
  connectionState: 'disconnected',
  activeExperienceId: null,
  activeCompanyId: null,
  currentActorId: null,

  localMedia: {
    isMicEnabled: false,
    isMuted: true,
    isPushToTalkActive: false,
    isVideoEnabled: false,
    isScreenSharing: false,
    hasMicPermission: null,
    hasCameraPermission: null,
    errorMessage: null,
  },
  localStream: null,
  localScreenStream: null,
  localAudioLevel: 0,

  remoteStreams: new Map(),
  remoteScreenStreams: new Map(),

  spatialAudioSettings: {
    isEnabled: true,
    masterVolume: 0.8,
    proximityRange: 15,
    attenuationModel: 'inverse',
    rolloffFactor: 1.5,
  },

  participants: new Map(),

  isBarOpen: false,
  isParticipantPanelOpen: false,
  isLocalPreviewExpanded: true,

  setConnectionState: (connectionState) => set({ connectionState }),

  initSession: (experienceId, companyId, actorId) =>
    set({
      activeExperienceId: experienceId,
      activeCompanyId: companyId,
      currentActorId: actorId,
      connectionState: 'connecting',
      isBarOpen: true,
    }),

  endSession: () => {
    const { localStream, localScreenStream, remoteStreams } = get();
    // Clean up local tracks
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    if (localScreenStream) {
      localScreenStream.getTracks().forEach((track) => track.stop());
    }
    set({
      connectionState: 'disconnected',
      activeExperienceId: null,
      localStream: null,
      localScreenStream: null,
      remoteStreams: new Map(),
      remoteScreenStreams: new Map(),
      participants: new Map(),
      isBarOpen: false,
      isParticipantPanelOpen: false,
    });
  },

  updateLocalMedia: (partial) =>
    set((state) => ({
      localMedia: { ...state.localMedia, ...partial },
    })),

  setLocalStream: (localStream) => set({ localStream }),

  setLocalScreenStream: (localScreenStream) => set({ localScreenStream }),

  setLocalAudioLevel: (localAudioLevel) => set({ localAudioLevel }),

  setRemoteStream: (actorId, stream) => {
    const nextMap = new Map(get().remoteStreams);
    if (stream) {
      nextMap.set(actorId, stream);
    } else {
      nextMap.delete(actorId);
    }
    set({ remoteStreams: nextMap });
  },

  setRemoteScreenStream: (actorId, stream) => {
    const nextMap = new Map(get().remoteScreenStreams);
    if (stream) {
      nextMap.set(actorId, stream);
    } else {
      nextMap.delete(actorId);
    }
    set({ remoteScreenStreams: nextMap });
  },

  updateSpatialAudioSettings: (partial) =>
    set((state) => ({
      spatialAudioSettings: { ...state.spatialAudioSettings, ...partial },
    })),

  upsertParticipant: (participant) => {
    const nextMap = new Map(get().participants);
    nextMap.set(participant.actorId, participant);
    set({ participants: nextMap });
  },

  removeParticipant: (actorId) => {
    const nextMap = new Map(get().participants);
    nextMap.delete(actorId);
    
    const nextRemoteStreams = new Map(get().remoteStreams);
    nextRemoteStreams.delete(actorId);

    const nextRemoteScreen = new Map(get().remoteScreenStreams);
    nextRemoteScreen.delete(actorId);

    set({
      participants: nextMap,
      remoteStreams: nextRemoteStreams,
      remoteScreenStreams: nextRemoteScreen,
    });
  },

  updateParticipantState: (actorId, partial) => {
    const nextMap = new Map(get().participants);
    const existing = nextMap.get(actorId);
    if (existing) {
      nextMap.set(actorId, { ...existing, ...partial });
      set({ participants: nextMap });
    }
  },

  updateParticipantPosition: (actorId, position) => {
    const nextMap = new Map(get().participants);
    const existing = nextMap.get(actorId);
    if (existing) {
      nextMap.set(actorId, { ...existing, position });
      set({ participants: nextMap });
    }
  },

  toggleBar: () => set((state) => ({ isBarOpen: !state.isBarOpen })),

  toggleParticipantPanel: () =>
    set((state) => ({ isParticipantPanelOpen: !state.isParticipantPanelOpen })),

  toggleLocalPreview: () =>
    set((state) => ({ isLocalPreviewExpanded: !state.isLocalPreviewExpanded })),
}));
