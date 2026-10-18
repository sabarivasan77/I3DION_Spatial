import { create } from 'zustand';
import { apiRequest } from '../services/api';

export interface QuoteItem {
  productId: string;
  name: string;
  modelUrl?: string;
  posterUrl?: string;
  companyName?: string;
  organizationId?: string;
  category?: string;
  quantity: number;
  notes?: string;
}

export interface QueuedRfqSubmission {
  id: string;
  timestamp: string;
  payload: any;
  attempts: number;
}

interface HubQuoteState {
  items: QuoteItem[];
  queuedSubmissions: QueuedRfqSubmission[];
  isSubmitting: boolean;
  lastSubmittedRfqId: string | null;

  // Basket item actions
  addItem: (item: Omit<QuoteItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearBasket: () => void;
  isInBasket: (productId: string) => boolean;
  getItemCount: () => number;

  // Offline queue actions
  queueOfflineRfq: (payload: any) => void;
  syncOfflineQueue: () => Promise<number>;
  setSubmitting: (isSubmitting: boolean) => void;
  setLastSubmittedRfqId: (id: string | null) => void;
}

const BASKET_STORAGE_KEY = 'i3dion_hub_quote_basket';
const OFFLINE_QUEUE_KEY = 'i3dion_hub_rfq_offline_queue';

function loadPersistedBasket(): QuoteItem[] {
  try {
    const raw = localStorage.getItem(BASKET_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistBasket(items: QuoteItem[]) {
  try {
    localStorage.setItem(BASKET_STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.warn('Failed to persist quote basket to localStorage:', err);
  }
}

function loadOfflineQueue(): QueuedRfqSubmission[] {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistOfflineQueue(queue: QueuedRfqSubmission[]) {
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.warn('Failed to persist RFQ queue to localStorage:', err);
  }
}

export const useHubQuoteStore = create<HubQuoteState>((set, get) => ({
  items: loadPersistedBasket(),
  queuedSubmissions: loadOfflineQueue(),
  isSubmitting: false,
  lastSubmittedRfqId: null,

  addItem: (newItem) => {
    const { items } = get();
    const existingIndex = items.findIndex((i) => i.productId === newItem.productId);
    let updated: QuoteItem[];

    if (existingIndex >= 0) {
      updated = items.map((item, index) =>
        index === existingIndex
          ? { ...item, quantity: item.quantity + (newItem.quantity || 1) }
          : item
      );
    } else {
      updated = [
        ...items,
        {
          ...newItem,
          quantity: Math.max(1, newItem.quantity || 1)
        }
      ];
    }

    persistBasket(updated);
    set({ items: updated });
  },

  removeItem: (productId) => {
    const updated = get().items.filter((i) => i.productId !== productId);
    persistBasket(updated);
    set({ items: updated });
  },

  updateQuantity: (productId, quantity) => {
    const safeQty = Math.max(1, Math.floor(quantity));
    const updated = get().items.map((i) =>
      i.productId === productId ? { ...i, quantity: safeQty } : i
    );
    persistBasket(updated);
    set({ items: updated });
  },

  clearBasket: () => {
    persistBasket([]);
    set({ items: [] });
  },

  isInBasket: (productId) => {
    return get().items.some((i) => i.productId === productId);
  },

  getItemCount: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0);
  },

  queueOfflineRfq: (payload) => {
    const queue = loadOfflineQueue();
    const submission: QueuedRfqSubmission = {
      id: payload.idempotencyKey || `offline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      payload,
      attempts: 0
    };
    const updated = [...queue, submission];
    persistOfflineQueue(updated);
    set({ queuedSubmissions: updated });
  },

  syncOfflineQueue: async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return 0;
    }

    const queue = loadOfflineQueue();
    if (queue.length === 0) return 0;

    let successCount = 0;
    const remaining: QueuedRfqSubmission[] = [];

    for (const item of queue) {
      try {
        await apiRequest('/hub/rfq', {
          method: 'POST',
          body: JSON.stringify(item.payload)
        });
        successCount++;
      } catch (err) {
        console.warn(`Failed to sync queued RFQ ${item.id}:`, err);
        remaining.push({
          ...item,
          attempts: item.attempts + 1
        });
      }
    }

    persistOfflineQueue(remaining);
    set({ queuedSubmissions: remaining });
    return successCount;
  },

  setSubmitting: (isSubmitting) => set({ isSubmitting }),
  setLastSubmittedRfqId: (lastSubmittedRfqId) => set({ lastSubmittedRfqId })
}));

// Wire online event listener for auto-syncing offline queued RFQs
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useHubQuoteStore.getState().syncOfflineQueue().then((synced) => {
      if (synced > 0) {
        console.info(`[HubQuoteStore] Successfully synchronized ${synced} offline RFQ inquiries.`);
      }
    });
  });
}
