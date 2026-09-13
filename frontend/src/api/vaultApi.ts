import { apiRequest } from '../services/api';

export interface VaultAsset {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  type: string;
  public_url: string;
  size_bytes: number;
  status: 'Processing' | 'Ready' | 'Warning' | 'Failed';
  visibility: 'Private' | 'Organization' | 'Public';
  created_at: string;
  updated_at: string;
  versions?: any[];
}

export const vaultApi = {
  getAssets: () => apiRequest<VaultAsset[]>('/api/vault/assets', { method: 'GET' }),
  
  getAsset: (id: string) => apiRequest<VaultAsset>(`/api/vault/assets/${id}`, { method: 'GET' }),
  
  uploadAsset: (file: File, metadata: Partial<VaultAsset>) => {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata.name) formData.append('name', metadata.name);
    if (metadata.description) formData.append('description', metadata.description);
    if (metadata.category) formData.append('category', metadata.category);
    if (metadata.type) formData.append('type', metadata.type);
    if (metadata.visibility) formData.append('visibility', metadata.visibility);

    // Using fetch directly because apiCall might assume JSON body
    // and we need to let the browser set the multipart boundary
    return fetch(import.meta.env.VITE_API_URL + '/api/vault/assets/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: formData,
    }).then(async res => {
      if (!res.ok) throw new Error('Upload failed');
      return res.json();
    });
  },

  updateAsset: (id: string, metadata: Partial<VaultAsset>) => 
    apiRequest<VaultAsset>(`/api/vault/assets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(metadata)
    })
};
