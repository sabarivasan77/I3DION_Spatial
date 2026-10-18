import type { AppNode, AppPage } from '../../../contracts/src/catalogAppDefinition.ts';
import { DocumentStore } from '../documentStore.ts';

export interface Command {
  id: string;
  name: string;
  execute(): void;
  undo(): void;
  canMergeWith?(other: Command): boolean;
  mergeWith?(other: Command): void;
}

/**
 * Inserts a new node into a parent container at specified index
 */
export class InsertNodeCommand implements Command {
  id = `insert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  name: string;
  private store: DocumentStore;
  private targetParentId: string;
  private node: AppNode;
  private index?: number;
  private pageId?: string;

  constructor(
    store: DocumentStore,
    targetParentId: string,
    node: AppNode,
    index?: number,
    pageId?: string
  ) {
    this.store = store;
    this.targetParentId = targetParentId;
    this.node = node;
    this.index = index;
    this.pageId = pageId;
    this.name = `Insert ${node.title || node.type}`;
  }

  execute(): void {
    const doc = JSON.parse(JSON.stringify(this.store.getDocument()));
    const page = doc.pages.find((p: AppPage) => !this.pageId || p.id === this.pageId) || doc.pages[0];
    if (!page) return;

    let targetContainer: { children?: AppNode[] } | null = null;
    if (page.id === this.targetParentId) {
      targetContainer = page;
    } else {
      function find(children?: AppNode[]): { children?: AppNode[] } | null {
        if (!children) return null;
        for (const c of children) {
          if (c.id === targetContainerId) return c;
          const found = find(c.children);
          if (found) return found;
        }
        return null;
      }
      const targetContainerId = this.targetParentId;
      targetContainer = find(page.children);
    }

    if (!targetContainer) return;
    if (!targetContainer.children) targetContainer.children = [];

    const insertIdx = this.index !== undefined ? this.index : targetContainer.children.length;
    targetContainer.children.splice(insertIdx, 0, this.node);

    this.store.setDocument(doc);
  }

  undo(): void {
    const doc = JSON.parse(JSON.stringify(this.store.getDocument()));
    const page = doc.pages.find((p: AppPage) => !this.pageId || p.id === this.pageId) || doc.pages[0];
    if (!page) return;

    function remove(children?: AppNode[]): boolean {
      if (!children) return false;
      const idx = children.findIndex(c => c.id === targetId);
      if (idx !== -1) {
        children.splice(idx, 1);
        return true;
      }
      for (const c of children) {
        if (remove(c.children)) return true;
      }
      return false;
    }
    const targetId = this.node.id;
    remove(page.children);
    this.store.setDocument(doc);
  }
}

/**
 * Moves an existing node to a new container and/or index
 */
export class MoveNodeCommand implements Command {
  id = `move-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  name: string;
  private store: DocumentStore;
  private nodeId: string;
  private newParentId: string;
  private newIndex?: number;
  private pageId?: string;
  private previousParentId: string | null = null;
  private previousIndex: number | null = null;
  private movedNode: AppNode | null = null;

  constructor(
    store: DocumentStore,
    nodeId: string,
    newParentId: string,
    newIndex?: number,
    pageId?: string
  ) {
    this.store = store;
    this.nodeId = nodeId;
    this.newParentId = newParentId;
    this.newIndex = newIndex;
    this.pageId = pageId;
    this.name = `Move ${nodeId}`;
  }

  execute(): void {
    const loc = this.store.findNodeLocation(this.nodeId, this.pageId);
    if (!loc) return;

    this.previousParentId = loc.parent.id;
    this.previousIndex = loc.index;
    this.movedNode = JSON.parse(JSON.stringify(loc.node));

    const doc = JSON.parse(JSON.stringify(this.store.getDocument()));
    const page = doc.pages.find((p: AppPage) => !this.pageId || p.id === this.pageId) || doc.pages[0];

    // Remove from old parent
    function remove(children?: AppNode[], targetId = ''): AppNode | null {
      if (!children) return null;
      const idx = children.findIndex(c => c.id === targetId);
      if (idx !== -1) {
        return children.splice(idx, 1)[0];
      }
      for (const c of children) {
        const found = remove(c.children, targetId);
        if (found) return found;
      }
      return null;
    }

    const removed = remove(page.children, this.nodeId);
    if (!removed) return;

    // Find new parent
    let targetParent: { children?: AppNode[] } | null = null;
    if (page.id === this.newParentId) {
      targetParent = page;
    } else {
      function findParent(children?: AppNode[], parentId = ''): AppNode | null {
        if (!children) return null;
        for (const c of children) {
          if (c.id === parentId) return c;
          const found = findParent(c.children, parentId);
          if (found) return found;
        }
        return null;
      }
      targetParent = findParent(page.children, this.newParentId);
    }

    if (!targetParent) return;
    if (!targetParent.children) targetParent.children = [];

    const destIdx = this.newIndex !== undefined ? this.newIndex : targetParent.children.length;
    targetParent.children.splice(destIdx, 0, removed);

    this.store.setDocument(doc);
  }

