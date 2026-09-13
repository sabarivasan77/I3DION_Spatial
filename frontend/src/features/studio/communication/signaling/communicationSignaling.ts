import { WebRTCSignalingPacket, WebRTCSignalingType } from '../types/communicationTypes';
import { collaborationTransport } from '../../collaboration/transport/collaborationTransport';
import { useCommunicationStore } from '../store/communicationStore';

class CommunicationSignalingManager {
  private listenerCallbacks: Set<(packet: WebRTCSignalingPacket) => void> = new Set();

  public sendSignalingPacket(
    type: WebRTCSignalingType,
    payload: any,
    targetActorId?: string
  ): void {
    const store = useCommunicationStore.getState();
    const { activeExperienceId, activeCompanyId, currentActorId } = store;

    if (!activeExperienceId || !activeCompanyId || !currentActorId) {
      return;
    }

    const packet: WebRTCSignalingPacket = {
      type,
      experienceId: activeExperienceId,
      companyId: activeCompanyId,
      senderActorId: currentActorId,
      targetActorId,
      timestamp: Date.now(),
      payload,
    };

    // Route packet via collaboration transport
    collaborationTransport.broadcastSignaling(packet);
  }

  public handleIncomingPacket(packet: WebRTCSignalingPacket): void {
    const store = useCommunicationStore.getState();
    // Validate tenant isolation
    if (
      packet.companyId !== store.activeCompanyId ||
      packet.experienceId !== store.activeExperienceId
    ) {
      return;
    }

    // Ignore self packets
    if (packet.senderActorId === store.currentActorId) {
      return;
    }

    // Filter if targetActorId specified and doesn't match current user
    if (packet.targetActorId && packet.targetActorId !== store.currentActorId) {
      return;
    }

    // Notify registered WebRTC listeners
    this.listenerCallbacks.forEach((cb) => cb(packet));
  }

  public subscribe(callback: (packet: WebRTCSignalingPacket) => void): () => void {
    this.listenerCallbacks.add(callback);
    return () => {
      this.listenerCallbacks.delete(callback);
    };
  }
}

export const communicationSignaling = new CommunicationSignalingManager();
