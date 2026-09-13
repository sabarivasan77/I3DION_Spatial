export type CameraPreset = 'Front' | 'Back' | 'Left' | 'Right' | 'Top' | 'Bottom' | 'Isometric' | 'Custom';

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface HotspotDefinition {
  id: string;
  label: string;
  description?: string;
  position: Vector3D;
  visible: boolean;
  icon?: string;
  targetAction?: string;
}

export interface AnimationControlState {
  availableAnimations: string[];
  currentAnimation: string | null;
  isPlaying: boolean;
  speed: number;
  loop: boolean;
}

export interface ThreeModelWidgetProperties {
  modelUrl?: string;
  modelId?: string;
  productName?: string;
  width?: number;
  height?: number;
  backgroundColor?: string;
  position3D?: Vector3D;
  rotation3D?: Vector3D;
  scale3D?: Vector3D;
  cameraPreset?: CameraPreset;
  cameraFov?: number;
  autoRotate?: boolean;
  rotationSpeed?: number;
  controlsEnabled?: boolean;
  lightIntensity?: number;
  environmentPreset?: 'studio' | 'city' | 'sunset' | 'night';
  shadowsEnabled?: boolean;
  wireframeMode?: 'solid' | 'wireframe' | 'xray';
  animations?: AnimationControlState;
  hotspots?: HotspotDefinition[];
  visible?: boolean;
  arEnabled?: boolean;
}

export type ExperienceEventType =
  | 'MODEL_LOADED'
  | 'MODEL_CLICKED'
  | 'MODEL_HOVERED'
  | 'ANIMATION_STARTED'
  | 'ANIMATION_COMPLETED'
  | 'HOTSPOT_CLICKED'
  | 'HOTSPOT_HOVERED'
  | 'WIDGET_CLICKED'
  | 'TIMELINE_STARTED'
  | 'TIMELINE_PAUSED'
  | 'TIMELINE_COMPLETED'
  | 'TIMELINE_STOPPED'
  | 'KEYFRAME_REACHED';

export interface ExperienceEventPayload {
  type: ExperienceEventType;
  targetId: string;
  targetName?: string;
  data?: any;
  timestamp: number;
}
