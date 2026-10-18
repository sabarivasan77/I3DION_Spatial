import { z } from 'zod';

// ============================================================================
// 1. LIFECYCLE & STATE SCHEMAS
// ============================================================================

export const FlowStatusSchema = z.enum(['draft', 'published', 'paused', 'archived']);
export type FlowStatus = z.infer<typeof FlowStatusSchema>;

export const FlowRunStatusSchema = z.enum([
  'pending',
  'queued',
  'running',
  'waiting_approval',
  'waiting_delay',
  'succeeded',
  'failed',
  'canceled',
  'timed_out'
]);
export type FlowRunStatus = z.infer<typeof FlowRunStatusSchema>;

export const FlowStepRunStatusSchema = z.enum([
  'pending',
  'running',
  'succeeded',
  'failed',
  'skipped'
]);
export type FlowStepRunStatus = z.infer<typeof FlowStepRunStatusSchema>;

export const FlowNodeTypeCategorySchema = z.enum([
  'trigger',
  'logic',
  'data',
  'communication',
  'documents',
  'catalogs',
  'ecosystem',
  'integration'
]);
export type FlowNodeTypeCategory = z.infer<typeof FlowNodeTypeCategorySchema>;

export const FlowPortDataTypeSchema = z.enum([
  'exec',
  'string',
  'number',
  'boolean',
  'object',
  'array',
  'any'
]);
export type FlowPortDataType = z.infer<typeof FlowPortDataTypeSchema>;

// ============================================================================
// 2. TRIGGER & NODE DEFINITIONS
// ============================================================================

export const FlowTriggerTypeSchema = z.enum([
  'manual',
  'schedule',
  'webhook',
  'event'
]);
export type FlowTriggerType = z.infer<typeof FlowTriggerTypeSchema>;

export const FlowTriggerDefinitionSchema = z.object({
  id: z.string().min(1),
  type: FlowTriggerTypeSchema,
  label: z.string().min(1),
  config: z.record(z.unknown()).default({}),
});
export type FlowTriggerDefinition = z.infer<typeof FlowTriggerDefinitionSchema>;

export const FlowNodePortSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  kind: z.enum(['exec', 'data']),
  type: FlowPortDataTypeSchema,
  required: z.boolean().default(false),
  description: z.string().optional(),
});
export type FlowNodePort = z.infer<typeof FlowNodePortSchema>;

export const FlowNodeErrorPolicySchema = z.object({
  retryCount: z.number().int().min(0).max(5).default(0),
  retryIntervalMs: z.number().int().min(100).max(60000).default(1000),
  timeoutSeconds: z.number().int().min(1).max(300).default(30),
  onError: z.enum(['stop', 'continue']).default('stop'),
});
export type FlowNodeErrorPolicy = z.infer<typeof FlowNodeErrorPolicySchema>;

export const FlowNodeDefinitionSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1).optional(),
  label: z.string().optional(),
  category: FlowNodeTypeCategorySchema.optional(),
  position: z
    .object({
      x: z.number(),
      y: z.number(),
    })
    .optional(),
  params: z.record(z.unknown()).default({}),
  errorPolicy: FlowNodeErrorPolicySchema.default({}),
  data: z.record(z.unknown()).optional(),
});
export type FlowNodeDefinition = z.infer<typeof FlowNodeDefinitionSchema>;

export const FlowEdgeDefinitionSchema = z.object({
  id: z.string().min(1),
  sourceNodeId: z.string().min(1).optional(),
  sourcePortId: z.string().optional().nullable(),
  targetNodeId: z.string().min(1).optional(),
  targetPortId: z.string().optional().nullable(),
  source: z.string().min(1).optional(),
  target: z.string().min(1).optional(),
  sourceHandle: z.string().optional().nullable(),
  targetHandle: z.string().optional().nullable(),
  animated: z.boolean().optional(),
  style: z.record(z.unknown()).optional(),
});
export type FlowEdgeDefinition = z.infer<typeof FlowEdgeDefinitionSchema>;

