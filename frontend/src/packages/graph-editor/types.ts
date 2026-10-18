import type { Node, Edge } from '@xyflow/react';

export type PortType = 'exec' | 'data' | 'vector3' | 'boolean' | 'number' | 'string';

export interface PortDefinition {
  id: string;
  name: string;
  type: PortType;
  defaultValue?: any;
}

export interface CircuitChipData {
  chipType: 'event' | 'action' | 'transform' | 'condition' | 'variable' | 'math';
  label: string;
  category: string;
  inputs: PortDefinition[];
  outputs: PortDefinition[];
  state?: Record<string, any>;
  icon?: string;
  description?: string;
}

export type CircuitNode = Node<CircuitChipData>;
export type CircuitEdge = Edge;
