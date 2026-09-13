import { TimelineTrack, TimelineKeyframe, InterpolationType } from '../types/timelineTypes';
import { canonicalExperienceRuntime } from '../../3d/runtime/canonicalRuntime';
import { useStudioStore } from '../../store/useStudioStore';

// Easing functions
const applyEasing = (t: number, type: InterpolationType): number => {
  const clamped = Math.max(0, Math.min(1, t));
  switch (type) {
    case 'step':
      return clamped < 1 ? 0 : 1;
    case 'ease-in':
      return clamped * clamped;
    case 'ease-out':
      return clamped * (2 - clamped);
    case 'ease-in-out':
      return clamped < 0.5 ? 2 * clamped * clamped : -1 + (4 - 2 * clamped) * clamped;
    case 'linear':
    default:
      return clamped;
  }
};

// Vector3D interpolation helper
const interpolateVector = (v1: { x: number; y: number; z: number }, v2: { x: number; y: number; z: number }, factor: number) => {
  return {
    x: v1.x + (v2.x - v1.x) * factor,
    y: v1.y + (v2.y - v1.y) * factor,
    z: v1.z + (v2.z - v1.z) * factor,
  };
};

// Number interpolation helper
const interpolateNumber = (n1: number, n2: number, factor: number) => {
  return n1 + (n2 - n1) * factor;
};

export const evaluateTrack = (track: TimelineTrack, time: number): any => {
  const { keyframes, property } = track;
  if (!keyframes || keyframes.length === 0) return undefined;

  // Before first keyframe
  if (time <= keyframes[0].time) {
    return keyframes[0].value;
  }

  // After last keyframe
  if (time >= keyframes[keyframes.length - 1].time) {
    return keyframes[keyframes.length - 1].value;
  }

  // Find bounding keyframe interval
  let prevKf: TimelineKeyframe = keyframes[0];
  let nextKf: TimelineKeyframe = keyframes[keyframes.length - 1];

  for (let i = 0; i < keyframes.length - 1; i++) {
    if (time >= keyframes[i].time && time <= keyframes[i + 1].time) {
      prevKf = keyframes[i];
      nextKf = keyframes[i + 1];
      break;
    }
  }

  const duration = nextKf.time - prevKf.time;
  if (duration <= 0) return prevKf.value;

  const rawFactor = (time - prevKf.time) / duration;
  const easedFactor = applyEasing(rawFactor, prevKf.interpolation || 'linear');

  // Vector3D interpolation for 3D transforms
  if (property === 'position3D' || property === 'rotation3D' || property === 'scale3D') {
    const v1 = prevKf.value || { x: 0, y: 0, z: 0 };
    const v2 = nextKf.value || { x: 0, y: 0, z: 0 };
    return interpolateVector(v1, v2, easedFactor);
  }

  // Numeric interpolation
  if (typeof prevKf.value === 'number' && typeof nextKf.value === 'number') {
    return interpolateNumber(prevKf.value, nextKf.value, easedFactor);
  }

  // Discrete value switch (boolean/string)
  return easedFactor >= 0.5 ? nextKf.value : prevKf.value;
};

export const evaluateAndApplyTimeline = (tracks: TimelineTrack[], time: number): void => {
  if (!tracks || tracks.length === 0) return;

  const studioStore = useStudioStore.getState();

  tracks.forEach((track) => {
    const value = evaluateTrack(track, time);
    if (value === undefined) return;

    if (track.property === 'position3D') {
      canonicalExperienceRuntime.executeAction({
        action: 'SET_MODEL_POSITION',
        targetId: track.targetId,
        payload: { position: value },
      });
    } else if (track.property === 'rotation3D') {
      canonicalExperienceRuntime.executeAction({
        action: 'SET_MODEL_ROTATION',
        targetId: track.targetId,
        payload: { rotation: value },
      });
    } else if (track.property === 'scale3D') {
      canonicalExperienceRuntime.executeAction({
        action: 'SET_MODEL_SCALE',
        targetId: track.targetId,
        payload: { scale: value },
      });
    } else if (track.property === 'visible') {
      canonicalExperienceRuntime.executeAction({
        action: value ? 'SHOW_MODEL' : 'HIDE_MODEL',
        targetId: track.targetId,
      });
    } else {
      // General property update
      studioStore.updateWidgetProperties(track.targetId, { [track.property]: value });
    }
  });
};
