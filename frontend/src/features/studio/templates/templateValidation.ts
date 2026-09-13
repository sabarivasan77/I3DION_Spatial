import { TemplateDefinition, TemplateValidationResult } from '../types/studio';
import { widgetRegistry } from '../registry/widgetRegistry';

export function validateTemplate(template: unknown): TemplateValidationResult {
  const errors: string[] = [];

  if (!template || typeof template !== 'object') {
    return { valid: false, errors: ['Template definition must be a non-null object.'] };
  }

  const t = template as Partial<TemplateDefinition>;

  if (!t.id || typeof t.id !== 'string' || t.id.trim() === '') {
    errors.push('Template must have a valid string "id".');
  }

  if (!t.name || typeof t.name !== 'string' || t.name.trim() === '') {
    errors.push('Template must have a valid string "name".');
  }

  if (typeof t.version !== 'number' || t.version < 1) {
    errors.push('Template must have a numeric "version" >= 1.');
  }

  if (!t.canvasConfig || typeof t.canvasConfig !== 'object') {
    errors.push('Template must provide a valid "canvasConfig" object.');
  }

  if (!Array.isArray(t.initialWidgetTree)) {
    errors.push('Template must provide an "initialWidgetTree" array.');
  } else {
    // Validate each root widget node in tree
    const validateNode = (node: any, path: string) => {
      if (!node || typeof node !== 'object') {
        errors.push(`Invalid widget node at ${path}`);
        return;
      }

      if (!node.type || typeof node.type !== 'string') {
        errors.push(`Widget node at ${path} is missing "type" string.`);
      } else if (!widgetRegistry.has(node.type)) {
        errors.push(
          `Widget node at ${path} references unregistered widget type "${node.type}".`
        );
      }

      if (!node.properties || typeof node.properties !== 'object') {
        errors.push(`Widget node at ${path} is missing "properties" object.`);
      }

      if (Array.isArray(node.children)) {
        node.children.forEach((childNode: any, index: number) => {
          validateNode(childNode, `${path}.children[${index}]`);
        });
      }
    };

    t.initialWidgetTree.forEach((node, index) => {
      validateNode(node, `initialWidgetTree[${index}]`);
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
