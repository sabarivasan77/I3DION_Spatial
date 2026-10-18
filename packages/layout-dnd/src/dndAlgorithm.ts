import type {
  BoundingRect,
  ChildRect,
  ContainerInfo,
  DragSource,
  DropTarget,
  GuideLine,
  PointerPosition,
  SnapResult
} from './types.ts';

/**
 * Checks if a pointer (x, y) is inside a bounding box
 */
export function isPointInsideRect(point: PointerPosition, rect: BoundingRect): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

/**
 * Snaps a 2D position to an 8px grid and aligns with sibling guides (edges and centers)
 */
export function snap(
  pos: PointerPosition,
  grid = 8,
  guides: GuideLine[] = [],
  tolerance = 5
): SnapResult {
  let targetX = pos.x;
  let targetY = pos.y;
  let snappedToGridX = false;
  let snappedToGridY = false;
  const activeGuides: GuideLine[] = [];

  // Check sibling guide alignment first (higher priority than pure grid)
  let alignedX = false;
  let alignedY = false;

  for (const guide of guides) {
    if (guide.type === 'vertical' && !alignedX) {
      if (Math.abs(pos.x - guide.position) <= tolerance) {
        targetX = guide.position;
        alignedX = true;
        activeGuides.push(guide);
      }
    } else if (guide.type === 'horizontal' && !alignedY) {
      if (Math.abs(pos.y - guide.position) <= tolerance) {
        targetY = guide.position;
        alignedY = true;
        activeGuides.push(guide);
      }
    }
  }

  // If not aligned with a sibling guide, snap to 8px grid
  if (!alignedX && grid > 0) {
    const remainderX = targetX % grid;
    if (remainderX !== 0) {
      targetX = Math.round(targetX / grid) * grid;
      snappedToGridX = true;
    }
  }

  if (!alignedY && grid > 0) {
    const remainderY = targetY % grid;
    if (remainderY !== 0) {
      targetY = Math.round(targetY / grid) * grid;
      snappedToGridY = true;
    }
  }

  return {
    x: targetX,
    y: targetY,
    snappedToGridX,
    snappedToGridY,
    activeGuides
  };
}

/**
 * Calculates insertion index (0..N) in a stack/grid container based on pointer coordinates
 */
export function calculateInsertionIndex(
  pointer: PointerPosition,
  childRects: ChildRect[],
  axis: 'vertical' | 'horizontal' = 'vertical'
): number {
  if (!childRects || childRects.length === 0) {
    return 0;
  }

  for (let i = 0; i < childRects.length; i++) {
    const rect = childRects[i].rect;
    if (axis === 'vertical') {
      const midpointY = rect.y + rect.height / 2;
      if (pointer.y < midpointY) {
        return i;
      }
    } else {
      const midpointX = rect.x + rect.width / 2;
      if (pointer.x < midpointX) {
        return i;
      }
    }
  }

  return childRects.length;
}

/**
 * Applies axis locking when Shift is held down:
 * Keeps movement purely along whichever axis has the greater displacement from the start.
 */
export function applyAxisLock(
  current: PointerPosition,
  origin: PointerPosition
): PointerPosition {
  const dx = Math.abs(current.x - origin.x);
  const dy = Math.abs(current.y - origin.y);

  if (dx > dy) {
    return { x: current.x, y: origin.y };
  } else {
    return { x: origin.x, y: current.y };
  }
}

/**
 * Calculates auto-scroll delta when dragging within 40px of container viewport edges
 */
export function calculateAutoScroll(
  pointer: PointerPosition,
  viewport: BoundingRect,
  threshold = 40,
  speed = 10
): { dx: number; dy: number } {
  let dx = 0;
  let dy = 0;

  // Horizontal edges
  if (pointer.x < viewport.x + threshold && pointer.x >= viewport.x) {
    const factor = (viewport.x + threshold - pointer.x) / threshold;
    dx = -Math.round(speed * factor);
  } else if (pointer.x > viewport.x + viewport.width - threshold && pointer.x <= viewport.x + viewport.width) {
    const factor = (pointer.x - (viewport.x + viewport.width - threshold)) / threshold;
    dx = Math.round(speed * factor);
  }

  // Vertical edges
  if (pointer.y < viewport.y + threshold && pointer.y >= viewport.y) {
    const factor = (viewport.y + threshold - pointer.y) / threshold;
    dy = -Math.round(speed * factor);
  } else if (pointer.y > viewport.y + viewport.height - threshold && pointer.y <= viewport.y + viewport.height) {
    const factor = (pointer.y - (viewport.y + viewport.height - threshold)) / threshold;
    dy = Math.round(speed * factor);
  }

  return { dx, dy };
}

