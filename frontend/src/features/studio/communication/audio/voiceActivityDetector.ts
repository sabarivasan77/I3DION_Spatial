import { useCommunicationStore } from '../store/communicationStore';

class VoiceActivityDetector {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private animFrameId: number | null = null;
  private speakingThreshold = 12; // dB / energy scale (0-100)

  public start(stream: MediaStream): void {
    this.stop();

    try {
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) return;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      this.audioContext = new AudioCtx();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.5;

      this.source = this.audioContext.createMediaStreamSource(stream);
      this.source.connect(this.analyser);

      this.analyze();
    } catch (e) {
      console.warn('VoiceActivityDetector initialization error:', e);
    }
  }

  private analyze = (): void => {
    if (!this.analyser) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const average = sum / dataArray.length;
    const normalizedLevel = Math.min(100, Math.round((average / 128) * 100));

    const isSpeaking = normalizedLevel > this.speakingThreshold;

    const store = useCommunicationStore.getState();
    store.setLocalAudioLevel(normalizedLevel);

    const currentActorId = store.currentActorId;
    if (currentActorId) {
      store.updateParticipantState(currentActorId, {
        audioLevel: normalizedLevel,
        isSpeaking: isSpeaking && !store.localMedia.isMuted,
      });
    }

    this.animFrameId = requestAnimationFrame(this.analyze);
  };

  public stop(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
    useCommunicationStore.getState().setLocalAudioLevel(0);
  }
}

export const voiceActivityDetector = new VoiceActivityDetector();
