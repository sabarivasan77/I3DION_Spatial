import { createBlankAppDefinition } from '../../contracts/src/catalogAppDefinition.ts';
import type {
  AppDefinitionContract,
  AppNode,
  AppPage
} from '../../contracts/src/catalogAppDefinition.ts';

export interface NodeLocation {
  node: AppNode;
  parent: AppNode | AppPage;
  index: number;
}

export class DocumentStore {
  private doc: AppDefinitionContract;
  private isDirty = false;
  private listeners: Set<() => void> = new Set();

  constructor(initialDoc?: AppDefinitionContract) {
    this.doc = initialDoc || createBlankAppDefinition();
  }

  getDocument(): AppDefinitionContract {
    return this.doc;
  }

  getRevision(): number {
    return this.doc.revision;
  }

  isModified(): boolean {
    return this.isDirty;
  }

  setDocument(newDoc: AppDefinitionContract, markDirty = true): void {
    this.doc = newDoc;
    if (markDirty) {
      this.isDirty = true;
    }
    this.notify();
  }

  markClean(revision?: number): void {
    this.isDirty = false;
    if (revision !== undefined) {
      this.doc.revision = revision;
    }
    this.notify();
  }

  getActivePage(pageId?: string): AppPage | undefined {
    if (!pageId && this.doc.pages.length > 0) {
      return this.doc.pages[0];
    }
    return this.doc.pages.find(p => p.id === pageId);
  }

  findNodeLocation(nodeId: string, pageId?: string): NodeLocation | null {
    const page = this.getActivePage(pageId);
    if (!page) return null;

    // Check direct children of page
    for (let i = 0; i < page.children.length; i++) {
      if (page.children[i].id === nodeId) {
        return { node: page.children[i], parent: page, index: i };
      }
    }

    // Recursive search inside container nodes
    function search(children: AppNode[], parent: AppNode): NodeLocation | null {
      for (let i = 0; i < children.length; i++) {
        if (children[i].id === nodeId) {
          return { node: children[i], parent, index: i };
        }
        if (children[i].children && children[i].children!.length > 0) {
          const found = search(children[i].children!, children[i]);
          if (found) return found;
        }
      }
      return null;
    }

    for (const topNode of page.children) {
      if (topNode.children && topNode.children.length > 0) {
        const found = search(topNode.children, topNode);
        if (found) return found;
      }
    }

    return null;
  }

  isDescendant(parentId: string, targetChildId: string, pageId?: string): boolean {
    if (parentId === targetChildId) return true;
    const parentLoc = this.findNodeLocation(parentId, pageId);
    if (!parentLoc) return false;

    function check(children?: AppNode[]): boolean {
      if (!children) return false;
      for (const c of children) {
        if (c.id === targetChildId) return true;
        if (check(c.children)) return true;
      }
      return false;
    }

    return check(parentLoc.node.children);
  }

  cloneNodeWithNewIds(node: AppNode): AppNode {
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const newId = `${node.type}-${randomSuffix}`;
    const clonedProps = JSON.parse(JSON.stringify(node.props || {}));

    const clonedNode: AppNode = {
      ...node,
      id: newId,
      props: clonedProps,
      children: []
    };

    if (node.children && node.children.length > 0) {
      clonedNode.children = node.children.map(c => this.cloneNodeWithNewIds(c));
    }

    return clonedNode;
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
        console.error('DocumentStore listener error:', err);
      }
    }
  }
}
