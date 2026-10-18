export interface PointerPosition {
  x: number;
  y: number;
}

export interface BoundingRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type ContainerLayoutMode = 'stack' | 'grid' | 'free' | 'tabs' | 'repeater';

export interface ChildRect {
  id: string;
  rect: BoundingRect;
}

export interface ContainerInfo {
  id: string;
  type: string;
  layoutMode: ContainerLayoutMode;
  rect: BoundingRect;
  depth: number;
  childRects: ChildRect[];
  capacityLimit?: number;
  currentChildCount: number;
  axis?: 'vertical' | 'horizontal';
  accepts?: (childType: string) => boolean;
}

export interface DragSource {
  kind: 'palette' | 'node';
  nodeType: string;
  nodeId?: string;
  selectedNodeIds?: string[];
  initialPointer: PointerPosition;
  nodeRect?: BoundingRect;
}

export interface GuideLine {
  type: 'vertical' | 'horizontal';
  position: number;
  label?: string;
}

export interface SnapResult {
  x: number;
  y: number;
  snappedToGridX: boolean;
  snappedToGridY: boolean;
  activeGuides: GuideLine[];
}

export interface DropTarget {
  containerId: string;
  canDrop: boolean;
  reason?: string;
  index?: number;
  position?: { x: number; y: number };
  isDuplicate?: boolean;
  activeGuides?: GuideLine[];
}

export interface DragState {
  isDragging: boolean;
  source: DragSource | null;
  currentPointer: PointerPosition;
  offset: PointerPosition;
  currentDropTarget: DropTarget | null;
  isAltPressed: boolean;
  isShiftPressed: boolean;
}
