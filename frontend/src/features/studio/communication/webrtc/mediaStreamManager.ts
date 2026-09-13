import { useCommunicationStore } from '../store/communicationStore';

class MediaStreamManager {
  private localStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;

  public async acquireMicrophone(): Promise<MediaStream | null> {
    const store = useCommunicationStore.getState();
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        store.updateLocalMedia({
          hasMicPermission: false,
          errorMessage: 'Microphone media access is not supported by your browser.',
        });
        return null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      this.localStream = stream;
      store.setLocalStream(stream);
      store.updateLocalMedia({
        isMicEnabled: true,
        isMuted: false,
        hasMicPermission: true,
        errorMessage: null,
      });

      // Handle track ending unexpectedly
      stream.getAudioTracks().forEach((track) => {
        track.onended = () => {
          this.stopMicrophone();
        };
      });

      return stream;
    } catch (err: any) {
      console.warn('Microphone permission denied or device error:', err);
      store.updateLocalMedia({
        isMicEnabled: false,
        isMuted: true,
        hasMicPermission: false,
        errorMessage: err.message || 'Microphone access denied.',
      });
      return null;
    }
  }

  public async acquireCamera(): Promise<MediaStream | null> {
    const store = useCommunicationStore.getState();
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        store.updateLocalMedia({
          hasCameraPermission: false,
          errorMessage: 'Camera media access is not supported.',
        });
        return null;
      }

      const videoStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { max: 24 },
        },
        audio: false,
      });

      // Combine video track into current localStream or create new
      let combined = this.localStream;
      if (!combined) {
        combined = new MediaStream();
        this.localStream = combined;
      }

      videoStream.getVideoTracks().forEach((track) => {
        combined!.addTrack(track);
        track.onended = () => {
          this.stopCamera();
        };
      });

      store.setLocalStream(combined);
      store.updateLocalMedia({
        isVideoEnabled: true,
        hasCameraPermission: true,
        errorMessage: null,
      });

      return combined;
    } catch (err: any) {
      console.warn('Camera access denied:', err);
      store.updateLocalMedia({
        isVideoEnabled: false,
        hasCameraPermission: false,
        errorMessage: err.message || 'Camera access denied.',
      });
      return null;
    }
  }

  public toggleMicrophoneMute(muted: boolean): void {
    const store = useCommunicationStore.getState();
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
    store.updateLocalMedia({ isMuted: muted });
  }

  public stopCamera(): void {
    const store = useCommunicationStore.getState();
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.stop();
        this.localStream!.removeTrack(track);
      });
    }
    store.updateLocalMedia({ isVideoEnabled: false });
  }

  public stopMicrophone(): void {
    const store = useCommunicationStore.getState();
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.stop();
        this.localStream!.removeTrack(track);
      });
    }
    store.updateLocalMedia({ isMicEnabled: false, isMuted: true });
  }

  public async acquireScreenShare(): Promise<MediaStream | null> {
    const store = useCommunicationStore.getState();
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        store.updateLocalMedia({
          errorMessage: 'Screen sharing is not supported in this browser.',
        });
        return null;
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      this.screenStream = stream;
      store.setLocalScreenStream(stream);
      store.updateLocalMedia({ isScreenSharing: true });

      stream.getVideoTracks().forEach((track) => {
        track.onended = () => {
          this.stopScreenShare();
        };
      });

      return stream;
    } catch (err: any) {
      console.warn('Screen share cancelled or failed:', err);
      store.updateLocalMedia({ isScreenSharing: false });
      return null;
    }
  }

  public stopScreenShare(): void {
    const store = useCommunicationStore.getState();
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((track) => track.stop());
      this.screenStream = null;
    }
    store.setLocalScreenStream(null);
    store.updateLocalMedia({ isScreenSharing: false });
  }

  public releaseAll(): void {
    this.stopCamera();
    this.stopMicrophone();
    this.stopScreenShare();
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
    const store = useCommunicationStore.getState();
    store.setLocalStream(null);
    store.setLocalScreenStream(null);
    store.updateLocalMedia({
      isMicEnabled: false,
      isMuted: true,
      isVideoEnabled: false,
      isScreenSharing: false,
    });
  }
}

export const mediaStreamManager = new MediaStreamManager();
