import type { AppDefinitionContract } from '../../contracts/src/catalogAppDefinition.ts';
import { DocumentStore } from './documentStore.ts';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'conflict' | 'error';

export interface ConflictErrorDetails {
  serverRevision: number;
  clientBaseRevision: number;
  message: string;
}

export type SaveHandler = (
  doc: AppDefinitionContract,
  expectedRevision: number
) => Promise<{ revision: number }>;

export class OptimisticLockManager {
  private baseRevision: number;
  private status: SaveStatus = 'idle';
  private lastSavedAt: Date | null = null;
  private lastError: string | null = null;
  private autoSaveTimer: NodeJS.Timeout | null = null;
  private listeners: Set<() => void> = new Set();
  private debounceMs: number;
  private store: DocumentStore;
  private saveHandler?: SaveHandler;

  constructor(
    store: DocumentStore,
    saveHandler?: SaveHandler,
    debounceMs = 1500
  ) {
    this.store = store;
    this.saveHandler = saveHandler;
    this.baseRevision = store.getRevision();
    this.debounceMs = debounceMs;

    // Listen to document store changes to schedule auto-save
    this.store.subscribe(() => {
      if (this.store.isModified()) {
        this.scheduleAutoSave();
      }
    });
  }

  getBaseRevision(): number {
    return this.baseRevision;
  }

  setBaseRevision(revision: number): void {
    this.baseRevision = revision;
    this.notify();
  }

  getStatus(): SaveStatus {
    return this.status;
  }

  getLastSavedAt(): Date | null {
    return this.lastSavedAt;
  }

  getLastError(): string | null {
    return this.lastError;
  }

  setSaveHandler(handler: SaveHandler): void {
    this.saveHandler = handler;
  }

  scheduleAutoSave(): void {
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }
    this.autoSaveTimer = setTimeout(() => {
      this.save().catch(err => {
        console.error('AutoSave failed:', err);
      });
    }, this.debounceMs);
  }

  async save(): Promise<boolean> {
    if (!this.saveHandler) {
      return false;
    }

    if (!this.store.isModified()) {
      return true;
    }

    if (this.status === 'saving') {
      // Re-schedule when current save completes
      this.scheduleAutoSave();
      return false;
    }

    this.status = 'saving';
    this.lastError = null;
    this.notify();

    try {
      const doc = this.store.getDocument();
      const result = await this.saveHandler(doc, this.baseRevision);

      this.baseRevision = result.revision;
      this.store.markClean(result.revision);
      this.status = 'saved';
      this.lastSavedAt = new Date();
      this.notify();
      return true;
    } catch (err: any) {
      if (err?.status === 409 || err?.name === 'ConflictError' || err?.code === '409') {
        this.status = 'conflict';
        this.lastError =
          err.message ||
          `Revision conflict: Server has newer changes than revision ${this.baseRevision}.`;
      } else {
        this.status = 'error';
        this.lastError = err?.message || 'Failed to save changes';
      }
      this.notify();
      throw err;
    }
  }

  checkConflict(incomingServerRevision: number): ConflictErrorDetails | null {
    if (incomingServerRevision !== this.baseRevision) {
      return {
        serverRevision: incomingServerRevision,
        clientBaseRevision: this.baseRevision,
        message: `Document revision conflict. Server revision is ${incomingServerRevision}, but client was modified against ${this.baseRevision}.`
      };
    }
    return null;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  destroy(): void {
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
    this.listeners.clear();
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (err) {
        console.error('OptimisticLockManager listener error:', err);
      }
    }
  }
}
