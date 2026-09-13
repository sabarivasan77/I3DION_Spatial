import { SpatialAudioSettings, SpatialPosition } from '../types/communicationTypes';
import { useCommunicationStore } from '../store/communicationStore';

interface AudioNodePipeline {
  panner: PannerNode;
  gain: GainNode;
  source: MediaStreamAudioSourceNode;
}

class SpatialAudioManager {
  private audioContext: AudioContext | null = null;
  private pipelines = new Map<string, AudioNodePipeline>();
  private localCameraPosition: SpatialPosition = { x: 0, y: 0, z: 5 };

  public initContext(): AudioContext | null {
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
      }
    }
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    return this.audioContext;
  }

  public updateLocalCameraPosition(position: SpatialPosition): void {
    this.localCameraPosition = position;
    if (this.audioContext && this.audioContext.listener) {
      const listener = this.audioContext.listener;
      if (listener.positionX) {
        listener.positionX.setValueAtTime(position.x, this.audioContext.currentTime);
        listener.positionY.setValueAtTime(position.y, this.audioContext.currentTime);
        listener.positionZ.setValueAtTime(position.z, this.audioContext.currentTime);
      } else if (typeof listener.setPosition === 'function') {
        listener.setPosition(position.x, position.y, position.z);
      }
    }
    this.recalculateAllDistances();
  }

  public attachRemoteStream(actorId: string, stream: MediaStream): void {
    this.detachRemoteStream(actorId);

    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) return;

      const source = ctx.createMediaStreamSource(stream);
      const panner = ctx.createPanner();
      const gain = ctx.createGain();

      const settings = useCommunicationStore.getState().spatialAudioSettings;

      panner.panningModel = 'HRTF';
      panner.distanceModel = settings.attenuationModel || 'inverse';
      panner.refDistance = 2;
      panner.maxDistance = settings.proximityRange || 15;
      panner.rolloffFactor = settings.rolloffFactor || 1.5;
      panner.coneInnerAngle = 360;

      gain.gain.value = settings.isEnabled ? settings.masterVolume : settings.masterVolume;

      source.connect(panner);
      panner.connect(gain);
      gain.connect(ctx.destination);

      this.pipelines.set(actorId, { panner, gain, source });
    } catch (err) {
      console.warn(`Failed to attach spatial audio pipeline for peer ${actorId}:`, err);
    }
  }

  public updateParticipantPosition(actorId: string, position: SpatialPosition): void {
    const pipeline = this.pipelines.get(actorId);
    if (!pipeline || !this.audioContext) return;

    const { panner } = pipeline;
    const time = this.audioContext.currentTime;

    if (panner.positionX) {
      panner.positionX.setValueAtTime(position.x, time);
      panner.positionY.setValueAtTime(position.y, time);
      panner.positionZ.setValueAtTime(position.z, time);
    } else if (typeof panner.setPosition === 'function') {
      panner.setPosition(position.x, position.y, position.z);
    }

    this.updateGainByDistance(actorId, position);
  }

  private updateGainByDistance(actorId: string, remotePos: SpatialPosition): void {
    const pipeline = this.pipelines.get(actorId);
    if (!pipeline) return;

    const settings = useCommunicationStore.getState().spatialAudioSettings;
    if (!settings.isEnabled) {
      pipeline.gain.gain.value = settings.masterVolume;
      return;
    }

    const dx = remotePos.x - this.localCameraPosition.x;
    const dy = remotePos.y - this.localCameraPosition.y;
    const dz = remotePos.z - this.localCameraPosition.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (distance > settings.proximityRange) {
      pipeline.gain.gain.value = 0.05; // Muted/very low out of range
    } else {
      const attenuation = Math.max(0, 1 - distance / settings.proximityRange);
      pipeline.gain.gain.value = attenuation * settings.masterVolume;
    }
  }

  private recalculateAllDistances(): void {
    const participants = useCommunicationStore.getState().participants;
    participants.forEach((p, actorId) => {
      if (p.position) {
        this.updateGainByDistance(actorId, p.position);
      }
    });
  }

  public detachRemoteStream(actorId: string): void {
    const pipeline = this.pipelines.get(actorId);
    if (pipeline) {
      try {
        pipeline.source.disconnect();
        pipeline.panner.disconnect();
        pipeline.gain.disconnect();
      } catch (e) {
        // ignore
      }
      this.pipelines.delete(actorId);
    }
  }

  public releaseAll(): void {
    this.pipelines.forEach((pipeline) => {
      try {
        pipeline.source.disconnect();
        pipeline.panner.disconnect();
        pipeline.gain.disconnect();
      } catch (e) {
        // ignore
      }
    });
    this.pipelines.clear();

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export const spatialAudioManager = new SpatialAudioManager();
