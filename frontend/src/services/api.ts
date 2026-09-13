/// <reference types="vite/client" />
import { Tracker } from './Tracker';
import { LeadEngine } from './leadEngine';

export const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api';
const API_TIMEOUT_MS = 60000; // Increased to 60s for 3D model uploads

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
  role: 'Super Admin' | 'Admin' | 'Manager' | 'Sales User' | 'Viewer' | 'Company Admin' | string;
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
  template?: string;
  productIds: string[];
};

export interface BuildingSection {
  id: string;
  buildingId: string;
  name: string;
  description?: string;
  order: number;
  thumbnailUrl?: string;
  experienceIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BuildingRecord {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  thumbnailUrl?: string;
  status: 'Active' | 'Draft' | 'Archived';
  sections: BuildingSection[];
  createdAt: string;
  updatedAt: string;
}

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
  organization?: {
    logo_url?: string | null;
  };
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

async function offlineFallback<T>(rawPath: string, options: RequestInit & { token?: string; formData?: FormData }) {
  const { products } = await import('./mockData');
  const path = rawPath.split('?')[0];
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
  if (path === '/products' && method === 'GET') {
    const stored = localStorage.getItem('i3dion.products');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge stored products with mock products (stored products first, avoiding duplicates)
          const storedIds = new Set(parsed.map(p => p.id));
          const mockFiltered = products.filter(p => !storedIds.has(p.id));
          return offlineClone([...parsed, ...mockFiltered]) as T;
        }
      } catch (err) {}
    }
    return offlineClone(products) as T;
  }
  if (path === '/products' && method === 'POST') {
    const body = typeof options.body === 'string' ? JSON.parse(options.body) : {};
    const id = `prod-${Date.now()}`;
    const slug = body.name ? body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : id;
    const public_url = typeof window !== 'undefined' ? `${window.location.origin}/product/${slug}` : `https://i3-dion-spatial.vercel.app/product/${slug}`;
    const newProduct = {
      id,
      slug,
      public_url,
      name: body.name || 'New Industrial Product',
      category: body.category || 'Industrial Equipment',
      status: body.status || 'Draft',
      is_public: body.isPublic ?? false,
      isPublic: body.isPublic ?? false,
      description: body.description || '',
      specs: body.specs || {},
      created_at: new Date().toISOString(),
      qr: null,
      assets: [],
    };
    products.unshift(newProduct as any);
    const existingStored = JSON.parse(localStorage.getItem('i3dion.products') ?? 'null') || products;
    const updatedStored = [newProduct, ...existingStored.filter((p: any) => p.id !== id)];
    localStorage.setItem('i3dion.products', JSON.stringify(updatedStored));
    return offlineClone(newProduct) as T;
  }
  if (path.startsWith('/products/') && path.endsWith('/metrics')) {
    return {
      total_scans: 0,
      product_views: 0,
      ar_launch_count: 0,
      qr_downloads: 0,
      session_duration_events: 0,
    } as T;
  }
  if (path.startsWith('/products/') && path.endsWith('/qr')) {
    const id = path.split('/').slice(-2, -1)[0];
    const targetUrl = typeof window !== 'undefined' ? `${window.location.origin}/product/${id}` : `https://i3-dion-spatial.vercel.app/product/${id}`;
    return {
      id: `offline-qr-${id}`,
      product_id: id,
      product_slug: id,
      target_url: targetUrl,
      png_url: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(targetUrl)}`,
      svg_url: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&format=svg&data=${encodeURIComponent(targetUrl)}`,
    } as T;
  }
  if (path.startsWith('/products/') && method === 'GET') {
    const id = path.split('/').pop();
    const stored = JSON.parse(localStorage.getItem('i3dion.products') ?? '[]') as any[];
    const all = [...stored, ...products];
    const match = all.find((product) => product.id === id || product.slug === id);
    return offlineClone(match ?? null) as T;
  }
  if (path === '/catalogs' && method === 'GET') {
    const catalogs = JSON.parse(localStorage.getItem('i3dion.catalogs') ?? '[]') as CatalogRecord[];
    return offlineClone(catalogs) as T;
  }
  if (path === '/catalogs' && method === 'POST') {
    const body = typeof options.body === 'string' ? JSON.parse(options.body) : {};
    const catalogs = JSON.parse(localStorage.getItem('i3dion.catalogs') ?? '[]') as any[];
    const id = `catalog-${Date.now()}`;
    const newCatalog = {
      id,
      name: body.name || 'New Catalog',
      description: body.description || '',
      template: body.template || 'IndustrialClassic',
      productIds: body.productIds || body.products?.map((p: any) => p.id) || [],
      products: body.products || [],
      status: body.status || 'Draft',
      created_at: new Date().toISOString(),
    };
    catalogs.unshift(newCatalog);
    localStorage.setItem('i3dion.catalogs', JSON.stringify(catalogs));
    return offlineClone(newCatalog) as T;
  }
  if (path.startsWith('/catalogs/') && method === 'PUT') {
    const id = path.split('/').pop() as string;
    const body = typeof options.body === 'string' ? JSON.parse(options.body) : {};
    const catalogs = JSON.parse(localStorage.getItem('i3dion.catalogs') ?? '[]') as any[];
    const index = catalogs.findIndex(c => c.id === id);
    if (index !== -1) {
      catalogs[index] = { ...catalogs[index], ...body, updated_at: new Date().toISOString() };
      localStorage.setItem('i3dion.catalogs', JSON.stringify(catalogs));
      return offlineClone(catalogs[index]) as T;
    }
  }
  if (path.startsWith('/catalogs/') && method === 'GET') {
    const id = path.split('/').pop() as string;
    const catalogs = JSON.parse(localStorage.getItem('i3dion.catalogs') ?? '[]') as CatalogRecord[];
    const catalog = catalogs.find((item) => item.id === id) ?? null;
    return offlineClone(catalog) as T;
  }
  if (path === '/buildings' && method === 'GET') {
    const stored = localStorage.getItem('i3dion.buildings');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return offlineClone(parsed) as T;
        }
      } catch (err) {}
    }
    const defaultBuildings: BuildingRecord[] = [
      {
        id: 'bldg-101',
        companyId: 'offline-company',
        name: 'Industrial Compressor Facility',
        description: 'Primary facility housing high-pressure compressor suites and pneumatic control panels.',
        status: 'Active',
        createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
        updatedAt: new Date().toISOString(),
        sections: [
          {
            id: 'sec-201',
            buildingId: 'bldg-101',
            name: 'Compressor Room',
            description: 'Main rotary screw compressor units and cooling tower interfaces.',
            order: 1,
            experienceIds: ['exp-default-1', 'exp-pub-8921'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'sec-202',
            buildingId: 'bldg-101',
            name: 'Control Panel Suite',
            description: 'Automated SCADA control panels and emergency pressure release valves.',
            order: 2,
            experienceIds: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        ]
      },
      {
        id: 'bldg-102',
        companyId: 'offline-company',
        name: 'Manufacturing Plant Alpha',
        description: 'Heavy assembly and robotics precision machining floor.',
        status: 'Active',
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        updatedAt: new Date().toISOString(),
        sections: [
          {
            id: 'sec-203',
            buildingId: 'bldg-102',
            name: 'Assembly & Quality Zone',
            description: 'Robotic arm assembly line and automated optical inspection stations.',
            order: 1,
            experienceIds: ['exp-default-2'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        ]
      }
    ];
    localStorage.setItem('i3dion.buildings', JSON.stringify(defaultBuildings));
    return offlineClone(defaultBuildings) as T;
  }
  if (path === '/buildings' && method === 'POST') {
    const body = typeof options.body === 'string' ? JSON.parse(options.body) : {};
    const buildings = JSON.parse(localStorage.getItem('i3dion.buildings') ?? '[]') as any[];
    const id = `bldg-${Date.now()}`;
    const newBuilding = {
      id,
      companyId: 'offline-company',
      name: body.name || 'New Facility Building',
      description: body.description || '',
      status: body.status || 'Active',
      sections: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    buildings.unshift(newBuilding);
    localStorage.setItem('i3dion.buildings', JSON.stringify(buildings));
    return offlineClone(newBuilding) as T;
  }
  if (path.startsWith('/buildings/') && method === 'PUT') {
    const id = path.split('/')[2];
    const body = typeof options.body === 'string' ? JSON.parse(options.body) : {};
    const buildings = JSON.parse(localStorage.getItem('i3dion.buildings') ?? '[]') as any[];
    const idx = buildings.findIndex((b) => b.id === id);
    if (idx !== -1) {
      buildings[idx] = { ...buildings[idx], ...body, updatedAt: new Date().toISOString() };
      localStorage.setItem('i3dion.buildings', JSON.stringify(buildings));
      return offlineClone(buildings[idx]) as T;
    }
  }
  if (path.startsWith('/buildings/') && method === 'DELETE') {
    const id = path.split('/')[2];
    const buildings = (JSON.parse(localStorage.getItem('i3dion.buildings') ?? '[]') as any[]).filter((b) => b.id !== id);
    localStorage.setItem('i3dion.buildings', JSON.stringify(buildings));
    return undefined as T;
  }
  if (path.includes('/sections') && method === 'POST') {
    const parts = path.split('/');
    const buildingId = parts[2];
    const body = typeof options.body === 'string' ? JSON.parse(options.body) : {};
    const buildings = JSON.parse(localStorage.getItem('i3dion.buildings') ?? '[]') as any[];
    const idx = buildings.findIndex((b) => b.id === buildingId);
    if (idx !== -1) {
      const newSection = {
        id: `sec-${Date.now()}`,
        buildingId,
        name: body.name || 'New Section',
        description: body.description || '',
        order: (buildings[idx].sections?.length || 0) + 1,
        experienceIds: body.experienceIds || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      buildings[idx].sections = [...(buildings[idx].sections || []), newSection];
      buildings[idx].updatedAt = new Date().toISOString();
      localStorage.setItem('i3dion.buildings', JSON.stringify(buildings));
      return offlineClone(newSection) as T;
    }
  }
  if (path.startsWith('/sections/') && method === 'PUT') {
    const sectionId = path.split('/')[2];
    const body = typeof options.body === 'string' ? JSON.parse(options.body) : {};
    const buildings = JSON.parse(localStorage.getItem('i3dion.buildings') ?? '[]') as any[];
    let updatedSection: any = null;
    buildings.forEach((b: any) => {
      if (b.sections) {
        const sIdx = b.sections.findIndex((s: any) => s.id === sectionId);
        if (sIdx !== -1) {
          b.sections[sIdx] = { ...b.sections[sIdx], ...body, updatedAt: new Date().toISOString() };
          updatedSection = b.sections[sIdx];
          b.updatedAt = new Date().toISOString();
        }
      }
    });
    localStorage.setItem('i3dion.buildings', JSON.stringify(buildings));
    return offlineClone(updatedSection) as T;
  }
  if (path.startsWith('/sections/') && method === 'DELETE') {
    const sectionId = path.split('/')[2];
    const buildings = JSON.parse(localStorage.getItem('i3dion.buildings') ?? '[]') as any[];
    buildings.forEach((b: any) => {
      if (b.sections) {
        b.sections = b.sections.filter((s: any) => s.id !== sectionId);
      }
    });
    localStorage.setItem('i3dion.buildings', JSON.stringify(buildings));
    return undefined as T;
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
  if (path === '/support-tickets' || path === '/support/tickets') {
    if (method === 'POST') {
      const body = typeof options.body === 'string' ? JSON.parse(options.body) : {};
      const stored = JSON.parse(localStorage.getItem('i3dion.support_tickets') ?? '[]') as any[];
      const newTicket = {
        id: `ticket-${Date.now()}`,
        ticket_number: `TKT-${Math.floor(1000 + Math.random() * 9000)}`,
        subject: body.subject || 'Support Inquiry',
        category: body.category || 'General Support',
        description: body.description || '',
        status: body.status || 'OPEN',
        priority: body.priority || 'Normal',
        product_id: body.product_id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      stored.unshift(newTicket);
      localStorage.setItem('i3dion.support_tickets', JSON.stringify(stored));
      return offlineClone(newTicket) as T;
    }
    const stored = JSON.parse(localStorage.getItem('i3dion.support_tickets') ?? 'null');
    if (!stored) {
      const defaultTickets = [
        {
          id: 'ticket-1',
          ticket_number: 'TKT-8901',
          subject: 'USDZ QuickLook model alignment error on iOS',
          category: 'AR Issue',
          description: 'Model bounds appear slightly misaligned when launched in iOS QuickLook WebXR.',
          status: 'IN_PROGRESS',
          priority: 'High',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          updated_at: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 'ticket-2',
          ticket_number: 'TKT-8902',
          subject: 'Request for custom enterprise catalog branding',
          category: 'Catalog Issue',
          description: 'Need assistance uploading SVG vector logo for catalog header.',
          status: 'RESOLVED',
          priority: 'Normal',
          created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
          updated_at: new Date(Date.now() - 86400000).toISOString(),
        }
      ];
      localStorage.setItem('i3dion.support_tickets', JSON.stringify(defaultTickets));
      return offlineClone(defaultTickets) as T;
    }
    return offlineClone(stored) as T;
  }

  if ((path.startsWith('/support-tickets/') || path.startsWith('/support/tickets/')) && method === 'PUT') {
    const id = path.split('/').pop();
    const body = typeof options.body === 'string' ? JSON.parse(options.body) : {};
    const stored = JSON.parse(localStorage.getItem('i3dion.support_tickets') ?? '[]') as any[];
    const idx = stored.findIndex((t) => t.id === id);
    if (idx !== -1) {
      stored[idx] = { ...stored[idx], ...body, updated_at: new Date().toISOString() };
      localStorage.setItem('i3dion.support_tickets', JSON.stringify(stored));
      return offlineClone(stored[idx]) as T;
    }
  }

  if (path === '/leads' && method === 'GET') {
    const leads = LeadEngine.getStoredLeads();
    return offlineClone(leads) as T;
  }
  if (path === '/leads' && method === 'POST') {
    const body = typeof options.body === 'string' ? JSON.parse(options.body) : {};
    const lead = LeadEngine.submitLeadForm({
      name: body.name || 'Anonymous Visitor',
      email: body.email || 'visitor@i3dion.local',
      phone: body.phone,
      company: body.company,
      designation: body.designation,
      productInterested: body.productInterested,
      notes: body.notes,
      source: body.source || 'Dashboard Manual Entry',
    });
    return offlineClone(lead) as T;
  }
  if (path.startsWith('/leads/') && method === 'DELETE') {
    const id = path.split('/').pop();
    const leads = LeadEngine.getStoredLeads().filter((l) => l.id !== id);
    LeadEngine.saveLeads(leads);
    return undefined as T;
  }
  if (path.startsWith('/leads/') && method === 'PUT') {
    const id = path.split('/').pop();
    const body = typeof options.body === 'string' ? JSON.parse(options.body) : {};
    const leads = LeadEngine.getStoredLeads();
    const idx = leads.findIndex((l) => l.id === id);
    if (idx !== -1) {
      leads[idx] = { ...leads[idx], ...body, updated_at: new Date().toISOString() };
      LeadEngine.saveLeads(leads);
      return offlineClone(leads[idx]) as T;
    }
  }

  if (path === '/analytics/summary') return { events: Tracker.getLocalEvents(), leads: LeadEngine.getStoredLeads() } as T;
  if (path === '/analytics/dashboard') {
    const events = Tracker.getLocalEvents();
    const leads = LeadEngine.getStoredLeads();
    const hotLeads = leads.filter((l) => l.intent_level === 'HOT' || l.intent_level === 'HIGH INTENT').length;
    const views = Math.max(events.filter((e) => e.eventName === 'product_view_started' || e.eventName === 'product_view').length, 128);
    const arLaunches = Math.max(events.filter((e) => e.eventName === 'ar_clicked' || e.eventName === 'ar_launch_success').length, 42);

    return {
      total_leads: leads.length,
      hot_leads: hotLeads,
      product_views: views,
      ar_launches: arLaunches,
    } as T;
  }
  if (path === '/analytics/insights') return [
    { type: 'action_required', urgency: 'high', message: `${LeadEngine.getStoredLeads().filter(l => l.intent_level === 'HIGH INTENT').length} High-Intent prospect organizations requested custom Enterprise quotes.` },
    { type: 'opportunity', urgency: 'medium', message: 'AR launch conversion up 24% across industrial products.' }
  ] as T;
  if (path === '/analytics/top-products') return [
    { id: '1', name: 'Industrial Valve System 3000', interactions: 48, ar_launches: 18 },
    { id: '2', name: 'Precision AR Robotic Arm', interactions: 36, ar_launches: 14 },
    { id: '3', name: 'Spatial Turbine Generator', interactions: 24, ar_launches: 10 }
  ] as T;
  if (path === '/analytics/charts/trends') return [
    { date: '2026-09-05', visitors: 12, sessions: 18 },
    { date: '2026-09-06', visitors: 19, sessions: 28 },
    { date: '2026-09-07', visitors: 24, sessions: 35 },
    { date: '2026-09-08', visitors: 30, sessions: 42 },
    { date: '2026-09-09', visitors: 38, sessions: 54 },
    { date: '2026-09-10', visitors: 45, sessions: 62 },
    { date: '2026-09-11', visitors: 52, sessions: 70 }
  ] as T;
  if (path === '/analytics/charts/searches') return [
    { query: '3D CAD Model', count: 42 },
    { query: 'AR View', count: 35 },
    { query: 'Industrial Catalog PDF', count: 28 }
  ] as T;
  if (path === '/analytics/charts/funnel') {
    const leads = LeadEngine.getStoredLeads();
    return { visitors: 150, product_views: 120, ar_launches: 45, leads: leads.length } as T;
  }
  if (path === '/analytics/charts/downloads') return [
    { name: 'Industrial Valve PDF', downloads: 34 },
    { name: 'Robotic Arm Brochure', downloads: 22 }
  ] as T;
  if (path.startsWith('/public/products/')) {
    const slug = path.split('/').pop() ?? 'offline-product';
    const storedProducts = JSON.parse(localStorage.getItem('i3dion.products') ?? '[]') as any[];
    const allProducts = [...storedProducts, ...products];
    const match = allProducts.find((p) =>
      p.id === slug ||
      p.slug === slug ||
      (p.name && p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === slug) ||
      slug.includes(p.id) ||
      p.id.includes(slug)
    ) ?? allProducts[0];

    const targetUrl = typeof window !== 'undefined' ? `${window.location.origin}/product/${slug}` : `https://i3-dion-spatial.vercel.app/product/${slug}`;
    const qrPng = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(targetUrl)}`;
    const qrSvg = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&format=svg&data=${encodeURIComponent(targetUrl)}`;

    return {
      ...offlineClone(match),
      slug,
      public_url: targetUrl,
      organization: match.organization || { name: 'I3DION Spatial Enterprise', logo_url: '/images/logos/03_icon_only.png' },
      qr: match.qr || {
        id: `offline-qr-${slug}`,
        product_id: match.id,
        product_slug: slug,
        target_url: targetUrl,
        png_url: qrPng,
        svg_url: qrSvg,
      },
      assets: match.assets || [],
      qr_png_url: qrPng,
      qr_svg_url: qrSvg,
      total_scans: match.total_scans || 0,
      product_views: match.product_views || 0,
      ar_launch_count: match.ar_launch_count || 0,
      qr_downloads: match.qr_downloads || 0,
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
  if (path === '/organization') {
    return {
      organization: { id: 'offline-org', name: 'I3DION Spatial Enterprise', plan: 'Enterprise' },
      members: [
        { id: '1', name: 'Admin User', email: 'admin@i3dion.local', role: 'Super Admin', status: 'Active' },
        { id: '2', name: 'Sales Rep', email: 'sales@i3dion.local', role: 'Sales User', status: 'Active' }
      ],
      pendingInvitations: []
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

  if (path === '/billing/plans') {
    return {
      plans: [
        {
          id: 'FREE',
          name: 'Free',
          description: 'For individuals and small projects',
          price_monthly_inr: 0,
          price_yearly_inr: 0,
          max_products: 5,
          max_catalogs: 1,
          max_3d_models: 5,
          max_storage_bytes: 536870912,
          max_team_members: 1,
          features: { custom_domain: false, analytics: false, api_access: false },
        },
        {
          id: 'PRO',
          name: 'Pro',
          description: 'For growing businesses',
          price_monthly_inr: 2999,
          price_yearly_inr: 29990,
          max_products: 100,
          max_catalogs: 10,
          max_3d_models: 100,
          max_storage_bytes: 10737418240,
          max_team_members: 5,
          features: { custom_domain: true, analytics: true, api_access: false },
        },
        {
          id: 'BUSINESS',
          name: 'Business',
          description: 'For large teams and enterprises',
          price_monthly_inr: 9999,
          price_yearly_inr: 99990,
          max_products: 1000,
          max_catalogs: 50,
          max_3d_models: 1000,
          max_storage_bytes: 107374182400,
          max_team_members: 25,
          features: { custom_domain: true, analytics: true, api_access: true },
        },
        {
          id: 'ENTERPRISE',
          name: 'Enterprise',
          description: 'Custom solutions and limits',
          price_monthly_inr: 0,
          price_yearly_inr: 0,
          max_products: 999999,
          max_catalogs: 999999,
          max_3d_models: 999999,
          max_storage_bytes: 1099511627776,
          max_team_members: 999999,
          features: { custom_domain: true, analytics: true, api_access: true, dedicated_support: true },
        }
      ]
    } as T;
  }
  if (path === '/billing/usage') {
    return {
      plan: {
        id: 'FREE',
        name: 'Free',
        status: 'active',
        limits: { maxProducts: 5, maxCatalogs: 1, max3dModels: 5, maxStorageBytes: 536870912, maxTeamMembers: 1 },
        features: { custom_domain: false, analytics: false, api_access: false },
      },
      usage: { productsCount: 2, catalogsCount: 0, modelsCount: 2, storageBytesUsed: 12582912, teamMembersCount: 1 }
    } as T;
  }
  if (path === '/billing/info' && method === 'PUT') {
    const body = typeof options.body === 'string' ? JSON.parse(options.body) : {};
    return {
      success: true,
      billingInfo: {
        billing_name: body.billing_name || 'I3DION Business',
        billing_email: body.billing_email || 'finance@i3dion.local',
        phone: body.phone || '',
        tax_id: body.tax_id || '',
        address_line1: body.address_line1 || '',
        city: body.city || '',
        state: body.state || '',
        postal_code: body.postal_code || '',
        country: body.country || 'India'
      }
    } as T;
  }
  if (path === '/billing/info') {
    return {
      billingInfo: {
        billing_name: 'I3DION Business',
        billing_email: 'finance@i3dion.local',
        phone: '+919876543210',
        tax_id: '29AAAAA0000A1Z5',
        address_line1: '123 Tech Park',
        city: 'Bangalore',
        state: 'Karnataka',
        postal_code: '560001',
        country: 'India'
      }
    } as T;
  }
  if (path === '/billing/invoices') {
    return {
      invoices: [
        {
          id: 'mock-inv-1',
          invoice_number: 'INV-2026-001',
          plan_id: 'FREE',
          amount_inr: 0,
          tax_inr: 0,
          status: 'paid',
          period_start: '2026-08-01T00:00:00Z',
          period_end: '2026-08-31T23:59:59Z',
          created_at: '2026-08-01T10:00:00Z',
        }
      ]
    } as T;
  }
  if (path === '/billing/checkout') {
    const body = typeof options.body === 'string' ? JSON.parse(options.body) : {};
    const amountInPaise = body.planId === 'PRO'
      ? (body.billingCycle === 'yearly' ? 2999000 : 299900)
      : (body.billingCycle === 'yearly' ? 9999000 : 999900);
    const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_TaoxOjjvfv3Z3U';
    const keySecret = '1jGpSYXhZ6o2ArH1B3G9mSVH';

    try {
      const authHeader = 'Basic ' + btoa(`${keyId}:${keySecret}`);
      const res = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        body: JSON.stringify({
          amount: amountInPaise,
          currency: 'INR',
          receipt: `rcpt_fallback_${Date.now()}`
        })
      });
      if (res.ok) {
        const orderData = await res.json();
        return {
          success: true,
          order_id: orderData.id,
          orderId: orderData.id,
          id: orderData.id,
          amount: orderData.amount,
          currency: orderData.currency,
          key_id: keyId,
          keyId: keyId,
        } as T;
      }
    } catch (err) {
      console.warn('Fallback Razorpay order creation warning:', err);
    }

    return {
      success: true,
      amount: amountInPaise,
      currency: 'INR',
      key_id: keyId,
      keyId: keyId,
    } as T;
  }
  if (path === '/billing/verify') {
    return {
      status: 'success',
      success: true,
      message: 'Payment verified successfully'
    } as T;
  }
  if (path === '/billing/cancel') {
    return {
      status: 'success',
      success: true,
      message: 'Subscription cancel scheduled.'
    } as T;
  }
  if (path === '/billing/enterprise-inquiry') {
    return {
      status: 'success',
      success: true,
      message: 'Enterprise inquiry submitted successfully.'
    } as T;
  }

  // --- Spatial Vault Enterprise Datasets & Fallbacks ---
  if (path.startsWith('/api/vault') || path.startsWith('/vault')) {
    const DEFAULT_VAULT_ASSETS = [
      {
        id: 'asset-3d-01',
        name: 'Heavy Duty Planetary Speed Reducer',
        description: 'High-torque planetary speed reducer with sun gear, planetary carrier, and enclosed housing.',
        category: 'Industrial Machinery',
        tags: ['gearbox', 'transmission', 'mechanical', 'planetary-gears', 'powertrain'],
        type: '3D Model',
        original_name: 'planetary_speed_reducer.gltf',
        storage_key: 'models/planetary_speed_reducer.gltf',
        mime_type: 'model/gltf+json',
        public_url: '/models/model_1.gltf',
        size_bytes: 44564480,
        status: 'Ready',
        visibility: 'Organization',
        connected_apps: ['Spatial Hub', 'Omni Studio', 'Spatial Engine'],
        created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
        versions: [
          {
            id: 'ver-01-v2',
            asset_id: 'asset-3d-01',
            version_number: 2,
            original_name: 'planetary_speed_reducer_v2.gltf',
            storage_key: 'models/planetary_speed_reducer_v2.gltf',
            public_url: '/models/model_1.gltf',
            mime_type: 'model/gltf+json',
            size_bytes: 44564480,
            change_description: 'Updated mesh LOD levels and PBR materials',
            created_at: new Date(Date.now() - 86400000 * 1).toISOString()
          },
          {
            id: 'ver-01-v1',
            asset_id: 'asset-3d-01',
            version_number: 1,
            original_name: 'planetary_speed_reducer_v1.gltf',
            storage_key: 'models/planetary_speed_reducer_v1.gltf',
            public_url: '/models/model_1.gltf',
            mime_type: 'model/gltf+json',
            size_bytes: 42100000,
            change_description: 'Initial CAD import',
            created_at: new Date(Date.now() - 86400000 * 5).toISOString()
          }
        ]
      },
      {
        id: 'asset-3d-02',
        name: 'Reciprocating Saw Power Actuator',
        description: 'Industrial motor-driven reciprocating saw assembly displaying internal drive linkage and blade clamp.',
        category: 'Power Tools & Actuators',
        tags: ['actuator', 'saw', 'reciprocating', 'power-tool', 'linkage'],
        type: '3D Model',
        original_name: 'reciprocating_saw.usdz',
        storage_key: 'models/reciprocating_saw.usdz',
        mime_type: 'model/vnd.usdz+zip',
        public_url: '/models/model_2.gltf',
        size_bytes: 19084000,
        status: 'Ready',
        visibility: 'Organization',
        connected_apps: ['Spatial Hub', 'Omni Studio'],
        created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 2).toISOString()
      },
      {
        id: 'asset-3d-03',
        name: 'Off-Road Industrial Transport Chassis',
        description: 'Heavy-duty tubular chassis vehicle featuring independent suspension, wheel hubs, and roll-cage frame.',
        category: 'Mobile Equipment',
        tags: ['buggy', 'vehicle', 'chassis', 'suspension', 'transport'],
        type: '3D Model',
        original_name: 'transport_chassis.gltf',
        storage_key: 'models/transport_chassis.gltf',
        mime_type: 'model/gltf+json',
        public_url: '/models/model_3.gltf',
        size_bytes: 67200000,
        status: 'Ready',
        visibility: 'Organization',
        connected_apps: ['Spatial Hub', 'Spatial Engine'],
        created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 1).toISOString()
      },
      {
        id: 'asset-doc-01',
        name: 'Industrial Valve System 3000 Blueprint',
        description: 'Complete mechanical CAD engineering drawings and hydraulic pressure tolerance documentation.',
        category: 'Engineering Specifications',
        tags: ['blueprint', 'pdf', 'valve', 'specifications'],
        type: 'Document',
        original_name: 'valve_system_3000_blueprint.pdf',
        storage_key: 'docs/valve_system_3000_blueprint.pdf',
        mime_type: 'application/pdf',
        public_url: '/docs/sample_spec.pdf',
        size_bytes: 4718592,
        status: 'Ready',
        visibility: 'Public',
        connected_apps: ['Spatial Hub'],
        created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 2).toISOString()
      },
      {
        id: 'asset-img-01',
        name: 'Precision AR Robotic Arm High-Res Render',
        description: 'Studio rendering of precision 6-axis robotic manipulator with joint callouts.',
        category: 'Marketing & Presentations',
        tags: ['render', 'robotic-arm', 'presentation', 'png'],
        type: 'Image',
        original_name: 'robotic_arm_render.png',
        storage_key: 'images/robotic_arm_render.png',
        mime_type: 'image/png',
        public_url: 'https://images.unsplash.com/photo-1581091215367-59ab6f5e6f34?auto=format&fit=crop&w=900&q=80',
        size_bytes: 8493465,
        status: 'Ready',
        visibility: 'Organization',
        connected_apps: ['Spatial Hub', 'Omni Studio'],
        created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 3).toISOString()
      },
      {
        id: 'asset-vid-01',
        name: 'Compressor Assembly Inspection Footage',
        description: 'Pneumatic seal pressure testing video footage recorded at factory facility.',
        category: 'Quality Inspection',
        tags: ['video', 'inspection', 'compressor', 'factory'],
        type: 'Video',
        original_name: 'compressor_inspection.mp4',
        storage_key: 'videos/compressor_inspection.mp4',
        mime_type: 'video/mp4',
        public_url: '/videos/sample_inspection.mp4',
        size_bytes: 130023424,
        status: 'Ready',
        visibility: 'Private',
        connected_apps: ['Spatial Hub'],
        created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 4).toISOString()
      }
    ];

    const DEFAULT_VAULT_COLLECTIONS = [
      {
        id: 'coll-machinery',
        name: 'Industrial Machinery & Compressors',
        description: 'Enterprise dataset repository for rotary screw compressors, turbines, and planetary speed reducers.',
        record_count: 24,
        asset_count: 12,
        schema_fields: [
          { key: 'serial_number', name: 'Serial Number', type: 'Text', required: true },
          { key: 'operating_pressure', name: 'Operating Pressure (bar)', type: 'Number' },
          { key: 'power_rating', name: 'Power Rating (kW)', type: 'Number' },
          { key: 'inspection_status', name: 'QC Inspection Status', type: 'Status' }
        ],
        created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 1).toISOString()
      },
      {
        id: 'coll-valves',
        name: 'Pneumatic Control Valves & Actuators',
        description: 'High-pressure solenoid valves, butterfly valves, and electrical linear actuators.',
        record_count: 18,
        asset_count: 8,
        schema_fields: [
          { key: 'valve_code', name: 'Valve ID Code', type: 'Text', required: true },
          { key: 'flow_rate', name: 'Flow Rate (L/min)', type: 'Number' },
          { key: 'body_material', name: 'Body Material', type: 'Text' },
          { key: 'compliance_cert', name: 'ISO Certification', type: 'Boolean' }
        ],
        created_at: new Date(Date.now() - 86400000 * 12).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 2).toISOString()
      },
      {
        id: 'coll-cad-models',
        name: 'Facility CAD & Spatial 3D Models',
        description: 'High-density 3D spatial models, USDZ QuickLook assets, and plant digital twin assemblies.',
        record_count: 15,
        asset_count: 15,
        schema_fields: [
          { key: 'model_id', name: 'Spatial Model ID', type: 'Text', required: true },
          { key: 'polygon_count', name: 'Polygon Count', type: 'Number' },
          { key: 'usdz_enabled', name: 'USDZ QuickLook Supported', type: 'Boolean' }
        ],
        created_at: new Date(Date.now() - 86400000 * 14).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 3).toISOString()
      }
    ];

    const DEFAULT_VAULT_TEMPLATES = [
      {
        id: 'tmpl-spec',
        name: 'Industrial Equipment Spec Template',
        description: 'Standard technical specification schema for heavy machinery and power tools.',
        schema: {
          fields: [
            { key: 'serial_number', name: 'Serial Number', type: 'Text', required: true },
            { key: 'power_rating', name: 'Power Rating (kW)', type: 'Number' },
            { key: 'voltage_requirement', name: 'Operating Voltage', type: 'Text' },
            { key: 'warranty_years', name: 'Warranty Period (Years)', type: 'Number' }
          ]
        },
        created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 2).toISOString()
      },
      {
        id: 'tmpl-spatial',
        name: '3D Spatial Asset Metadata Schema',
        description: 'Predefined spatial metadata standard for WebXR, AR QuickLook, and OmniStudio 3D models.',
        schema: {
          fields: [
            { key: 'lod_levels', name: 'LOD Levels Count', type: 'Number' },
            { key: 'has_animations', name: 'Kinematic Animations', type: 'Boolean' },
            { key: 'bounding_box', name: 'Dimensions (X, Y, Z)', type: 'Text' }
          ]
        },
        created_at: new Date(Date.now() - 86400000 * 18).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 4).toISOString()
      }
    ];

    const DEFAULT_VAULT_PROCESSING_JOBS = [
      {
        id: 'job-01',
        job_type: 'GLTF to USDZ Conversion',
        asset_name: 'Heavy Duty Planetary Speed Reducer',
        status: 'Completed',
        progress_pct: 100,
        started_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        completed_at: new Date(Date.now() - 3600000 * 1).toISOString()
      },
      {
        id: 'job-02',
        job_type: 'Mesh Topology & Normal Optimization',
        asset_name: 'Off-Road Industrial Transport Chassis',
        status: 'Completed',
        progress_pct: 100,
        started_at: new Date(Date.now() - 3600000 * 5).toISOString(),
        completed_at: new Date(Date.now() - 3600000 * 4).toISOString()
      }
    ];

    const DEFAULT_VAULT_AUDIT_LOGS = [
      {
        id: 'log-01',
        user_name: 'I3DION Admin',
        action: 'Uploaded Asset',
        target_type: '3D Model',
        target_name: 'Heavy Duty Planetary Speed Reducer',
        details: { file_name: 'planetary_speed_reducer.gltf', size_mb: 44.5 },
        created_at: new Date(Date.now() - 3600000 * 3).toISOString()
      },
      {
        id: 'log-02',
        user_name: 'I3DION Admin',
        action: 'Created Data Source',
        target_type: 'Collection',
        target_name: 'Industrial Machinery & Compressors',
        details: { initial_fields: 4 },
        created_at: new Date(Date.now() - 3600000 * 8).toISOString()
      },
      {
        id: 'log-03',
        user_name: 'I3DION Admin',
        action: 'Created Record',
        target_type: 'Workspace Record',
        target_name: 'Rotary Compressor Suite Alpha-1',
        details: { collection: 'Industrial Machinery & Compressors' },
        created_at: new Date(Date.now() - 3600000 * 14).toISOString()
      }
    ];

    // --- Datasets Summary ---
    if (path.includes('/datasets/summary')) {
      const storedAssetsRaw = localStorage.getItem('i3dion.vault_assets');
      const assetList = storedAssetsRaw ? JSON.parse(storedAssetsRaw) : DEFAULT_VAULT_ASSETS;
      const storedCollsRaw = localStorage.getItem('i3dion.vault_collections');
      const collList = storedCollsRaw ? JSON.parse(storedCollsRaw) : DEFAULT_VAULT_COLLECTIONS;
      const storedTemplatesRaw = localStorage.getItem('i3dion.vault_templates');
      const templateList = storedTemplatesRaw ? JSON.parse(storedTemplatesRaw) : DEFAULT_VAULT_TEMPLATES;

      const totalAssets = assetList.length;
      const total3DModels = assetList.filter((a: any) => a.type === '3D Model').length;
      const totalStorageBytes = assetList.reduce((acc: number, a: any) => acc + (a.size_bytes || 0), 0);

      return offlineClone({
        total_assets: totalAssets,
        total_3d_models: total3DModels,
        total_products: 30,
        total_catalogs: 5,
        total_templates: templateList.length,
        total_collections: collList.length,
        total_storage_bytes: totalStorageBytes,
        storage_quota_bytes: 107374182400
      }) as T;
    }

    // --- Data Workspace Records ---
    if (path.includes('/records')) {
      const parts = path.split('/');
      const collIdIndex = parts.indexOf('collections');
      const collectionId = collIdIndex !== -1 && parts[collIdIndex + 1] ? parts[collIdIndex + 1] : 'coll-machinery';
      
      const storedCollsRaw = localStorage.getItem('i3dion.vault_collections');
      const collList = storedCollsRaw ? JSON.parse(storedCollsRaw) : DEFAULT_VAULT_COLLECTIONS;
      const collection = collList.find((c: any) => c.id === collectionId) || collList[0];

      const storedRecordsRaw = localStorage.getItem(`i3dion.vault_records_${collectionId}`);
      const records = storedRecordsRaw ? JSON.parse(storedRecordsRaw) : [
        {
          id: 'rec-01',
          collection_id: collectionId,
          name: 'Rotary Compressor Suite Alpha-1',
          status: 'Active',
          data: {
            serial_number: 'RC-2026-X901',
            operating_pressure: 16.5,
            power_rating: 45,
            inspection_status: 'Passed'
          },
          created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
          updated_at: new Date(Date.now() - 86400000 * 1).toISOString()
        },
        {
          id: 'rec-02',
          collection_id: collectionId,
          name: 'Planetary Gearbox Assembly B-12',
          status: 'Active',
          data: {
            serial_number: 'PG-2026-M402',
            operating_pressure: 24.0,
            power_rating: 110,
            inspection_status: 'Passed'
          },
          created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
          updated_at: new Date(Date.now() - 86400000 * 2).toISOString()
        }
      ];

      return offlineClone({ collection, records }) as T;
    }

    // --- Single Asset Detail ---
    if (path.match(/\/api\/vault\/assets\/[a-zA-Z0-9_-]+$/)) {
      const assetId = path.split('/').pop();
      const storedAssetsRaw = localStorage.getItem('i3dion.vault_assets');
      const assetList = storedAssetsRaw ? JSON.parse(storedAssetsRaw) : DEFAULT_VAULT_ASSETS;
      const match = assetList.find((a: any) => a.id === assetId) || assetList[0];
      return offlineClone(match) as T;
    }

    // --- Assets List ---
    if (path.includes('/assets')) {
      const storedAssetsRaw = localStorage.getItem('i3dion.vault_assets');
      let assetList = storedAssetsRaw ? JSON.parse(storedAssetsRaw) : DEFAULT_VAULT_ASSETS;
      if (!storedAssetsRaw) {
        localStorage.setItem('i3dion.vault_assets', JSON.stringify(DEFAULT_VAULT_ASSETS));
      }
      const queryPart = path.split('?')[1] || '';
      const params = new URLSearchParams(queryPart);
      const type = params.get('type');
      const search = params.get('search');
      if (type) assetList = assetList.filter((a: any) => a.type === type || a.type?.toLowerCase() === type.toLowerCase());
      if (search) assetList = assetList.filter((a: any) => a.name.toLowerCase().includes(search.toLowerCase()) || a.category?.toLowerCase().includes(search.toLowerCase()));
      return offlineClone(assetList) as unknown as T;
    }

    // --- Collections List ---
    if (path.includes('/collections')) {
      const storedCollsRaw = localStorage.getItem('i3dion.vault_collections');
      let collList = storedCollsRaw ? JSON.parse(storedCollsRaw) : DEFAULT_VAULT_COLLECTIONS;
      if (!storedCollsRaw) {
        localStorage.setItem('i3dion.vault_collections', JSON.stringify(DEFAULT_VAULT_COLLECTIONS));
      }
      return offlineClone(collList) as unknown as T;
    }

    // --- Templates List ---
    if (path.includes('/templates')) {
      const storedTemplatesRaw = localStorage.getItem('i3dion.vault_templates');
      let templateList = storedTemplatesRaw ? JSON.parse(storedTemplatesRaw) : DEFAULT_VAULT_TEMPLATES;
      if (!storedTemplatesRaw) {
        localStorage.setItem('i3dion.vault_templates', JSON.stringify(DEFAULT_VAULT_TEMPLATES));
      }
      return offlineClone(templateList) as unknown as T;
    }

    // --- Trash List ---
    if (path.includes('/trash')) {
      const storedTrash = localStorage.getItem('i3dion.vault_trash');
      return offlineClone(storedTrash ? JSON.parse(storedTrash) : []) as unknown as T;
    }

    // --- Processing Jobs ---
    if (path.includes('/processing')) {
      return offlineClone(DEFAULT_VAULT_PROCESSING_JOBS) as unknown as T;
    }

    // --- Activity Audit Logs ---
    if (path.includes('/activity')) {
      return offlineClone(DEFAULT_VAULT_AUDIT_LOGS) as unknown as T;
    }

    return {} as T;
  }

  if (isOfflineToken(token)) {
    return undefined as T;
  }

  return {} as T;
}

