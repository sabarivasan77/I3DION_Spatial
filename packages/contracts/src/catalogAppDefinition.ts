import { z } from 'zod';

/**
 * Node layout configuration (Stack flex, Grid, Free Canvas with x/y, Tabs, Repeater)
 */
export const AppNodeLayoutSchema = z.object({
  mode: z.enum(['stack', 'grid', 'free', 'tabs', 'repeater']).default('stack'),
  direction: z.enum(['vertical', 'horizontal']).default('vertical'),
  gap: z.number().nonnegative().default(16),
  columns: z.number().int().positive().default(3),
  align: z.enum(['start', 'center', 'end', 'stretch']).default('stretch'),
  justify: z.enum(['start', 'center', 'end', 'between', 'around']).default('start'),
  position: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number().optional(),
    height: z.number().optional(),
    zIndex: z.number().int().default(1)
  }).optional()
});
export type AppNodeLayout = z.infer<typeof AppNodeLayoutSchema>;

/**
 * Recursive App Definition Node Schema (Canvas widget instance)
 */
export const BaseAppNodeSchema = z.object({
  id: z.string().optional().default(() => `node-${Math.random().toString(36).slice(2, 8)}`),
  type: z.string().min(1),
  title: z.string().optional(),
  props: z.record(z.unknown()).default({}),
  bind: z.string().optional(),
  layout: AppNodeLayoutSchema.optional(),
  on: z.record(z.any()).optional(),
  visibility: z.record(z.any()).optional(),
  conditional: z.object({
    visibleExpr: z.string().optional()
  }).optional()
});

export type AppNode = z.infer<typeof BaseAppNodeSchema> & {
  children?: AppNode[];
};

export const AppNodeSchema: z.ZodType<AppNode> = BaseAppNodeSchema.extend({
  children: z.lazy(() => z.array(AppNodeSchema)).optional().default([])
});

/**
 * Catalog Page Schema
 */
export const AppPageSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  route: z.string().optional(),
  slug: z.string().optional(),
  icon: z.string().optional(),
  layout: AppNodeLayoutSchema.default({
    mode: 'stack',
    direction: 'vertical',
    gap: 24,
    columns: 1,
    align: 'stretch',
    justify: 'start'
  }),
  children: z.array(AppNodeSchema).default([])
});
export type AppPage = z.infer<typeof AppPageSchema>;

/**
 * Data Source definition connected to Vault collections / tables
 */
export const AppDataSourceSchema = z.object({
  vault: z.string().min(1),
  filter: z.string().optional(),
  sort: z.array(z.string()).default([]),
  pageSize: z.number().int().positive().default(24)
});
export type AppDataSource = z.infer<typeof AppDataSourceSchema>;

/**
 * Reactive Template / Context Variable
 */
export const AppVariableSchema = z.object({
  type: z.enum(['text', 'number', 'boolean', 'list', 'object']).default('text'),
  default: z.unknown().optional()
});
export type AppVariable = z.infer<typeof AppVariableSchema>;

/**
 * Brand & Visual Design Tokens
 */
export const AppThemeSchema = z.object({
  preset: z.string().default('industrial-light'),
  primary: z.string().default('#2563EB'),
  secondary: z.string().default('#0F172A'),
  font: z.string().default('Inter'),
  radius: z.number().nonnegative().default(8),
  mode: z.enum(['light', 'dark']).default('light')
});
export type AppTheme = z.infer<typeof AppThemeSchema>;

/**
 * Catalog Metadata
 */
export const AppMetaSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional().default(''),
  languages: z.array(z.string()).default(['en']),
  defaultLanguage: z.string().default('en'),
  author: z.string().optional(),
  version: z.string().default('1.0.0')
});
export type AppMeta = z.infer<typeof AppMetaSchema>;

/**
 * Canonical App Definition Schema: schema: i3dion.catalog/1
 * The single source of truth for Omni Studio authoring, YAML round-trip,
 * Player runtime rendering, and Print PDF export.
 */
export const AppDefinitionContractSchema = z.object({
  schema: z.literal('i3dion.catalog/1'),
  meta: AppMetaSchema,
  theme: AppThemeSchema.default({
    preset: 'industrial-light',
    primary: '#2563EB',
    secondary: '#0F172A',
    font: 'Inter',
    radius: 8,
    mode: 'light'
  }),
  data: z.object({
    sources: z.record(AppDataSourceSchema).default({})
  }).default({ sources: {} }),
  variables: z.record(AppVariableSchema).default({}),
  pages: z.array(AppPageSchema).min(1),
  revision: z.number().int().nonnegative().default(1),
  publishedSnapshot: z.record(z.unknown()).optional().nullable(),
  publishedAt: z.string().datetime().optional().nullable()
});
export const AppDefinitionSchema = AppDefinitionContractSchema;
export type AppDefinitionContract = z.infer<typeof AppDefinitionContractSchema>;

/**
 * Helper to generate a blank canonical App Definition (i3dion.catalog/1)
 */
export function createBlankAppDefinition(name = 'New Catalog Application', slug = 'new-catalog'): AppDefinitionContract {
  return {
    schema: 'i3dion.catalog/1',
    meta: {
      name,
      slug,
      description: 'Interactive Industrial Catalog Application',
      languages: ['en'],
      defaultLanguage: 'en',
      version: '1.0.0'
    },
    theme: {
      preset: 'industrial-light',
      primary: '#2563EB',
      secondary: '#0F172A',
      font: 'Inter',
      radius: 8,
      mode: 'light'
    },
    data: {
      sources: {
        products: {
          vault: 'Products',
          sort: ['name asc'],
          pageSize: 24
        }
      }
    },
    variables: {
      searchQuery: { type: 'text', default: '' },
      selectedCategory: { type: 'text', default: 'all' }
    },
    pages: [
      {
        id: 'page-home',
        title: 'Home Showcase',
        layout: {
          mode: 'stack',
          direction: 'vertical',
          gap: 24,
          columns: 1,
          align: 'stretch',
          justify: 'start'
        },
        children: [
          {
            id: 'node-hero-1',
            type: 'hero',
            title: 'Hero Banner',
            props: {
              title: name,
              subtitle: 'Precision Engineering & 3D Interactive Catalog',
              ctaText: 'Browse Catalog',
              ctaTarget: '#products'
            }
          },
          {
            id: 'node-repeater-1',
            type: 'repeater',
            title: 'Product Catalog Grid',
            props: {
              dataSource: 'products',
              pageSize: 12
            },
            layout: {
              mode: 'grid',
              direction: 'vertical',
              columns: 3,
              gap: 20,
              align: 'stretch',
              justify: 'start'
            },
            children: [
              {
                id: 'node-product-card-1',
                type: 'product_card',
                title: 'Product Card Template',
                props: {
                  show3DViewer: true,
                  showPricing: false,
                  showRfqButton: true
                }
              }
            ]
          }
        ]
      }
    ],
    revision: 1
  };
}
