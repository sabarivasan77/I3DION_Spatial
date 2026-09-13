import { WidgetDefinition, WidgetCategory } from '../types/studio';
import { ContainerWidget } from './widgets/ContainerWidget';
import { TextWidget } from './widgets/TextWidget';
import { HeadingWidget } from './widgets/HeadingWidget';
import { ImageWidget } from './widgets/ImageWidget';
import { VideoWidget } from './widgets/VideoWidget';
import { ButtonWidget } from './widgets/ButtonWidget';
import { ProductInfoWidget } from './widgets/ProductInfoWidget';
import { SpecificationListWidget } from './widgets/SpecificationListWidget';
import { ThreeModelViewerWidget } from './widgets/ThreeModelViewerWidget';
import { HotspotWidget } from './widgets/HotspotWidget';
import { ARLaunchWidget } from './widgets/ARLaunchWidget';
import { FormContainerWidget } from './widgets/FormContainerWidget';
import { TextInputWidget } from './widgets/TextInputWidget';
import { EmailInputWidget } from './widgets/EmailInputWidget';
import { SubmitButtonWidget } from './widgets/SubmitButtonWidget';
import { DividerWidget } from './widgets/DividerWidget';
import { SpacerWidget } from './widgets/SpacerWidget';
import { CardWidget, StatWidget, PriceWidget } from './widgets/LayoutWidgets';
import { InputWidget, SelectWidget, CheckboxWidget } from './widgets/FormWidgets';

class WidgetRegistryService {
  private registry: Map<string, WidgetDefinition> = new Map();

  constructor() {
    this.registerDefaults();
  }