export const FlowVariableDefinitionSchema = z.object({
  name: z.string().min(1).regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Must be a valid identifier'),
  type: z.enum(['string', 'number', 'boolean', 'object', 'array']),
  default: z.unknown().optional(),
  description: z.string().optional(),
});
export type FlowVariableDefinition = z.infer<typeof FlowVariableDefinitionSchema>;

// ============================================================================
// 3. MASTER FLOW DEFINITION CONTRACT (V1.0)
// ============================================================================

export const FlowSettingsSchema = z.object({
  concurrency: z.number().int().min(1).max(25).default(5),
  timeoutSeconds: z.number().int().min(5).max(600).default(120),
  retentionDays: z.number().int().min(1).max(365).default(30),
});
export type FlowSettings = z.infer<typeof FlowSettingsSchema>;

export const FlowDefinitionSchema = z.object({
  contractVersion: z.literal('1.0').default('1.0'),
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional().default(''),
  status: FlowStatusSchema.default('draft'),
  version: z.number().int().positive().default(1),
  trigger: FlowTriggerDefinitionSchema,
  nodes: z.array(FlowNodeDefinitionSchema).default([]),
  edges: z.array(FlowEdgeDefinitionSchema).default([]),
  variables: z.array(FlowVariableDefinitionSchema).default([]),
  settings: FlowSettingsSchema.default({}),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});
export type FlowDefinition = z.infer<typeof FlowDefinitionSchema>;

// ============================================================================
// 4. EXECUTION RUN & STEP RUN CONTRACTS
// ============================================================================

export const FlowStepRunSchema = z.object({
  stepIndex: z.number().int().min(0),
  nodeId: z.string().min(1),
  nodeType: z.string().min(1),
  status: FlowStepRunStatusSchema,
  input: z.unknown().optional(),
  output: z.unknown().optional(),
  error: z.string().optional().nullable(),
  durationMs: z.number().int().nonnegative().default(0),
  retryAttempt: z.number().int().nonnegative().default(0),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional().nullable(),
});
export type FlowStepRun = z.infer<typeof FlowStepRunSchema>;

export const FlowRunSchema = z.object({
  id: z.string().uuid(),
  flowId: z.string().uuid(),
  flowVersion: z.number().int().positive(),
  organizationId: z.string().uuid(),
  status: FlowRunStatusSchema,
  triggerPayload: z.record(z.unknown()).default({}),
  stepResults: z.array(FlowStepRunSchema).default([]),
  error: z.string().optional().nullable(),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional().nullable(),
});
export type FlowRun = z.infer<typeof FlowRunSchema>;

// ============================================================================
// 5. ACTION REGISTRY DEFINITIONS (CORE MVP NODES)
// ============================================================================

export interface ActionDefinition {
  type: string;
  name: string;
  category: FlowNodeTypeCategory;
  description: string;
  icon: string;
  inputPorts: FlowNodePort[];
  outputPorts: FlowNodePort[];
  paramSchema: z.ZodObject<any>;
  sideEffect: boolean;
  idempotent: boolean;
  requiredPermission?: string;
}

