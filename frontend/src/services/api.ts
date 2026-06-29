const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api';
const API_TIMEOUT_MS = 15000;

export class ApiClientError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export interface SessionUser {
  id: string;
  companyId: string;
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Sales User' | 'Viewer';
}

export interface AuthResponse {
  token: string;
  user: SessionUser;
}

export interface ProfileResponse {
  user: SessionUser & {
    phone?: string | null;
    avatarUrl?: string | null;
    designation?: string | null;
    department?: string | null;
    bio?: string | null;
    bannerUrl?: string | null;
    website?: string | null;
    location?: string | null;
    socialLinks?: Record<string, string>;
    emailVerified?: boolean;
    lastLoginAt?: string | null;
    createdAt?: string;
  };
}

export interface UploadedFile {
  id: string;
  file_category: 'image' | 'video' | 'model' | 'usdz_model' | 'document' | 'thumbnail' | 'qr_png' | 'qr_svg';
  asset_type?: 'thumbnail' | 'image' | 'model' | 'usdz_model' | 'document' | 'qr_png' | 'qr_svg';
  original_name: string;
  file_name?: string;
  file_path?: string;
  url: string;
  mime_type: string;
  size_bytes: number;
  checksum_sha256?: string;
  product?: unknown;
  qr?: unknown;
}

export interface ProductPayload {
  name: string;
  category: string;
  description?: string;
  status: 'Draft' | 'Published' | 'Archived';
  isPublic?: boolean;
  specs: Record<string, string>;
  imageUrl?: string;
  modelUrl?: string;
  usdzUrl?: string;
  documentUrl?: string;
  videoUrl?: string;
  dimensions?: {
    width?: number;
    height?: number;
    depth?: number;
    scale?: number;
    units?: string;
  };
}

export type CatalogRecord = {
  id: string;
  name: string;
  description?: string;
  status: 'Draft' | 'Published' | 'Archived';
  pdf_url?: string;
  productIds: string[];
};

export interface ProductMetricRecord {
  total_scans: number;
  product_views: number;
  ar_launch_count: number;
  qr_downloads: number;
  session_duration_events?: number;
}

export interface ProductAssetRecord {
  id: string;
  product_id: string;
  asset_type: 'thumbnail' | 'image' | 'model' | 'usdz_model' | 'document' | 'qr_png' | 'qr_svg';
  original_name: string;
  file_name: string;
  file_path: string;
  public_url: string;
  mime_type: string;
  size_bytes: number;
  checksum_sha256?: string | null;
  metadata?: Record<string, unknown>;
  created_at?: string;
}

export interface ProductQrRecord {
  id: string;
  product_id: string;
  product_slug: string;
  target_url: string;
  png_url: string;
  svg_url: string;
  generated_at?: string;
  updated_at?: string;
}

export interface ProductRecord {
  id: string;
  company_id?: string;
  name: string;
  category: string;
  description?: string | null;
  status: 'Draft' | 'Published' | 'Archived';
  specs: Record<string, string>;
  image_url?: string | null;
  model_url?: string | null;
  usdz_url?: string | null;
  document_url?: string | null;
  video_url?: string | null;
  dimensions?: {
    width?: number;
    height?: number;
    depth?: number;
    scale?: number;
    units?: string;
  } | null;
  is_public?: boolean;
  slug?: string | null;
  public_url?: string | null;
  thumbnail_asset_id?: string | null;
  model_asset_id?: string | null;
  usdz_asset_id?: string | null;
  qr_code_id?: string | null;
  created_at?: string;
  updated_at?: string;
  assets?: ProductAssetRecord[];
  qr?: ProductQrRecord | null;
  qr_generated_at?: string | null;
  qr_png_url?: string | null;
  qr_svg_url?: string | null;
  total_scans?: number;
  product_views?: number;
  ar_launch_count?: number;
  qr_downloads?: number;
  session_duration_events?: number;
}

