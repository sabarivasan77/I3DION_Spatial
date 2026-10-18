import { z } from 'zod';

export const VaultColumnTypeSchema = z.enum([
  'text',
  'number',
  'currency',
  'unit-number',
  'date',
  'boolean',
  'choice',
  'multi-choice',
  'lookup',
  'many-to-many',
  'rollup',
  'formula',
  'URL',
  'file',
  '3D model ref',
  'image gallery'
]);
export type VaultColumnType = z.infer<typeof VaultColumnTypeSchema>;

export const VaultFieldSchema = z.object({
  id: z.string().uuid().optional(),
  schema_id: z.string().uuid().optional(),
  name: z.string().min(1),
  internal_name: z.string().min(1),
  field_type: VaultColumnTypeSchema,
  description: z.string().optional().default(''),
  required: z.boolean().default(false),
  unique_constraint: z.boolean().default(false),
  default_value: z.string().optional().nullable(),
  formula_definition: z.string().optional().nullable(),
  rollup_definition: z.record(z.any()).optional().nullable(),
  lookup_collection_id: z.string().uuid().optional().nullable(),
  lookup_field_name: z.string().optional().nullable(),
  audience_restricted: z.boolean().default(false),
  allowed_roles: z.array(z.string()).default(['Admin', 'Manager', 'Sales']),
  visibility: z.enum(['PUBLIC', 'INTERNAL', 'ADMIN_ONLY', 'SYSTEM_ONLY']).default('INTERNAL'),
  editable: z.boolean().default(true)
});
export type VaultField = z.infer<typeof VaultFieldSchema>;

export const VaultRelationshipSchema = z.object({
  id: z.string().uuid().optional(),
  organization_id: z.string().uuid(),
  name: z.string().min(1),
  source_collection_id: z.string().uuid(),
  target_collection_id: z.string().uuid(),
  relationship_type: z.enum(['lookup', 'one_to_many', 'many_to_many']).default('lookup'),
  on_delete: z.enum(['restrict', 'cascade', 'set_null']).default('restrict'),
  created_at: z.string().optional()
});
export type VaultRelationship = z.infer<typeof VaultRelationshipSchema>;

export const VaultFolderSchema = z.object({
  id: z.string().uuid().optional(),
  organization_id: z.string().uuid(),
  parent_id: z.string().uuid().optional().nullable(),
  name: z.string().min(1),
  path: z.string().min(1)
});
export type VaultFolder = z.infer<typeof VaultFolderSchema>;

export const AssetUsageSchema = z.object({
  id: z.string().uuid().optional(),
  organization_id: z.string().uuid(),
  asset_id: z.string().uuid(),
  version_id: z.string().uuid().optional().nullable(),
  consumer_type: z.enum(['catalog', 'scene', 'page', 'flow']),
  consumer_id: z.string().min(1),
  consumer_name: z.string().optional().nullable(),
  context: z.record(z.any()).default({})
});
export type AssetUsage = z.infer<typeof AssetUsageSchema>;
