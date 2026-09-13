import { apiRequest } from '../services/api';

export interface VaultAssetVersion {
  id: string;
  asset_id: string;
  version_number: number;
  original_name: string;
  storage_key: string;
  public_url: string;
  mime_type: string;
  size_bytes: number;
  change_description?: string;
  created_at: string;
}

export interface VaultAsset {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  type: string;
  original_name?: string;
  storage_key?: string;
  mime_type?: string;
  public_url: string;
  size_bytes: number;
  status: 'Processing' | 'Ready' | 'Warning' | 'Failed';
  visibility: 'Private' | 'Organization' | 'Public';
  connected_apps?: string[];
  custom_fields?: Record<string, any>;
  is_deleted?: boolean;
  deleted_at?: string;
  created_at: string;
  updated_at: string;
  versions?: VaultAssetVersion[];
}

export interface VaultSchemaField {
  key: string;
  name: string;
  type: 'Text' | 'Number' | 'Boolean' | 'Date' | 'File' | '3D Model' | 'Status' | 'Reference' | 'Tags';
  required?: boolean;
  defaultValue?: any;
}

export interface VaultCollection {
  id: string;
  name: string;
  description: string;
  schema_fields: VaultSchemaField[];
  record_count?: number;
  asset_count?: number;
  created_at: string;
  updated_at: string;
}

