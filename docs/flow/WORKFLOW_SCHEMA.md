# I3DION Flow — Workflow Schema & Serialization Specification v1.0
**Document Version:** 1.0 • **Implementation:** [packages/contracts/src/flow.ts](file:///d:/I3DION%20COMPANY%20FILES/i3dion-spatial/I3DION_Spatial/packages/contracts/src/flow.ts)

---

## 1. Schema Philosophy
1. **Strict Versioning:** Every workflow definition contains a `contractVersion: '1.0'` and an incrementing integer `version` field.
2. **Separation of Presentation & Execution Semantics:** Node positions (`{x, y}`) are stored in metadata and do not influence DAG execution topology.
3. **Immutability of Published Runs:** Once a workflow is published, runs execute against an immutable snapshot of that exact version.
4. **Declarative DAGs:** Workflows are directed acyclic graphs. MVP explicitly forbids cyclic execution loops to guarantee termination.

---

## 2. Complete Flow Definition Contract (TypeScript & Zod)

```typescript
export interface FlowDefinition {
  contractVersion: '1.0';
  id: string; // UUID
  organizationId: string; // UUID
  name: string; // 1..120 chars
  description?: string; // Max 500 chars
  status: 'draft' | 'published' | 'paused' | 'archived';
  version: number; // Positive integer

  // 1. Single Primary Trigger
  trigger: {
    id: string;
    type: 'manual' | 'schedule' | 'webhook' | 'event';
    label: string;
    config: Record<string, unknown>;
  };

  // 2. Action & Logic Nodes
  nodes: {
    id: string;
    type: string; // Stable type matching ACTION_REGISTRY
    label: string;
    category: 'trigger' | 'logic' | 'data' | 'communication' | 'documents' | 'catalogs' | 'ecosystem' | 'integration';
    position: { x: number; y: number };
    params: Record<string, unknown>;
    errorPolicy: {
      retryCount: number; // 0..5
      retryIntervalMs: number;
      timeoutSeconds: number; // 1..300
      onError: 'stop' | 'continue';
    };
  }[];

  // 3. Directed Connections
  edges: {
    id: string;
    sourceNodeId: string;
    sourcePortId: string; // 'out', 'true', 'false'
    targetNodeId: string;
    targetPortId: string; // 'in'
  }[];

  // 4. Variables
  variables: {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    default?: unknown;
    description?: string;
  }[];

  // 5. Execution Limits & Retention
  settings: {
    concurrency: number; // Max concurrent executions (1..25)
    timeoutSeconds: number; // Run timeout (5..600)
    retentionDays: number; // Run logs retention (1..365)
  };

  createdAt?: string; // ISO8601
  updatedAt?: string; // ISO8601
}
```

---

## 3. Dynamic Content Mapping & Expression Syntax
Flow parameters can reference prior step outputs using structured chip syntax:
- `{{trigger.contact.email}}` — evaluates against the initial trigger payload.
- `{{nodes.node_1.output.leadScore}}` — evaluates against the output of step `node_1`.
- `{{variables.leadScore}}` — evaluates against the current workflow variable.

### 3.1 Evaluation Rules
- References are resolved in topological order. A node can only reference outputs from nodes that precede it in the DAG.
- Missing fields fail closed (evaluates to `null` or raises a schema validation error if the target parameter is required).
- No arbitrary script execution is permitted; expressions are evaluated via AST traversal.
