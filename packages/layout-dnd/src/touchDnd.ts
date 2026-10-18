import type { PointerPosition } from './types.ts';

export interface TouchSensorOptions {
  pressThresholdMs?: number;
  movementTolerancePx?: number;
  vibrateOnLift?: boolean;
}

export class TouchDndSensor {
  private timer: NodeJS.Timeout | null = null;
  private startPoint: PointerPosition | null = null;
  private isLiftTriggered = false;
  private pressThresholdMs: number;
  private movementTolerancePx: number;
  private vibrateOnLift: boolean;

  constructor(options: TouchSensorOptions = {}) {
    this.pressThresholdMs = options.pressThresholdMs ?? 300;
    this.movementTolerancePx = options.movementTolerancePx ?? 10;
    this.vibrateOnLift = options.vibrateOnLift ?? true;
  }

  handleTouchStart(
    point: PointerPosition,
    onLiftCallback: (startPoint: PointerPosition) => void
  ): void {
    this.cancel();
    this.startPoint = { ...point };
    this.isLiftTriggered = false;

    this.timer = setTimeout(() => {
      this.isLiftTriggered = true;
      if (
        this.vibrateOnLift &&
        typeof navigator !== 'undefined' &&
        typeof navigator.vibrate === 'function'
      ) {
        try {
          navigator.vibrate(50);
        } catch {
          // Ignore vibration failures if unpermitted
        }
      }
      onLiftCallback(this.startPoint!);
    }, this.pressThresholdMs);
  }

  handleTouchMove(currentPoint: PointerPosition): boolean {
    if (this.isLiftTriggered) {
      // Drag is already active, return true to indicate active drag
      return true;
    }

    if (!this.startPoint) return false;

    const dx = Math.abs(currentPoint.x - this.startPoint.x);
    const dy = Math.abs(currentPoint.y - this.startPoint.y);

    // If moved more than tolerance before timer fired, user is trying to scroll
    if (dx > this.movementTolerancePx || dy > this.movementTolerancePx) {
      this.cancel();
      return false;
    }

    return false;
  }

  handleTouchEnd(): boolean {
    const wasLifted = this.isLiftTriggered;
    this.cancel();
    return wasLifted;
  }

  cancel(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.startPoint = null;
    this.isLiftTriggered = false;
  }

  isDragging(): boolean {
    return this.isLiftTriggered;
  }
}