  undo(): void {
    if (!this.previousParentId || this.previousIndex === null || !this.movedNode) return;

    const cmd = new MoveNodeCommand(
      this.store,
      this.nodeId,
      this.previousParentId,
      this.previousIndex,
      this.pageId
    );
    cmd.execute();
  }
}

/**
 * Deletes a node and stores a snapshot for undo
 */
export class DeleteNodeCommand implements Command {
  id = `delete-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  name: string;
  private store: DocumentStore;
  private nodeId: string;
  private pageId?: string;
  private previousParentId: string | null = null;
  private previousIndex: number | null = null;
  private deletedNode: AppNode | null = null;

  constructor(
    store: DocumentStore,
    nodeId: string,
    pageId?: string
  ) {
    this.store = store;
    this.nodeId = nodeId;
    this.pageId = pageId;
    this.name = `Delete ${nodeId}`;
  }

  execute(): void {
    const loc = this.store.findNodeLocation(this.nodeId, this.pageId);
    if (!loc) return;

    this.previousParentId = loc.parent.id;
    this.previousIndex = loc.index;
    this.deletedNode = JSON.parse(JSON.stringify(loc.node));

    const doc = JSON.parse(JSON.stringify(this.store.getDocument()));
    const page = doc.pages.find((p: AppPage) => !this.pageId || p.id === this.pageId) || doc.pages[0];

    function remove(children?: AppNode[], id = ''): boolean {
      if (!children) return false;
      const idx = children.findIndex(c => c.id === id);
      if (idx !== -1) {
        children.splice(idx, 1);
        return true;
      }
      for (const c of children) {
        if (remove(c.children, id)) return true;
      }
      return false;
    }

    remove(page.children, this.nodeId);
    this.store.setDocument(doc);
  }

  undo(): void {
    if (!this.previousParentId || this.previousIndex === null || !this.deletedNode) return;
    const insertCmd = new InsertNodeCommand(
      this.store,
      this.previousParentId,
      this.deletedNode,
      this.previousIndex,
      this.pageId
    );
    insertCmd.execute();
  }
}

/**
 * Updates a node's properties, with support for typing debounce merge
 */
export class UpdatePropsCommand implements Command {
  id = `update-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  name: string;
  private store: DocumentStore;
  public nodeId: string;
  public newProps: Record<string, unknown>;
  private pageId?: string;
  private previousProps: Record<string, unknown> = {};
  public timestamp = Date.now();

  constructor(
    store: DocumentStore,
    nodeId: string,
    newProps: Record<string, unknown>,
    pageId?: string
  ) {
    this.store = store;
    this.nodeId = nodeId;
    this.newProps = newProps;
    this.pageId = pageId;
    this.name = `Update props of ${nodeId}`;
  }

  execute(): void {
    const loc = this.store.findNodeLocation(this.nodeId, this.pageId);
    if (!loc) return;

    this.previousProps = JSON.parse(JSON.stringify(loc.node.props || {}));

    const doc = JSON.parse(JSON.stringify(this.store.getDocument()));
    const page = doc.pages.find((p: AppPage) => !this.pageId || p.id === this.pageId) || doc.pages[0];

    function update(children?: AppNode[], targetId = '', props = {}): boolean {
      if (!children) return false;
      for (const c of children) {
        if (c.id === targetId) {
          c.props = { ...c.props, ...props };
          return true;
        }
        if (update(c.children, targetId, props)) return true;
      }
      return false;
    }

    update(page.children, this.nodeId, this.newProps);
    this.store.setDocument(doc);
  }

  undo(): void {
    const doc = JSON.parse(JSON.stringify(this.store.getDocument()));
    const page = doc.pages.find((p: AppPage) => !this.pageId || p.id === this.pageId) || doc.pages[0];

    function restore(children?: AppNode[], targetId = '', props = {}): boolean {
      if (!children) return false;
      for (const c of children) {
        if (c.id === targetId) {
          c.props = { ...props };
          return true;
        }
        if (restore(c.children, targetId, props)) return true;
      }
      return false;
    }

    restore(page.children, this.nodeId, this.previousProps);
    this.store.setDocument(doc);
  }

  canMergeWith(other: Command): boolean {
    if (other instanceof UpdatePropsCommand && other.nodeId === this.nodeId) {
      // Merge if within 500ms
      return Math.abs(other.timestamp - this.timestamp) < 500;
    }
    return false;
  }

  mergeWith(other: Command): void {
    if (other instanceof UpdatePropsCommand) {
      this.newProps = { ...this.newProps, ...other.newProps };
      this.timestamp = other.timestamp;
      this.execute();
    }
  }
}

/**
 * Composite batch command applying multiple sub-commands as one atomic undo/redo unit
 */
export class BatchCommand implements Command {
  id = `batch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  public name: string;
  private commands: Command[];

  constructor(
    name: string,
    commands: Command[]
  ) {
    this.name = name;
    this.commands = commands;
  }

  execute(): void {
    for (const cmd of this.commands) {
      cmd.execute();
    }
  }

  undo(): void {
    // Undo in reverse order
    for (let i = this.commands.length - 1; i >= 0; i--) {
      this.commands[i].undo();
    }
  }
}