export const ACTION_REGISTRY: Record<string, ActionDefinition> = {
  // --- LOGIC ---
  condition: {
    type: 'condition',
    name: 'Condition (If / Else)',
    category: 'logic',
    description: 'Branches workflow execution based on typed expression comparison.',
    icon: 'GitBranch',
    inputPorts: [{ id: 'in', name: 'In', kind: 'exec', type: 'exec', required: true }],
    outputPorts: [
      { id: 'true', name: 'True', kind: 'exec', type: 'exec', required: true },
      { id: 'false', name: 'False', kind: 'exec', type: 'exec', required: true },
    ],
    paramSchema: z.object({
      field: z.string().min(1),
      operator: z.enum(['equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'is_empty']),
      value: z.unknown(),
    }),
    sideEffect: false,
    idempotent: true,
  },
  delay: {
    type: 'delay',
    name: 'Delay',
    category: 'logic',
    description: 'Pauses workflow execution for a specified duration in seconds.',
    icon: 'Clock',
    inputPorts: [{ id: 'in', name: 'In', kind: 'exec', type: 'exec', required: true }],
    outputPorts: [{ id: 'out', name: 'Out', kind: 'exec', type: 'exec', required: true }],
    paramSchema: z.object({
      durationSeconds: z.number().int().min(1).max(86400),
    }),
    sideEffect: false,
    idempotent: true,
  },
  terminate: {
    type: 'terminate',
    name: 'Terminate Flow',
    category: 'logic',
    description: 'Ends workflow run immediately with specified status and reason.',
    icon: 'StopCircle',
    inputPorts: [{ id: 'in', name: 'In', kind: 'exec', type: 'exec', required: true }],
    outputPorts: [],
    paramSchema: z.object({
      status: z.enum(['succeeded', 'failed', 'canceled']),
      reason: z.string().optional(),
    }),
    sideEffect: false,
    idempotent: true,
  },

  // --- DATA ---
  compose: {
    type: 'compose',
    name: 'Compose Message',
    category: 'data',
    description: 'Creates a structured string or object from previous step outputs.',
    icon: 'Layers',
    inputPorts: [{ id: 'in', name: 'In', kind: 'exec', type: 'exec', required: true }],
    outputPorts: [{ id: 'out', name: 'Out', kind: 'exec', type: 'exec', required: true }],
    paramSchema: z.object({
      template: z.string().min(1),
    }),
    sideEffect: false,
    idempotent: true,
  },
  set_variable: {
    type: 'set_variable',
    name: 'Set Variable',
    category: 'data',
    description: 'Updates the value of a declared workflow variable.',
    icon: 'Sliders',
    inputPorts: [{ id: 'in', name: 'In', kind: 'exec', type: 'exec', required: true }],
    outputPorts: [{ id: 'out', name: 'Out', kind: 'exec', type: 'exec', required: true }],
    paramSchema: z.object({
      variableName: z.string().min(1),
      value: z.unknown(),
    }),
    sideEffect: false,
    idempotent: true,
  },

  // --- COMMUNICATION ---
  send_email: {
    type: 'send_email',
    name: 'Send Permitted Email',
    category: 'communication',
    description: 'Dispatches a templated email with consent and suppression checks.',
    icon: 'Mail',
    inputPorts: [{ id: 'in', name: 'In', kind: 'exec', type: 'exec', required: true }],
    outputPorts: [{ id: 'out', name: 'Out', kind: 'exec', type: 'exec', required: true }],
    paramSchema: z.object({
      recipientEmail: z.string().min(1),
      subject: z.string().min(1),
      templateKey: z.string().optional(),
      body: z.string().min(1),
    }),
    sideEffect: true,
    idempotent: false,
    requiredPermission: 'flow.send_email',
  },
  send_notification: {
    type: 'send_notification',
    name: 'Send In-App Notification',
    category: 'communication',
    description: 'Creates a persistent notification in the recipient team notification inbox.',
    icon: 'Bell',
    inputPorts: [{ id: 'in', name: 'In', kind: 'exec', type: 'exec', required: true }],
    outputPorts: [{ id: 'out', name: 'Out', kind: 'exec', type: 'exec', required: true }],
    paramSchema: z.object({
      title: z.string().min(1),
      body: z.string().min(1),
      actionUrl: z.string().optional(),
    }),
    sideEffect: true,
    idempotent: true,
  },

  // --- ECOSYSTEM (LEADS & VAULT) ---
  auto_assign_lead: {
    type: 'auto_assign_lead',
    name: 'Assign Lead & Set Score',
    category: 'ecosystem',
    description: 'Assigns canonical lead to team member and updates lead status.',
    icon: 'Users',
    inputPorts: [{ id: 'in', name: 'In', kind: 'exec', type: 'exec', required: true }],
    outputPorts: [{ id: 'out', name: 'Out', kind: 'exec', type: 'exec', required: true }],
    paramSchema: z.object({
      leadId: z.string().min(1),
      assignedToUserId: z.string().optional(),
      status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'OPPORTUNITY', 'WON', 'LOST']).optional(),
      scoreDelta: z.number().int().optional(),
    }),
    sideEffect: true,
    idempotent: true,
    requiredPermission: 'leads.manage',
  },
  webhook_dispatch: {
    type: 'webhook_dispatch',
    name: 'Dispatch to Outbox / Webhook',
    category: 'integration',
    description: 'Enqueues transactional outbox event for external webhook dispatch.',
    icon: 'Send',
    inputPorts: [{ id: 'in', name: 'In', kind: 'exec', type: 'exec', required: true }],
    outputPorts: [{ id: 'out', name: 'Out', kind: 'exec', type: 'exec', required: true }],
    paramSchema: z.object({
      eventType: z.string().min(1),
      destinationUrl: z.string().url().optional(),
      payload: z.record(z.unknown()).default({}),
    }),
    sideEffect: true,
    idempotent: true,
  },
};

