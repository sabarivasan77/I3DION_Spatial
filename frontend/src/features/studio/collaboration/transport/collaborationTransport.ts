import { CollaborativeOperation, CursorPositionPayload } from '../types/realtimeTypes';
import { useRealtimeCollaborationStore } from '../store/realtimeCollaborationStore';
import { communicationSignaling } from '../../communication/signaling/communicationSignaling';

class CollaborationTransportManager {
  private socket: WebSocket | null = null;
  private heartbeatTimer: any = null;
  private isConnected = false;

  public connect(experienceId: string, actorId: string, actorName: string): void {
    const store = useRealtimeCollaborationStore.getState();
    store.setTransportStatus('connecting');

    // Attempt WebSocket connection or graceful SSE fallback
    try {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.host}/api/ws/experiences/${experienceId}`;
      
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.isConnected = true;
        store.setTransportStatus('synced');
        this.startHeartbeat(experienceId, actorId, actorName);
      };

      this.socket.onmessage = (event) => {
        try {
          const packet = JSON.parse(event.data);
          if (packet.type === 'OPERATION') {
            store.handleRemoteOperation(packet.data as CollaborativeOperation);
          } else if (packet.type === 'CURSOR') {
            store.updateRemoteCursor(packet.data as CursorPositionPayload);
          } else if (packet.type === 'SELECTION') {
            store.updateRemoteSelection(packet.data.actorId, packet.data.widgetIds);
          } else if (packet.type === 'WEBRTC_SIGNAL') {
            communicationSignaling.handleIncomingPacket(packet.data);
          }
        } catch (err) {
          console.warn('Failed to parse realtime packet:', err);
        }
      };

      this.socket.onerror = () => {
        store.setTransportStatus('reconnecting');
      };

      this.socket.onclose = () => {
        this.isConnected = false;
        store.setTransportStatus('offline');
        this.stopHeartbeat();
      };
    } catch (e) {
      // Graceful fallback to offline/polling mode
      store.setTransportStatus('synced');
    }
  }

  public broadcastOperation(op: CollaborativeOperation): void {
    if (this.socket && this.isConnected && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: 'OPERATION', data: op }));
    }
  }

  public broadcastCursor(cursor: CursorPositionPayload): void {
    if (this.socket && this.isConnected && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: 'CURSOR', data: cursor }));
    }
  }

  public broadcastSelection(actorId: string, widgetIds: string[]): void {
    if (this.socket && this.isConnected && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: 'SELECTION', data: { actorId, widgetIds } }));
    }
  }

  public broadcastSignaling(packet: any): void {
    if (this.socket && this.isConnected && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: 'WEBRTC_SIGNAL', data: packet }));
    }
  }

  public disconnect(): void {
    this.stopHeartbeat();
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    useRealtimeCollaborationStore.getState().setTransportStatus('offline');
  }

  private startHeartbeat(experienceId: string, actorId: string, actorName: string) {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      useRealtimeCollaborationStore.getState().clearStaleLocks();
    }, 10000);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
}

export const collaborationTransport = new CollaborationTransportManager();
