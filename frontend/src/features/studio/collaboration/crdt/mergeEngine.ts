import { CollaborativeOperation } from '../types/realtimeTypes';
import { useStudioStore } from '../../store/useStudioStore';
import { useTimelineStore } from '../../timeline/store/timelineStore';
import { canonicalExperienceRuntime } from '../../3d/runtime/canonicalRuntime';

class CollaborationMergeEngine {
  private processedOpIds: Set<string> = new Set();

  public applyRemoteOperation(op: CollaborativeOperation): boolean {
    if (this.processedOpIds.has(op.operationId)) {
      return false; // Deduplicate
    }
    this.processedOpIds.add(op.operationId);

    const studioStore = useStudioStore.getState();
    const timelineStore = useTimelineStore.getState();

    switch (op.type) {
      case 'UPDATE_WIDGET_PROPERTY':
      case 'MOVE_WIDGET':
      case 'RESIZE_WIDGET':
        if (op.targetId && op.payload) {
          studioStore.updateWidgetProperties(op.targetId, op.payload);
        }
        break;

      case 'DELETE_WIDGET':
        if (op.targetId) {
          studioStore.deleteWidget(op.targetId);
        }
        break;

      case 'DUPLICATE_WIDGET':
        if (op.targetId) {
          studioStore.duplicateWidget(op.targetId);
        }
        break;

      case 'UPDATE_3D_TRANSFORM':
        if (op.targetId && op.payload) {
          if (op.payload.position3D) {
            canonicalExperienceRuntime.executeAction({
              action: 'SET_MODEL_POSITION',
              targetId: op.targetId,
              payload: { position: op.payload.position3D },
            });
          }
          if (op.payload.rotation3D) {
            canonicalExperienceRuntime.executeAction({
              action: 'SET_MODEL_ROTATION',
              targetId: op.targetId,
              payload: { rotation: op.payload.rotation3D },
            });
          }
          if (op.payload.scale3D) {
            canonicalExperienceRuntime.executeAction({
              action: 'SET_MODEL_SCALE',
              targetId: op.targetId,
              payload: { scale: op.payload.scale3D },
            });
          }
        }
        break;

      case 'ADD_KEYFRAME':
        if (op.payload.trackId && op.payload.time !== undefined) {
          timelineStore.addKeyframe(op.payload.trackId, op.payload.time, op.payload.value);
        }
        break;

      case 'MOVE_KEYFRAME':
      case 'UPDATE_KEYFRAME':
        if (op.payload.trackId && op.payload.keyframeId && op.payload.updates) {
          timelineStore.updateKeyframe(op.payload.trackId, op.payload.keyframeId, op.payload.updates);
        }
        break;

      case 'DELETE_KEYFRAME':
        if (op.payload.trackId && op.payload.keyframeId) {
          timelineStore.deleteKeyframe(op.payload.trackId, op.payload.keyframeId);
        }
        break;

      case 'RENAME_SCENE_NODE':
        if (op.targetId && op.payload.name) {
          useStudioStore.setState((state) => ({
            experience: {
              ...state.experience,
              widgets: state.experience.widgets.map((w) =>
                w.id === op.targetId ? { ...w, name: op.payload.name } : w
              ),
            },
          }));
        }
        break;

      case 'HIDE_SCENE_NODE':
      case 'LOCK_SCENE_NODE':
        if (op.targetId && op.payload) {
          studioStore.updateWidgetProperties(op.targetId, op.payload);
        }
        break;

      default:
        break;
    }

    return true;
  }
}

export const mergeEngine = new CollaborationMergeEngine();