export interface VaultRecord {
  id: string;
  collection_id: string;
  name: string;
  data: Record<string, any>;
  asset_id?: string;
  asset_name?: string;
  asset_url?: string;
  asset_type?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface VaultTemplate {
  id: string;
  name: string;
  description: string;
  schema: {
    fields?: VaultSchemaField[];
    tags?: string[];
    category?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface VaultProcessingJob {
  id: string;
  job_type: string;
  asset_name: string;
  status: 'Processing' | 'Completed' | 'Failed';
  progress_pct: number;
  started_at: string;
  completed_at?: string;
  error_message?: string;
}

export interface VaultAuditLog {
  id: string;
  user_name: string;
  action: string;
  target_type: string;
  target_name: string;
  details?: Record<string, any>;
  created_at: string;
}

export interface VaultDatasetSummary {
  total_assets: number;
  total_3d_models: number;
  total_products: number;
  total_catalogs: number;
  total_templates: number;
  total_collections: number;
  total_storage_bytes: number;
  storage_quota_bytes: number;
}

export const vaultApi = {
  // --- Datasets & Multi-Source Summary ---
  getDatasetsSummary: () => apiRequest<VaultDatasetSummary>('/api/vault/datasets/summary', { method: 'GET' }),
  
  getProductDataset: () => apiRequest<{ collection: VaultCollection; records: VaultRecord[] }>('/api/vault/datasets/products', { method: 'GET' }),
  
  getCatalogDataset: () => apiRequest<{ collection: VaultCollection; records: VaultRecord[] }>('/api/vault/datasets/catalogs', { method: 'GET' }),

  // --- Assets ---
  getAssets: (params?: { search?: string; type?: string; status?: string; collection_id?: string; is_deleted?: boolean; sort?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.type) query.set('type', params.type);
    if (params?.status) query.set('status', params.status);
    if (params?.collection_id) query.set('collection_id', params.collection_id);
    if (params?.is_deleted) query.set('is_deleted', 'true');
    if (params?.sort) query.set('sort', params.sort);
    
    return apiRequest<VaultAsset[]>(`/api/vault/assets?${query.toString()}`, { method: 'GET' });
  },
  
  getAsset: (id: string) => apiRequest<VaultAsset>(`/api/vault/assets/${id}`, { method: 'GET' }),
  
  uploadAsset: (file: File, metadata: Partial<VaultAsset> & { collection_id?: string }) => {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata.name) formData.append('name', metadata.name);
    if (metadata.description) formData.append('description', metadata.description);
    if (metadata.category) formData.append('category', metadata.category);
    if (metadata.type) formData.append('type', metadata.type);
    if (metadata.visibility) formData.append('visibility', metadata.visibility);
    if (metadata.collection_id) formData.append('collection_id', metadata.collection_id);
    if (metadata.tags) formData.append('tags', JSON.stringify(metadata.tags));

    return fetch((import.meta.env.VITE_API_URL || '') + '/api/vault/assets/upload', {
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

  uploadVersion: (assetId: string, file: File, changeDescription?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (changeDescription) formData.append('change_description', changeDescription);

    return fetch((import.meta.env.VITE_API_URL || '') + `/api/vault/assets/${assetId}/versions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: formData,
    }).then(async res => {
      if (!res.ok) throw new Error('Failed to upload version');
      return res.json();
    });
  },

  updateAsset: (id: string, metadata: Partial<VaultAsset>) => 
    apiRequest<VaultAsset>(`/api/vault/assets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(metadata)
    }),

  deleteAsset: (id: string) =>
    apiRequest<{ message: string }>(`/api/vault/assets/${id}`, { method: 'DELETE' }),

  restoreAsset: (id: string) =>
    apiRequest<{ message: string }>(`/api/vault/assets/${id}/restore`, { method: 'POST' }),

  permanentDeleteAsset: (id: string) =>
    apiRequest<{ message: string }>(`/api/vault/assets/${id}/permanent`, { method: 'DELETE' }),

  bulkDeleteAssets: (ids: string[]) =>
    apiRequest<{ message: string }>('/api/vault/assets/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids })
    }),

  // --- Collections / Data Sources ---
  getCollections: () => apiRequest<VaultCollection[]>('/api/vault/collections', { method: 'GET' }),
  
  createCollection: (data: { name: string; description?: string; schema_fields?: VaultSchemaField[] }) =>
    apiRequest<VaultCollection>('/api/vault/collections', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateCollection: (id: string, data: { name?: string; description?: string; schema_fields?: VaultSchemaField[] }) =>
    apiRequest<VaultCollection>(`/api/vault/collections/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),

  deleteCollection: (id: string) =>
    apiRequest<{ message: string }>(`/api/vault/collections/${id}`, { method: 'DELETE' }),

  // --- Data Workspace Records ---
  getRecords: (collectionId: string) =>
    apiRequest<{ collection: VaultCollection; records: VaultRecord[] }>(`/api/vault/collections/${collectionId}/records`, { method: 'GET' }),

  createRecord: (collectionId: string, record: { name: string; data?: Record<string, any>; asset_id?: string; status?: string }) =>
    apiRequest<VaultRecord>(`/api/vault/collections/${collectionId}/records`, {
      method: 'POST',
      body: JSON.stringify(record)
    }),

  updateRecord: (collectionId: string, recordId: string, record: Partial<VaultRecord>) =>
    apiRequest<VaultRecord>(`/api/vault/collections/${collectionId}/records/${recordId}`, {
      method: 'PATCH',
      body: JSON.stringify(record)
    }),

  deleteRecord: (collectionId: string, recordId: string) =>
    apiRequest<{ message: string }>(`/api/vault/collections/${collectionId}/records/${recordId}`, { method: 'DELETE' }),

  // --- Templates ---
  getTemplates: () => apiRequest<VaultTemplate[]>('/api/vault/templates', { method: 'GET' }),

  createTemplate: (data: { name: string; description?: string; schema?: any }) =>
    apiRequest<VaultTemplate>('/api/vault/templates', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateTemplate: (id: string, data: Partial<VaultTemplate>) =>
    apiRequest<VaultTemplate>(`/api/vault/templates/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),

  deleteTemplate: (id: string) =>
    apiRequest<{ message: string }>(`/api/vault/templates/${id}`, { method: 'DELETE' }),

  // --- Trash, Processing & Activity ---
  getTrash: () => apiRequest<any[]>('/api/vault/trash', { method: 'GET' }),

  emptyTrash: () => apiRequest<{ message: string }>('/api/vault/trash/empty', { method: 'POST' }),

  getProcessingJobs: () => apiRequest<VaultProcessingJob[]>('/api/vault/processing/jobs', { method: 'GET' }),

  getActivityLogs: (params?: { search?: string; action?: string; target_type?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.action) query.set('action', params.action);
    if (params?.target_type) query.set('target_type', params.target_type);

    return apiRequest<VaultAuditLog[]>(`/api/vault/activity?${query.toString()}`, { method: 'GET' });
  }
};
