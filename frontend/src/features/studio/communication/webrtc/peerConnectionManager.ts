export interface PeerConnectionConfig {
  iceServers?: RTCIceServer[];
}

const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

export class PeerConnectionManager {
  public static createPeerConnection(config?: PeerConnectionConfig): RTCPeerConnection {
    const configuration: RTCConfiguration = {
      iceServers: config?.iceServers || DEFAULT_ICE_SERVERS,
      iceTransportPolicy: 'all',
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require',
    };

    return new RTCPeerConnection(configuration);
  }
}
