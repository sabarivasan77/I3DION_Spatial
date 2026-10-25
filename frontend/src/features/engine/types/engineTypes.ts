export type EngineMode =
  | 'modeling'      // Blender-inspired 3D scene & mesh authoring
  | 'interactive'   // Verge3D-inspired interactive behaviors, widgets, code, XR
  | 'projects'      // Project management & template catalog
  | 'preview'       // Fullscreen interactive runtime preview
  | 'workspace'     // Backward compatibility alias for projects
  | 'ui'            // Backward compatibility alias for interactive
  | 'logic';        // Backward compatibility alias for interactive logic

export type ViewportDevice = 'desktop' | 'tablet' | 'mobile';
export type TransformGizmoMode = 'translate' | 'rotate' | 'scale';

export type BlenderObjectMode = 'object' | 'edit' | 'sculpt';
export type BlenderTool = 'select' | 'cursor' | 'move' | 'rotate' | 'scale' | 'transform' | 'measure' | 'add';
export type BlenderShadingMode = 'wireframe' | 'solid' | 'material' | 'rendered';

export interface InteractiveWidget {
  id: string;
  title: string;
  type: 'hotspot' | 'infocard' | 'button' | 'exploded_slider' | 'variant_switcher' | 'xr_button' | 'modal';
  targetNodeId?: string;
  position?: Vector3D;
  content?: string;
  config: Record<string, any>;
  enabled: boolean;
}

export interface SceneInteraction {
  id: string;
  name: string;
  trigger: 'click' | 'hover' | 'load' | 'hotspot_click';
  targetNodeId?: string;
  action: 'show_hide' | 'change_material' | 'play_animation' | 'open_info' | 'open_url' | 'trigger_sound';
  parameters: Record<string, any>;
  enabled: boolean;
}

export interface CustomCodeFiles {
  html: string;
  css: string;
  js: string;
}

export interface EngineExportSettings {
  format: 'standalone_zip' | 'gltf_bundle' | 'cloud_publish';
  title: string;
  includeViewer: boolean;
  enableAr: boolean;
}

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface SceneNode {
  id: string;
  name: string;
  type: 'mesh' | 'group' | 'camera' | 'light' | 'model';
  geometryType?: 'cube' | 'sphere' | 'cylinder' | 'torus' | 'cone' | 'monkey' | 'custom';
  dimensions?: Vector3D;
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
  widgets?: InteractiveWidget[];
  interactions?: SceneInteraction[];
  codeFiles?: CustomCodeFiles;
  logicGraph: {
    nodes: LogicNode[];
    connections: LogicConnection[];
  };
  variables: EngineVariable[];
  animations: { id: string; name: string; duration: number }[];
}
