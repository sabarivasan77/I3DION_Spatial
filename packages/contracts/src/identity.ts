import { z } from 'zod';

export const UserRoleSchema = z.enum([
  'Super Admin',
  'Company Admin',
  'Admin',
  'Manager',
  'Sales User',
  'Sales Executive',
  'Support Executive',
  'Marketing',
  'Viewer',
  'Public Visitor'
]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const PermissionActionSchema = z.enum([
  'organization.read',
  'organization.update',
  'organization.members.manage',
  'billing.read',
  'billing.manage',
  'vault.asset.create',
  'vault.asset.read',
  'vault.asset.update',
  'vault.asset.delete',
  'vault.asset.publish',
  'studio.catalog.create',
  'studio.catalog.read',
  'studio.catalog.update',
  'studio.catalog.delete',
  'studio.catalog.publish',
  'engine.experience.create',
  'engine.experience.read',
  'engine.experience.update',
  'engine.experience.publish',
  'hub.public.view',
  'hub.lead.submit',
  'lens.analytics.read',
  'lens.dashboard.manage',
  'flow.rule.manage'
]);
export type PermissionAction = z.infer<typeof PermissionActionSchema>;

export const IdentityUserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  role: UserRoleSchema,
  organizationId: z.string().uuid(),
  createdAt: z.string().datetime().optional(),
  lastLoginAt: z.string().datetime().optional().nullable(),
});
export type IdentityUser = z.infer<typeof IdentityUserSchema>;

export const IdentityOrganizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  slug: z.string().optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
  createdAt: z.string().datetime().optional(),
});
export type IdentityOrganization = z.infer<typeof IdentityOrganizationSchema>;

export const PermissionDecisionSchema = z.object({
  allowed: z.boolean(),
  userId: z.string().uuid(),
  organizationId: z.string().uuid(),
  role: UserRoleSchema,
  action: z.string(),
  resourceId: z.string().optional().nullable(),
  denialReason: z.string().optional().nullable(),
});
export type PermissionDecision = z.infer<typeof PermissionDecisionSchema>;