const OFFLINE_TOKEN = 'offline-dev-token';

function isOfflineToken(token?: string) {
  return !token || token === OFFLINE_TOKEN;
}

function isApiUnavailable(error: unknown) {
  return error instanceof TypeError || error instanceof DOMException;
}

function offlineClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

async function offlineFallback<T>(path: string, options: RequestInit & { token?: string; formData?: FormData }) {
  const { products } = await import('./mockData');
  const token = options.token;
  const method = (options.method ?? 'GET').toUpperCase();

  if (path === '/auth/login' || path === '/auth/signup') {
    const body = typeof options.body === 'string' ? JSON.parse(options.body) : {};
    return {
      token: OFFLINE_TOKEN,
      user: {
        id: `offline-${body.email ?? 'user'}`,
        companyId: 'offline-company',
        name: body.name ?? String(body.email ?? 'I3DION Admin').split('@')[0],
        email: body.email ?? 'offline@i3dion.local',
        role: 'Admin',
      },
    } as T;
  }

  if (path === '/auth/forgot-password') return { message: 'Offline preview mode: reset unavailable.' } as T;
  if (path === '/auth/reset-password') return { message: 'Offline preview mode: reset unavailable.' } as T;
  if (path === '/auth/logout') return undefined as T;
  if (path === '/me' && method === 'GET') {
    const stored = localStorage.getItem('i3dion.user');
    return { user: stored ? JSON.parse(stored) : { id: 'offline-user', companyId: 'offline-company', name: 'I3DION Admin', email: 'offline@i3dion.local', role: 'Admin' } } as T;
  }
  if (path === '/me' && method === 'PUT') {
    const body = typeof options.body === 'string' ? JSON.parse(options.body) : {};
    const stored = localStorage.getItem('i3dion.user');
    const current = stored ? JSON.parse(stored) : { id: 'offline-user', companyId: 'offline-company', name: 'I3DION Admin', email: 'offline@i3dion.local', role: 'Admin' };
    const user = { ...current, ...body };
    localStorage.setItem('i3dion.user', JSON.stringify(user));
    return { user } as T;
  }
  if (path === '/products') return offlineClone(products) as T;
  if (path.startsWith('/products/') && path.endsWith('/metrics')) {
    return { total_scans: 0, product_views: 0, ar_launch_count: 0, qr_downloads: 0, session_duration_events: 0 } as T;
  }
  if (path.startsWith('/products/') && path.endsWith('/qr')) {
    const id = path.split('/').slice(-2, -1)[0];
    return {
      id: `offline-qr-${id}`,
      product_id: id,
      product_slug: id,
      target_url: `${window.location.origin}/product/${id}`,
      png_url: 'data:image/png;base64,',
      svg_url: 'data:image/svg+xml;base64,',
    } as T;
  }
  if (path.startsWith('/products/') && method === 'GET') {
    const id = path.split('/').pop();
    return offlineClone(products.find((product) => product.id === id) ?? null) as T;
  }
  if (path === '/catalogs') {
    const catalogs = JSON.parse(localStorage.getItem('i3dion.catalogs') ?? '[]') as CatalogRecord[];
    return offlineClone(catalogs) as T;
  }
  if (path.startsWith('/catalogs/') && method === 'GET') {
    const id = path.split('/').pop() as string;
    const catalogs = JSON.parse(localStorage.getItem('i3dion.catalogs') ?? '[]') as CatalogRecord[];
    const catalog = catalogs.find((item) => item.id === id) ?? null;
    return offlineClone(catalog) as T;
  }
  if (path === '/preferences') {
    return {
      company_id: 'offline-company',
      onboarding_enabled: true,
      default_brand_color: '#2563EB',
      default_catalog_visibility: 'private',
      notification_preferences: { email: true, inApp: true },
      appearance_preferences: { theme: 'light', density: 'comfortable' },
    } as T;
  }
  if (path === '/support-tickets') return [] as T;
  if (path === '/leads') return [] as T;
  if (path.startsWith('/leads/') && method === 'DELETE') return undefined as T;
  if (path.startsWith('/leads/') && method === 'PUT') return {} as T;
  if (path === '/analytics/summary') return { events: [], leads: [] } as T;
  if (path.startsWith('/public/products/')) {
    const slug = path.split('/').pop() ?? 'offline-product';
    const sample = products.find((product) => product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === slug) ?? products[0];
    return {
      ...offlineClone(sample),
      slug,
      public_url: `${window.location.origin}/product/${slug}`,
      qr: {
        id: `offline-qr-${slug}`,
        product_id: sample.id,
        product_slug: slug,
        target_url: `${window.location.origin}/product/${slug}`,
        png_url: 'data:image/png;base64,',
        svg_url: 'data:image/svg+xml;base64,',
      },
      assets: [],
      qr_png_url: 'data:image/png;base64,',
      qr_svg_url: 'data:image/svg+xml;base64,',
      total_scans: 0,
      product_views: 0,
      ar_launch_count: 0,
      qr_downloads: 0,
    } as T;
  }
  if (path === '/public/analytics/events') return { id: `offline-event-${Date.now()}` } as T;
  if (path === '/sessions') return [] as T;
  if (path.startsWith('/search')) return { products: [], catalogs: [], leads: [], total: 0 } as T;
  if (path === '/company') {
    return {
      id: 'offline-company', name: 'I3DION Industrial', website: '', logo_url: '', primary_color: '#2563EB', profile: '',
    } as T;
  }

  if (path === '/uploads') {
    return {
      id: `offline-file-${Date.now()}`,
      file_category: 'document',
      original_name: 'offline-upload',
      url: '',
      mime_type: 'application/octet-stream',
      size_bytes: 0,
    } as T;
  }
  if (path.startsWith('/qr/')) {
    return {
      id: `offline-qr-${Date.now()}`,
      entity_type: path.includes('/catalog/') ? 'catalog' : 'product',
      entity_id: path.split('/').pop(),
      target_url: 'http://localhost:5173',
      qr_data_url: 'data:image/png;base64,',
    } as T;
  }

  if (isOfflineToken(token)) {
    return undefined as T;
  }

  throw new ApiClientError(0, 'API server is not running. Start the backend at http://localhost:4000 or use the frontend in offline preview mode.');
}

