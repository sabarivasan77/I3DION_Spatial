import { apiRequest } from './api';

export interface HubProduct {
  id: string;
  company_id: string;
  name: string;
  description: string;
  category: string;
  imageUrl?: string;
  modelUrl?: string;
  slug: string;
  views_count: number;
  likes_count: number;
  downloads_count: number;
  company_name: string;
  company_logo?: string;
  creator_name?: string;
  creator_avatar?: string;
  created_at: string;
  tags: string[];
}

export interface HubComment {
  id: string;
  user_name: string;
  user_avatar?: string;
  content: string;
  created_at: string;
  likes_count: number;
}

export const hubApi = {
  getFeed: async (): Promise<HubProduct[]> => {
    return apiRequest('/hub/feed');
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
