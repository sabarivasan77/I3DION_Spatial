import { z } from 'zod';

export const PublishingContentTypeSchema = z.enum([
  'catalog',
  'experience',
  'product_showcase'
]);
export type PublishingContentType = z.infer<typeof PublishingContentTypeSchema>;

export const PublishingVisibilitySchema = z.enum([
  'PUBLIC',
  'RESTRICTED',
  'PASSCODE'
]);
export type PublishingVisibility = z.infer<typeof PublishingVisibilitySchema>;

export const PublishingStatusSchema = z.enum([
  'DRAFT',
  'PENDING_APPROVAL',
  'ACTIVE',
  'UNPUBLISHED',
  'EXPIRED'
]);
export type PublishingStatus = z.infer<typeof PublishingStatusSchema>;

export const PinnedAssetVersionSchema = z.object({
  assetId: z.string().uuid(),
  versionId: z.string(),
  mediaType: z.string(),
  deliveryUrl: z.string().url(),
});
export type PinnedAssetVersion = z.infer<typeof PinnedAssetVersionSchema>;

export const PublishingContractSchema = z.object({
  contractVersion: z.literal('1.0').default('1.0'),
  snapshotId: z.string().uuid(),
  organizationId: z.string().uuid(),
  contentType: PublishingContentTypeSchema,
  contentId: z.string().uuid(),
  title: z.string().min(1),
  publishedSlug: z.string().min(2),
  publishedVersionNumber: z.number().int().positive(),
  visibility: PublishingVisibilitySchema,
  status: PublishingStatusSchema,
  publisher: z.object({
    userId: z.string().uuid(),
    name: z.string(),
    email: z.string().email(),
  }),
  publishedAt: z.string().datetime(),
  expiresAt: z.string().datetime().optional().nullable(),
  publicUrl: z.string().url(),
  qrCodeUrl: z.string().url().optional().nullable(),
  pinnedAssets: z.array(PinnedAssetVersionSchema).default([]),
  immutableSnapshotPayload: z.record(z.unknown()),
  rollbackVersionId: z.string().optional().nullable(),
});
export type PublishingContract = z.infer<typeof PublishingContractSchema>;
