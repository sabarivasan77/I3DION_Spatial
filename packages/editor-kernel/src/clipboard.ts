import type { AppNode } from '../../contracts/src/catalogAppDefinition.ts';

export interface ClipboardPayload {
  version: 'i3dion.clipboard/1';
  timestamp: number;
  nodes: AppNode[];
}

export class ClipboardManager {
  private inMemoryPayload: ClipboardPayload | null = null;
  private listeners: Set<() => void> = new Set();

  copy(nodes: AppNode[]): void {
    if (!nodes || nodes.length === 0) return;

    // Deep clone nodes
    const cloned = JSON.parse(JSON.stringify(nodes)) as AppNode[];
    this.inMemoryPayload = {
      version: 'i3dion.clipboard/1',
      timestamp: Date.now(),
      nodes: cloned
    };

    // If running in browser environment, attempt async write to system clipboard
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      try {
        navigator.clipboard.writeText(JSON.stringify(this.inMemoryPayload)).catch(() => {
          // System clipboard access may fail if unpermitted; in-memory fallback is active
        });
      } catch {
        // Fallback to in-memory only
      }
    }

    this.notify();
  }

  cut(nodes: AppNode[], onCutCallback?: () => void): void {
    this.copy(nodes);
    if (onCutCallback) {
      onCutCallback();
    }
  }

  paste(): AppNode[] {
    if (!this.inMemoryPayload || !this.inMemoryPayload.nodes || this.inMemoryPayload.nodes.length === 0) {
      return [];
    }

    // Remap all node IDs recursively so pasted nodes are completely distinct
    const remapped = this.inMemoryPayload.nodes.map(node => this.remapNodeIds(node));
    return remapped;
  }

  hasContent(): boolean {
    return this.inMemoryPayload !== null && this.inMemoryPayload.nodes.length > 0;
  }

  getPayload(): ClipboardPayload | null {
    return this.inMemoryPayload;
  }

  setPayload(payload: ClipboardPayload): void {
    if (payload && payload.version === 'i3dion.clipboard/1' && Array.isArray(payload.nodes)) {
      this.inMemoryPayload = JSON.parse(JSON.stringify(payload));
      this.notify();
    }
  }

  clear(): void {
    this.inMemoryPayload = null;
    this.notify();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private remapNodeIds(node: AppNode): AppNode {
    const randomSuffix = Math.random().toString(36).slice(2, 8);
    const newId = `${node.type}-${randomSuffix}`;
    const newNode: AppNode = {
      ...node,
      id: newId,
      props: JSON.parse(JSON.stringify(node.props || {})),
      children: []
    };

    if (node.children && node.children.length > 0) {
      newNode.children = node.children.map(c => this.remapNodeIds(c));
    }

    return newNode;
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (err) {
        console.error('ClipboardManager listener error:', err);
      }
    }
  }
}

export const clipboardManager = new ClipboardManager();
