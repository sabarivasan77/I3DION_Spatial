/**
 * OmniStudio Project Runtime Compiler Service
 * Compiles and normalizes a studio_project JSON document into a production-ready runtime definition.
 */
import { projectService } from './projectService.js';
import { scriptService } from './scriptService.js';

export const compilerService = {
  /**
   * Compiles project document into a normalized runtime definition
   */
  compileProject: (project) => {
    if (!project) {
      throw new Error('Invalid project instance');
    }

    const doc = projectService.validateDocument(project.project_document);
    const errors = [];
    const warnings = [];

    // 1. Validate screens
    if (!doc.screens || doc.screens.length === 0) {
      errors.push('Project must contain at least one screen or page');
    }

    const initialScreen = doc.screens.find(s => s.is_initial) || doc.screens[0];
    const screenIds = new Set(doc.screens.map(s => s.id));

    // 2. Validate component tree & navigation references
    (doc.components || []).forEach(comp => {
      if (comp.action && comp.action.type === 'navigate' && comp.action.target_id) {
        if (!screenIds.has(comp.action.target_id)) {
          warnings.push(`Component '${comp.name}' targets non-existent screen '${comp.action.target_id}'`);
        }
      }
    });

    // 3. Validate scripts
    if (doc.scripts && Array.isArray(doc.scripts)) {
      doc.scripts.forEach((scriptItem, idx) => {
        const check = scriptService.validateSyntax(scriptItem.code || '');
        if (!check.valid) {
          errors.push(`Script '${scriptItem.name || idx + 1}' has syntax errors: ${check.errors.join(', ')}`);
        }
      });
    }

    // Return runtime compilation payload
    const runtimeDefinition = {
      project_id: project.id,
      name: project.name,
      project_type: project.project_type || 'Standard Application',
      version: project.version || '1.0',
      compiled_at: new Date().toISOString(),
      initial_screen_id: initialScreen ? initialScreen.id : null,
      theme: doc.theme || { primary_color: '#4F46E5' },
      screens: doc.screens,
      components: doc.components,
      variables: doc.variables || [],
      logic: doc.logic || [],
      scripts: doc.scripts || [],
      settings: doc.settings || {},
      compilation_summary: {
        status: errors.length === 0 ? 'SUCCESS' : 'FAILED',
        error_count: errors.length,
        warning_count: warnings.length,
        errors,
        warnings
      }
    };

    return runtimeDefinition;
  }
};
