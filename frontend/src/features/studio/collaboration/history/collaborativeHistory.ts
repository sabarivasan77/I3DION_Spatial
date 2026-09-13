import { CollaborativeOperation } from '../types/realtimeTypes';
import { useStudioStore } from '../../store/useStudioStore';

export class CollaborativeHistoryManager {
  private localHistoryPast: CollaborativeOperation[] = [];
  private localHistoryFuture: CollaborativeOperation[] = [];

  public recordLocalOperation(op: CollaborativeOperation): void {
    this.localHistoryPast.push(op);
    this.localHistoryFuture = [];
  }

  public undoLocal(actorId: string): CollaborativeOperation | null {
    if (this.localHistoryPast.length === 0) return null;

    // Find last operation executed by this local actor
    let targetIndex = -1;
    for (let i = this.localHistoryPast.length - 1; i >= 0; i--) {
      if (this.localHistoryPast[i].actorId === actorId) {
        targetIndex = i;
        break;
      }
    }

    if (targetIndex === -1) return null;

    const opToUndo = this.localHistoryPast[targetIndex];
    this.localHistoryPast.splice(targetIndex, 1);
    this.localHistoryFuture.push(opToUndo);

    // Apply store undo for local user
    useStudioStore.getState().undo();

    return opToUndo;
  }

  public redoLocal(actorId: string): CollaborativeOperation | null {
    if (this.localHistoryFuture.length === 0) return null;

    const opToRedo = this.localHistoryFuture.pop();
    if (!opToRedo) return null;

    this.localHistoryPast.push(opToRedo);
    useStudioStore.getState().redo();

    return opToRedo;
  }
}

export const collaborativeHistory = new CollaborativeHistoryManager();
