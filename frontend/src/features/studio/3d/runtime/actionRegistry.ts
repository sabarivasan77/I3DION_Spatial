import { CameraPreset, Vector3D } from '../types/threeTypes';

export type ActionType =
  | 'PLAY_ANIMATION'
  | 'PAUSE_ANIMATION'
  | 'STOP_ANIMATION'
  | 'ROTATE_MODEL'
  | 'SET_MODEL_POSITION'
  | 'SET_MODEL_ROTATION'
  | 'SET_MODEL_SCALE'
  | 'SHOW_MODEL'
  | 'HIDE_MODEL'
  | 'TOGGLE_MODEL'
  | 'SET_CAMERA'
  | 'RESET_CAMERA'
  | 'SHOW_WIDGET'
  | 'HIDE_WIDGET'
  | 'PLAY_TIMELINE'
  | 'PAUSE_TIMELINE'
  | 'STOP_TIMELINE'
  | 'SEEK_TIMELINE'
  | 'SET_TIMELINE_SPEED'
  | 'CALL_DATABRIDGE';

export interface ActionInvocation {
  action: ActionType;
  targetId: string;
  payload?: {
    animationName?: string;
    timelineId?: string;
    seekTime?: number;
    position?: Partial<Vector3D>;
    rotation?: Partial<Vector3D>;
    scale?: Partial<Vector3D> | number;
    cameraPreset?: CameraPreset;
    speed?: number;
    axis?: 'X' | 'Y' | 'Z';
    degrees?: number;
    dataBridgeKey?: string;
  };
}

export type ActionHandler = (invocation: ActionInvocation) => void;

class ActionRegistry {
  private handlers: Map<ActionType, Set<ActionHandler>> = new Map();

  public registerHandler(action: ActionType, handler: ActionHandler): () => void {
    if (!this.handlers.has(action)) {
      this.handlers.set(action, new Set());
    }
    this.handlers.get(action)!.add(handler);

    return () => {
      this.handlers.get(action)?.delete(handler);
    };
  }

  public dispatchAction(invocation: ActionInvocation): void {
    const actionHandlers = this.handlers.get(invocation.action);
    if (actionHandlers) {
      actionHandlers.forEach(handler => handler(invocation));
    }
  }
}

export const actionRegistry = new ActionRegistry();
