export type PropFieldType = 'text' | 'textarea' | 'number' | 'boolean' | 'color' | 'select' | 'asset' | 'list';

export interface PropFieldDefinition {
  name: string;
  label: string;
  type: PropFieldType;
  defaultValue: any;
  options?: { label: string; value: any }[];
  description?: string;
}

export interface BlockSchema {
  type: string;
  title: string;
  description: string;
  category: 'presentation' | '3d' | 'content' | 'conversion' | 'navigation';
  icon: string;
  defaultProps: Record<string, any>;
  fields: PropFieldDefinition[];
  allowedSlots?: string[];
}
