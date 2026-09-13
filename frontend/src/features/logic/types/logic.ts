export type PortDataType =
  | 'EVENT'
  | 'FLOW'
  | 'BOOLEAN'
  | 'STRING'
  | 'NUMBER'
  | 'WIDGET'
  | 'OBJECT'
  | 'ANIMATION'
  | 'ANY';

export type PortDirection = 'input' | 'output';

export type NodeCategory =
  | 'triggers'
  | 'logic'
  | 'conditions'
  | 'actions'
  | 'data'
  | '3d'
  | 'ui'
  | 'utility';

export interface LogicPortDef {
  id: string;
  name: string;
  label: string;
  type: PortDataType;
  direction: PortDirection;
  description?: string;
}

export interface LogicNodeDefinition {
  type: string;
  name: string;
  category: NodeCategory;
  iconName: string;
  description: string;
  version: number;
  defaultProperties: Record<string, any>;
  inputPorts: LogicPortDef[];
  outputPorts: LogicPortDef[];
  suggestedNextNodes?: string[];
  propertySchema?: {
    name: string;
    label: string;
    type: 'text' | 'select' | 'number' | 'boolean' | 'widget_picker' | '3d_object_picker';
    options?: { label: string; value: string }[];
    default?: any;
    description?: string;
  }[];
}

export interface LogicGraphNode {
  id: string;
  type: string;
  name: string;
  position: { x: number; y: number };
  properties: Record<string, any>;
  inputPorts: LogicPortDef[];
  outputPorts: LogicPortDef[];
}

export interface LogicConnection {
  id: string;
  sourceNodeId: string;
  sourcePortId: string;
  targetNodeId: string;
  targetPortId: string;
}

export interface LogicGraph {
  version: number;
  id: string;
  name: string;
  description: string;
  nodes: LogicGraphNode[];
  connections: LogicConnection[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface GraphValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}
