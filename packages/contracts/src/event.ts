import { z } from 'zod';

export const EventSourceProductSchema = z.enum([
  'hub',
  'vault',
  'studio',
  'engine',
  'lens'
]);
export type EventSourceProduct = z.infer<typeof EventSourceProductSchema>;

export const StandardEventTypeSchema = z.enum([
  'page_view',
  'product_view',
  'catalog_view',
  'qr_landing',              // QR-attributed visit, NOT claimed camera scan
  '3d_interaction',          // Orbit, zoom, pan
  'hotspot_click',
  'animation_play',
  'blueprint_toggle',
  'ar_launch_attempt',
  'ar_session_success',
  'ar_unsupported_fallback',
  'cta_quote_click',
  'lead_form_submitted',
  'dwell_time_ping'          // Dwell time pulse in seconds
]);
export type StandardEventType = z.infer<typeof StandardEventTypeSchema>;

export const TelemetryDeviceContextSchema = z.object({
  deviceType: z.enum(['mobile', 'tablet', 'desktop']),
  os: z.enum(['ios', 'android', 'windows', 'macos', 'linux', 'other']),
  browser: z.string().optional(),
  arSupported: z.boolean().default(false),
  arMode: z.enum(['webxr', 'quicklook', 'scene_viewer', 'none']).default('none'),
  viewportWidth: z.number().int().optional(),
  viewportHeight: z.number().int().optional(),
});
export type TelemetryDeviceContext = z.infer<typeof TelemetryDeviceContextSchema>;

export const EventContractSchema = z.object({
  contractVersion: z.literal('1.0').default('1.0'),
  eventId: z.string().uuid(),
  type: StandardEventTypeSchema,
  timestamp: z.string().datetime(),
  organizationId: z.string().uuid(),
  sourceProduct: EventSourceProductSchema,
  publishedRef: z.object({
    snapshotId: z.string().uuid(),
    contentType: z.enum(['catalog', 'experience', 'product_showcase']),
    contentId: z.string().uuid(),
    slug: z.string(),
  }).optional().nullable(),
  sessionId: z.string().min(8), // Anonymous session UUID
  visitorId: z.string().min(8), // Pseudonymous visitor identifier
  properties: z.record(z.unknown()).default({}),
  device: TelemetryDeviceContextSchema.optional(),
  dwellDurationSeconds: z.number().int().nonnegative().optional(),
  dedupeKey: z.string(),
});
export type EventContract = z.infer<typeof EventContractSchema>;