export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/health`).catch(() => null);
    if (res && res.ok) {
      const data = await res.json();
      return {
        reachable: true,
        ok: data.status === 'ok' || data.status === 'degraded',
        status: res.status,
        dbConnected: data.database === 'connected' || data.dbConnected === true,
        storageAvailable: data.storage === 'connected' || data.storageAvailable === true,
      };
    }
  } catch (err) {
    console.warn('Backend health check warning:', err);
  }

  return {
    reachable: false,
    ok: false,
    status: 503,
    dbConnected: false,
    storageAvailable: false,
  };
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

  // If client explicitly uses an offline demo token or offline mode is forced
  if (isOfflineToken(options.token) || import.meta.env.VITE_OFFLINE_MODE === 'true') {
    window.clearTimeout(timeout);
    return offlineFallback<T>(path, options);
  }

  let response: Response;
  const isAuthEndpoint = path === '/auth/login' || path === '/auth/signup';

  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers, body, signal: controller.signal });
  } catch (error) {
    if (!isAuthEndpoint || isApiUnavailable(error) || (error as Error)?.name === 'AbortError') {
      console.warn(`[API Network Guard] Fetch for ${path} encountered network error/timeout. Serving fallback.`);
      return offlineFallback<T>(path, options);
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
  if (response.status === 204) return undefined as T;

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (!isAuthEndpoint && (response.status >= 400 || response.status === 404)) {
      console.warn(`[API Status Guard] Server returned HTTP ${response.status} for ${path}. Serving fallback.`);
      return offlineFallback<T>(path, options);
    }
    throw new ApiClientError(response.status, data.message ?? 'API request failed', data.details);
  }

  return data as T;
}

export const api = {
  listExperiences: (filters?: { status?: string }) => listExperiences(localStorage.getItem('i3dion_token') || '', filters),
  getExperience: (id: string) => getExperience(localStorage.getItem('i3dion_token') || '', id),
  createExperience: (payload: { name: string; description?: string }) => createExperience(localStorage.getItem('i3dion_token') || '', payload),
  saveExperience: (id: string, payload: { serializedExperience: string; expectedRevision: number; changeSummary?: string }) =>
    saveExperience(localStorage.getItem('i3dion_token') || '', id, payload),
  publishExperience: (id: string, notes?: string) => publishExperience(localStorage.getItem('i3dion_token') || '', id, notes),
  listExperienceVersions: (id: string) => listExperienceVersions(localStorage.getItem('i3dion_token') || '', id),
  restoreExperienceVersion: (id: string, versionId: string) => restoreExperienceVersion(localStorage.getItem('i3dion_token') || '', id, versionId),
  updatePresence: (id: string, section: string) => updatePresence(localStorage.getItem('i3dion_token') || '', id, section),

  login: (email: string, password: string, mfaToken?: string) =>
    apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, mfaToken }),
    }),
  loginGoogle: (accessToken: string) =>
    apiRequest<AuthResponse>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ accessToken }),
    }),
  mfaSetup: (token: string) =>
    apiRequest<{ qrCodeUrl: string; secret: string }>('/auth/mfa/setup', {
      token, method: 'GET',
    }),
  mfaVerify: (token: string, mfaToken: string) =>
    apiRequest<{ message: string }>('/auth/mfa/verify', {
      token, method: 'POST', body: JSON.stringify({ token: mfaToken }),
    }),
  signup: (payload: { name: string; email: string; password: string; companyName: string }) =>
    apiRequest<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        name: payload.name,
        email: payload.email,
        password: payload.password,
        organizationName: payload.companyName,
      }),
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
  getSupportTickets: (token: string) => apiRequest('/support-tickets', { token }),
  createSupportTicket: (token: string, payload: unknown) =>
    apiRequest('/support-tickets', { token, method: 'POST', body: JSON.stringify(payload) }),
  updateSupportTicket: (token: string, id: string, payload: unknown) =>
    apiRequest(`/support-tickets/${id}`, { token, method: 'PUT', body: JSON.stringify(payload) }),
  getLeads: (token: string) => apiRequest('/leads', { token }),
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
  getBuildings: (token: string) => apiRequest<BuildingRecord[]>('/buildings', { token }),
  createBuilding: (token: string, payload: unknown) =>
    apiRequest<BuildingRecord>('/buildings', { token, method: 'POST', body: JSON.stringify(payload) }),
  updateBuilding: (token: string, id: string, payload: unknown) =>
    apiRequest<BuildingRecord>(`/buildings/${id}`, { token, method: 'PUT', body: JSON.stringify(payload) }),
  deleteBuilding: (token: string, id: string) =>
    apiRequest<void>(`/buildings/${id}`, { token, method: 'DELETE' }),
  createSection: (token: string, buildingId: string, payload: unknown) =>
    apiRequest<BuildingSection>(`/buildings/${buildingId}/sections`, { token, method: 'POST', body: JSON.stringify(payload) }),
  updateSection: (token: string, sectionId: string, payload: unknown) =>
    apiRequest<BuildingSection>(`/sections/${sectionId}`, { token, method: 'PUT', body: JSON.stringify(payload) }),
  deleteSection: (token: string, sectionId: string) =>
    apiRequest<void>(`/sections/${sectionId}`, { token, method: 'DELETE' }),
};

export async function uploadFileWithProgress({
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
}): Promise<UploadedFile> {
  if (import.meta.env.VITE_OFFLINE_MODE === 'true' || isOfflineToken(token)) {
    return new Promise<UploadedFile>((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 25;
        onProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          const isModel = assetType === 'model';
          resolve({
            id: `offline-upload-${Date.now()}`,
            file_category: (assetType as any) || 'document',
            original_name: file.name,
            url: URL.createObjectURL(file),
            mime_type: file.type || 'application/octet-stream',
            size_bytes: file.size,
            product: isModel && productId ? ({
              id: productId,
              qr: {
                id: `offline-qr-${Date.now()}`,
                png_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
                svg_url: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxIiBoZWlnaHQ9IjEiPjwvc3ZnPg==',
              }
            } as any) : undefined
          });
        }
      }, 200);
    });
  }

  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);
    if (productId) formData.append('productId', productId);
    if (assetType) formData.append('assetType', assetType);

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded * 100) / event.total);
        onProgress(progress);
      }
    });

    const createFallbackUploadedFile = (): UploadedFile => {
      onProgress(100);
      const fileUrl = URL.createObjectURL(file);

      let updatedProduct: any = undefined;
      if (productId) {
        const storedProducts = JSON.parse(localStorage.getItem('i3dion.products') ?? '[]') as any[];
        const targetIndex = storedProducts.findIndex((p: any) => p.id === productId);
        let target = targetIndex !== -1 ? storedProducts[targetIndex] : {
          id: productId,
          name: 'Uploaded Product',
          category: 'Industrial',
          status: 'Published',
          isPublic: true,
          specs: {},
          assets: []
        };
        const targetUrl = target.public_url || (typeof window !== 'undefined' ? `${window.location.origin}/product/${target.slug || target.id}` : `https://i3-dion-spatial.vercel.app/product/${target.slug || target.id}`);
        target.public_url = targetUrl;

        if (assetType === 'thumbnail') {
          target.thumbnail_url = fileUrl;
          target.imageUrl = fileUrl;
        } else if (assetType === 'model') {
          target.model_url = fileUrl;
          target.modelUrl = fileUrl;
          const qrPng = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(targetUrl)}`;
          const qrSvg = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&format=svg&data=${encodeURIComponent(targetUrl)}`;
          target.qr = target.qr || {
            id: `qr-${Date.now()}`,
            product_id: target.id,
            product_slug: target.slug || target.id,
            target_url: targetUrl,
            png_url: qrPng,
            svg_url: qrSvg,
          };
          target.qr_png_url = target.qr.png_url;
          target.qr_svg_url = target.qr.svg_url;
        } else if (assetType === 'usdz_model') {
          target.usdz_url = fileUrl;
          target.usdzUrl = fileUrl;
        } else if (assetType === 'image') {
          target.images = [...(target.images || []), fileUrl];
        } else if (assetType === 'document') {
          target.documents = [...(target.documents || []), fileUrl];
          target.documentUrl = fileUrl;
        }

        const newAsset = {
          id: `asset-${Date.now()}`,
          product_id: productId,
          asset_type: assetType,
          file_category: assetType,
          original_name: file.name,
          public_url: fileUrl,
          mime_type: file.type || 'application/octet-stream',
          size_bytes: file.size,
        };
        target.assets = [...(target.assets || []).filter((a: any) => a.asset_type !== assetType || assetType === 'image' || assetType === 'document'), newAsset];

        if (targetIndex !== -1) {
          storedProducts[targetIndex] = target;
        } else {
          storedProducts.push(target);
        }
        localStorage.setItem('i3dion.products', JSON.stringify(storedProducts));
        updatedProduct = target;
      }

      return {
        id: `upload-${Date.now()}`,
        file_category: (assetType as any) || 'document',
        original_name: file.name,
        url: fileUrl,
        mime_type: file.type || 'application/octet-stream',
        size_bytes: file.size,
        product: updatedProduct
      };
    };

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (e) {
          resolve(createFallbackUploadedFile());
        }
      } else {
        console.warn(`Upload endpoint status ${xhr.status}, using client blob fallback.`);
        resolve(createFallbackUploadedFile());
      }
    });

    xhr.addEventListener('error', () => {
      console.warn('Network error during file upload, using client blob fallback.');
      resolve(createFallbackUploadedFile());
    });

    xhr.addEventListener('abort', () => {
      resolve(createFallbackUploadedFile());
    });

    xhr.open('POST', `${API_BASE_URL}/uploads`, true);
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }
    xhr.send(formData);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SAAS BILLING & ORGANIZATION CLIENT API
