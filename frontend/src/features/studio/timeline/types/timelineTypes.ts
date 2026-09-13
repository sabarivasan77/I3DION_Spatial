export type InterpolationType = 'linear' | 'step' | 'ease-in' | 'ease-out' | 'ease-in-out';

export type AnimatableProperty =
  | 'position3D'
  | 'rotation3D'
  | 'scale3D'
  | 'opacity'
  | 'visible'
  | 'backgroundColor'
  | 'fontSize';

export interface TimelineKeyframe {
  id: string;
  time: number; // In seconds (e.g. 0.5, 1.0, 2.5)
  value: any; // {x, y, z} or number or boolean
  interpolation: InterpolationType;
}

export interface TimelineTrack {
  id: string;
  targetId: string; // StudioWidgetNode ID
  targetName?: string;
  property: AnimatableProperty;
  keyframes: TimelineKeyframe[];
}

export interface TimelineDefinition {
  id: string;
  name: string;
  duration: number; // Total duration in seconds (default 5.0)
  fps: number; // Frames per second (default 30)
  speed: number; // Playback speed multiplier (default 1.0)
  loop: boolean;
  tracks: TimelineTrack[];
}

export interface TimelineState {
  timelines: TimelineDefinition[];
  activeTimelineId: string | null;
  currentTime: number;
  isPlaying: boolean;
  speed: number;
  selectedKeyframeId: string | null;
  selectedTrackId: string | null;
}
