import { PeerConnectionManager } from './peerConnectionManager';
import { mediaStreamManager } from './mediaStreamManager';
import { communicationSignaling } from '../signaling/communicationSignaling';
import { useCommunicationStore } from '../store/communicationStore';
import { voiceActivityDetector } from '../audio/voiceActivityDetector';
import { spatialAudioManager } from '../audio/spatialAudioManager';
import { WebRTCSignalingPacket } from '../types/communicationTypes';

class WebRTCSessionManager {
  private peerConnections = new Map<string, RTCPeerConnection>();
  private signalingUnsub: (() => void) | null = null;
  private isInitialized = false;

  public async startSession(
    experienceId: string,
    companyId: string,
    actorId: string,
    displayName: string,
    avatarUrl?: string
  ): Promise<void> {
    const store = useCommunicationStore.getState();
    store.initSession(experienceId, companyId, actorId);

    // Register local participant
    store.upsertParticipant({
      participantId: `p-${actorId}`,
      actorId,
      displayName,
      avatarUrl,
      isOnline: true,
      isMuted: true,
      isSpeaking: false,
      isVideoEnabled: false,
      isScreenSharing: false,
      audioLevel: 0,
      color: '#3b82f6',
    });

    // Subscribe to signaling packets
    this.signalingUnsub = communicationSignaling.subscribe((packet) =>
      this.handleSignalingPacket(packet)
    );

    // Announce peer join
    communicationSignaling.sendSignalingPacket('WEBRTC_PEER_JOINED', {
      displayName,
      avatarUrl,
    });

    // Acquire microphone stream
    const micStream = await mediaStreamManager.acquireMicrophone();
    if (micStream) {
      voiceActivityDetector.start(micStream);
    }

    store.setConnectionState('connected');
    this.isInitialized = true;
  }

  private async handleSignalingPacket(packet: WebRTCSignalingPacket): Promise<void> {
    const { type, senderActorId, payload } = packet;

    switch (type) {
      case 'WEBRTC_PEER_JOINED':
        // Registered new peer
        useCommunicationStore.getState().upsertParticipant({
          participantId: `p-${senderActorId}`,
          actorId: senderActorId,
          displayName: payload.displayName || `Collaborator (${senderActorId.slice(0, 4)})`,
          avatarUrl: payload.avatarUrl,
          isOnline: true,
          isMuted: true,
          isSpeaking: false,
          isVideoEnabled: false,
          isScreenSharing: false,
          audioLevel: 0,
          color: '#8b5cf6',
        });
        // Initiate WebRTC offer to newly joined peer
        await this.createOffer(senderActorId);
        break;

      case 'WEBRTC_OFFER':
        await this.handleOffer(senderActorId, payload.sdp);
        break;

      case 'WEBRTC_ANSWER':
        await this.handleAnswer(senderActorId, payload.sdp);
        break;

      case 'WEBRTC_ICE_CANDIDATE':
        await this.handleIceCandidate(senderActorId, payload.candidate);
        break;

      case 'MEDIA_STATE_CHANGED':
        useCommunicationStore.getState().updateParticipantState(senderActorId, {
          isMuted: payload.isMuted,
          isVideoEnabled: payload.isVideoEnabled,
        });
        break;

      case 'SCREEN_SHARE_STARTED':
        useCommunicationStore.getState().updateParticipantState(senderActorId, {
          isScreenSharing: true,
        });
        break;

      case 'SCREEN_SHARE_STOPPED':
        useCommunicationStore.getState().updateParticipantState(senderActorId, {
          isScreenSharing: false,
        });
        useCommunicationStore.getState().setRemoteScreenStream(senderActorId, null);
        break;

      case 'SPATIAL_POSITION_UPDATE':
        if (payload.position) {
          useCommunicationStore.getState().updateParticipantPosition(senderActorId, payload.position);
          spatialAudioManager.updateParticipantPosition(senderActorId, payload.position);
        }
        break;

      case 'WEBRTC_PEER_LEFT':
        this.closePeerConnection(senderActorId);
        useCommunicationStore.getState().removeParticipant(senderActorId);
        spatialAudioManager.detachRemoteStream(senderActorId);
        break;
    }
  }

