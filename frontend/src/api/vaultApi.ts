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

export interface VaultSearchResult {
  query: string;
  assets: VaultAsset[];
  products: any[];
  catalogs: any[];
  collections: VaultCollection[];
  templates: VaultTemplate[];
}

export const vaultApi = {
  // --- Global Multi-Target Search ---
  searchGlobal: (query: string) =>
    apiRequest<VaultSearchResult>(`/api/vault/search?q=${encodeURIComponent(query)}`, { method: 'GET' })
      .catch(() => ({ query, assets: [], products: [], catalogs: [], collections: [], templates: [] })),

  // --- Datasets & Multi-Source Summary ---
  getDatasetsSummary: () => apiRequest<VaultDatasetSummary>('/api/vault/datasets/summary', { method: 'GET' })
    .catch(() => ({ total_assets: 0, total_3d_models: 0, total_products: 0, total_catalogs: 0, total_templates: 0, total_collections: 0, total_storage_bytes: 0, storage_quota_bytes: 107374182400 })),

  
  getProductDataset: () => apiRequest<{ collection: VaultCollection; records: VaultRecord[] }>('/api/vault/datasets/products', { method: 'GET' })
    .then(res => ({
      collection: res?.collection || { id: 'products', name: 'Products Dataset', description: '', schema_fields: [], created_at: '', updated_at: '' },
      records: Array.isArray(res?.records) ? res.records : []
    }))
    .catch(() => ({ collection: { id: 'products', name: 'Products Dataset', description: '', schema_fields: [], created_at: '', updated_at: '' }, records: [] })),
  
  getCatalogDataset: () => apiRequest<{ collection: VaultCollection; records: VaultRecord[] }>('/api/vault/datasets/catalogs', { method: 'GET' })
    .then(res => ({
      collection: res?.collection || { id: 'catalogs', name: 'Catalogs Dataset', description: '', schema_fields: [], created_at: '', updated_at: '' },
      records: Array.isArray(res?.records) ? res.records : []
    }))
    .catch(() => ({ collection: { id: 'catalogs', name: 'Catalogs Dataset', description: '', schema_fields: [], created_at: '', updated_at: '' }, records: [] })),

  // --- Assets ---
  getAssets: (params?: { search?: string; type?: string; status?: string; collection_id?: string; is_deleted?: boolean; sort?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.type) query.set('type', params.type);
    if (params?.status) query.set('status', params.status);
    if (params?.collection_id) query.set('collection_id', params.collection_id);
    if (params?.is_deleted) query.set('is_deleted', 'true');
    if (params?.sort) query.set('sort', params.sort);
    
    return apiRequest<VaultAsset[]>(`/api/vault/assets?${query.toString()}`, { method: 'GET' })
      .then(res => (Array.isArray(res) ? res : []))
      .catch(() => []);
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
  getCollections: () => apiRequest<VaultCollection[]>('/api/vault/collections', { method: 'GET' })
    .then(res => (Array.isArray(res) ? res : []))
    .catch(() => []),
  
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
    apiRequest<{ collection: VaultCollection; records: VaultRecord[] }>(`/api/vault/collections/${collectionId}/records`, { method: 'GET' })
      .then(res => ({
        collection: res?.collection || { id: collectionId, name: 'Collection', description: '', schema_fields: [], created_at: '', updated_at: '' },
        records: Array.isArray(res?.records) ? res.records : []
      }))
      .catch(() => ({
        collection: { id: collectionId, name: 'Collection', description: '', schema_fields: [], created_at: '', updated_at: '' },
        records: []
      })),

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
  getTemplates: () => apiRequest<VaultTemplate[]>('/api/vault/templates', { method: 'GET' })
    .then(res => (Array.isArray(res) ? res : []))
    .catch(() => []),

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
  getTrash: () => apiRequest<any[]>('/api/vault/trash', { method: 'GET' })
    .then(res => (Array.isArray(res) ? res : []))
    .catch(() => []),

  emptyTrash: () => apiRequest<{ message: string }>('/api/vault/trash/empty', { method: 'POST' }),

  getProcessingJobs: () => apiRequest<VaultProcessingJob[]>('/api/vault/processing/jobs', { method: 'GET' })
    .then(res => (Array.isArray(res) ? res : []))
    .catch(() => []),

  getActivityLogs: (params?: { search?: string; action?: string; target_type?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.action) query.set('action', params.action);
    if (params?.target_type) query.set('target_type', params.target_type);

    return apiRequest<VaultAuditLog[]>(`/api/vault/activity?${query.toString()}`, { method: 'GET' })
      .then(res => (Array.isArray(res) ? res : []))
      .catch(() => []);
  },

  // --- Saved Views ---
  getSavedViews: (collectionId?: string) => {
    const query = collectionId ? `?collection_id=${collectionId}` : '';
    return apiRequest<any[]>(`/api/vault/views${query}`, { method: 'GET' })
      .then(res => (Array.isArray(res) ? res : []))
      .catch(() => []);
  },

  createSavedView: (data: { collection_id?: string; name: string; columns_config?: any[]; filters_config?: any[]; sort_config?: any; is_shared?: boolean }) =>
    apiRequest<any>('/api/vault/views', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  deleteSavedView: (id: string) =>
    apiRequest<{ message: string }>(`/api/vault/views/${id}`, { method: 'DELETE' }),

  // --- Resource Sharing ---
  getShares: (resourceType?: string, resourceId?: string) => {
    const query = new URLSearchParams();
    if (resourceType) query.set('resource_type', resourceType);
    if (resourceId) query.set('resource_id', resourceId);
    return apiRequest<any[]>(`/api/vault/shares?${query.toString()}`, { method: 'GET' })
      .then(res => (Array.isArray(res) ? res : []))
      .catch(() => []);
  },

  createShare: (data: { resource_type: string; resource_id: string; shared_with_user_id: string; permission_level?: string }) =>
    apiRequest<any>('/api/vault/shares', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  deleteShare: (id: string) =>
    apiRequest<{ message: string }>(`/api/vault/shares/${id}`, { method: 'DELETE' }),

  // --- Approval Lifecycle & Restore ---
  updateApprovalStatus: (assetId: string, approval_status: string, review_notes?: string) =>
    apiRequest<VaultAsset>(`/api/vault/assets/${assetId}/approval`, {
      method: 'POST',
      body: JSON.stringify({ approval_status, review_notes })
    }),

  restoreVersion: (assetId: string, versionId: string) =>
    apiRequest<VaultAsset>(`/api/vault/assets/${assetId}/versions/${versionId}/restore`, {
      method: 'POST'
    }),

  // --- Ecosystem Enquiries ---
  getEnquiries: (params?: { search?: string; source_application?: string; status?: string; priority?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.source_application) query.set('source_application', params.source_application);
    if (params?.status) query.set('status', params.status);
    if (params?.priority) query.set('priority', params.priority);

    return apiRequest<VaultEnquiry[]>(`/api/vault/enquiries?${query.toString()}`, { method: 'GET' })
      .then(res => (Array.isArray(res) ? res : []))
      .catch(() => []);
  },

  createEnquiry: (data: Partial<VaultEnquiry>) =>
    apiRequest<VaultEnquiry>('/api/vault/enquiries', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateEnquiry: (id: string, data: Partial<VaultEnquiry>) =>
    apiRequest<VaultEnquiry>(`/api/vault/enquiries/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),

  // --- Product Detail & Update ---
  getProductDetail: (id: string) =>
    apiRequest<VaultProductDetail>(`/api/vault/products/${id}`, { method: 'GET' }),

  updateProduct: (id: string, data: Partial<VaultProductDetail>) =>
    apiRequest<VaultProductDetail>(`/api/vault/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),

  // --- Catalog Product Reordering ---
  getCatalogProducts: (catalogId: string) =>
    apiRequest<any[]>(`/api/vault/catalogs/${catalogId}/products`, { method: 'GET' })
      .then(res => (Array.isArray(res) ? res : []))
      .catch(() => []),

  reorderCatalogProducts: (catalogId: string, productIds: string[]) =>
    apiRequest<{ message: string; count: number }>(`/api/vault/catalogs/${catalogId}/reorder`, {
      method: 'POST',
      body: JSON.stringify({ product_ids: productIds })
    }),

  // --- Phase 2 Product Relationships ---
  getProductRelationships: (id: string) =>
    apiRequest<ProductFullRelationships>(`/api/vault/products/${id}/relationships`, { method: 'GET' }),

  attachProductAsset: (id: string, data: { asset_id: string; asset_role: string; display_order?: number }) =>
    apiRequest<AttachedAssetMap>(`/api/vault/products/${id}/assets`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  detachProductAsset: (id: string, mapId: string) =>
    apiRequest<{ message: string }>(`/api/vault/products/${id}/assets/${mapId}`, { method: 'DELETE' }),

  addProductRelationship: (id: string, data: { target_product_id: string; relationship_type: string; notes?: string }) =>
    apiRequest<ProductRelationshipItem>(`/api/vault/products/${id}/related`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  removeProductRelationship: (id: string, relId: string) =>
    apiRequest<{ message: string }>(`/api/vault/products/${id}/related/${relId}`, { method: 'DELETE' }),

  // --- Phase 2 Dynamic Schemas & Field Governance ---
  getSchemas: () =>
    apiRequest<VaultSchema[]>('/api/vault/schemas', { method: 'GET' })
      .then(res => (Array.isArray(res) ? res : []))
      .catch(() => []),

  createSchema: (data: { name: string; description?: string; version?: string }) =>
    apiRequest<VaultSchema>('/api/vault/schemas', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  getSchemaFields: (schemaId: string) =>
    apiRequest<VaultSchemaField[]>(`/api/vault/schemas/${schemaId}/fields`, { method: 'GET' })
      .then(res => (Array.isArray(res) ? res : []))
      .catch(() => []),

  createSchemaField: (schemaId: string, data: Partial<VaultSchemaField>) =>
    apiRequest<VaultSchemaField>(`/api/vault/schemas/${schemaId}/fields`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // --- Phase 2 Bulk Operations & Import/Export ---
  bulkDatasetOperation: (collectionId: string, data: { action: 'delete' | 'update_status' | 'bulk_edit'; record_ids: string[]; data_payload?: any }) =>
    apiRequest<{ message: string; count: number }>(`/api/vault/datasets/${collectionId}/bulk`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  importDatasetRecords: (collectionId: string, records: any[]) =>
    apiRequest<{ message: string; count: number }>(`/api/vault/datasets/${collectionId}/import`, {
      method: 'POST',
      body: JSON.stringify({ records })
    }),

  exportDatasetRecords: (collectionId: string) =>
    apiRequest<any[]>(`/api/vault/datasets/${collectionId}/export`, { method: 'GET' })
      .then(res => (Array.isArray(res) ? res : []))
      .catch(() => [])
};

export interface AttachedAssetMap {
  map_id: string;
  asset_id: string;
  asset_role: string;
  display_order: number;
  attached_at: string;
  name: string;
  type: string;
  mime_type: string;
  size_bytes: number;
  public_url: string;
  thumbnail_url?: string;
  status: string;
}

export interface ProductRelationshipItem {
  rel_id: string;
  relationship_type: 'accessory' | 'replacement' | 'alternative' | 'variant' | 'parent' | 'child' | 'compatible' | 'recommended';
  notes?: string;
  created_at: string;
  target_product_id: string;
  target_product_name: string;
  category: string;
  status: string;
  image_url?: string;
}

export interface ProductFullRelationships {
  attached_assets: AttachedAssetMap[];
  related_products: ProductRelationshipItem[];
  catalogs: { id: string; name: string; status: string; slug: string; display_order: number }[];
  enquiries: VaultEnquiry[];
}

export interface VaultSchema {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  version: string;
  is_active: boolean;
  field_count?: number;
  created_at: string;
  updated_at: string;
}

export interface VaultSchemaField {
  id: string;
  schema_id: string;
  organization_id: string;
  name: string;
  internal_name: string;
  field_type: string;
  description?: string;
  required: boolean;
  unique_constraint: boolean;
  default_value?: string;
  validation_rules?: Record<string, any>;
  display_order: number;
  visibility: 'PUBLIC' | 'INTERNAL' | 'ADMIN_ONLY' | 'SYSTEM_ONLY';
  editable: boolean;
  system_field: boolean;
  created_at: string;
}

export interface VaultEnquiry {
  id: string;
  organization_id: string;
  source_application: string;
  product_id?: string;
  product_name?: string;
  catalog_id?: string;
  catalog_name?: string;
  customer_name: string;
  company?: string;
  email: string;
  phone?: string;
  message?: string;
  status: 'New' | 'In Progress' | 'Contacted' | 'Qualified' | 'Closed';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  assigned_to?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface VaultProductDetail {
  id: string;
  name: string;
  category: string;
  description: string;
  status: string;
  is_public: boolean;
  visibility?: string;
  approval_status?: string;
  specs?: Record<string, any>;
  dimensions?: Record<string, any>;
  catalog_id?: string;
  catalog_name?: string;
  associated_assets?: VaultAsset[];
  created_at: string;
  updated_at: string;
}

