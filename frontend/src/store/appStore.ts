import { create } from 'zustand';
import type { Product } from '../types';

interface AppState {
  products: Product[];
  selectedProductId: string;
  catalogProductIds: string[];
  setSelectedProduct: (id: string) => void;
  toggleCatalogProduct: (id: string) => void;
  setCatalogProductIds: (ids: string[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  products: [],
  selectedProductId: '',
  catalogProductIds: [],
  setSelectedProduct: (id) => set({ selectedProductId: id }),
  toggleCatalogProduct: (id) =>
    set((state) => ({
      catalogProductIds: state.catalogProductIds.includes(id)
        ? state.catalogProductIds.filter((productId) => productId !== id)
        : [...state.catalogProductIds, id],
    })),
  setCatalogProductIds: (ids) => set({ catalogProductIds: ids }),
}));
