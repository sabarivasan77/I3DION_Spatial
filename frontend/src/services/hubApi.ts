import { apiRequest } from './api';

export interface HubProduct {
  id: string;
  organization_id?: string;
  company_id?: string;
  name: string;
  description: string;
  category: string;
  image_url?: string;
  imageUrl?: string;
  model_url?: string;
  modelUrl?: string;
  preview_model_url?: string;
  poster_url?: string;
  full_model_url?: string;
  original_model_url?: string;
  slug: string;
  views_count: number;
  likes_count: number;
  downloads_count?: number;
  company_name: string;
  company_logo?: string;
  company_verified?: boolean;
  creator_name?: string;
  creator_avatar?: string;
  created_at: string;
  tags: string[];
  license_spdx?: string[];
  license_artist?: string;
  license_owner?: string;
  attribution_required?: boolean;
  is_demo_model?: boolean;
  specs?: Record<string, unknown>;
}

export interface HubComment {
  id: string;
  user_name: string;
  user_avatar?: string;
  content: string;
  created_at: string;
  likes_count: number;
}

export interface HubFeedResponse {
  items: HubProduct[];
  nextCursor?: string | null;
  hasMore: boolean;
  count: number;
}

export interface HubFeedParams {
  cursor?: string | null;
  limit?: number;
  category?: string;
  sort?: 'popular' | 'newest' | 'alphabetical';
  search?: string;
}

export const hubApi = {
  getFeed: async (params?: HubFeedParams): Promise<HubProduct[] | HubFeedResponse> => {
    const q = new URLSearchParams();
    if (params) {
      q.append('paginated', 'true');
      if (params.cursor) q.append('cursor', params.cursor);
      if (params.limit) q.append('limit', String(params.limit));
      if (params.category && params.category !== 'All') q.append('category', params.category);
      if (params.sort) q.append('sort', params.sort);
      if (params.search) q.append('search', params.search);
    }
    const queryString = q.toString();
    return apiRequest(`/hub/feed${queryString ? '?' + queryString : ''}`);
  },
  
  search: async (query: string, category?: string): Promise<HubProduct[]> => {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (category) params.append('category', category);
    return apiRequest(`/hub/search?${params.toString()}`);
  },

  getProduct: async (id: string): Promise<HubProduct> => {
    return apiRequest(`/hub/products/${id}`);
  },

  getComments: async (entityType: 'product' | 'catalog', id: string): Promise<HubComment[]> => {
    return apiRequest(`/hub/${entityType}/${id}/comments`);
  },

  toggleLike: async (token: string, entityType: 'product' | 'catalog' | 'comment', id: string): Promise<{ liked: boolean }> => {
    return apiRequest(`/hub/${entityType}/${id}/like`, { token, method: 'POST' });
  },

  postComment: async (token: string, entityType: 'product' | 'catalog', id: string, content: string): Promise<HubComment> => {
    return apiRequest(`/hub/${entityType}/${id}/comments`, { token, method: 'POST', body: JSON.stringify({ content }) });
  },

  followCreator: async (token: string, creatorId: string): Promise<{ following: boolean }> => {
    return apiRequest(`/hub/creators/${creatorId}/follow`, { token, method: 'POST' });
  },

  reportContent: async (token: string, entityType: string, id: string, reason: string): Promise<any> => {
    return apiRequest(`/hub/${entityType}/${id}/report`, { token, method: 'POST', body: JSON.stringify({ reason }) });
  }
};
