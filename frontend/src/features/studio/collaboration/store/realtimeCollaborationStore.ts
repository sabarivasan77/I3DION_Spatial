import { create } from 'zustand';
import {
  RealtimeTransportStatus,
  CursorPositionPayload,
  SoftLockRecord,
  CollaborativeOperation,
} from '../types/realtimeTypes';
import { mergeEngine } from '../crdt/mergeEngine';
import { createOperationPacket } from '../crdt/operationTypes';

interface RealtimeCollaborationState {
  transportStatus: RealtimeTransportStatus;
  remoteCursors: Map<string, CursorPositionPayload>;
  remoteSelections: Map<string, string[]>; // actorId -> selectedWidgetIds[]
  softLocks: Map<string, SoftLockRecord>; // targetId -> SoftLockRecord
  pendingOperations: CollaborativeOperation[];
  isPresenceDrawerOpen: boolean;

  // Actions
  setTransportStatus: (status: RealtimeTransportStatus) => void;
  updateRemoteCursor: (cursor: CursorPositionPayload) => void;
  updateRemoteSelection: (actorId: string, widgetIds: string[]) => void;
  acquireSoftLock: (targetId: string, actorId: string, actorName: string) => void;
  releaseSoftLock: (targetId: string) => void;
  dispatchLocalOperation: (
    experienceId: string,
    actorId: string,
    actorName: string,
    revision: number,
    type: any,
    targetId: string,
    payload: Record<string, any>
  ) => CollaborativeOperation;
  handleRemoteOperation: (op: CollaborativeOperation) => void;
  togglePresenceDrawer: () => void;
  clearStaleLocks: () => void;
}

export const useRealtimeCollaborationStore = create<RealtimeCollaborationState>((set, get) => ({
  transportStatus: 'synced',
  remoteCursors: new Map(),
  remoteSelections: new Map(),
  softLocks: new Map(),
  pendingOperations: [],
  isPresenceDrawerOpen: false,

  setTransportStatus: (status) => set({ transportStatus: status }),

  updateRemoteCursor: (cursor) => {
    set((state) => {
      const nextMap = new Map(state.remoteCursors);
      nextMap.set(cursor.actorId, cursor);
      return { remoteCursors: nextMap };
    });
  },

  updateRemoteSelection: (actorId, widgetIds) => {
    set((state) => {
      const nextMap = new Map(state.remoteSelections);
      nextMap.set(actorId, widgetIds);
      return { remoteSelections: nextMap };
    });
  },

  acquireSoftLock: (targetId, actorId, actorName) => {
    set((state) => {
      const nextLocks = new Map(state.softLocks);
      const now = Date.now();
      nextLocks.set(targetId, {
        targetId,
        actorId,
        actorName,
        lockedAt: now,
        expiresAt: now + 30000, // 30s TTL
      });
      return { softLocks: nextLocks };
    });
  },

  releaseSoftLock: (targetId) => {
    set((state) => {
      const nextLocks = new Map(state.softLocks);
      nextLocks.delete(targetId);
      return { softLocks: nextLocks };
    });
  },

  dispatchLocalOperation: (experienceId, actorId, actorName, revision, type, targetId, payload) => {
    const packet = createOperationPacket(
      experienceId,
      actorId,
      actorName,
      revision,
      type,
      targetId,
      payload
    );

    set((state) => ({
      pendingOperations: [...state.pendingOperations, packet],
    }));

    return packet;
  },

  handleRemoteOperation: (op) => {
    mergeEngine.applyRemoteOperation(op);
  },

  togglePresenceDrawer: () => set((state) => ({ isPresenceDrawerOpen: !state.isPresenceDrawerOpen })),

  clearStaleLocks: () => {
    set((state) => {
      const now = Date.now();
      const nextLocks = new Map<string, SoftLockRecord>();
      state.softLocks.forEach((lock, id) => {
        if (lock.expiresAt > now) {
          nextLocks.set(id, lock);
        }
      });
      return { softLocks: nextLocks };
    });
  },
}));
