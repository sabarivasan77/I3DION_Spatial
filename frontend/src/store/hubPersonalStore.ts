import { create } from 'zustand';
import api from '../services/api';

interface SavedItem {
  id: string;
  content_id: string;
  content_type: string;
}

interface LikedItem {
  id: string;
  content_id: string;
  content_type: string;
}

interface Subscription {
  id: string;
  plan: string;
  status: string;
  start_date: string;
  renewal_date: string | null;
  enterprise_access: boolean;
  features: Record<string, any>;
}

interface HubPersonalState {
  savedIds: Set<string>;
  likedIds: Set<string>;
  subscription: Subscription | null;
  isLoading: boolean;
  
  // Actions
  fetchPersonalData: () => Promise<void>;
  toggleSaved: (contentId: string, contentType: string) => Promise<void>;
  toggleLiked: (contentId: string, contentType: string) => Promise<void>;
  isSaved: (contentId: string) => boolean;
  isLiked: (contentId: string) => boolean;
}

export const useHubPersonalStore = create<HubPersonalState>((set, get) => ({
  savedIds: new Set<string>(),
  likedIds: new Set<string>(),
  subscription: null,
  isLoading: false,

  isSaved: (contentId: string) => get().savedIds.has(contentId),
  isLiked: (contentId: string) => get().likedIds.has(contentId),

  fetchPersonalData: async () => {
    set({ isLoading: true });
    try {
      const [savedRes, likedRes, subRes] = await Promise.all([
        api.get('/hub/personal/saved'),
        api.get('/hub/personal/liked'),
        api.get('/hub/personal/subscriptions')
      ]);

      const savedIds = new Set<string>(savedRes.data.map((item: SavedItem) => item.content_id));
      const likedIds = new Set<string>(likedRes.data.map((item: LikedItem) => item.content_id));

      set({
        savedIds,
        likedIds,
        subscription: subRes.data.subscription || null,
        isLoading: false
      });
    } catch (error) {
      console.error('Failed to fetch personal data:', error);
      set({ isLoading: false });
    }
  },

  toggleSaved: async (contentId: string, contentType: string) => {
    const { savedIds } = get();
    const isCurrentlySaved = savedIds.has(contentId);
    
    // Optimistic Update
    const newSavedIds = new Set(savedIds);
    if (isCurrentlySaved) {
      newSavedIds.delete(contentId);
    } else {
      newSavedIds.add(contentId);
    }
    set({ savedIds: newSavedIds });

    try {
      if (isCurrentlySaved) {
        await api.delete(`/hub/personal/saved/${contentId}`);
      } else {
        await api.post('/hub/personal/saved', { contentId, contentType });
      }
    } catch (error) {
      // Rollback on error
      console.error('Failed to toggle save state:', error);
      set({ savedIds });
    }
  },

  toggleLiked: async (contentId: string, contentType: string) => {
    const { likedIds } = get();
    const isCurrentlyLiked = likedIds.has(contentId);
    
    // Optimistic Update
    const newLikedIds = new Set(likedIds);
    if (isCurrentlyLiked) {
      newLikedIds.delete(contentId);
    } else {
      newLikedIds.add(contentId);
    }
    set({ likedIds: newLikedIds });

    try {
      if (isCurrentlyLiked) {
        await api.delete(`/hub/personal/liked/${contentId}`);
      } else {
        await api.post('/hub/personal/liked', { contentId, contentType });
      }
    } catch (error) {
      // Rollback on error
      console.error('Failed to toggle like state:', error);
      set({ likedIds });
    }
  }
}));
