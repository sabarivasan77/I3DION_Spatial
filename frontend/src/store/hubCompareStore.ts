import { create } from 'zustand';

export interface CompareModelItem {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  thumbnail: string;
  modelUrl: string;
  previewUrl: string;
  companyName: string;
  companyVerified: boolean;
  licenseSpdx: string[];
  licenseArtist?: string;
  attributionRequired: boolean;
  viewsCount: number;
  likesCount: number;
  specs?: Record<string, any>;
}

interface HubCompareState {
  models: CompareModelItem[];
  addModel: (model: CompareModelItem) => boolean;
  removeModel: (id: string) => void;
  clearCompare: () => void;
  isInCompare: (id: string) => boolean;
  setModels: (models: CompareModelItem[]) => void;
}

const STORAGE_KEY = 'i3dion_hub_compare_items';

function loadPersistedCompare(): CompareModelItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistCompare(models: CompareModelItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(models));
  } catch (err) {
    console.warn('Failed to persist compare items:', err);
  }
}

export const useHubCompareStore = create<HubCompareState>((set, get) => ({
  models: loadPersistedCompare(),

  addModel: (model) => {
    const { models } = get();
    if (models.some((m) => m.id === model.id)) return true;
    if (models.length >= 4) return false;

    const updated = [...models, model];
    persistCompare(updated);
    set({ models: updated });
    return true;
  },

  removeModel: (id) => {
    const updated = get().models.filter((m) => m.id !== id);
    persistCompare(updated);
    set({ models: updated });
  },

  clearCompare: () => {
    persistCompare([]);
    set({ models: [] });
  },

  isInCompare: (id) => {
    return get().models.some((m) => m.id === id);
  },

  setModels: (models) => {
    const clamped = models.slice(0, 4);
    persistCompare(clamped);
    set({ models: clamped });
  }
}));
