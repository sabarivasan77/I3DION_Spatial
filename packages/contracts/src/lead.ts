import { z } from 'zod';

export const LeadIntentTypeSchema = z.enum([
  'quote',
  'demo',
  'technical_spec',
  'contact_sales'
]);
export type LeadIntentType = z.infer<typeof LeadIntentTypeSchema>;

export const LeadStatusSchema = z.enum([
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'OPPORTUNITY',
  'WON',
  'LOST',
  'SPAM'
]);
export type LeadStatus = z.infer<typeof LeadStatusSchema>;

export const LeadContactSchema = z.object({
  name: z.string().min(1, 'Contact name is required'),
  email: z.string().email('Valid work email is required'),
  phone: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  jobTitle: z.string().optional().nullable(),
  country: z.string().optional().default('India'),
});
export type LeadContact = z.infer<typeof LeadContactSchema>;

export const LeadConsentMetadataSchema = z.object({
  consentGiven: z.boolean(),
  consentText: z.string().optional(),
  consentTimestamp: z.string().datetime(),
  anonymizedIp: z.string().optional(),
});
export type LeadConsentMetadata = z.infer<typeof LeadConsentMetadataSchema>;

export const LeadContractSchema = z.object({
  contractVersion: z.literal('1.0').default('1.0'),
  leadId: z.string().uuid(),
  organizationId: z.string().uuid(),
  sourceExperienceRef: z.object({
    snapshotId: z.string().uuid().optional(),
    slug: z.string(),
    contentType: z.enum(['catalog', 'experience', 'product_showcase']),
    qrAttributed: z.boolean().default(false),
  }),
  productId: z.string().uuid().optional().nullable(),
  productName: z.string().min(1),
  contact: LeadContactSchema,
  intent: LeadIntentTypeSchema.default('quote'),
  message: z.string().optional().nullable(),
  consent: LeadConsentMetadataSchema,
  status: LeadStatusSchema.default('NEW'),
  assignedToUserId: z.string().uuid().optional().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type LeadContract = z.infer<typeof LeadContractSchema>;
