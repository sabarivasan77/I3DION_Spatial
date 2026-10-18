import { z } from 'zod';

export const LensMetricDefinitionSchema = z.object({
  key: z.string(),
  name: z.string(),
  definition: z.string(),
  source: z.string(),
  nonNegotiableRule: z.string()
});
export type LensMetricDefinition = z.infer<typeof LensMetricDefinitionSchema>;

export const LensOverviewKpisSchema = z.object({
  totalVisitors: z.number().int().nonnegative(),
  totalSessions: z.number().int().nonnegative(),
  qrAttributedVisits: z.number().int().nonnegative(),
  interactiveVisitors: z.number().int().nonnegative(),
  interactionRate: z.number().min(0).max(100),
  arLaunchAttempts: z.number().int().nonnegative(),
  arSessionSuccess: z.number().int().nonnegative(),
  arAttemptRate: z.number().min(0).max(100),
  hotspotClicks: z.number().int().nonnegative(),
  totalLeads: z.number().int().nonnegative(),
  qrLeads: z.number().int().nonnegative(),
  activeLeads: z.number().int().nonnegative(),
  leadConversionRate: z.number().min(0).max(100)
});
export type LensOverviewKpis = z.infer<typeof LensOverviewKpisSchema>;

export const LensFunnelStageSchema = z.object({
  stage: z.string(),
  count: z.number().int().nonnegative(),
  percentage: z.number().min(0).max(100),
  dropoffPercentage: z.number().min(0).max(100).optional()
});
export type LensFunnelStage = z.infer<typeof LensFunnelStageSchema>;

export const LensDealerPerformanceSchema = z.object({
  dealerId: z.string(),
  dealerName: z.string(),
  totalVisits: z.number().int().nonnegative(),
  uniqueVisitors: z.number().int().nonnegative(),
  inquiries: z.number().int().nonnegative(),
  totalQuoteValue: z.number().nonnegative(),
  conversionRate: z.number().min(0).max(100)
});
export type LensDealerPerformance = z.infer<typeof LensDealerPerformanceSchema>;

export const LensHotspotHeatmapSchema = z.object({
  label: z.string(),
  metricUnit: z.string().optional(),
  clicks: z.number().int().nonnegative(),
  uniqueVisitors: z.number().int().nonnegative(),
  recommendation: z.string().optional()
});
export type LensHotspotHeatmap = z.infer<typeof LensHotspotHeatmapSchema>;

export const ApprovalRequestSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  resourceType: z.enum(['asset', 'catalog', 'schema', 'flow', 'quote']),
  resourceId: z.string().uuid(),
  versionId: z.string().uuid().optional().nullable(),
  requestedBy: z.string().uuid(),
  reviewedBy: z.string().uuid().optional().nullable(),
  approvalStatus: z.enum(['PENDING_REVIEW', 'APPROVED', 'REJECTED']),
  reviewNotes: z.string().optional().nullable(),
  submittedAt: z.string(),
  reviewedAt: z.string().optional().nullable()
});
export type ApprovalRequest = z.infer<typeof ApprovalRequestSchema>;

export const PresenterSessionSchema = z.object({
  id: z.string().uuid(),
  sessionCode: z.string().min(4).max(12),
  hostUserId: z.string().uuid(),
  experienceId: z.string().uuid(),
  activeSlide: z.number().int().nonnegative().default(0),
  cameraOrbit: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 5]),
  activeVariant: z.string().optional().nullable(),
  activeHotspot: z.string().optional().nullable(),
  explodedFactor: z.number().min(0).max(1).default(0),
  participantsCount: z.number().int().nonnegative().default(1),
  isActive: z.boolean().default(true),
  createdAt: z.string(),
  updatedAt: z.string()
});
export type PresenterSession = z.infer<typeof PresenterSessionSchema>;

export const CommandPaletteItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string(),
  category: z.enum(['catalogs', 'products', 'assets', 'experiences', 'flows', 'leads', 'analytics', 'actions']),
  icon: z.string(),
  action: z.object({
    type: z.enum(['navigate', 'run_flow', 'copy_link']),
    url: z.string().optional(),
    flowId: z.string().optional()
  })
});
export type CommandPaletteItem = z.infer<typeof CommandPaletteItemSchema>;