  private async createOffer(remoteActorId: string): Promise<void> {
    const pc = this.getOrCreatePeerConnection(remoteActorId);
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      communicationSignaling.sendSignalingPacket(
        'WEBRTC_OFFER',
        { sdp: pc.localDescription },
        remoteActorId
      );
    } catch (e) {
      console.warn(`Failed to create WebRTC offer for peer ${remoteActorId}:`, e);
    }
  }

  private async handleOffer(remoteActorId: string, sdp: RTCSessionDescriptionInit): Promise<void> {
    const pc = this.getOrCreatePeerConnection(remoteActorId);
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      communicationSignaling.sendSignalingPacket(
        'WEBRTC_ANSWER',
        { sdp: pc.localDescription },
        remoteActorId
      );
    } catch (e) {
      console.warn(`Failed to handle WebRTC offer from peer ${remoteActorId}:`, e);
    }
  }

  private async handleAnswer(remoteActorId: string, sdp: RTCSessionDescriptionInit): Promise<void> {
    const pc = this.peerConnections.get(remoteActorId);
    if (pc) {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      } catch (e) {
        console.warn(`Failed to set remote answer for peer ${remoteActorId}:`, e);
      }
    }
  }

  private async handleIceCandidate(
    remoteActorId: string,
    candidate: RTCIceCandidateInit
  ): Promise<void> {
    const pc = this.peerConnections.get(remoteActorId);
    if (pc && pc.remoteDescription) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn(`Failed to add ICE candidate for peer ${remoteActorId}:`, e);
      }
    }
  }

  private getOrCreatePeerConnection(remoteActorId: string): RTCPeerConnection {
    let pc = this.peerConnections.get(remoteActorId);
    if (pc) return pc;

    pc = PeerConnectionManager.createPeerConnection();

    // Attach local media tracks
    const localStream = useCommunicationStore.getState().localStream;
    if (localStream) {
      localStream.getTracks().forEach((track) => pc!.addTrack(track, localStream));
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        communicationSignaling.sendSignalingPacket(
          'WEBRTC_ICE_CANDIDATE',
          { candidate: event.candidate },
          remoteActorId
        );
      }
    };

    // Handle remote media track reception
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteStream) {
        useCommunicationStore.getState().setRemoteStream(remoteActorId, remoteStream);
        spatialAudioManager.attachRemoteStream(remoteActorId, remoteStream);
      }
    };

    pc.onconnectionstatechange = () => {
      if (
        pc?.connectionState === 'failed' ||
        pc?.connectionState === 'disconnected' ||
        pc?.connectionState === 'closed'
      ) {
        this.closePeerConnection(remoteActorId);
      }
    };

    this.peerConnections.set(remoteActorId, pc);
    return pc;
  }

  private closePeerConnection(remoteActorId: string): void {
    const pc = this.peerConnections.get(remoteActorId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(remoteActorId);
    }
  }

  public notifyMediaStateChange(): void {
    const { localMedia } = useCommunicationStore.getState();
    communicationSignaling.sendSignalingPacket('MEDIA_STATE_CHANGED', {
      isMuted: localMedia.isMuted,
      isVideoEnabled: localMedia.isVideoEnabled,
    });
  }

  public broadcastSpatialPosition(position: { x: number; y: number; z: number }): void {
    communicationSignaling.sendSignalingPacket('SPATIAL_POSITION_UPDATE', { position });
  }

  public leaveSession(): void {
    if (this.isInitialized) {
      communicationSignaling.sendSignalingPacket('WEBRTC_PEER_LEFT', {});
    }

    if (this.signalingUnsub) {
      this.signalingUnsub();
      this.signalingUnsub = null;
    }

    // Close all peer connections
    this.peerConnections.forEach((pc) => pc.close());
    this.peerConnections.clear();

    // Release detectors & spatial audio
    voiceActivityDetector.stop();
    spatialAudioManager.releaseAll();
    mediaStreamManager.releaseAll();

    useCommunicationStore.getState().endSession();
    this.isInitialized = false;
  }
}

export const webrtcSessionManager = new WebRTCSessionManager();
