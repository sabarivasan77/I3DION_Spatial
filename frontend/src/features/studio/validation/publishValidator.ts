import { ExperienceSchema, StudioWidgetNode } from '../types/studio';

export interface PublishValidationError {
  nodeId?: string;
  field?: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface PublishValidationResult {
  valid: boolean;
  errors: PublishValidationError[];
  warnings: PublishValidationError[];
}

export function validateExperienceForPublish(experience: ExperienceSchema): PublishValidationResult {
  const errors: PublishValidationError[] = [];
  const warnings: PublishValidationError[] = [];

  if (!experience.name || experience.name.trim() === '') {
    errors.push({ field: 'name', message: 'Experience name is required before publishing.', severity: 'error' });
  }

  const widgets = experience.widgets || [];
  if (widgets.length === 0) {
    errors.push({ message: 'Experience canvas is empty. Add at least one widget before publishing.', severity: 'error' });
  }

  const checkNode = (node: StudioWidgetNode) => {
    if (!node.id) {
      errors.push({ message: 'A widget on the canvas is missing a unique ID.', severity: 'error' });
    }

    if (node.type === '3d-model-viewer' || node.type === 'three_model_viewer') {
      if (!node.properties?.modelUrl) {
        warnings.push({
          nodeId: node.id,
          message: `3D Model Viewer '${node.name || node.id}' has no custom GLTF model URL. Procedural spatial assembly fallback will be displayed.`,
          severity: 'warning',
        });
      }
    }

    if (node.events && node.events.length > 0) {
      node.events.forEach((evt) => {
        const targetId = evt.parameters?.targetWidgetId;
        if (targetId && !widgets.some((w) => w.id === targetId)) {
          errors.push({
            nodeId: node.id,
            message: `Event rule in '${node.name || node.id}' references missing target widget '${targetId}'.`,
            severity: 'error',
          });
        }
      });
    }

    if (node.children) {
      node.children.forEach(checkNode);
    }
  };

  widgets.forEach(checkNode);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
