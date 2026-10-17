import { z } from 'zod';

export const CatalogSectionTypeSchema = z.enum([
  'hero',
  'product_grid',
  'spec_table',
  'viewer_3d',
  'lead_capture'
]);
export type CatalogSectionType = z.infer<typeof CatalogSectionTypeSchema>;

export const CatalogLayoutModeSchema = z.enum([
  'grid_dense',
  'grid_spacious',
  'carousel',
  'list',
  'split_3d'
]);
export type CatalogLayoutMode = z.infer<typeof CatalogLayoutModeSchema>;

export const CatalogBrandingSchema = z.object({
  companyName: z.string().min(1),
  logoUrl: z.string().optional().nullable(),
  primaryColor: z.string().default('#2563EB'),
  accentColor: z.string().default('#0F172A'),
  fontFamily: z.string().default('Inter'),
  heroBannerUrl: z.string().optional().nullable(),
  contactEmail: z.string().email().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  websiteUrl: z.string().url().optional().nullable()
});
export type CatalogBranding = z.infer<typeof CatalogBrandingSchema>;

export const CatalogPinnedProductSchema = z.object({
  productId: z.string().uuid(),
  productName: z.string(),
  productSlug: z.string(),
  category: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  pinnedAssetId: z.string().uuid().optional().nullable(),
  pinnedVersionNumber: z.number().int().positive().default(1),
  pinnedStorageKey: z.string().optional().nullable(),
  pinnedPublicUrl: z.string().optional().nullable(),
  specs: z.record(z.unknown()).default({}),
  dimensions: z.record(z.unknown()).default({}),
  sortOrder: z.number().int().default(0),
  customPriceDisplay: z.string().optional().nullable()
});
export type CatalogPinnedProduct = z.infer<typeof CatalogPinnedProductSchema>;

export const CatalogSectionSchema = z.object({
  id: z.string(),
  type: CatalogSectionTypeSchema,
  title: z.string(),
  subtitle: z.string().optional().nullable(),
  layoutMode: CatalogLayoutModeSchema.default('grid_spacious'),
  visibleFields: z.object({
    showSpecs: z.boolean().default(true),
    showDimensions: z.boolean().default(true),
    show3DViewer: z.boolean().default(true),
    showPricing: z.boolean().default(false),
    showQuoteCta: z.boolean().default(true)
  }).default({
    showSpecs: true,
    showDimensions: true,
    show3DViewer: true,
    showPricing: false,
    showQuoteCta: true
  }),
  sortOrder: z.number().int().default(0),
  settings: z.record(z.unknown()).default({})
});
export type CatalogSection = z.infer<typeof CatalogSectionSchema>;

export const CatalogCompositionContractSchema = z.object({
  contractVersion: z.literal('1.0').default('1.0'),
  catalogId: z.string().uuid(),
  organizationId: z.string().uuid(),
  title: z.string().min(1),
  slug: z.string().min(2),
  description: z.string().optional().nullable(),
  status: z.enum(['Draft', 'In Review', 'Published', 'Archived']).default('Draft'),
  branding: CatalogBrandingSchema,
  sections: z.array(CatalogSectionSchema).default([]),
  pinnedProducts: z.array(CatalogPinnedProductSchema).default([]),
  publishedSnapshot: z.record(z.unknown()).optional().nullable(),
  publishedAt: z.string().datetime().optional().nullable(),
  qrCodeUrl: z.string().optional().nullable(),
  pdfUrl: z.string().optional().nullable()
});
export type CatalogCompositionContract = z.infer<typeof CatalogCompositionContractSchema>;
