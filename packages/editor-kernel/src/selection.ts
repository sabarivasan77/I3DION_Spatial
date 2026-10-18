export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BoxSelection {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface BoundedNode {
  id: string;
  rect: Rect;
}

export class SelectionManager {
  private selectedIds: Set<string> = new Set();
  private primaryFocusedId: string | null = null;
  private listeners: Set<() => void> = new Set();

  constructor(initialSelected: string[] = []) {
    for (const id of initialSelected) {
      this.selectedIds.add(id);
    }
    if (initialSelected.length > 0) {
      this.primaryFocusedId = initialSelected[0];
    }
  }

  getSelectedIds(): string[] {
    return Array.from(this.selectedIds);
  }

  getFocusedId(): string | null {
    return this.primaryFocusedId;
  }

  isSelected(id: string): boolean {
    return this.selectedIds.has(id);
  }

  count(): number {
    return this.selectedIds.size;
  }

  select(id: string, multi = false): void {
    if (!multi) {
      this.selectedIds.clear();
      this.selectedIds.add(id);
      this.primaryFocusedId = id;
    } else {
      if (this.selectedIds.has(id)) {
        this.selectedIds.delete(id);
        if (this.primaryFocusedId === id) {
          this.primaryFocusedId = this.selectedIds.size > 0 ? Array.from(this.selectedIds)[0] : null;
        }
      } else {
        this.selectedIds.add(id);
        this.primaryFocusedId = id;
      }
    }
    this.notify();
  }

  setSelection(ids: string[]): void {
    this.selectedIds.clear();
    for (const id of ids) {
      this.selectedIds.add(id);
    }
    this.primaryFocusedId = ids.length > 0 ? ids[0] : null;
    this.notify();
  }

  clear(): void {
    if (this.selectedIds.size === 0 && this.primaryFocusedId === null) return;
    this.selectedIds.clear();
    this.primaryFocusedId = null;
    this.notify();
  }

  selectWithinBox(box: BoxSelection, candidates: BoundedNode[], additive = false): void {
    const left = Math.min(box.x1, box.x2);
    const right = Math.max(box.x1, box.x2);
    const top = Math.min(box.y1, box.y2);
    const bottom = Math.max(box.y1, box.y2);

    const enclosed: string[] = [];
    for (const item of candidates) {
      const nodeLeft = item.rect.x;
      const nodeRight = item.rect.x + item.rect.width;
      const nodeTop = item.rect.y;
      const nodeBottom = item.rect.y + item.rect.height;

      // Intersect or enclose
      const intersects =
        nodeLeft < right &&
        nodeRight > left &&
        nodeTop < bottom &&
        nodeBottom > top;

      if (intersects) {
        enclosed.push(item.id);
      }
    }

    if (!additive) {
      this.selectedIds.clear();
    }
    for (const id of enclosed) {
      this.selectedIds.add(id);
    }
    if (enclosed.length > 0 && !this.primaryFocusedId) {
      this.primaryFocusedId = enclosed[0];
    }
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
        console.error('SelectionManager listener error:', err);
      }
    }
  }
}