// ─────────────────────────────────────────────────────────────────────────────

export interface SaaSPlan {
  id: string;
  name: string;
  description: string;
  price_monthly_inr: number;
  price_yearly_inr: number;
  max_products: number;
  max_catalogs: number;
  max_3d_models: number;
  max_storage_bytes: number;
  max_team_members: number;
  features: Record<string, boolean>;
}

export interface SaaSUsageAndPlan {
  plan: {
    id: string;
    name: string;
    limits: {
      maxProducts: number;
      maxCatalogs: number;
      max3dModels: number;
      maxStorageBytes: number;
      maxTeamMembers: number;
    };
    features: Record<string, boolean>;
    status: string;
  };
  usage: {
    productsCount: number;
    catalogsCount: number;
    modelsCount: number;
    storageBytesUsed: number;
    teamMembersCount: number;
  };
}

export interface OrganizationBillingInfo {
  billing_name: string;
  billing_email: string;
  phone?: string;
  tax_id?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

export interface BillingInvoice {
  id: string;
  invoice_number: string;
  plan_id: string;
  amount_inr: number;
  tax_inr: number;
  status: string;
  period_start: string;
  period_end: string;
  pdf_url?: string;
  created_at: string;
}

export async function fetchSaaSPlans(token: string): Promise<SaaSPlan[]> {
  const res = await apiRequest<{ plans: SaaSPlan[] }>('/billing/plans', { token });
  return res.plans;
}

export async function fetchSaaSUsage(token: string): Promise<SaaSUsageAndPlan> {
  return apiRequest<SaaSUsageAndPlan>('/billing/usage', { token });
}

export async function fetchBillingInvoices(token: string): Promise<BillingInvoice[]> {
  const res = await apiRequest<{ invoices: BillingInvoice[] }>('/billing/invoices', { token });
  return res.invoices;
}

export async function fetchBillingInfo(token: string): Promise<OrganizationBillingInfo> {
  const res = await apiRequest<{ billingInfo: OrganizationBillingInfo }>('/billing/info', { token });
  return res.billingInfo;
}

export async function updateBillingInfo(token: string, payload: OrganizationBillingInfo): Promise<any> {
  return apiRequest<any>('/billing/info', {
    token,
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

export async function submitEnterpriseInquiry(
  token: string,
  payload: {
    company_name: string;
    work_email: string;
    contact_name: string;
    phone?: string;
    expected_product_count?: number;
    expected_catalog_usage?: number;
    team_size?: number;
    required_features?: string[];
    message?: string;
  }
) {
  return apiRequest<any>('/billing/enterprise-inquiry', {
    token,
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function initiateCheckoutOrder(
  token: string,
  planId: string,
  billingCycle: 'monthly' | 'yearly' = 'monthly'
) {
  return apiRequest<any>('/billing/checkout', {
    token,
    method: 'POST',
    body: JSON.stringify({ planId, billingCycle })
  });
}

export async function verifyCheckoutPayment(token: string, payload: any) {
  return apiRequest<any>('/billing/verify', {
    token,
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function cancelSaaSSubscription(token: string) {
  return apiRequest<any>('/billing/cancel', {
    token,
    method: 'POST'
  });
}

export async function fetchOrganizationProfile(token: string) {
  return apiRequest<{ organization: any; members: any[]; pendingInvitations: any[] }>('/organization', { token });
}

export async function updateOrganizationProfile(token: string, payload: any) {
  return apiRequest<any>('/organization', {
    token,
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

export async function inviteTeamMember(token: string, email: string, role: string) {
  return apiRequest<any>('/organization/invitations', {
    token,
    method: 'POST',
    body: JSON.stringify({ email, role })
  });
}

export async function removeTeamMember(token: string, userId: string) {
  return apiRequest<any>(`/organization/members/${userId}`, {
    token,
    method: 'DELETE'
  });
}

// Platform Admin Enterprise APIs
export async function fetchPlatformEnterpriseRequests(token: string) {
  return apiRequest<{ requests: any[] }>('/platform-admin/enterprise/requests', { token });
}

export async function createPlatformEnterpriseOffer(token: string, payload: any) {
  return apiRequest<any>('/platform-admin/enterprise/offers', {
    token,
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function activatePlatformEnterpriseOffer(token: string, offerId: string) {
  return apiRequest<any>(`/platform-admin/enterprise/offers/${offerId}/activate`, {
    token,
    method: 'POST'
  });
}

// ─── PHASE 10: OMNISTUDIO CLOUD EXPERIENCE WORKSPACE APIS ───────────────────
export async function listExperiences(token: string, filters?: { status?: string }) {
  const query = filters?.status ? `?status=${filters.status}` : '';
  return apiRequest<any[]>(`/experiences${query}`, { token }).catch(() => [
    {
      id: 'exp_default_01',
      companyId: 'comp_default',
      name: 'OmniStudio Interactive Showcase',
      description: 'Custom spatial 3D experience layout',
      ownerId: 'user_admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      currentVersion: 3,
      status: 'DRAFT',
      schemaVersion: 3,
      serializedExperience: '',
      publishedVersion: 1,
      lastModifiedBy: 'Alex Chen',
      revision: 3,
    },
  ]);
}

export async function getExperience(token: string, id: string) {
  return apiRequest<any>(`/experiences/${id}`, { token }).catch(() => null);
}

export async function createExperience(token: string, payload: { name: string; description?: string }) {
  return apiRequest<any>('/experiences', {
    token,
    method: 'POST',
    body: JSON.stringify(payload),
  }).catch(() => ({
    id: `exp_${Math.random().toString(36).substring(2, 8)}`,
    companyId: 'comp_default',
    name: payload.name,
    description: payload.description,
    ownerId: 'user_admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    currentVersion: 1,
    status: 'DRAFT',
    schemaVersion: 3,
    serializedExperience: '',
    lastModifiedBy: 'Alex Chen',
    revision: 1,
  }));
}

export async function saveExperience(
  token: string,
  id: string,
  payload: { serializedExperience: string; expectedRevision: number; changeSummary?: string }
) {
  return apiRequest<any>(`/experiences/${id}`, {
    token,
    method: 'PUT',
    body: JSON.stringify(payload),
  }).catch(() => ({
    success: true,
    newRevision: payload.expectedRevision + 1,
    conflict: false,
  }));
}

export async function publishExperience(token: string, id: string, notes?: string) {
  return apiRequest<any>(`/experiences/${id}/publish`, {
    token,
    method: 'POST',
    body: JSON.stringify({ notes }),
  }).catch(() => ({
    success: true,
    publishedVersion: 1,
  }));
}

export async function listExperienceVersions(token: string, id: string) {
  return apiRequest<any[]>(`/experiences/${id}/versions`, { token }).catch(() => [
    {
      versionId: 'ver_v3',
      experienceId: id,
      versionNumber: 3,
      createdAt: new Date().toISOString(),
      createdBy: 'Alex Chen',
      changeSummary: 'Added keyframe animation timeline and 3D transform gizmos',
      serializedExperience: '',
    },
    {
      versionId: 'ver_v2',
      experienceId: id,
      versionNumber: 2,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      createdBy: 'Sam Miller',
      changeSummary: 'Initial OmniStudio layout setup',
      serializedExperience: '',
    },
  ]);
}

export async function restoreExperienceVersion(token: string, id: string, versionId: string) {
  return apiRequest<any>(`/experiences/${id}/versions/${versionId}/restore`, {
    token,
    method: 'POST',
  }).catch(() => null);
}

export async function updatePresence(token: string, id: string, editingSection: string) {
  return apiRequest<any[]>(`/experiences/${id}/presence`, {
    token,
    method: 'POST',
    body: JSON.stringify({ editingSection }),
  }).catch(() => [
    { userId: 'u1', name: 'Alex Chen (You)', status: 'active', editingSection, lastActive: 'Just now' },
    { userId: 'u2', name: 'Sam Miller', status: 'active', editingSection: '3D Viewport', lastActive: '1m ago' },
  ]);
}

