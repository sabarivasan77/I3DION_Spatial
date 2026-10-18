import { z } from 'zod';
import type { BlockDef } from '../types.ts';

export const headingBlock: BlockDef = {
  type: 'heading',
  title: 'Heading & Subtitle',
  description: 'Typographic title block supporting H1-H4 levels, semantic tags, and alignment',
  category: 'content',
  icon: 'type',
  isContainer: false,
  propsSchema: z.object({
    text: z.string().default('Heading Title'),
    level: z.union([z.enum(['h1', 'h2', 'h3', 'h4']), z.number().int().min(1).max(4)]).default('h2'),
    subtitle: z.string().optional().default(''),
    align: z.enum(['left', 'center', 'right']).default('left'),
    color: z.string().default('inherit')
  }),
  defaultProps: {
    text: 'Heading Title',
    level: 'h2',
    subtitle: '',
    align: 'left',
    color: 'inherit'
  }
};

export const richTextBlock: BlockDef = {
  type: 'rich_text',
  title: 'Rich Text / Description',
  description: 'Formatted prose text block with bold, lists, links, and sanitized markdown',
  category: 'content',
  icon: 'file-text',
  isContainer: false,
  propsSchema: z.object({
    content: z.string().default('Describe product features, engineering certifications, or technical specifications here.'),
    fontSize: z.enum(['sm', 'base', 'lg']).default('base')
  }),
  defaultProps: {
    content: 'Describe product features, engineering certifications, or technical specifications here.',
    fontSize: 'base'
  }
};

export const imageBlock: BlockDef = {
  type: 'image',
  title: 'Image Banner',
  description: 'Static or dynamic asset image with responsive scaling and alt description',
  category: 'content',
  icon: 'image',
  isContainer: false,
  propsSchema: z.object({
    src: z.string().default(''),
    alt: z.string().default('Product Illustration'),
    aspectRatio: z.enum(['16:9', '4:3', '1:1', 'auto']).default('16:9'),
    objectFit: z.enum(['contain', 'cover']).default('cover'),
    borderRadius: z.number().default(8)
  }),
  defaultProps: {
    src: '',
    alt: 'Product Illustration',
    aspectRatio: '16:9',
    objectFit: 'cover',
    borderRadius: 8
  }
};

export const viewer3dBlock: BlockDef = {
  type: 'viewer_3d',
  title: '3D CAD / Digital Twin Viewer',
  description: 'Interactive WebGL/WebXR viewport rendering GLB/USDZ models with AR and hotspots',
  category: 'content',
  icon: 'box',
  isContainer: false,
  ports: [
    { name: 'modelUrl', type: 'string', direction: 'in', label: '3D Model Source' },
    { name: 'activeHotspot', type: 'string', direction: 'out', label: 'Selected Hotspot' }
  ],
  propsSchema: z.object({
    modelAssetId: z.string().optional().nullable(),
    modelUrl: z.string().default(''),
    enableAr: z.boolean().default(true),
    autoRotate: z.boolean().default(true),
    cameraControls: z.boolean().default(true),
    backgroundColor: z.string().default('#0F172A'),
    height: z.number().default(480),
    hotspots: z.array(z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      position: z.tuple([z.number(), z.number(), z.number()])
    })).default([])
  }),
  defaultProps: {
    modelAssetId: null,
    modelUrl: '',
    enableAr: true,
    autoRotate: true,
    cameraControls: true,
    backgroundColor: '#0F172A',
    height: 480,
    hotspots: []
  }
};

export const specTableBlock: BlockDef = {
  type: 'spec_table',
  title: 'Technical Specifications Table',
  description: 'Structured key-value table showing engineering specs and performance metrics',
  category: 'content',
  icon: 'table',
  isContainer: false,
  propsSchema: z.object({
    specs: z.record(z.string()).default({
      'Operating Pressure': '16 bar',
      'Max Flow Rate': '450 m³/h',
      'Efficiency': '88.4%'
    }),
    zebraStriping: z.boolean().default(true)
  }),
  defaultProps: {
    specs: {
      'Operating Pressure': '16 bar',
      'Max Flow Rate': '450 m³/h',
      'Efficiency': '88.4%'
    },
    zebraStriping: true
  }
};

export const priceBlock: BlockDef = {
  type: 'price',
  title: 'Price & Commercial Display',
  description: 'Formatted currency pricing display with volume discounts and RFQ option',
  category: 'content',
  icon: 'dollar-sign',
  isContainer: false,
  propsSchema: z.object({
    amount: z.number().optional().nullable(),
    currency: z.string().default('INR'),
    prefixText: z.string().default('Starting at'),
    showOnRequest: z.boolean().default(false),
    onRequestText: z.string().default('Price upon Request (RFQ)')
  }),
  defaultProps: {
    amount: null,
    currency: 'INR',
    prefixText: 'Starting at',
    showOnRequest: true,
    onRequestText: 'Price upon Request (RFQ)'
  }
};

export const downloadButtonBlock: BlockDef = {
  type: 'download_button',
  title: 'Asset Download Button',
  description: 'Secure pre-signed download trigger for spec sheets, CAD models, or certificates',
  category: 'content',
  icon: 'download',
  isContainer: false,
  propsSchema: z.object({
    label: z.string().default('Download Technical Datasheet'),
    fileAssetId: z.string().optional().nullable(),
    fileUrl: z.string().default(''),
    fileFormat: z.string().default('PDF')
  }),
  defaultProps: {
    label: 'Download Technical Datasheet',
    fileAssetId: null,
    fileUrl: '',
    fileFormat: 'PDF'
  }
};

export const contentBlocks = [
  headingBlock,
  richTextBlock,
  imageBlock,
  viewer3dBlock,
  specTableBlock,
  priceBlock,
  downloadButtonBlock
];
