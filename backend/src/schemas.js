import { z } from 'zod';

export const idParam = z.object({ params: z.object({ id: z.string().uuid() }) });

export const signupSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
    companyName: z.string().min(2).default('I3DION Workspace'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({ email: z.string().email() }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(24),
    password: z.string().min(8),
  }),
});

export const companySchema = z.object({
  body: z.object({
    name: z.string().min(2),
    website: z.string().url().optional().or(z.literal('')),
    logoUrl: z.string().url().optional().or(z.literal('')),
    primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#2563EB'),
    profile: z.string().optional(),
  }),
});

export const profileSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    phone: z.string().min(7).optional().or(z.literal('')),
    avatarUrl: z.string().url().optional().or(z.literal('')),
    currentPassword: z.string().min(8).optional(),
    newPassword: z.string().min(8).optional(),
  }),
});

export const preferencesSchema = z.object({
  body: z.object({
    onboardingEnabled: z.boolean().optional(),
    defaultBrandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    defaultCatalogVisibility: z.enum(['private', 'public']).optional(),
    notificationPreferences: z.record(z.unknown()).optional(),
    appearancePreferences: z.record(z.unknown()).optional(),
  }),
});

export const supportTicketSchema = z.object({
  body: z.object({
    category: z.enum(['FAQ', 'Contact Support', 'Report Issue', 'Feature Request', 'Documentation']),
    subject: z.string().min(3),
    message: z.string().min(10),
  }),
});

export const productSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    category: z.string().min(2),
    description: z.string().optional(),
    status: z.enum(['Draft', 'Published', 'Archived']).default('Draft'),
    isPublic: z.boolean().default(false),
    specs: z.record(z.string()).default({}),
    imageUrl: z.string().url().optional().or(z.literal('')),
    modelUrl: z.string().url().optional().or(z.literal('')),
    usdzUrl: z.string().url().optional().or(z.literal('')),
    documentUrl: z.string().url().optional().or(z.literal('')),
    videoUrl: z.string().url().optional().or(z.literal('')),
    dimensions: z.object({
      width: z.number().optional(),
      height: z.number().optional(),
      depth: z.number().optional(),
      scale: z.number().optional(),
      units: z.string().optional()
    }).optional(),
  }),
});

export const catalogSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    description: z.string().optional(),
    status: z.enum(['Draft', 'Published', 'Archived']).default('Draft'),
    isPublic: z.boolean().default(false),
    productIds: z.array(z.string().uuid()).default([]),
  }),
});

export const leadSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional(),
    company: z.string().optional(),
    productId: z.string().uuid().optional(),
    catalogId: z.string().uuid().optional(),
    status: z.enum(['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Closed', 'Lost']).default('New'),
    source: z.string().default('Catalog'),
    score: z.number().int().min(0).max(100).default(0),
    notes: z.string().optional(),
  }),
});

export const eventSchema = z.object({
  body: z.object({
    eventType: z.enum([
      'page_view',
      'product_view',
      'catalog_view',
      'qr_scan',
      'qr_preview',
      'qr_download',
      'ar_launch',
      'ar_session',
      'session_duration',
      'lead_created',
      'hotspot_view',
      'animation_play',
      'download',
      'model_download',
    ]),
    productId: z.string().uuid().optional(),
    catalogId: z.string().uuid().optional(),
    leadId: z.string().uuid().optional(),
    metadata: z.record(z.unknown()).default({}),
  }),
});
