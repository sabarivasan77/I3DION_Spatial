import { schemaService } from './schemaService.js';

export const formService = {
  /**
   * Auto-generate a low-code form configuration from a dataset schema
   */
  generateFormConfig: async (datasetKey, organizationId, options = {}) => {
    const schema = await schemaService.getDatasetSchema(datasetKey, organizationId);
    
    const formFields = (schema.fields || [])
      .filter((f) => !f.is_readonly || f.field_name === 'status')
      .map((f, idx) => ({
        id: `form-field-${f.field_name}`,
        field_name: f.field_name,
        label: f.display_name,
        input_type: formService.mapFieldToInputType(f.field_type),
        is_required: f.is_required,
        default_value: f.default_value ?? '',
        placeholder: f.placeholder || `Enter ${f.display_name}`,
        options: f.options || [],
        order: idx + 1,
        validation: {
          required: f.is_required,
          pattern: f.field_type === 'Email' ? '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$' : null
        }
      }));

    return {
      dataset_key: datasetKey,
      form_title: options.title || `${schema.name} Entry Form`,
      form_description: options.description || `Submit and record data directly into ${schema.name}`,
      submit_button_text: options.submit_text || 'Submit Record',
      layout: options.layout || 'single_column',
      fields: formFields
    };
  },

  /**
   * Map schema field types to UI input control types
   */
  mapFieldToInputType: (fieldType) => {
    switch (fieldType) {
      case 'Long Text': return 'textarea';
      case 'Number':
      case 'Decimal':
      case 'Currency': return 'number';
      case 'Boolean': return 'checkbox';
      case 'Choice':
      case 'Status': return 'select';
      case 'MultiChoice': return 'multiselect';
      case 'Date': return 'date';
      case 'DateTime': return 'datetime';
      case 'Email': return 'email';
      case 'URL':
      case 'File':
      case 'Image': return 'url';
      default: return 'text';
    }
  }
};
