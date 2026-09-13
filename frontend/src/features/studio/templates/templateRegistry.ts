import {
  TemplateDefinition,
  ExperienceSchema,
  StudioWidgetNode,
} from '../types/studio';
import { validateTemplate } from './templateValidation';
import { productShowcaseTemplate } from './definitions/productShowcaseTemplate';
import { immersive3dTemplate } from './definitions/immersive3dTemplate';
import { salesConversionTemplate } from './definitions/salesConversionTemplate';

class TemplateRegistry {
  private templates: Map<string, TemplateDefinition> = new Map();

  constructor() {
    // Register foundation templates
    this.register(productShowcaseTemplate);
    this.register(immersive3dTemplate);
    this.register(salesConversionTemplate);
  }

  public register(template: TemplateDefinition): void {
    const validation = validateTemplate(template);
    if (!validation.valid) {
      console.error(
        `Failed to register template "${template.id}":`,
        validation.errors.join('; ')
      );
      throw new Error(
        `Template validation failed for template "${template.id}": ${validation.errors.join('; ')}`
      );
    }
    this.templates.set(template.id, template);
  }

  public get(id: string): TemplateDefinition | undefined {
    return this.templates.get(id);
  }

  public getAll(): TemplateDefinition[] {
    return Array.from(this.templates.values());
  }

  public cloneTemplateAsExperience(templateId: string): ExperienceSchema {
    const template = this.get(templateId);
    if (!template) {
      throw new Error(`Template with ID "${templateId}" not found in registry.`);
    }

    const timestamp = new Date().toISOString();
    const expId = `exp_${template.id}_${Math.random().toString(36).substring(2, 9)}`;

    // Helper to generate fresh unique IDs for all cloned widgets
    const cloneWidgetTree = (nodes: StudioWidgetNode[]): StudioWidgetNode[] => {
      return nodes.map((node) => {
        const freshId = `widget_${node.type}_${Math.random().toString(36).substring(2, 8)}`;
        const clonedChildren = node.children
          ? cloneWidgetTree(node.children)
          : undefined;

        return {
          ...JSON.parse(JSON.stringify(node)),
          id: freshId,
          children: clonedChildren,
        };
      });
    };

    const clonedWidgets = cloneWidgetTree(template.initialWidgetTree);

    return {
      version: 1,
      id: expId,
      name: `${template.name} (Custom Copy)`,
      description: template.description,
      canvas: {
        viewport: template.canvasConfig.viewport,
        width: template.canvasConfig.width,
        height: template.canvasConfig.height,
        backgroundColor: template.canvasConfig.backgroundColor,
      },
      widgets: clonedWidgets,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  }
}

export const templateRegistry = new TemplateRegistry();
