import { z } from 'zod';

export const AssetMediaTypeSchema = z.enum([
  'model/gltf-binary', // .glb
  'model/gltf+json',   // .gltf
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/pdf',
  'video/mp4'
]);
export type AssetMediaType = z.infer<typeof AssetMediaTypeSchema>;

export const AssetAccessPolicySchema = z.enum([
  'INTERNAL',            // Private to asset author
  'ORGANIZATION',        // Accessible to all org members
  'PUBLIC_APPROVED'      // Approved for inclusion in public published snapshots
]);
export type AssetAccessPolicy = z.infer<typeof AssetAccessPolicySchema>;

export const AssetTechnicalMetadataSchema = z.object({
  fileSizeBytes: z.number().int().nonnegative(),
  dimensions: z.object({
    widthMeters: z.number().nonnegative().optional(),
    heightMeters: z.number().nonnegative().optional(),
    depthMeters: z.number().nonnegative().optional(),
  }).optional(),
  triangleCount: z.number().int().nonnegative().optional(),
  animationClips: z.array(z.string()).default([]),
  dracoCompressed: z.boolean().default(false),
  ktx2Textures: z.boolean().default(false),
  mimeType: z.string(),
  checksumSha256: z.string().optional(),
});
export type AssetTechnicalMetadata = z.infer<typeof AssetTechnicalMetadataSchema>;

export const AssetReferenceSchema = z.object({
  contractVersion: z.literal('1.0').default('1.0'),
  assetId: z.string().uuid(),
  versionId: z.string(),
  versionNumber: z.number().int().positive(),
  organizationId: z.string().uuid(),
  name: z.string().min(1),
  mediaType: z.string(),
  accessPolicy: AssetAccessPolicySchema,
  metadata: AssetTechnicalMetadataSchema,
  deliveryUrl: z.string().url(),
  thumbnailUrl: z.string().url().optional().nullable(),
  createdAt: z.string().datetime(),
  isCurrentVersion: z.boolean().default(true),
});
export type AssetReference = z.infer<typeof AssetReferenceSchema>;