export interface DropTargetContext {
  containers: ContainerInfo[];
  isDescendantFn: (ancestorId: string, potentialChildId: string) => boolean;
  guides?: GuideLine[];
}

/**
 * Core Drag-and-Drop algorithm from Master Specification §4.4
 * Finds the deepest valid container under the pointer, verifies acceptance and capacity,
 * and computes the target insertion index or snapped 2D free position.
 */
export function calculateDropTarget(
  source: DragSource,
  rawPointer: PointerPosition,
  offset: PointerPosition,
  modifiers: { isAltPressed: boolean; isShiftPressed: boolean },
  context: DropTargetContext
): DropTarget {
  const pointer = modifiers.isShiftPressed
    ? applyAxisLock(rawPointer, source.initialPointer)
    : rawPointer;

  // 1. Find candidate containers whose rect contains the pointer
  const candidates = context.containers.filter(c => isPointInsideRect(pointer, c.rect));

  if (candidates.length === 0) {
    return {
      containerId: '',
      canDrop: false,
      reason: 'No container under pointer'
    };
  }

  // 2. Sort candidates by depth descending (deepest first)
  candidates.sort((a, b) => b.depth - a.depth);

  for (const candidate of candidates) {
    // Rule: Cannot drop into self or descendants
    if (source.nodeId) {
      if (source.nodeId === candidate.id) {
        return {
          containerId: candidate.id,
          canDrop: false,
          reason: 'Cannot drop block into itself'
        };
      }
      if (context.isDescendantFn(source.nodeId, candidate.id)) {
        return {
          containerId: candidate.id,
          canDrop: false,
          reason: 'Cannot drop block into its own descendant'
        };
      }
    }

    // Rule: Type acceptance check
    if (typeof candidate.accepts === 'function' && !candidate.accepts(source.nodeType)) {
      continue; // Try next outer candidate if current rejects this type
    }

    // Rule: Capacity check
    if (
      candidate.capacityLimit !== undefined &&
      candidate.currentChildCount >= candidate.capacityLimit
    ) {
      // If moving within the same container, capacity is not exceeded
      const isInternalMove = candidate.childRects.some(c => c.id === source.nodeId);
      if (!isInternalMove) {
        return {
          containerId: candidate.id,
          canDrop: false,
          reason: `Container capacity limit reached (${candidate.capacityLimit})`
        };
      }
    }

    // Deepest valid container found!
    if (
      candidate.layoutMode === 'stack' ||
      candidate.layoutMode === 'tabs' ||
      candidate.layoutMode === 'grid' ||
      candidate.layoutMode === 'repeater'
    ) {
      const axis = candidate.axis || (candidate.layoutMode === 'tabs' ? 'horizontal' : 'vertical');
      const index = calculateInsertionIndex(pointer, candidate.childRects, axis);

      return {
        containerId: candidate.id,
        canDrop: true,
        index,
        isDuplicate: modifiers.isAltPressed
      };
    }

    if (candidate.layoutMode === 'free') {
      const freeX = pointer.x - offset.x - candidate.rect.x;
      const freeY = pointer.y - offset.y - candidate.rect.y;

      const snapResult = snap(
        { x: freeX, y: freeY },
        8,
        context.guides || [],
        5
      );

      return {
        containerId: candidate.id,
        canDrop: true,
        position: { x: snapResult.x, y: snapResult.y },
        activeGuides: snapResult.activeGuides,
        isDuplicate: modifiers.isAltPressed
      };
    }
  }

  return {
    containerId: candidates[0]?.id || '',
    canDrop: false,
    reason: 'Container does not accept this widget type'
  };
}
