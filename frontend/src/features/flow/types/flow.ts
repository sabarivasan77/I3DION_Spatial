import type { Node, Edge } from '@xyflow/react';

export type FlowCategory =
  | 'trigger'
  | 'logic'
  | 'data'
  | 'communication'
  | 'documents'
  | 'catalogs'
  | 'ecosystem'
  | 'integration';

export type ExecutionState = 'idle' | 'running' | 'succeeded' | 'failed' | 'skipped';

export interface FlowNodeData extends Record<string, unknown> {
  label: string;
  type: string;
  category: FlowCategory;
  params: Record<string, any>;
  errorPolicy?: {
    retryCount: number;
    timeoutSeconds: number;
    onError: 'stop' | 'continue';
  };
  executionStatus?: ExecutionState;
  durationMs?: number;
  outputSummary?: string;
  error?: string;
}

export type CustomFlowNode = Node<FlowNodeData, string>;
export type CustomFlowEdge = Edge;

export interface FlowVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  default?: any;
  description?: string;
}

export interface FlowDocument {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'published' | 'paused' | 'archived';
  version: number;
  trigger: {
    id: string;
    type: string;
    label: string;
    config: Record<string, any>;
  };
  nodes: CustomFlowNode[];
  edges: CustomFlowEdge[];
  variables: FlowVariable[];
  settings: {
    concurrency: number;
    timeoutSeconds: number;
    retentionDays: number;
  };
}

export interface StepTelemetry {
  nodeId: string;
  nodeType: string;
  status: ExecutionState;
  durationMs: number;
  output?: any;
  error?: string;
}

export interface TestRunResult {
  runId: string;
  flowId: string;
  status: 'completed' | 'failed';
  totalDurationMs: number;
  steps: StepTelemetry[];
  error?: string;
}