// ============================================================================
// 6. GRAPH DAG & CYCLE VALIDATION UTILITIES
// ============================================================================

export interface GraphValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateFlowDAG(flow: FlowDefinition): GraphValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const nodeMap = new Map<string, FlowNodeDefinition>();
  for (const node of flow.nodes) {
    if (nodeMap.has(node.id)) {
      errors.push(`Duplicate node identifier found: "${node.id}"`);
    }
    nodeMap.set(node.id, node);
  }

  // Edge referential integrity
  const adjacency = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  for (const node of flow.nodes) {
    adjacency.set(node.id, []);
    inDegree.set(node.id, 0);
  }

  for (const edge of (flow.edges as any[])) {
    const sourceId = edge.sourceNodeId || edge.source;
    const targetId = edge.targetNodeId || edge.target;

    if (!sourceId || !nodeMap.has(sourceId)) {
      errors.push(`Edge "${edge.id}" references non-existent source node "${sourceId}"`);
    }
    if (!targetId || !nodeMap.has(targetId)) {
      errors.push(`Edge "${edge.id}" references non-existent target node "${targetId}"`);
    }
    if (sourceId && targetId && sourceId === targetId) {
      errors.push(`Self-referencing cycle detected on node "${sourceId}"`);
    }

    if (sourceId && adjacency.has(sourceId)) {
      adjacency.get(sourceId)!.push(targetId);
    }
    if (targetId && inDegree.has(targetId)) {
      inDegree.set(targetId, (inDegree.get(targetId) || 0) + 1);
    }
  }

  // Cycle detection via Kahn's algorithm (topological sort)
  if (errors.length === 0 && flow.nodes.length > 0) {
    const queue: string[] = [];
    const localInDegree = new Map(inDegree);

    for (const [nodeId, degree] of localInDegree.entries()) {
      if (degree === 0) queue.push(nodeId);
    }

    let visitedCount = 0;
    while (queue.length > 0) {
      const current = queue.shift()!;
      visitedCount++;

      for (const neighbor of adjacency.get(current) || []) {
        const nextDegree = localInDegree.get(neighbor)! - 1;
        localInDegree.set(neighbor, nextDegree);
        if (nextDegree === 0) queue.push(neighbor);
      }
    }

    if (visitedCount < flow.nodes.length) {
      errors.push('Cycle detected in workflow graph. Cycles are forbidden in MVP workflows.');
    }
  }

  // Check for orphan nodes
  if (flow.nodes.length > 1) {
    for (const node of flow.nodes) {
      const incoming = inDegree.get(node.id) || 0;
      const outgoing = (adjacency.get(node.id) || []).length;
      if (incoming === 0 && outgoing === 0) {
        warnings.push(`Node "${node.label}" (${node.id}) is disconnected from the workflow.`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