export async function checkBackendHealth() {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(`${API_BASE_URL}/health`, { signal: controller.signal });
    const payload = await response.json().catch(() => null);
    return {
      reachable: true,
      ok: response.ok,
      status: response.status,
      dbConnected: Boolean(payload?.dbConnected),
      storageAvailable: Boolean(payload?.storageAvailable),
    };
  } catch {
    return {
      reachable: false,
      ok: false,
      status: 0,
      dbConnected: false,
      storageAvailable: false,
    };
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { token?: string; formData?: FormData } = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  const body = options.formData ?? options.body;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  if (!options.formData && body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`);
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers, body, signal: controller.signal });
  } catch (error) {
    if (isApiUnavailable(error) || (error as Error)?.name === 'AbortError') {
      if (import.meta.env.VITE_OFFLINE_MODE !== 'true') {
        throw new ApiClientError(0, 'Server unavailable. Please try again.');
      }
      return offlineFallback<T>(path, options);
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
  if (response.status === 204) return undefined as T;

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiClientError(response.status, data.message ?? 'Request failed', data.details);
  }

  return data as T;
}

export const api = {
  login: (email: string, password: string) =>
    apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  signup: (payload: { name: string; email: string; password: string; companyName: string }) =>
    apiRequest<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  forgotPassword: (email: string) =>
    apiRequest<{ message: string; resetToken?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  resetPassword: (token: string, password: string) =>
    apiRequest<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    }),
  logout: (token: string) => apiRequest<void>('/auth/logout', { token, method: 'POST' }),
  getMe: (token: string) => apiRequest<ProfileResponse>('/me', { token }),
  updateMe: (
    token: string,
    payload: {
      name?: string; email?: string; phone?: string; avatarUrl?: string;
      currentPassword?: string; newPassword?: string;
      designation?: string; department?: string; bio?: string; bannerUrl?: string;
      website?: string; location?: string; socialLinks?: Record<string, string>;
    },
  ) => apiRequest<ProfileResponse>('/me', { token, method: 'PUT', body: JSON.stringify(payload) }),
  listProducts: (token: string) => apiRequest<ProductRecord[]>('/products', { token }),
  getProduct: (token: string, id: string) => apiRequest<ProductRecord>(`/products/${id}`, { token }),
  getProductMetrics: (token: string, id: string) => apiRequest<ProductMetricRecord>(`/products/${id}/metrics`, { token }),
  getProductQr: (token: string, id: string) => apiRequest<ProductQrRecord | null>(`/products/${id}/qr`, { token }),
  createProduct: (token: string, payload: ProductPayload) =>
    apiRequest<ProductRecord>('/products', { token, method: 'POST', body: JSON.stringify(payload) }),
  updateProduct: (token: string, id: string, payload: ProductPayload) =>
    apiRequest<ProductRecord>(`/products/${id}`, { token, method: 'PUT', body: JSON.stringify(payload) }),
  patchProductStatus: (token: string, id: string, status: 'Draft' | 'Published' | 'Archived') =>
    apiRequest<ProductRecord>(`/products/${id}/status`, { token, method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteProduct: (token: string, id: string) => apiRequest<void>(`/products/${id}`, { token, method: 'DELETE' }),
  listCatalogs: (token: string) => apiRequest('/catalogs', { token }),
  getCatalog: (token: string, id: string) => apiRequest(`/catalogs/${id}`, { token }),
  createCatalog: (token: string, payload: unknown) =>
    apiRequest('/catalogs', { token, method: 'POST', body: JSON.stringify(payload) }),
  updateCatalog: (token: string, id: string, payload: unknown) =>
    apiRequest(`/catalogs/${id}`, { token, method: 'PUT', body: JSON.stringify(payload) }),
  deleteCatalog: (token: string, id: string) => apiRequest<void>(`/catalogs/${id}`, { token, method: 'DELETE' }),
  uploadCatalogPdf: async (token: string, id: string, file: Blob, filename: string): Promise<{ pdf_url: string }> => {
    const formData = new FormData();
    formData.append('file', file, filename);
    const res = await fetch(`${API_BASE_URL}/catalogs/${id}/upload-pdf`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) {
      throw new ApiClientError(res.status, await res.text());
    }
    return res.json();
  },
  listLeads: (token: string) => apiRequest('/leads', { token }),
  createLead: (token: string, payload: unknown) => apiRequest('/leads', { token, method: 'POST', body: JSON.stringify(payload) }),
  updateLead: (token: string, id: string, payload: unknown) =>
    apiRequest(`/leads/${id}`, { token, method: 'PUT', body: JSON.stringify(payload) }),
  deleteLead: (token: string, id: string) => apiRequest<void>(`/leads/${id}`, { token, method: 'DELETE' }),
  getLeadJourney: (token: string, id: string) => apiRequest(`/leads/${id}/journey`, { token }),
  getLeadActivities: (token: string, id: string) => apiRequest(`/leads/${id}/activities`, { token }),
  addLeadActivity: (token: string, id: string, payload: unknown) =>
    apiRequest(`/leads/${id}/activities`, { token, method: 'POST', body: JSON.stringify(payload) }),
  searchAll: (token: string, query: string, type = 'all') =>
    apiRequest<{ products: unknown[]; catalogs: unknown[]; leads: unknown[]; total: number }>(`/search?q=${encodeURIComponent(query)}&type=${type}`, { token }),
  getSessions: (token: string) => apiRequest<unknown[]>('/sessions', { token }),
  revokeAllSessions: (token: string) => apiRequest<void>('/sessions', { token, method: 'DELETE' }),

  // Analytics
  getAnalyticsSummary: (token: string) => apiRequest('/analytics/summary', { token }),
  getAnalyticsDashboard: (token: string) => apiRequest('/analytics/dashboard', { token }),
  getAnalyticsInsights: (token: string) => apiRequest('/analytics/insights', { token }),
  getTopProducts: (token: string) => apiRequest('/analytics/top-products', { token }),
  getAnalyticsTrends: (token: string) => apiRequest('/analytics/charts/trends', { token }),
  getAnalyticsSearches: (token: string) => apiRequest('/analytics/charts/searches', { token }),
  getAnalyticsFunnel: (token: string) => apiRequest('/analytics/charts/funnel', { token }),
  getAnalyticsDownloads: (token: string) => apiRequest('/analytics/charts/downloads', { token }),
  updateCompany: (token: string, payload: unknown) =>
    apiRequest('/company', { token, method: 'PUT', body: JSON.stringify(payload) }),
  getCompany: (token: string) => apiRequest('/company', { token }),
  getPreferences: (token: string) => apiRequest('/preferences', { token }),

  updatePreferences: (token: string, payload: unknown) =>
    apiRequest('/preferences', { token, method: 'PUT', body: JSON.stringify(payload) }),
  listSupportTickets: (token: string) => apiRequest('/support-tickets', { token }),
  createSupportTicket: (token: string, payload: unknown) =>
    apiRequest('/support-tickets', { token, method: 'POST', body: JSON.stringify(payload) }),
  uploadFile: (token: string, formData: FormData) =>
    apiRequest('/uploads', { token, method: 'POST', formData }),
  deleteFile: (token: string, id: string) => apiRequest<void>(`/uploads/${id}`, { token, method: 'DELETE' }),
  createQr: (token: string, type: 'product' | 'catalog', id: string) =>
    apiRequest(`/qr/${type}/${id}`, { token, method: 'POST' }),
  trackEvent: (token: string, payload: unknown) =>
    apiRequest('/analytics/events', { token, method: 'POST', body: JSON.stringify(payload) }),
  getPublicProduct: (slug: string) => apiRequest<ProductRecord>(`/public/products/${slug}`),
  trackPublicEvent: (payload: { slug: string; eventType: string; metadata?: Record<string, unknown>; durationSeconds?: number; sessionId?: string }) =>
    apiRequest('/public/analytics/events', { method: 'POST', body: JSON.stringify(payload) }),
};

export function uploadFileWithProgress({
  token,
  file,
  productId,
  assetType,
  onProgress,
}: {
  token: string;
  file: File;
  productId?: string;
  assetType?: string;
  onProgress: (progress: number) => void;
}) {
  return new Promise<UploadedFile>((resolve, reject) => {
    const request = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);
    if (productId) formData.append('productId', productId);
    if (assetType) formData.append('assetType', assetType);

    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    request.onload = () => {
      const data = JSON.parse(request.responseText || '{}');
      if (request.status >= 200 && request.status < 300) {
        onProgress(100);
        resolve(data as UploadedFile);
        return;
      }

      reject(new ApiClientError(request.status, data.message ?? 'Upload failed', data.details));
    };

    request.onerror = () => {
      reject(new ApiClientError(0, 'Backend API is not reachable. Make sure the backend and PostgreSQL are running before uploading files.'));
    };
    request.timeout = API_TIMEOUT_MS;
    request.ontimeout = () => {
      reject(new ApiClientError(0, 'Upload timed out. Check the backend and database, then try again.'));
    };

    request.open('POST', `${API_BASE_URL}/uploads`);
    request.setRequestHeader('Authorization', `Bearer ${token}`);
    request.send(formData);
  });
}
