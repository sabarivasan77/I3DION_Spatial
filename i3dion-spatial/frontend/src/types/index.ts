import type { LucideIcon } from 'lucide-react';

export type ProductStatus = 'Published' | 'Draft' | 'Archived';
export type LeadStatus = 'New' | 'Qualified' | 'Demo Scheduled' | 'Closed';
export type ProductAssetType = 'thumbnail' | 'image' | 'model' | 'document' | 'qr_png' | 'qr_svg';

export interface ProductAsset {
  id: string;
  product_id: string;
  asset_type: ProductAssetType;
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

export interface ProductQr {
  id: string;
  product_id: string;
  product_slug: string;
  target_url: string;
  png_url: string;
  svg_url: string;
  generated_at?: string;
  updated_at?: string;
}

export interface ProductMetrics {
  total_scans: number;
  product_views: number;
  ar_launch_count: number;
  qr_downloads: number;
  session_duration_events?: number;
}

export interface Product {
  id: string;
  company_id?: string;
  name: string;
  category: string;
  description?: string | null;
  status: ProductStatus;
  views: number;
  leads: number;
  updated: string;
  image: string;
  specs: Record<string, string>;
  image_url?: string | null;
  model_url?: string | null;
  document_url?: string | null;
  video_url?: string | null;
  slug?: string | null;
  public_url?: string | null;
  thumbnail_asset_id?: string | null;
  model_asset_id?: string | null;
  qr_code_id?: string | null;
  is_public?: boolean;
  created_at?: string;
  updated_at?: string;
  assets?: ProductAsset[];
  qr?: ProductQr | null;
  qr_generated_at?: string | null;
  qr_png_url?: string | null;
  qr_svg_url?: string | null;
  total_scans?: number;
  product_views?: number;
  ar_launch_count?: number;
  qr_downloads?: number;
}

export interface Lead {
  id: string;
  name: string;
  company: string;
  product: string;
  status: LeadStatus;
  score: number;
  source: string;
  lastSeen: string;
}

export interface Kpi {
  label: string;
  value: string;
  change: string;
  icon: LucideIcon;
  tone: string;
}

export interface Activity {
  title: string;
  detail: string;
  time: string;
}