  private registerDefaults() {
    // 1. Container Widget (Layout)
    this.register({
      type: 'container',
      displayName: 'Container',
      category: 'layout',
      iconName: 'Box',
      version: '1.0.0',
      description: 'Layout container for grouping and aligning child elements.',
      defaultProperties: {
        backgroundColor: '#ffffff',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        minHeight: 140,
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'stretch',
        shadow: 'sm',
      },
      propertySchema: [
        {
          title: 'Appearance',
          category: 'style',
          properties: [
            { name: 'backgroundColor', label: 'Background Color', type: 'color', default: '#ffffff' },
            { name: 'borderColor', label: 'Border Color', type: 'color', default: '#e2e8f0' },
            { name: 'borderWidth', label: 'Border Width (px)', type: 'number', min: 0, max: 20, default: 1 },
            { name: 'borderRadius', label: 'Border Radius (px)', type: 'number', min: 0, max: 40, default: 12 },
          ],
        },
        {
          title: 'Layout & Spacing',
          category: 'layout',
          properties: [
            { name: 'padding', label: 'Padding (px)', type: 'number', min: 0, max: 80, default: 16 },
            { name: 'minHeight', label: 'Min Height (px)', type: 'number', min: 40, max: 1000, default: 140 },
          ],
        },
      ],
      component: ContainerWidget,
    });

    // 2. Heading Widget (Content)
    this.register({
      type: 'heading',
      displayName: 'Heading',
      category: 'content',
      iconName: 'Heading',
      version: '1.0.0',
      description: 'Section heading element.',
      defaultProperties: {
        content: 'Section Heading',
        level: 'h2',
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0f172a',
        textAlign: 'left',
        marginBottom: 12,
      },
      propertySchema: [
        {
          title: 'Content',
          category: 'content',
          properties: [
            { name: 'content', label: 'Heading Text', type: 'text', default: 'Section Heading' },
            {
              name: 'level',
              label: 'Heading Level',
              type: 'select',
              options: [
                { label: 'H1', value: 'h1' },
                { label: 'H2', value: 'h2' },
                { label: 'H3', value: 'h3' },
              ],
              default: 'h2',
            },
          ],
        },
        {
          title: 'Typography & Style',
          category: 'style',
          properties: [
            { name: 'fontSize', label: 'Font Size (px)', type: 'number', min: 14, max: 72, default: 24 },
            { name: 'color', label: 'Text Color', type: 'color', default: '#0f172a' },
          ],
        },
      ],
      component: HeadingWidget,
    });

    // 3. Text Widget (Content)
    this.register({
      type: 'text',
      displayName: 'Text',
      category: 'content',
      iconName: 'Type',
      version: '1.0.0',
      description: 'Paragraph body text element.',
      defaultProperties: {
        content: 'Interactive Spatial Experience',
        variant: 'h2',
        fontSize: 16,
        fontWeight: 'normal',
        color: '#334155',
        textAlign: 'left',
        lineHeight: 1.5,
      },
      propertySchema: [
        {
          title: 'Content',
          category: 'content',
          properties: [
            { name: 'content', label: 'Text Content', type: 'textarea', default: 'Interactive Spatial Experience' },
          ],
        },
        {
          title: 'Formatting',
          category: 'style',
          properties: [
            { name: 'fontSize', label: 'Font Size (px)', type: 'number', min: 10, max: 48, default: 16 },
            { name: 'color', label: 'Text Color', type: 'color', default: '#334155' },
          ],
        },
      ],
      component: TextWidget,
    });

    // 4. Image Widget (Media)
    this.register({
      type: 'image',
      displayName: 'Image',
      category: 'media',
      iconName: 'Image',
      version: '1.0.0',
      description: 'Image display with asset picker integration.',
      defaultProperties: {
        src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop',
        alt: 'Spatial 3D Asset Banner',
        objectFit: 'cover',
        height: 240,
        borderRadius: 12,
      },
      propertySchema: [
        {
          title: 'Image Source',
          category: 'content',
          properties: [
            { name: 'src', label: 'Image URL / Asset', type: 'image', default: '' },
            { name: 'alt', label: 'Alt Text', type: 'text', default: 'Image preview' },
          ],
        },
        {
          title: 'Style',
          category: 'style',
          properties: [
            { name: 'height', label: 'Height (px)', type: 'number', min: 40, max: 800, default: 240 },
            { name: 'borderRadius', label: 'Border Radius (px)', type: 'number', min: 0, max: 40, default: 12 },
          ],
        },
      ],
      component: ImageWidget,
    });

    // 5. Video Widget (Media)
    this.register({
      type: 'video',
      displayName: 'Video Player',
      category: 'media',
      iconName: 'Video',
      version: '1.0.0',
      description: 'HTML5 Video player widget.',
      defaultProperties: {
        src: '',
        controls: true,
        autoPlay: false,
        loop: false,
        muted: false,
        height: 320,
        borderRadius: 12,
      },
      propertySchema: [
        {
          title: 'Video Settings',
          category: 'content',
          properties: [
            { name: 'src', label: 'Video Source URL', type: 'text', default: '' },
            { name: 'controls', label: 'Show Controls', type: 'boolean', default: true },
            { name: 'autoPlay', label: 'Autoplay', type: 'boolean', default: false },
          ],
        },
      ],
      events: [
        { name: 'onPlay', label: 'On Video Play' },
        { name: 'onEnded', label: 'On Video Ended' },
      ],
      component: VideoWidget,
    });

    // 6. Button Widget (Interactive)
    this.register({
      type: 'button',
      displayName: 'Button',
      category: 'interactive',
      iconName: 'MousePointerClick',
      version: '1.0.0',
      description: 'Interactive button control.',
      defaultProperties: {
        label: 'Explore 3D Model',
        variant: 'primary',
        backgroundColor: '#2563eb',
        textColor: '#ffffff',
        borderRadius: 8,
        fullWidth: false,
      },
      propertySchema: [
        {
          title: 'Button Settings',
          category: 'content',
          properties: [
            { name: 'label', label: 'Button Label', type: 'text', default: 'Explore 3D Model' },
            { name: 'backgroundColor', label: 'Background Color', type: 'color', default: '#2563eb' },
            { name: 'textColor', label: 'Text Color', type: 'color', default: '#ffffff' },
          ],
        },
      ],
      events: [{ name: 'onClick', label: 'On Click Trigger' }],
      component: ButtonWidget,
    });

    // 7. Product Info Widget (Product)
    this.register({
      type: 'product_info',
      displayName: 'Product Info',
      category: 'product',
      iconName: 'ShoppingBag',
      version: '1.0.0',
      description: 'Product overview info card.',
      defaultProperties: {
        title: 'Spatial Precision Scanner X1',
        subtitle: 'High-Speed Sub-Millimeter Optical 3D Measurement System',
        price: '$4,999.00',
        sku: 'SKU-SPATIAL-X100',
        inStock: true,
        backgroundColor: '#ffffff',
        borderColor: '#e2e8f0',
        borderRadius: 16,
        padding: 24,
      },
      propertySchema: [
        {
          title: 'Product Data',
          category: 'data',
          properties: [
            { name: 'title', label: 'Product Title', type: 'text', default: 'Spatial Scanner X1' },
            { name: 'price', label: 'Price Display', type: 'text', default: '$4,999.00' },
          ],
        },
      ],
      component: ProductInfoWidget,
    });

    // 8. Specification List Widget (Product)
    this.register({
      type: 'specification_list',
      displayName: 'Spec List',
      category: 'product',
      iconName: 'Sliders',
      version: '1.0.0',
      description: 'Structured technical specifications list.',
      defaultProperties: {
        title: 'Technical Specifications',
        items: [
          { name: 'Resolution', value: '0.005', unit: 'mm' },
          { name: 'Scan Rate', value: '2.4M', unit: 'pts/sec' },
        ],
        backgroundColor: '#f8fafc',
        borderColor: '#e2e8f0',
        borderRadius: 12,
        padding: 20,
      },
      propertySchema: [
        {
          title: 'Settings',
          category: 'content',
          properties: [
            { name: 'title', label: 'Section Title', type: 'text', default: 'Technical Specifications' },
          ],
        },
      ],
      component: SpecificationListWidget,
    });

    // 9. REAL 3D Model Viewer Widget (3D)
    this.register({
      type: 'three_model_viewer',
      displayName: '3D Model Viewer',
      category: '3d',
      iconName: 'Box',
      version: '1.0.0',
      description: 'Real Three.js / R3F Canvas 3D Model Viewer with OrbitControls.',
      defaultProperties: {
        modelUrl: '',
        height: 360,
        backgroundColor: '#0f172a',
        autoRotate: true,
        controlsEnabled: true,
        lightIntensity: 1.2,
        initialScale: 1.0,
        borderRadius: 16,
      },
      propertySchema: [
        {
          title: '3D Model Source & Controls',
          category: 'content',
          properties: [
            { name: 'modelUrl', label: 'GLTF / GLB Model URL', type: 'text', default: '' },
            { name: 'autoRotate', label: 'Auto Rotate', type: 'boolean', default: true },
            { name: 'controlsEnabled', label: 'Enable Orbit Controls', type: 'boolean', default: true },
            { name: 'height', label: 'Viewport Height (px)', type: 'number', min: 180, max: 800, default: 360 },
            { name: 'backgroundColor', label: 'Background Color', type: 'color', default: '#0f172a' },
          ],
        },
      ],
      events: [
        { name: 'onModelLoaded', label: 'On 3D Model Loaded' },
        { name: 'onObjectSelected', label: 'On 3D Mesh Clicked' },
      ],
      component: ThreeModelViewerWidget,
    });

    // 10. Hotspot Widget (3D)
    this.register({
      type: 'hotspot',
      displayName: '3D Hotspot',
      category: '3d',
      iconName: 'MapPin',
      version: '1.0.0',
      description: 'Interactive spatial hotspot callout pin.',
      defaultProperties: {
        label: 'Hotspot Callout 01',
        description: 'Click to inspect internal component details',
        pinColor: '#3b82f6',
        backgroundColor: '#1e293b',
        textColor: '#f8fafc',
        borderRadius: 12,
      },
      propertySchema: [
        {
          title: 'Hotspot Callout',
          category: 'content',
          properties: [
            { name: 'label', label: 'Title', type: 'text', default: 'Hotspot Callout 01' },
            { name: 'description', label: 'Description', type: 'text', default: '' },
          ],
        },
      ],
      events: [{ name: 'onClick', label: 'On Hotspot Click' }],
      component: HotspotWidget,
    });

    // 11. AR Launch Widget (AR)
    this.register({
      type: 'ar_launch',
      displayName: 'AR View Launcher',
      category: 'ar',
      iconName: 'Smartphone',
      version: '1.0.0',
      description: 'Augmented Reality experience launcher trigger.',
      defaultProperties: {
        label: 'Launch Augmented Reality (AR)',
        subtitle: 'Scan QR or tap to place model in your environment',
        backgroundColor: '#4f46e5',
        textColor: '#ffffff',
        borderRadius: 14,
      },
      propertySchema: [
        {
          title: 'AR Launcher Settings',
          category: 'content',
          properties: [
            { name: 'label', label: 'Button Title', type: 'text', default: 'Launch AR' },
          ],
        },
      ],
      component: ARLaunchWidget,
    });

    // 12. Form Container Widget (Forms)
    this.register({
      type: 'form_container',
      displayName: 'Form Container',
      category: 'forms',
      iconName: 'FileText',
      version: '1.0.0',
      description: 'Container wrapper for input fields & lead submissions.',
      defaultProperties: {
        title: 'Lead Capture Form',
        description: 'Submit your information for an instant spatial product quote.',
        backgroundColor: '#ffffff',
        borderColor: '#e2e8f0',
        borderRadius: 16,
        padding: 24,
      },
      propertySchema: [
        {
          title: 'Form Header',
          category: 'content',
          properties: [
            { name: 'title', label: 'Form Title', type: 'text', default: 'Lead Capture Form' },
          ],
        },
      ],
      events: [{ name: 'onSubmit', label: 'On Form Submit' }],
      component: FormContainerWidget,
    });

    // 13. Text Input Widget (Forms)
    this.register({
      type: 'text_input',
      displayName: 'Text Input',
      category: 'forms',
      iconName: 'FormInput',
      version: '1.0.0',
      description: 'Text input field.',
      defaultProperties: {
        label: 'Full Name',
        placeholder: 'Enter your name...',
        required: false,
        name: 'fullName',
      },
      propertySchema: [
        {
          title: 'Input Properties',
          category: 'content',
          properties: [
            { name: 'label', label: 'Field Label', type: 'text', default: 'Full Name' },
            { name: 'required', label: 'Required Field', type: 'boolean', default: false },
          ],
        },
      ],
      component: TextInputWidget,
    });

    // 14. Email Input Widget (Forms)
    this.register({
      type: 'email_input',
      displayName: 'Email Input',
      category: 'forms',
      iconName: 'Mail',
      version: '1.0.0',
      description: 'Email input field with validation.',
      defaultProperties: {
        label: 'Email Address',
        placeholder: 'name@company.com',
        required: true,
        name: 'email',
      },
      propertySchema: [
        {
          title: 'Email Field',
          category: 'content',
          properties: [
            { name: 'label', label: 'Field Label', type: 'text', default: 'Email Address' },
          ],
        },
      ],
      component: EmailInputWidget,
    });

    // 15. Submit Button Widget (Forms)
    this.register({
      type: 'submit_button',
      displayName: 'Submit Button',
      category: 'forms',
      iconName: 'Send',
      version: '1.0.0',
      description: 'Form submission CTA button.',
      defaultProperties: {
        label: 'Submit Inquiry',
        backgroundColor: '#2563eb',
        textColor: '#ffffff',
        borderRadius: 8,
      },
      propertySchema: [
        {
          title: 'Submit Settings',
          category: 'content',
          properties: [
            { name: 'label', label: 'Button Label', type: 'text', default: 'Submit Inquiry' },
          ],
        },
      ],
      component: SubmitButtonWidget,
    });

    // 16. Divider Widget (Utility)
    this.register({
      type: 'divider',
      displayName: 'Divider',
      category: 'utility',
      iconName: 'Minus',
      version: '1.0.0',
      description: 'Horizontal divider line.',
      defaultProperties: {
        color: '#e2e8f0',
        height: 1,
        margin: 16,
      },
      propertySchema: [
        {
          title: 'Divider Style',
          category: 'style',
          properties: [
            { name: 'color', label: 'Line Color', type: 'color', default: '#e2e8f0' },
            { name: 'margin', label: 'Margin Top/Bottom (px)', type: 'number', min: 0, max: 64, default: 16 },
          ],
        },
      ],
      component: DividerWidget,
    });

    // 17. Spacer Widget (Utility)
    this.register({
      type: 'spacer',
      displayName: 'Spacer',
      category: 'utility',
      iconName: 'MoveVertical',
      version: '1.0.0',
      description: 'Vertical spacing element.',
      defaultProperties: {
        height: 32,
      },
      propertySchema: [
        {
          title: 'Spacing',
          category: 'layout',
          properties: [
            { name: 'height', label: 'Height (px)', type: 'number', min: 8, max: 200, default: 32 },
          ],
        },
      ],
      component: SpacerWidget,
    });

    // 18. Card Widget (Layout)
    this.register({
      type: 'card',
      displayName: 'Card',
      category: 'LAYOUT',
      iconName: 'CreditCard',
      version: '1.0.0',
      description: 'Styled card container widget.',
      defaultProperties: { title: 'Feature Card', subtitle: 'Card description...', padding: 20, borderRadius: 16 },
      propertySchema: [{ title: 'Card Settings', properties: [{ name: 'title', label: 'Title', type: 'text', default: 'Feature Card' }] }],
      component: CardWidget,
    });

    // 19. Stat Widget (Data)
    this.register({
      type: 'stat',
      displayName: 'Stat Card',
      category: 'DATA',
      iconName: 'TrendingUp',
      version: '1.0.0',
      description: 'Metric KPI display card.',
      defaultProperties: { label: 'Total Sales', value: '$124,500', change: '+14.2%' },
      propertySchema: [{ title: 'Metric', properties: [{ name: 'label', label: 'Metric Label', type: 'text', default: 'Total Sales' }] }],
      component: StatWidget,
    });

    // 20. Price Widget (Data)
    this.register({
      type: 'price',
      displayName: 'Pricing Card',
      category: 'DATA',
      iconName: 'DollarSign',
      version: '1.0.0',
      description: 'Subscription pricing tier card.',
      defaultProperties: { planName: 'Pro Plan', price: '$299', period: '/month' },
      propertySchema: [{ title: 'Pricing Plan', properties: [{ name: 'planName', label: 'Plan Name', type: 'text', default: 'Pro Plan' }] }],
      component: PriceWidget,
    });

    // 21. Input Widget (Form)
    this.register({
      type: 'input',
      displayName: 'Form Input',
      category: 'FORM',
      iconName: 'FormInput',
      version: '1.0.0',
      description: 'Form text input control.',
      defaultProperties: { label: 'Input Label', placeholder: 'Enter value...', required: false },
      propertySchema: [{ title: 'Input Settings', properties: [{ name: 'label', label: 'Label', type: 'text', default: 'Input Label' }] }],
      component: InputWidget,
    });

    // 22. Select Widget (Form)
    this.register({
      type: 'select',
      displayName: 'Select Dropdown',
      category: 'FORM',
      iconName: 'ListFilter',
      version: '1.0.0',
      description: 'Form select dropdown.',
      defaultProperties: { label: 'Select Option', options: 'Option 1, Option 2, Option 3' },
      propertySchema: [{ title: 'Options', properties: [{ name: 'label', label: 'Label', type: 'text', default: 'Select Option' }] }],
      component: SelectWidget,
    });

    // 23. Checkbox Widget (Form)
    this.register({
      type: 'checkbox',
      displayName: 'Checkbox',
      category: 'FORM',
      iconName: 'CheckSquare',
      version: '1.0.0',
      description: 'Form checkbox control.',
      defaultProperties: { label: 'I agree to terms', checked: false },
      propertySchema: [{ title: 'Checkbox Settings', properties: [{ name: 'label', label: 'Label', type: 'text', default: 'I agree to terms' }] }],
      component: CheckboxWidget,
    });
  }

  public register(widget: WidgetDefinition): void {
    if (this.registry.has(widget.type)) {
      console.warn(`Widget type "${widget.type}" is already registered. Overwriting.`);
    }
    this.registry.set(widget.type, widget);
  }

  public get(type: string): WidgetDefinition | undefined {
    return this.registry.get(type);
  }

  public has(type: string): boolean {
    return this.registry.has(type);
  }

  public getAll(): WidgetDefinition[] {
    return Array.from(this.registry.values());
  }

  public getByCategory(category: WidgetCategory): WidgetDefinition[] {
    return this.getAll().filter((w) => w.category === category);
  }
}

export const widgetRegistry = new WidgetRegistryService();
