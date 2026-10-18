import type { BlockSchema } from './types';

export const DEFAULT_BLOCK_SCHEMAS: BlockSchema[] = [
  {
    type: 'hero_3d',
    title: '3D Spatial Hero',
    description: 'High-impact product hero with interactive 3D model canvas and call-to-actions.',
    category: 'presentation',
    icon: 'Box',
    defaultProps: {
      headline: 'Next-Generation Spatial Experience',
      subheadline: 'Interact with CAD precision in your browser.',
      ctaText: 'Explore Interactive Demo',
      modelUrl: '/models/industrial-arm.glb',
      backgroundColor: '#0a0f1d',
    },
    fields: [
      { name: 'headline', label: 'Headline', type: 'text', defaultValue: 'Next-Generation Spatial Experience' },
      { name: 'subheadline', label: 'Subheadline', type: 'textarea', defaultValue: 'Interact with CAD precision in your browser.' },
      { name: 'ctaText', label: 'CTA Button Text', type: 'text', defaultValue: 'Explore Interactive Demo' },
      { name: 'modelUrl', label: '3D Model Asset', type: 'asset', defaultValue: '/models/industrial-arm.glb' },
      { name: 'backgroundColor', label: 'Background Color', type: 'color', defaultValue: '#0a0f1d' },
    ],
  },
  {
    type: 'model_viewer',
    title: 'Standalone 3D Viewer',
    description: 'Full-control 3D viewport with explode view, orbit controls, and wireframe toggle.',
    category: '3d',
    icon: 'Layers',
    defaultProps: {
      autoRotate: true,
      enableZoom: true,
      fov: 45,
      modelUrl: '/models/industrial-arm.glb',
    },
    fields: [
      { name: 'autoRotate', label: 'Auto Rotate', type: 'boolean', defaultValue: true },
      { name: 'enableZoom', label: 'Enable Zoom', type: 'boolean', defaultValue: true },
      { name: 'fov', label: 'Field of View', type: 'number', defaultValue: 45 },
      { name: 'modelUrl', label: '3D Model Path', type: 'asset', defaultValue: '/models/industrial-arm.glb' },
    ],
  },
  {
    type: 'product_specs',
    title: 'Technical Specs Grid',
    description: 'Structured engineering specifications with tolerances and metric units.',
    category: 'content',
    icon: 'ListFilter',
    defaultProps: {
      title: 'Engineering Specifications',
      items: [
        { label: 'Payload Capacity', value: '25.0 kg' },
        { label: 'Reach Radius', value: '1,820 mm' },
        { label: 'Repeatability', value: '±0.02 mm' },
      ],
    },
    fields: [
      { name: 'title', label: 'Section Title', type: 'text', defaultValue: 'Engineering Specifications' },
      { name: 'items', label: 'Spec Items', type: 'list', defaultValue: [] },
    ],
  },
  {
    type: 'gallery_grid',
    title: 'Multi-Angle Gallery',
    description: 'Media carousel of rendered angles, CAD blueprints, and contextual shots.',
    category: 'presentation',
    icon: 'Image',
    defaultProps: {
      columns: 3,
      items: [
        { title: 'Orthographic Front', url: '/models/preview-1.png' },
        { title: 'Exploded Subassembly', url: '/models/preview-2.png' },
        { title: 'Hydraulic Linkage', url: '/models/preview-3.png' },
      ],
    },
    fields: [
      { name: 'columns', label: 'Grid Columns', type: 'number', defaultValue: 3 },
    ],
  },
  {
    type: 'lead_capture',
    title: 'Spatial RFQ & Lead Form',
    description: 'High-conversion procurement and quote request form with CRM dispatch.',
    category: 'conversion',
    icon: 'Send',
    defaultProps: {
      heading: 'Request Industrial Quotation',
      submitButtonText: 'Submit RFQ to Sales',
      notifyEmail: 'sales@i3dion.com',
    },
    fields: [
      { name: 'heading', label: 'Form Heading', type: 'text', defaultValue: 'Request Industrial Quotation' },
      { name: 'submitButtonText', label: 'Button Label', type: 'text', defaultValue: 'Submit RFQ to Sales' },
    ],
  },
  {
    type: 'cta_banner',
    title: 'Action Banner',
    description: 'Call-to-action banner with immediate AR launch trigger.',
    category: 'conversion',
    icon: 'Sparkles',
    defaultProps: {
      text: 'Experience in Augmented Reality via WebXR',
      buttonLabel: 'Launch AR Now',
    },
    fields: [
      { name: 'text', label: 'Banner Copy', type: 'text', defaultValue: 'Experience in Augmented Reality via WebXR' },
      { name: 'buttonLabel', label: 'Action Button', type: 'text', defaultValue: 'Launch AR Now' },
    ],
  },
  {
    type: 'footer_legal',
    title: 'Footer & Compliance',
    description: 'Organization footer, certifications (ISO/CE), and copyright.',
    category: 'navigation',
    icon: 'Shield',
    defaultProps: {
      copyrightText: '© 2026 I3DION Spatial Technologies. All Rights Reserved.',
      compliance: 'ISO 9001:2015 & CE Industrial Standard Certified',
    },
    fields: [
      { name: 'copyrightText', label: 'Copyright', type: 'text', defaultValue: '© 2026 I3DION Spatial Technologies. All Rights Reserved.' },
      { name: 'compliance', label: 'Compliance Text', type: 'text', defaultValue: 'ISO 9001:2015 & CE Industrial Standard Certified' },
    ],
  },
];
