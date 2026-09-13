export type EngineMode = 'workspace' | 'ui' | 'logic' | 'preview';
export type ViewportDevice = 'desktop' | 'tablet' | 'mobile';
export type TransformGizmoMode = 'translate' | 'rotate' | 'scale';

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface SceneNode {
  id: string;
  name: string;
  type: 'mesh' | 'group' | 'camera' | 'light' | 'model';
  parent?: string | null;
  visible: boolean;
  locked?: boolean;
  transform: {
    position: Vector3D;
    rotation: Vector3D;
    scale: Vector3D;
  };
  material?: {
    color?: string;
    roughness?: number;
    metalness?: number;
    wireframe?: boolean;
    xray?: boolean;
  };
  modelUrl?: string;
  animationClips?: string[];
  activeAnimation?: string;
}

export interface UIElement {
  id: string;
  name: string;
  type: 'text' | 'button' | 'image' | 'container' | 'section' | 'card' | 'input' | 'icon' | 'badge';
  content?: string;
  visible: boolean;
  style?: {
    position?: 'static' | 'absolute' | 'relative';
    top?: number | string;
    left?: number | string;
    width?: number | string;
    height?: number | string;
    backgroundColor?: string;
    color?: string;
    fontSize?: number | string;
    borderRadius?: number | string;
    padding?: string;
  };
  children?: string[];
  onClickLogicId?: string;
}

export interface LogicPort {
  id: string;
  name: string;
  type: 'flow' | 'string' | 'number' | 'boolean' | 'object' | 'any';
}

export interface LogicNode {
  id: string;
  type: string;
  category: 'events' | 'actions' | 'conditions' | 'objects' | 'ui' | 'variables' | 'loops' | 'math' | 'functions' | 'custom';
  title: string;
  position: { x: number; y: number };
  inputs: LogicPort[];
  outputs: LogicPort[];
  properties: Record<string, any>;
}

export interface LogicConnection {
  id: string;
  fromNodeId: string;
  fromPortId: string;
  toNodeId: string;
  toPortId: string;
}

export interface EngineVariable {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  value: any;
}

export interface EngineProject {
  id: string;
  name: string;
  description?: string;
  status: 'Draft' | 'Published';
  updatedAt: string;
  thumbnailUrl?: string;
  sceneGraph: SceneNode[];
  uiElements: UIElement[];
  logicGraph: {
    nodes: LogicNode[];
    connections: LogicConnection[];
  };
  variables: EngineVariable[];
  animations: { id: string; name: string; duration: number }[];
}
