/**
 * OmniStudio Data Collection Engine
 * Provides runtime collection abstraction (Filter, Sort, Search, First, Count, Paginate, Group) and ThisItem context
 */
import { studioApi, StudioQueryPayload } from '../../api/studioApi';

export interface CollectionRecord {
  id: string;
  [key: string]: any;
}

export class RuntimeCollection {
  name: string;
  items: CollectionRecord[];
  totalCount: number;

  constructor(name: string, items: CollectionRecord[] = [], totalCount?: number) {
    this.name = name;
    this.items = items;
    this.totalCount = totalCount !== undefined ? totalCount : items.length;
  }

  /**
   * Filter records based on condition predicate function
   */
  filter(predicate: (item: CollectionRecord) => boolean): RuntimeCollection {
    const filtered = this.items.filter(predicate);
    return new RuntimeCollection(this.name, filtered, filtered.length);
  }

  /**
   * Sort records by key
   */
  sort(key: string, direction: 'asc' | 'desc' = 'asc'): RuntimeCollection {
    const sorted = [...this.items].sort((a, b) => {
      const valA = a[key] ?? '';
      const valB = b[key] ?? '';
      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    return new RuntimeCollection(this.name, sorted, this.totalCount);
  }

  /**
   * Search records by keyword across string values
   */
  search(keyword: string): RuntimeCollection {
    if (!keyword || !keyword.trim()) return this;
    const term = keyword.toLowerCase();
    const filtered = this.items.filter(item =>
      Object.values(item).some(val =>
        typeof val === 'string' && val.toLowerCase().includes(term)
      )
    );
    return new RuntimeCollection(this.name, filtered, filtered.length);
  }

  /**
   * Client-side pagination helper
   */
  paginate(page: number = 1, limit: number = 20): RuntimeCollection {
    const start = (page - 1) * limit;
    const paginated = this.items.slice(start, start + limit);
    return new RuntimeCollection(this.name, paginated, this.items.length);
  }

  /**
   * Group records by property key
   */
  groupBy(key: string): Record<string, CollectionRecord[]> {
    const groups: Record<string, CollectionRecord[]> = {};
    this.items.forEach((item) => {
      const groupVal = String(item[key] ?? 'Uncategorized');
      if (!groups[groupVal]) groups[groupVal] = [];
      groups[groupVal].push(item);
    });
    return groups;
  }

  /**
   * Get first record
   */
  first(): CollectionRecord | null {
    return this.items.length > 0 ? this.items[0] : null;
  }

  /**
   * Get record count
   */
  count(): number {
    return this.totalCount;
  }
}

export const collectionEngine = {
  createCollection: (name: string, items: any[], totalCount?: number): RuntimeCollection => {
    return new RuntimeCollection(name, items, totalCount);
  },

  /**
   * Fetch server-side paginated & structured collection from Vault
   */
  fetchServerCollection: async (datasetKey: string, queryPayload?: Partial<StudioQueryPayload>): Promise<RuntimeCollection> => {
    try {
      const res = await studioApi.executeQuery({
        dataset_key: datasetKey,
        filters: queryPayload?.filters || [],
        sort: queryPayload?.sort || [{ field: 'created_at', direction: 'DESC' }],
        search: queryPayload?.search || '',
        pagination: queryPayload?.pagination || { page: 1, limit: 25 }
      });
      return new RuntimeCollection(datasetKey, res.records || [], res.pagination?.total_records || 0);
    } catch (err) {
      console.error('Fetch Server Collection Error:', err);
      return new RuntimeCollection(datasetKey, [], 0);
    }
  },

  /**
   * Evaluate contextual expression for item inside Repeater / Gallery / List / Table
   */
  evaluateThisItem: (item: any, fieldKey: string): any => {
    if (!item) return '';
    if (!fieldKey || fieldKey === 'ThisItem') return item;
    
    // Support nested field extraction e.g. ThisItem.name or Vault.Product.name
    const parts = fieldKey.replace(/^ThisItem\./, '').replace(/^Vault\.Product\./, '').split('.');
    let curr = item;
    for (const p of parts) {
      if (curr && typeof curr === 'object' && p in curr) {
        curr = curr[p];
      } else {
        return '';
      }
    }
    return curr;
  }
};
