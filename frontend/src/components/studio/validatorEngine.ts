import { StudioProject } from '../../api/studioApi';
import { iScriptEngine } from './iScriptEngine';

export interface ValidationError {
  id: string;
  type: 'error' | 'warning';
  location: 'screen' | 'component' | 'binding' | 'iscript' | 'navigation';
  target_name: string;
  message: string;
}

export const validatorEngine = {
  validateProject: (project: StudioProject): ValidationError[] => {
    const errors: ValidationError[] = [];
    const doc = project.project_document || { screens: [], components: [], variables: [] };

    // 1. Validate Screens & Navigation Targets
    const screenIds = new Set((doc.screens || []).map((s: any) => s.id));

    if (screenIds.size === 0) {
      errors.push({
        id: 'val-no-screens',
        type: 'error',
        location: 'screen',
        target_name: 'Project',
        message: 'Project contains no screens or pages.'
      });
    }

    // 2. Validate Component References & Actions
    (doc.components || []).forEach((comp: any) => {
      if (comp.action && comp.action.type === 'navigate' && comp.action.target_id) {
        if (!screenIds.has(comp.action.target_id)) {
          errors.push({
            id: `val-nav-${comp.id}`,
            type: 'error',
            location: 'navigation',
            target_name: comp.name || comp.type,
            message: `Navigation action targets non-existent screen ID '${comp.action.target_id}'`
          });
        }
      }

      // Unbound Data Check Warning
      if (comp.type === 'Viewer3D' && (!comp.props?.url && !comp.data_binding)) {
        errors.push({
          id: `val-3d-${comp.id}`,
          type: 'warning',
          location: 'component',
          target_name: comp.name,
          message: '3D Viewport component has no GLB model URL or Spatial Vault data binding specified.'
        });
      }
    });

    // 3. Validate iScript Code
    if (doc.scripts && Array.isArray(doc.scripts)) {
      doc.scripts.forEach((scriptItem: any, idx: number) => {
        try {
          iScriptEngine.parse(scriptItem.code || '');
        } catch (err: any) {
          errors.push({
            id: `val-script-${idx}`,
            type: 'error',
            location: 'iscript',
            target_name: scriptItem.name || `Script ${idx + 1}`,
            message: err.message || 'iScript syntax error'
          });
        }
      });
    }

    return errors;
  }
};
