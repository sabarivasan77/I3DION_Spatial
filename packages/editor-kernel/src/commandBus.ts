import type { Command } from './commands/index.ts';

export class CommandBus {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private maxHistory: number;
  private listeners: Set<() => void> = new Set();

  constructor(maxHistory = 100) {
    this.maxHistory = maxHistory;
  }

  dispatch(command: Command): void {
    // Check if command can be merged with previous command (e.g., rapid text typing)
    const lastCmd = this.undoStack[this.undoStack.length - 1];
    if (lastCmd && typeof lastCmd.canMergeWith === 'function' && lastCmd.canMergeWith(command)) {
      lastCmd.mergeWith!(command);
      this.notify();
      return;
    }

    command.execute();
    this.undoStack.push(command);
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
    // New action invalidates redo stack
    this.redoStack = [];
    this.notify();
  }

  undo(): boolean {
    if (this.undoStack.length === 0) return false;
    const command = this.undoStack.pop()!;
    command.undo();
    this.redoStack.push(command);
    this.notify();
    return true;
  }

  redo(): boolean {
    if (this.redoStack.length === 0) return false;
    const command = this.redoStack.pop()!;
    command.execute();
    this.undoStack.push(command);
    this.notify();
    return true;
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  getUndoStackNames(): string[] {
    return this.undoStack.map(c => c.name);
  }

  getRedoStackNames(): string[] {
    return this.redoStack.map(c => c.name);
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.notify();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (err) {
        console.error('CommandBus listener error:', err);
      }
    }
  }
}
