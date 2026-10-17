import { z } from 'zod';

export const Vector3Schema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number()
});
export type Vector3 = z.infer<typeof Vector3Schema>;

export const CameraConfigSchema = z.object({
  fov: z.number().min(10).max(120).default(45),
  position: z.tuple([z.number(), z.number(), z.number()]).default([0, 1.5, 3]),
  target: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
  minPolarAngle: z.number().default(0),
  maxPolarAngle: z.number().default(Math.PI),
  minDistance: z.number().default(0.5),
  maxDistance: z.number().default(20)
});
export type CameraConfig = z.infer<typeof CameraConfigSchema>;

export const EnvironmentConfigSchema = z.object({
  preset: z.enum(['studio', 'neutral', 'industrial', 'outdoor']).default('studio'),
  exposure: z.number().min(0.1).max(5).default(1.0),
  contactShadow: z.boolean().default(true),
  reflection: z.number().min(0).max(1).default(0.2),
  ambientIntensity: z.number().default(0.5),
  keyLightIntensity: z.number().default(1.2),
  fillLightIntensity: z.number().default(0.6)
});
export type EnvironmentConfig = z.infer<typeof EnvironmentConfigSchema>;

export const HotspotPinSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  position: Vector3Schema,
  surfaceNormal: Vector3Schema.optional().nullable(),
  badgeNumber: z.number().int().positive().optional().nullable(),
  metricUnits: z.record(z.string()).default({}),
  ctaText: z.string().default('Request Quote'),
  ctaAction: z.enum(['quote_request', 'inspect_component', 'trigger_animation', 'open_link']).default('quote_request'),
  ctaTarget: z.string().optional().nullable()
});
export type HotspotPin = z.infer<typeof HotspotPinSchema>;

export const AnimationTimelineSchema = z.object({
  activeClip: z.string().optional().nullable(),
  playbackSpeed: z.number().min(0.1).max(5.0).default(1.0),
  loop: z.boolean().default(true),
  timelinePosition: z.number().min(0).max(1).default(0.0),
  explodedViewFactor: z.number().min(0).max(1).default(0.0),
  partOffsets: z.array(z.object({
    partId: z.string(),
    partName: z.string(),
    offsetVector: Vector3Schema
  })).default([])
});
export type AnimationTimeline = z.infer<typeof AnimationTimelineSchema>;

export const BlueprintOverlaySchema = z.object({
  enabled: z.boolean().default(false),
  dimensions: z.object({
    length: z.number(),
    width: z.number(),
    height: z.number(),
    unit: z.enum(['mm', 'cm', 'm', 'in', 'ft']).default('mm')
  }),
  callouts: z.array(z.object({
    id: z.string(),
    label: z.string(),
    anchor: Vector3Schema,
    leaderEndpoint: Vector3Schema
  })).default([])
});
export type BlueprintOverlay = z.infer<typeof BlueprintOverlaySchema>;

export const ArLaunchTierSchema = z.enum([
  'webxr',
  'scene_viewer',
  'quick_look',
  'orbit_qr_fallback'
]);
export type ArLaunchTier = z.infer<typeof ArLaunchTierSchema>;

export const ArConfigSchema = z.object({
  scale: z.number().positive().default(1.0),
  placement: z.enum(['floor', 'wall', 'tabletop']).default('floor'),
  allowSnapshot: z.boolean().default(true),
  ctaText: z.string().default('Request Quote'),
  usdzStorageKey: z.string().optional().nullable(),
  preferredTier: ArLaunchTierSchema.default('webxr')
});
export type ArConfig = z.infer<typeof ArConfigSchema>;

export const ExperienceSceneContractSchema = z.object({
  contractVersion: z.literal('1.0').default('1.0'),
  experienceId: z.string().uuid(),
  organizationId: z.string().uuid(),
  name: z.string().min(1),
  slug: z.string().min(2),
  description: z.string().optional().nullable(),
  status: z.enum(['Draft', 'In Review', 'Published', 'Archived']).default('Draft'),
  vaultAssetId: z.string().uuid().optional().nullable(),
  pinnedVersionNumber: z.number().int().positive().default(1),
  modelUrl: z.string().optional().nullable(),
  camera: CameraConfigSchema,
  environment: EnvironmentConfigSchema,
  hotspots: z.array(HotspotPinSchema).default([]),
  animation: AnimationTimelineSchema,
  blueprint: BlueprintOverlaySchema,
  ar: ArConfigSchema,
  publishedSnapshot: z.record(z.unknown()).optional().nullable(),
  publishedAt: z.string().datetime().optional().nullable()
});
export type ExperienceSceneContract = z.infer<typeof ExperienceSceneContractSchema>;
