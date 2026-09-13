import React from 'react';

export type WidgetCategory =
  | 'BASIC'
  | 'LAYOUT'
  | 'MEDIA'
  | 'FORM'
  | 'DATA'
  | '3D / SPATIAL'
  | 'NAVIGATION'
  | 'FEEDBACK'
  | 'ADVANCED'
  | 'layout'
  | 'content'
  | 'media'
  | 'interactive'
  | 'product'
  | '3d'
  | 'ar'
  | 'forms'
  | 'utility';

export type PropertyControlType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'color'
  | 'select'
  | 'boolean'
  | 'image'
  | 'range';

export interface PropertyOption {
  label: string;
  value: string | number;
}

export type PropertyGroupCategory =
  | 'content'
  | 'layout'
  | 'style'
  | 'behaviour'
  | 'data'
  | 'accessibility'
  | 'general'
  | 'typography'
  | 'appearance';

export interface PropertySchemaItem {
  name: string;
  label: string;
  type: PropertyControlType;
  category?: PropertyGroupCategory;
  default?: any;
  options?: PropertyOption[];
  min?: number;
  max?: number;
  step?: number;
  description?: string;
}

export interface PropertySchemaGroup {
  title: string;
  category?: PropertyGroupCategory;
  properties: PropertySchemaItem[];
}

export interface WidgetEventDef {
  name: string;
  label: string;
  description?: string;
}

export interface WidgetActionDef {
  event: string;
  sourceWidgetId: string;
  targetAction?: string;
  parameters?: Record<string, any>;
}

export interface StudioWidgetNode {
  id: string;
  type: string;
  name: string;
  properties: Record<string, any>;
  children?: StudioWidgetNode[];
  parentId?: string | null;
  events?: WidgetActionDef[];
  metadata?: Record<string, any>;
  locked?: boolean;
  hidden?: boolean;
  isGroup?: boolean;
}

export interface WidgetRendererProps {
  node: StudioWidgetNode;
  isSelected: boolean;
  isPreview: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onUpdateProps?: (updatedProps: Record<string, any>) => void;
}

export interface WidgetDefinition {
  type: string;
  displayName: string;
  category: WidgetCategory;
  iconName: string;
  version: string;
  description: string;
  defaultProperties: Record<string, any>;
  propertySchema: PropertySchemaGroup[];
  events?: WidgetEventDef[];
  component: React.ComponentType<WidgetRendererProps>;
}

export type CanvasViewport = 'desktop' | 'tablet' | 'mobile';

export interface ExperienceSchema {
  version: number;
  id: string;
  name: string;
  description?: string;
  canvas: {
    viewport: CanvasViewport;
    width: number;
    height: number;
    backgroundColor: string;
  };
  widgets: StudioWidgetNode[];
  createdAt: string;
  updatedAt: string;
}

export type TemplateCategory = 'product' | '3d' | 'sales' | 'custom';
export type TemplateAccessLevel = 'free' | 'premium';

export interface TemplatePreviewMetadata {
  tags: string[];
  icon: string;
  themeColor: string;
  thumbnailUrl?: string;
}

export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  useCase: string;
  version: number;
  access: TemplateAccessLevel;
  previewMetadata: TemplatePreviewMetadata;
  canvasConfig: {
    viewport: CanvasViewport;
    width: number;
    height: number;
    backgroundColor: string;
  };
  initialWidgetTree: StudioWidgetNode[];
  supportedCapabilities: string[];
}

export interface TemplateValidationResult {
  valid: boolean;
  errors: string[];
}

