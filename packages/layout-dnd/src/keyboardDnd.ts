export interface KeyboardDndState {
  isLifted: boolean;
  nodeId: string | null;
  nodeTitle: string;
  sourceContainerId: string;
  sourceIndex: number;
  currentContainerId: string;
  currentIndex: number;
  announcement: string;
}

export interface ContainerTreeSlot {
  containerId: string;
  title: string;
  itemCount: number;
}

export class KeyboardDndController {
  private state: KeyboardDndState = {
    isLifted: false,
    nodeId: null,
    nodeTitle: '',
    sourceContainerId: '',
    sourceIndex: -1,
    currentContainerId: '',
    currentIndex: -1,
    announcement: ''
  };

  private listeners: Set<(state: KeyboardDndState) => void> = new Set();

  getState(): KeyboardDndState {
    return { ...this.state };
  }

  lift(
    nodeId: string,
    nodeTitle: string,
    containerId: string,
    index: number,
    totalInContainer: number
  ): string {
    this.state = {
      isLifted: true,
      nodeId,
      nodeTitle,
      sourceContainerId: containerId,
      sourceIndex: index,
      currentContainerId: containerId,
      currentIndex: index,
      announcement: `Lifted ${nodeTitle}. Current position ${index + 1} of ${totalInContainer}. Use arrow keys to navigate, Space to drop, Escape to cancel.`
    };
    this.notify();
    return this.state.announcement;
  }

  moveVertical(delta: number, maxCount: number, containerTitle: string): string {
    if (!this.state.isLifted) return '';

    const newIndex = Math.max(0, Math.min(maxCount, this.state.currentIndex + delta));
    this.state.currentIndex = newIndex;
    this.state.announcement = `Moved ${this.state.nodeTitle} to position ${newIndex + 1} of ${maxCount + 1} in ${containerTitle}.`;
    this.notify();
    return this.state.announcement;
  }

  switchContainer(
    targetContainerId: string,
    containerTitle: string,
    targetCount: number
  ): string {
    if (!this.state.isLifted) return '';

    this.state.currentContainerId = targetContainerId;
    this.state.currentIndex = targetCount; // Appended at end by default
    this.state.announcement = `Moved ${this.state.nodeTitle} into container ${containerTitle} at position ${targetCount + 1}.`;
    this.notify();
    return this.state.announcement;
  }

  drop(containerTitle: string): { containerId: string; index: number; announcement: string } | null {
    if (!this.state.isLifted || !this.state.nodeId) return null;

    const result = {
      containerId: this.state.currentContainerId,
      index: this.state.currentIndex,
      announcement: `Dropped ${this.state.nodeTitle} into ${containerTitle} at position ${this.state.currentIndex + 1}.`
    };

    this.cancel(); // Reset lifted state
    return result;
  }

  cancel(): string {
    const announcement = this.state.isLifted
      ? `Drag cancelled. Restored ${this.state.nodeTitle} to original position.`
      : '';

    this.state = {
      isLifted: false,
      nodeId: null,
      nodeTitle: '',
      sourceContainerId: '',
      sourceIndex: -1,
      currentContainerId: '',
      currentIndex: -1,
      announcement
    };
    this.notify();
    return announcement;
  }

  subscribe(listener: (state: KeyboardDndState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.state);
      } catch (err) {
        console.error('KeyboardDndController listener error:', err);
      }
    }
  }
}
