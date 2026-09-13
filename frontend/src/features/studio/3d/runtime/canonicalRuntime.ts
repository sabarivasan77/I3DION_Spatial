import { actionRegistry, ActionInvocation } from './actionRegistry';
import { experienceEventBus } from './eventBus';
import { ExperienceEventPayload, CameraPreset, Vector3D } from '../types/threeTypes';
import { useStudioStore } from '../../store/useStudioStore';

export interface ModelRuntimeState {
  widgetId: string;
  visible: boolean;
  position: Vector3D;
  rotation: Vector3D;
  scale: Vector3D;
  cameraPreset: CameraPreset;
  activeAnimation: string | null;
  isPlayingAnimation: boolean;
  availableAnimations: string[];
}

class CanonicalExperienceRuntime {
  private modelStates: Map<string, ModelRuntimeState> = new Map();

  constructor() {
    // Listen for canonical events
    experienceEventBus.subscribe('MODEL_LOADED', (evt) => this.handleEvent(evt));
    experienceEventBus.subscribe('MODEL_CLICKED', (evt) => this.handleEvent(evt));
    experienceEventBus.subscribe('HOTSPOT_CLICKED', (evt) => this.handleEvent(evt));
  }

  public registerModelState(id: string, initialState: Partial<ModelRuntimeState>): void {
    const existing = this.modelStates.get(id) || {
      widgetId: id,
      visible: true,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      cameraPreset: 'Custom',
      activeAnimation: null,
      isPlayingAnimation: false,
      availableAnimations: [],
    };

    this.modelStates.set(id, { ...existing, ...initialState });
  }

  public getModelState(id: string): ModelRuntimeState | undefined {
    return this.modelStates.get(id);
  }

  public executeAction(invocation: ActionInvocation): void {
    // Dispatch to registered handlers (3D viewport components & UI)
    actionRegistry.dispatchAction(invocation);

    // Update canonical state store
    const state = this.modelStates.get(invocation.targetId);
    if (!state) return;

    switch (invocation.action) {
      case 'SHOW_MODEL':
        state.visible = true;
        break;
      case 'HIDE_MODEL':
        state.visible = false;
        break;
      case 'TOGGLE_MODEL':
        state.visible = !state.visible;
        break;
      case 'PLAY_ANIMATION':
        if (invocation.payload?.animationName) {
          state.activeAnimation = invocation.payload.animationName;
          state.isPlayingAnimation = true;
        }
        break;
      case 'PAUSE_ANIMATION':
      case 'STOP_ANIMATION':
        state.isPlayingAnimation = false;
        break;
      case 'SET_CAMERA':
        if (invocation.payload?.cameraPreset) {
          state.cameraPreset = invocation.payload.cameraPreset;
        }
        break;
      case 'ROTATE_MODEL':
        if (invocation.payload?.axis && invocation.payload?.degrees !== undefined) {
          const rad = (invocation.payload.degrees * Math.PI) / 180;
          if (invocation.payload.axis === 'X') state.rotation.x += rad;
          if (invocation.payload.axis === 'Y') state.rotation.y += rad;
          if (invocation.payload.axis === 'Z') state.rotation.z += rad;
        }
        break;
      case 'SET_MODEL_POSITION':
        if (invocation.payload?.position) {
          state.position = { ...state.position, ...invocation.payload.position };
        }
        break;
      case 'SET_MODEL_ROTATION':
        if (invocation.payload?.rotation) {
          state.rotation = { ...state.rotation, ...invocation.payload.rotation };
        }
        break;
      case 'SET_MODEL_SCALE':
        if (invocation.payload?.scale) {
          if (typeof invocation.payload.scale === 'number') {
            const s = invocation.payload.scale;
            state.scale = { x: s, y: s, z: s };
          } else {
            state.scale = { ...state.scale, ...invocation.payload.scale };
          }
        }
        break;
      case 'PLAY_TIMELINE':
        experienceEventBus.dispatch({ type: 'TIMELINE_STARTED', targetId: invocation.targetId || 'timeline' });
        break;
      case 'PAUSE_TIMELINE':
        experienceEventBus.dispatch({ type: 'TIMELINE_PAUSED', targetId: invocation.targetId || 'timeline' });
        break;
      case 'STOP_TIMELINE':
        experienceEventBus.dispatch({ type: 'TIMELINE_STOPPED', targetId: invocation.targetId || 'timeline' });
        break;
      case 'SEEK_TIMELINE':
        if (invocation.payload?.seekTime !== undefined) {
          experienceEventBus.dispatch({ type: 'KEYFRAME_REACHED', targetId: invocation.targetId || 'timeline', data: { time: invocation.payload.seekTime } });
        }
        break;
      case 'SET_TIMELINE_SPEED':
        break;
      case 'CALL_DATABRIDGE':
        break;
    }

    // Sync changes back to OmniStudio StudioStore if node exists
    const studioStore = useStudioStore.getState();
    const node = studioStore.experience.nodes[invocation.targetId];
    if (node) {
      studioStore.updateNodeProperties(invocation.targetId, {
        visible: state.visible,
        position3D: state.position,
        rotation3D: state.rotation,
        scale3D: state.scale,
        cameraPreset: state.cameraPreset,
      });
    }
  }

  private handleEvent(event: ExperienceEventPayload): void {
    if (event.type === 'MODEL_LOADED' && event.data?.animations) {
      const state = this.modelStates.get(event.targetId);
      if (state) {
        state.availableAnimations = event.data.animations;
      }
    }
  }
}

export const canonicalExperienceRuntime = new CanonicalExperienceRuntime();
