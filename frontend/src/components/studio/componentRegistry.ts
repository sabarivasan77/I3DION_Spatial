import { 
  Box, 
  Layers, 
  FileText, 
  Sparkles, 
  Grid, 
  Plus, 
  Sliders, 
  CheckCircle2, 
  Package, 
  HelpCircle, 
  Monitor, 
  Link2, 
  Play, 
  Cpu, 
  Database,
  Type,
  Image as ImageIcon,
  Video,
  List,
  Table,
  Eye
} from 'lucide-react';

export interface ComponentDefinition {
  type: string;
  name: string;
  category: 'BASIC' | 'TEXT' | 'INPUT' | 'BUTTONS' | 'DISPLAY' | 'MEDIA' | 'NAVIGATION' | 'PRODUCT' | '3D_SPATIAL' | 'DATA' | 'ADVANCED';
  icon: any;
  defaultW: number;
  defaultH: number;
  defaultProps: Record<string, any>;
  defaultStyle: Record<string, any>;
  supportedEvents: string[];
}

export const COMPONENT_REGISTRY: Record<string, ComponentDefinition> = {
  // BASIC & LAYOUT
  Container: {
    type: 'Container',
    name: 'Container Box',
    category: 'BASIC',
    icon: Box,
    defaultW: 400,
    defaultH: 220,
    defaultProps: { layoutDirection: 'vertical', gap: 12 },
    defaultStyle: { backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '16px', border: '1px solid #E2E8F0' },
    supportedEvents: ['OnClick', 'OnHover']
  },
  Section: {
    type: 'Section',
    name: 'Section Block',
    category: 'BASIC',
    icon: Layers,
    defaultW: 600,
    defaultH: 200,
    defaultProps: { sectionTitle: 'Section Header' },
    defaultStyle: { backgroundColor: '#F8FAFC', borderRadius: '16px', padding: '24px' },
    supportedEvents: ['OnVisible']
  },
  Row: {
    type: 'Row',
    name: 'Flex Row',
    category: 'BASIC',
    icon: Grid,
    defaultW: 500,
    defaultH: 100,
    defaultProps: { alignment: 'center', spaceBetween: true },
    defaultStyle: { display: 'flex', flexDirection: 'row', gap: '16px' },
    supportedEvents: []
  },
  Column: {
    type: 'Column',
    name: 'Flex Column',
    category: 'BASIC',
    icon: Layers,
    defaultW: 240,
    defaultH: 300,
    defaultProps: { alignment: 'stretch' },
    defaultStyle: { display: 'flex', flexDirection: 'column', gap: '12px' },
    supportedEvents: []
  },
  Divider: {
    type: 'Divider',
    name: 'Horizontal Line',
    category: 'BASIC',
    icon: Grid,
    defaultW: 350,
    defaultH: 20,
    defaultProps: { lineStyle: 'solid', thickness: 1 },
    defaultStyle: { borderColor: '#E2E8F0', marginY: '8px' },
    supportedEvents: []
  },

  // TEXT
  Text: {
    type: 'Text',
    name: 'Text Paragraph',
    category: 'TEXT',
    icon: FileText,
    defaultW: 220,
    defaultH: 40,
    defaultProps: { content: 'Sample text paragraph content' },
    defaultStyle: { fontSize: '14px', color: '#1E293B', fontWeight: '400' },
    supportedEvents: ['OnClick']
  },
  Heading: {
    type: 'Heading',
    name: 'Heading Title',
    category: 'TEXT',
    icon: Type,
    defaultW: 300,
    defaultH: 52,
    defaultProps: { content: 'Heading Title', level: 'h2' },
    defaultStyle: { fontSize: '24px', color: '#0F172A', fontWeight: '800' },
    supportedEvents: ['OnClick']
  },
  RichText: {
    type: 'RichText',
    name: 'Rich Text HTML',
    category: 'TEXT',
    icon: FileText,
    defaultW: 360,
    defaultH: 100,
    defaultProps: { htmlContent: '<p><b>Bold</b> industrial product description text.</p>' },
    defaultStyle: { fontSize: '14px', color: '#334155' },
    supportedEvents: []
  },

  // INPUT
  TextInput: {
    type: 'TextInput',
    name: 'Text Field Input',
    category: 'INPUT',
    icon: FileText,
    defaultW: 260,
    defaultH: 42,
    defaultProps: { placeholder: 'Enter text...', label: 'Label' },
    defaultStyle: { backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' },
    supportedEvents: ['OnChange', 'OnFocus', 'OnBlur']
  },
  NumberInput: {
    type: 'NumberInput',
    name: 'Numeric Input',
    category: 'INPUT',
    icon: FileText,
    defaultW: 180,
    defaultH: 42,
    defaultProps: { min: 0, max: 100, step: 1, value: 1 },
    defaultStyle: { borderRadius: '8px', border: '1px solid #CBD5E1' },
    supportedEvents: ['OnChange']
  },
  Dropdown: {
    type: 'Dropdown',
    name: 'Dropdown Select',
    category: 'INPUT',
    icon: Sliders,
    defaultW: 240,
    defaultH: 42,
    defaultProps: { options: ['Option A', 'Option B', 'Option C'], selected: 'Option A' },
    defaultStyle: { backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #CBD5E1' },
    supportedEvents: ['OnChange', 'OnSelect']
  },
  Toggle: {
    type: 'Toggle',
    name: 'Switch Toggle',
    category: 'INPUT',
    icon: Sliders,
    defaultW: 120,
    defaultH: 36,
    defaultProps: { checked: false, label: 'Enable' },
    defaultStyle: { color: '#4F46E5' },
    supportedEvents: ['OnChange']
  },

  // BUTTONS
  Button: {
    type: 'Button',
    name: 'Action Button',
    category: 'BUTTONS',
    icon: Plus,
    defaultW: 160,
    defaultH: 44,
    defaultProps: { label: 'Click Action', variant: 'primary', disabled: false },
    defaultStyle: { backgroundColor: '#4F46E5', color: '#FFFFFF', borderRadius: '10px', fontWeight: '600', fontSize: '13px' },
    supportedEvents: ['OnClick', 'OnHover']
  },
  IconButton: {
    type: 'IconButton',
    name: 'Icon Button',
    category: 'BUTTONS',
    icon: Sparkles,
    defaultW: 44,
    defaultH: 44,
    defaultProps: { iconName: 'Sparkles', tooltip: 'Action' },
    defaultStyle: { backgroundColor: '#EEF2FF', color: '#4F46E5', borderRadius: '10px' },
    supportedEvents: ['OnClick']
  },
  Link: {
    type: 'Link',
    name: 'Hyperlink Text',
    category: 'BUTTONS',
    icon: Link2,
    defaultW: 120,
    defaultH: 30,
    defaultProps: { text: 'Learn More', href: '#' },
    defaultStyle: { color: '#4F46E5', textDecoration: 'underline', fontSize: '13px' },
    supportedEvents: ['OnClick']
  },

  // DISPLAY
  Card: {
    type: 'Card',
    name: 'Content Card',
    category: 'DISPLAY',
    icon: Package,
    defaultW: 320,
    defaultH: 220,
    defaultProps: { title: 'Card Title', description: 'Description text details.' },
    defaultStyle: { backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '16px' },
    supportedEvents: ['OnClick']
  },
  Badge: {
    type: 'Badge',
    name: 'Status Badge',
    category: 'DISPLAY',
    icon: CheckCircle2,
    defaultW: 110,
    defaultH: 30,
    defaultProps: { label: 'Active', color: 'indigo' },
    defaultStyle: { backgroundColor: '#EEF2FF', color: '#4F46E5', borderRadius: '6px', fontSize: '11px', fontWeight: '700' },
    supportedEvents: []
  },
  Table: {
    type: 'Table',
    name: 'Data Table Grid',
    category: 'DISPLAY',
    icon: Grid,
    defaultW: 500,
    defaultH: 240,
    defaultProps: { columns: ['Name', 'Category', 'Status'], rows: [] },
    defaultStyle: { backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0' },
    supportedEvents: ['OnSelect']
  },

  // MEDIA
  Image: {
    type: 'Image',
    name: 'Image Render',
    category: 'MEDIA',
    icon: ImageIcon,
    defaultW: 320,
    defaultH: 200,
    defaultProps: { src: '/models/model_1.png', alt: 'Product Image', objectFit: 'cover' },
    defaultStyle: { borderRadius: '12px' },
    supportedEvents: ['OnClick']
  },
  Video: {
    type: 'Video',
    name: 'Video Player',
    category: 'MEDIA',
    icon: Video,
    defaultW: 420,
    defaultH: 240,
    defaultProps: { src: 'https://www.w3schools.com/html/mov_bbb.mp4', autoPlay: false, controls: true },
    defaultStyle: { borderRadius: '12px' },
    supportedEvents: ['OnPlay', 'OnPause']
  },

  // NAVIGATION
  Navbar: {
    type: 'Navbar',
    name: 'Top Navigation Bar',
    category: 'NAVIGATION',
    icon: Monitor,
    defaultW: 680,
    defaultH: 56,
    defaultProps: { title: 'Enterprise Portal', links: ['Home', 'Products', 'Support'] },
    defaultStyle: { backgroundColor: '#FFFFFF', borderBottom: '1px solid #E2E8F0', padding: '12px 24px' },
    supportedEvents: ['OnSelect']
  },

  // PRODUCT / CATALOG
  ProductCard: {
    type: 'ProductCard',
    name: 'Product Master Card',
    category: 'PRODUCT',
    icon: Package,
    defaultW: 340,
    defaultH: 380,
    defaultProps: { title: 'Heavy Duty Rotary Compressor', category: 'Machinery', price: '$12,500', model_url: '/models/model_1.gltf' },
    defaultStyle: { backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '16px' },
    supportedEvents: ['OnClick', 'OnSelect']
  },
  SpecTable: {
    type: 'SpecTable',
    name: 'Technical Specs Table',
    category: 'PRODUCT',
    icon: Grid,
    defaultW: 460,
    defaultH: 240,
    defaultProps: { specs: { 'Power Rating': '45 kW', 'Torque': '1,200 Nm', 'Operating Pressure': '10 Bar' } },
    defaultStyle: { backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '16px' },
    supportedEvents: []
  },
  EnquiryForm: {
    type: 'EnquiryForm',
    name: 'Lead Enquiry Form',
    category: 'PRODUCT',
    icon: FileText,
    defaultW: 380,
    defaultH: 360,
    defaultProps: { formTitle: 'Request Enterprise Quote', submitButtonText: 'Submit Enquiry' },
    defaultStyle: { backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #CBD5E1', padding: '20px' },
    supportedEvents: ['OnSubmit', 'OnSuccess']
  },

  // 3D / SPATIAL
  Viewer3D: {
    type: 'Viewer3D',
    name: '3D Model Viewport (GLB)',
    category: '3D_SPATIAL',
    icon: Box,
    defaultW: 500,
    defaultH: 340,
    defaultProps: { modelUrl: '/models/model_1.gltf', autoRotate: true, cameraOrbit: '0deg 75deg 105%', enableAr: true },
    defaultStyle: { backgroundColor: '#0F172A', borderRadius: '16px', overflow: 'hidden' },
    supportedEvents: ['OnLoad', 'OnClick', 'OnAnimComplete']
  },
  ARButton: {
    type: 'ARButton',
    name: 'AR WebXR Launch Button',
    category: '3D_SPATIAL',
    icon: Cpu,
    defaultW: 180,
    defaultH: 48,
    defaultProps: { label: 'View in AR', modelUrl: '/models/model_1.gltf' },
    defaultStyle: { backgroundColor: '#4F46E5', color: '#FFFFFF', borderRadius: '12px', fontWeight: '700' },
    supportedEvents: ['OnClick']
  },

  // DATA
  DataTable: {
    type: 'DataTable',
    name: 'Spatial Vault Data Table',
    category: 'DATA',
    icon: Database,
    defaultW: 580,
    defaultH: 300,
    defaultProps: { dataSource: 'vault_products', pageSize: 5 },
    defaultStyle: { backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #CBD5E1' },
    supportedEvents: ['OnSelect', 'OnPageChange']
  },

  // ADVANCED
  CustomHTML: {
    type: 'CustomHTML',
    name: 'Custom HTML Block',
    category: 'ADVANCED',
    icon: FileText,
    defaultW: 360,
    defaultH: 180,
    defaultProps: { html: '<div style="padding:10px; background:#EEF2FF; color:#4F46E5;">Custom Low-Code HTML Embed</div>' },
    defaultStyle: { borderRadius: '8px' },
    supportedEvents: []
  }
};
