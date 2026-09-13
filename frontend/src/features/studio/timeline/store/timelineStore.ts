import { create } from 'zustand';
import { TimelineDefinition, TimelineKeyframe, TimelineTrack, AnimatableProperty } from '../types/timelineTypes';

const generateId = (prefix: string) => `${prefix}_${Math.random().toString(36).substring(2, 8)}`;

const DEFAULT_TIMELINE: TimelineDefinition = {
  id: 'timeline_main_01',
  name: 'Main Experience Animation',
  duration: 5.0,
  fps: 30,
  speed: 1.0,
  loop: false,
  tracks: [],
};

interface TimelineStoreState {
  timelines: TimelineDefinition[];
  activeTimelineId: string;
  currentTime: number;
  isPlaying: boolean;
  speed: number;
  selectedKeyframeId: string | null;
  selectedTrackId: string | null;

  // Actions
  setActiveTimeline: (id: string) => void;
  setCurrentTime: (time: number) => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  setSpeed: (speed: number) => void;
  addTimeline: (name: string) => string;
  deleteTimeline: (id: string) => void;

  addTrack: (targetId: string, property: AnimatableProperty, targetName?: string) => string;
  deleteTrack: (trackId: string) => void;

  addKeyframe: (trackId: string, time: number, value: any) => string;
  updateKeyframe: (trackId: string, keyframeId: string, updates: Partial<TimelineKeyframe>) => void;
  deleteKeyframe: (trackId: string, keyframeId: string) => void;
  selectKeyframe: (keyframeId: string | null, trackId?: string | null) => void;

  getActiveTimeline: () => TimelineDefinition | undefined;
  setTimelines: (timelines: TimelineDefinition[]) => void;
}

export const useTimelineStore = create<TimelineStoreState>((set, get) => ({
  timelines: [DEFAULT_TIMELINE],
  activeTimelineId: 'timeline_main_01',
  currentTime: 0,
  isPlaying: false,
  speed: 1.0,
  selectedKeyframeId: null,
  selectedTrackId: null,

  setActiveTimeline: (id) => set({ activeTimelineId: id }),
  setCurrentTime: (time) => set({ currentTime: Math.max(0, time) }),

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  stop: () => set({ isPlaying: false, currentTime: 0 }),
  seek: (time) => {
    const active = get().getActiveTimeline();
    const maxDur = active ? active.duration : 5.0;
    const clamped = Math.max(0, Math.min(maxDur, time));
    set({ currentTime: clamped });
  },

  setSpeed: (speed) => set({ speed: Math.max(0.1, Math.min(5.0, speed)) }),

  addTimeline: (name) => {
    const id = generateId('timeline');
    const newTl: TimelineDefinition = {
      id,
      name,
      duration: 5.0,
      fps: 30,
      speed: 1.0,
      loop: false,
      tracks: [],
    };
    set((state) => ({
      timelines: [...state.timelines, newTl],
      activeTimelineId: id,
    }));
    return id;
  },

  deleteTimeline: (id) => {
    set((state) => {
      const filtered = state.timelines.filter((t) => t.id !== id);
      const nextActive = filtered.length > 0 ? filtered[0].id : '';
      return {
        timelines: filtered,
        activeTimelineId: nextActive,
      };
    });
  },

  addTrack: (targetId, property, targetName) => {
    const active = get().getActiveTimeline();
    if (!active) return '';

    // Check if track already exists
    const existing = active.tracks.find((t) => t.targetId === targetId && t.property === property);
    if (existing) return existing.id;

    const trackId = generateId('track');
    const newTrack: TimelineTrack = {
      id: trackId,
      targetId,
      targetName: targetName || targetId,
      property,
      keyframes: [],
    };

    set((state) => ({
      timelines: state.timelines.map((tl) => {
        if (tl.id === state.activeTimelineId) {
          return { ...tl, tracks: [...tl.tracks, newTrack] };
        }
        return tl;
      }),
    }));

    return trackId;
  },

  deleteTrack: (trackId) => {
    set((state) => ({
      timelines: state.timelines.map((tl) => {
        if (tl.id === state.activeTimelineId) {
          return { ...tl, tracks: tl.tracks.filter((t) => t.id !== trackId) };
        }
        return tl;
      }),
    }));
  },

  addKeyframe: (trackId, time, value) => {
    const kfId = generateId('kf');
    const newKf: TimelineKeyframe = {
      id: kfId,
      time,
      value,
      interpolation: 'linear',
    };

    set((state) => ({
      timelines: state.timelines.map((tl) => {
        if (tl.id === state.activeTimelineId) {
          return {
            ...tl,
            tracks: tl.tracks.map((tr) => {
              if (tr.id === trackId) {
                const updatedKfs = [...tr.keyframes, newKf].sort((a, b) => a.time - b.time);
                return { ...tr, keyframes: updatedKfs };
              }
              return tr;
            }),
          };
        }
        return tl;
      }),
      selectedKeyframeId: kfId,
      selectedTrackId: trackId,
    }));

    return kfId;
  },

  updateKeyframe: (trackId, keyframeId, updates) => {
    set((state) => ({
      timelines: state.timelines.map((tl) => {
        if (tl.id === state.activeTimelineId) {
          return {
            ...tl,
            tracks: tl.tracks.map((tr) => {
              if (tr.id === trackId) {
                const updated = tr.keyframes
                  .map((kf) => (kf.id === keyframeId ? { ...kf, ...updates } : kf))
                  .sort((a, b) => a.time - b.time);
                return { ...tr, keyframes: updated };
              }
              return tr;
            }),
          };
        }
        return tl;
      }),
    }));
  },

  deleteKeyframe: (trackId, keyframeId) => {
    set((state) => ({
      timelines: state.timelines.map((tl) => {
        if (tl.id === state.activeTimelineId) {
          return {
            ...tl,
            tracks: tl.tracks.map((tr) => {
              if (tr.id === trackId) {
                return { ...tr, keyframes: tr.keyframes.filter((kf) => kf.id !== keyframeId) };
              }
              return tr;
            }),
          };
        }
        return tl;
      }),
      selectedKeyframeId: state.selectedKeyframeId === keyframeId ? null : state.selectedKeyframeId,
    }));
  },

  selectKeyframe: (keyframeId, trackId = null) => {
    set({ selectedKeyframeId: keyframeId, selectedTrackId: trackId });
  },

  getActiveTimeline: () => {
    const state = get();
    return state.timelines.find((t) => t.id === state.activeTimelineId);
  },

  setTimelines: (timelines) => {
    if (!timelines || timelines.length === 0) return;
    set({ timelines, activeTimelineId: timelines[0].id });
  },
}));
