import { z } from 'zod';
import type { BlockDef } from '../types.ts';

export const productCardBlock: BlockDef = {
  type: 'product_card',
  title: 'Product Card',
  description: 'Interactive catalog item card showing thumbnail or 3D preview, title, and action',
  category: 'product',
  icon: 'package',
  isContainer: false,
  propsSchema: z.object({
    productId: z.string().optional().nullable(),
    productSlug: z.string().default(''),
    title: z.string().default('Centrifugal Pump CP-450'),
    category: z.string().default('Pumps'),
    thumbnailUrl: z.string().default(''),
    show3DViewer: z.boolean().default(true),
    showPricing: z.boolean().default(false),
    showRfqButton: z.boolean().default(true),
    rfqButtonText: z.string().default('Request Quote')
  }),
  defaultProps: {
    productId: null,
    productSlug: '',
    title: 'Centrifugal Pump CP-450',
    category: 'Pumps',
    thumbnailUrl: '',
    show3DViewer: true,
    showPricing: false,
    showRfqButton: true,
    rfqButtonText: 'Request Quote'
  }
};

export const productDetailBlock: BlockDef = {
  type: 'product_detail',
  title: 'Product Detail Showcase',
  description: 'Full product overview layout integrating 3D viewer, specs, variants, and RFQ',
  category: 'product',
  icon: 'file-text',
  isContainer: true,
  propsSchema: z.object({
    layoutOrientation: z.enum(['split-viewer-left', 'split-viewer-right', 'stacked']).default('split-viewer-left'),
    allowArLaunch: z.boolean().default(true),
    showDimensions: z.boolean().default(true),
    showCertificationBadges: z.boolean().default(true)
  }),
  defaultProps: {
    layoutOrientation: 'split-viewer-left',
    allowArLaunch: true,
    showDimensions: true,
    showCertificationBadges: true
  }
};

export const variantPickerBlock: BlockDef = {
  type: 'variant_picker',
  title: 'Variant & Configuration Selector',
  description: 'Interactive choice chips or dropdowns to configure engineering options',
  category: 'product',
  icon: 'sliders',
  isContainer: false,
  propsSchema: z.object({
    options: z.array(z.object({
      id: z.string(),
      label: z.string(),
      values: z.array(z.string())
    })).default([
      { id: 'opt-impeller', label: 'Impeller Material', values: ['Bronze', 'Stainless Steel 316', 'Cast Iron'] },
      { id: 'opt-motor', label: 'Motor Power', values: ['15 kW', '22 kW', '30 kW'] }
    ])
  }),
  defaultProps: {
    options: [
      { id: 'opt-impeller', label: 'Impeller Material', values: ['Bronze', 'Stainless Steel 316', 'Cast Iron'] },
      { id: 'opt-motor', label: 'Motor Power', values: ['15 kW', '22 kW', '30 kW'] }
    ]
  }
};

export const specCompareBlock: BlockDef = {
  type: 'spec_compare',
  title: 'Specification Comparison Matrix',
  description: 'Side-by-side comparison table analyzing multiple selected products or variants',
  category: 'product',
  icon: 'columns',
  isContainer: false,
  propsSchema: z.object({
    maxComparedProducts: z.number().int().min(2).max(5).default(3),
    highlightDifferences: z.boolean().default(true)
  }),
  defaultProps: {
    maxComparedProducts: 3,
    highlightDifferences: true
  }
};

export const productBlocks = [
  productCardBlock,
  productDetailBlock,
  variantPickerBlock,
  specCompareBlock
];
