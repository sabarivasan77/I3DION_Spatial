import { z } from 'zod';
import type { BlockDef } from '../types.ts';

export const sectionBlock: BlockDef = {
  type: 'section',
  title: 'Section Container',
  description: 'Full-width container with responsive padding, background style, and container bounds',
  category: 'layout',
  icon: 'layout',
  isContainer: true,
  propsSchema: z.object({
    paddingY: z.number().default(48),
    paddingX: z.number().default(24),
    maxWidth: z.enum(['sm', 'md', 'lg', 'xl', 'full']).default('xl'),
    backgroundColor: z.string().default('transparent'),
    borderBottom: z.boolean().default(false)
  }),
  defaultProps: {
    paddingY: 48,
    paddingX: 24,
    maxWidth: 'xl',
    backgroundColor: 'transparent',
    borderBottom: false
  }
};

export const stackBlock: BlockDef = {
  type: 'stack',
  title: 'Stack (Flexbox)',
  description: 'Flexible 1D linear container supporting vertical and horizontal auto-layout',
  category: 'layout',
  icon: 'layers',
  isContainer: true,
  propsSchema: z.object({
    direction: z.enum(['vertical', 'horizontal']).default('vertical'),
    gap: z.number().default(16),
    align: z.enum(['start', 'center', 'end', 'stretch']).default('stretch'),
    justify: z.enum(['start', 'center', 'end', 'between', 'around']).default('start'),
    wrap: z.boolean().default(false)
  }),
  defaultProps: {
    direction: 'vertical',
    gap: 16,
    align: 'stretch',
    justify: 'start',
    wrap: false
  }
};

export const gridBlock: BlockDef = {
  type: 'grid',
  title: 'Responsive Grid',
  description: 'Multi-column grid layout adapting cleanly across desktop, tablet, and mobile',
  category: 'layout',
  icon: 'grid',
  isContainer: true,
  propsSchema: z.object({
    columnsDesktop: z.number().int().min(1).max(12).default(3),
    columnsTablet: z.number().int().min(1).max(6).default(2),
    columnsMobile: z.number().int().min(1).max(2).default(1),
    gap: z.number().default(20)
  }),
  defaultProps: {
    columnsDesktop: 3,
    columnsTablet: 2,
    columnsMobile: 1,
    gap: 20
  }
};

export const freeCanvasBlock: BlockDef = {
  type: 'free_canvas',
  title: 'Free Canvas',
  description: 'Open spatial canvas supporting freeform 2D positioning and snapping',
  category: 'layout',
  icon: 'move',
  isContainer: true,
  propsSchema: z.object({
    snapGrid: z.number().default(8),
    minHeight: z.number().default(500),
    showGridGuides: z.boolean().default(true)
  }),
  defaultProps: {
    snapGrid: 8,
    minHeight: 500,
    showGridGuides: true
  }
};

export const repeaterBlock: BlockDef = {
  type: 'repeater',
  title: 'Data Repeater',
  description: 'Dynamic container repeating template widgets for every row in a Vault dataset',
  category: 'layout',
  icon: 'repeat',
  isContainer: true,
  capacityLimit: 1, // Only holds 1 item template
  propsSchema: z.object({
    dataSource: z.string().min(1),
    pageSize: z.number().int().positive().default(12),
    emptyMessage: z.string().default('No records found matching criteria.')
  }),
  defaultProps: {
    dataSource: 'products',
    pageSize: 12,
    emptyMessage: 'No records found matching criteria.'
  }
};

export const tabsBlock: BlockDef = {
  type: 'tabs',
  title: 'Tabs Container',
  description: 'Multi-tab container allowing users to switch views interactively',
  category: 'layout',
  icon: 'folder',
  isContainer: true,
  propsSchema: z.object({
    tabs: z.array(z.object({
      id: z.string(),
      label: z.string(),
      icon: z.string().optional()
    })).default([
      { id: 'tab-1', label: 'Overview' },
      { id: 'tab-2', label: 'Specifications' }
    ]),
    defaultActiveTab: z.string().default('tab-1')
  }),
  defaultProps: {
    tabs: [
      { id: 'tab-1', label: 'Overview' },
      { id: 'tab-2', label: 'Specifications' }
    ],
    defaultActiveTab: 'tab-1'
  }
};

export const dividerBlock: BlockDef = {
  type: 'divider',
  title: 'Divider / Spacer',
  description: 'Visual horizontal line or spacing block between catalog elements',
  category: 'layout',
  icon: 'minus',
  isContainer: false,
  propsSchema: z.object({
    spacingY: z.number().default(24),
    showLine: z.boolean().default(true),
    lineColor: z.string().default('#E2E8F0')
  }),
  defaultProps: {
    spacingY: 24,
    showLine: true,
    lineColor: '#E2E8F0'
  }
};

export const layoutBlocks = [
  sectionBlock,
  stackBlock,
  gridBlock,
  freeCanvasBlock,
  repeaterBlock,
  tabsBlock,
  dividerBlock
];
