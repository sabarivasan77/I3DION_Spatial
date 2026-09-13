export type OperationType =
  | 'ADD_WIDGET'
  | 'DELETE_WIDGET'
  | 'MOVE_WIDGET'
  | 'RESIZE_WIDGET'
  | 'UPDATE_WIDGET_PROPERTY'
  | 'DUPLICATE_WIDGET'
  | 'SELECT_WIDGET'
  | 'DESELECT_WIDGET'
  | 'UPDATE_3D_TRANSFORM'
  | 'UPDATE_CAMERA'
  | 'UPDATE_HOTSPOT'
  | 'ADD_KEYFRAME'
  | 'MOVE_KEYFRAME'
  | 'DELETE_KEYFRAME'
  | 'UPDATE_KEYFRAME'
  | 'ADD_LOGIC_NODE'
  | 'MOVE_LOGIC_NODE'
  | 'DELETE_LOGIC_NODE'
  | 'CONNECT_LOGIC_NODES'
  | 'UPDATE_ISCRIPT'
  | 'RENAME_SCENE_NODE'
  | 'HIDE_SCENE_NODE'
  | 'LOCK_SCENE_NODE'
  | 'GROUP_OBJECTS'
  | 'UNGROUP_OBJECTS';

export interface CollaborativeOperation {
  operationId: string;
  experienceId: string;
  actorId: string;
  actorName: string;
  actorAvatar?: string;
  timestamp: number;
  baseRevision: number;
  type: OperationType;
  targetId: string;
  payload: Record<string, any>;
}

export interface CursorPositionPayload {
  actorId: string;
  actorName: string;
  actorColor: string;
  x: number;
  y: number;
  editingSection?: string;
  timestamp: number;
}

export interface SoftLockRecord {
  targetId: string;
  actorId: string;
  actorName: string;
  lockedAt: number;
  expiresAt: number;
}

export type RealtimeTransportStatus = 'connected' | 'connecting' | 'reconnecting' | 'offline' | 'synced' | 'error';
