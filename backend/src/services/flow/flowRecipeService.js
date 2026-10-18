import crypto from 'node:crypto';
import { withTenant } from '../../db/pool.js';
import { createFlow, getFlowById } from './flowPersistenceService.js';

/**
 * Standard Industrial Recipes for I3DION Spatial Commerce & Engineering
 */
export const INDUSTRIAL_RECIPES = [
  {
    key: 'rfq_lead_qualification',
    name: '3D RFQ Lead Scoring & Instant Spec Sheet',
    description:
      'Triggers when a buyer submits an RFQ from a 3D digital twin. Evaluates inspection dwell time, prioritizes VIP accounts in CRM, and delivers an instant technical CAD spec sheet.',
    triggerType: 'trigger_event',
    category: 'Commercial',
    tags: ['3D RFQ', 'Lead Scoring', 'CAD Spec', 'CRM'],
    nodeCount: 5,
    triggerConfig: { eventName: 'spatial.rfq.submitted' },
    flowDefinition: {
      schemaVersion: '1.0',
      nodes: [
        {
          id: 'node_trigger',
          type: 'trigger_event',
          position: { x: 250, y: 50 },
          data: {
            label: '3D RFQ Submitted',
            category: 'trigger',
            params: { eventName: 'spatial.rfq.submitted' },
          },
        },
        {
          id: 'node_condition',
          type: 'condition',
          position: { x: 250, y: 180 },
          data: {
            label: 'High-Intent Dwell Time Check',
            category: 'logic',
            params: {
              field: 'dwellTimeSec',
              operator: 'greater_than',
              value: 45,
            },
          },
        },
        {
          id: 'node_vip_lead',
          type: 'crm_create_lead',
          position: { x: 100, y: 320 },
          data: {
            label: 'Create VIP Lead in CRM',
            category: 'action',
            params: {
              company: '{{trigger.company}}',
              contactName: '{{trigger.contactName}}',
              email: '{{trigger.email}}',
              leadScore: 90,
              isVIP: true,
            },
          },
        },
        {
          id: 'node_pdf_spec',
          type: 'pdf_spec_generator',
          position: { x: 100, y: 460 },
          data: {
            label: 'Generate 3D PDF Spec Sheet',
            category: 'action',
            params: {
              productName: '{{trigger.productName}}',
              includeEngineeringDrawings: true,
            },
          },
        },
        {
          id: 'node_standard_lead',
          type: 'crm_create_lead',
          position: { x: 420, y: 320 },
          data: {
            label: 'Log Standard Inquirer',
            category: 'action',
            params: {
              company: '{{trigger.company}}',
              contactName: '{{trigger.contactName}}',
              email: '{{trigger.email}}',
              leadScore: 35,
              isVIP: false,
            },
          },
        },
      ],
      edges: [
        { id: 'edge_1', source: 'node_trigger', target: 'node_condition' },
        { id: 'edge_2', source: 'node_condition', target: 'node_vip_lead', sourceHandle: 'true' },
        { id: 'edge_3', source: 'node_vip_lead', target: 'node_pdf_spec' },
        { id: 'edge_4', source: 'node_condition', target: 'node_standard_lead', sourceHandle: 'false' },
      ],
    },
  },
  {
    key: 'hotspot_dwell_alert',
    name: 'Interactive Hotspot Dwell Alert & Slack Notification',
    description:
      'Fires when high-interest components (e.g. materials, tolerance pins) are inspected in 3D. Alerts the sales engineering team with session telemetry.',
    triggerType: 'trigger_event',
    category: 'Engineering',
    tags: ['Hotspot', 'Telemetry', 'Slack', 'Alerts'],
    nodeCount: 3,
    triggerConfig: { eventName: 'spatial.hotspot.clicked' },
    flowDefinition: {
      schemaVersion: '1.0',
      nodes: [
        {
          id: 'node_trigger',
          type: 'trigger_event',
          position: { x: 250, y: 60 },
          data: {
            label: 'Hotspot Pin Clicked',
            category: 'trigger',
            params: { eventName: 'spatial.hotspot.clicked' },
          },
        },
        {
          id: 'node_condition',
          type: 'condition',
          position: { x: 250, y: 190 },
          data: {
            label: 'Is Critical Component',
            category: 'logic',
            params: {
              field: 'isCritical',
              operator: 'equals',
              value: true,
            },
          },
        },
        {
          id: 'node_notify',
          type: 'send_notification',
          position: { x: 250, y: 330 },
          data: {
            label: 'Alert Sales Engineer',
            category: 'action',
            params: {
              title: 'Critical Hotspot Inspected',
              message: 'Prospect inspected component {{trigger.hotspotTitle}} on model {{trigger.productName}}',
              type: 'alert',
            },
          },
        },
      ],
      edges: [
        { id: 'edge_1', source: 'node_trigger', target: 'node_condition' },
        { id: 'edge_2', source: 'node_condition', target: 'node_notify', sourceHandle: 'true' },
      ],
    },
  },
  {
    key: 'cad_proposal_dispatcher',
    name: 'Automated CAD Proposal & Spec Sheet Emailer',
    description:
      'Instantly renders technical product dimensions and CAD specification sheets upon quotation request, sending a direct email to the procurement agent.',
    triggerType: 'trigger_event',
    category: 'Sales Automation',
    tags: ['CAD', 'Email', 'PDF', 'Instant Quote'],
    nodeCount: 3,
    triggerConfig: { eventName: 'spatial.quote.requested' },
    flowDefinition: {
      schemaVersion: '1.0',
      nodes: [
        {
          id: 'node_trigger',
          type: 'trigger_event',
          position: { x: 250, y: 60 },
          data: {
            label: 'Quote Requested',
            category: 'trigger',
            params: { eventName: 'spatial.quote.requested' },
          },
        },
        {
          id: 'node_pdf',
          type: 'pdf_spec_generator',
          position: { x: 250, y: 200 },
          data: {
            label: 'Generate CAD Spec Sheet',
            category: 'action',
            params: {
              productName: '{{trigger.productName}}',
              includeEngineeringDrawings: true,
            },
          },
        },
        {
          id: 'node_email',
          type: 'send_email',
          position: { x: 250, y: 340 },
          data: {
            label: 'Dispatch Proposal Email',
            category: 'communication',
            params: {
              to: '{{trigger.email}}',
              subject: 'Your 3D CAD Technical Proposal & Specification Sheet',
              body: 'Thank you for your interest in {{trigger.productName}}. Attached is your verified engineering specification document.',
            },
          },
        },
      ],
      edges: [
        { id: 'edge_1', source: 'node_trigger', target: 'node_pdf' },
        { id: 'edge_2', source: 'node_pdf', target: 'node_email' },
      ],
    },
  },
  {
    key: 'inventory_webhook_sync',
    name: 'Transactional Outbox Webhook Dispatcher',
    description:
      'Listens for spatial commerce events and dispatches an HMAC-signed transactional webhook to external ERP/CRM systems with SSRF protection.',
    triggerType: 'trigger_webhook',
    category: 'Integrations',
    tags: ['ERP Sync', 'Webhook', 'SSRF Safe', 'HMAC'],
    nodeCount: 2,
    triggerConfig: { webhookPath: '/hooks/inventory' },
    flowDefinition: {
      schemaVersion: '1.0',
      nodes: [
        {
          id: 'node_trigger',
          type: 'trigger_webhook',
          position: { x: 250, y: 60 },
          data: {
            label: 'Inbound Inventory Event',
            category: 'trigger',
            params: { webhookPath: '/hooks/inventory' },
          },
        },
        {
          id: 'node_outbox',
          type: 'outbox_webhook',
          position: { x: 250, y: 220 },
          data: {
            label: 'Dispatch Secure Webhook',
            category: 'integration',
            params: {
              destinationUrl: 'https://api.partner-erp.com/webhooks/spatial-inventory',
              retryAttempts: 3,
            },
          },
        },
      ],
      edges: [
        { id: 'edge_1', source: 'node_trigger', target: 'node_outbox' },
      ],
    },
  },
];

/**
 * 1. List available pre-built industrial recipes
 */
export function listRecipes() {
  return INDUSTRIAL_RECIPES.map(({ flowDefinition, ...meta }) => meta);
}

/**
 * 2. Get single recipe by key
 */
export function getRecipe(key) {
  const recipe = INDUSTRIAL_RECIPES.find((r) => r.key === key);
  if (!recipe) {
    throw new Error(`Recipe with key "${key}" not found`);
  }
  return recipe;
}

/**
 * 3. Instantiate a recipe into a new draft workflow for the organization
 */
export async function instantiateRecipe(organizationId, userId, recipeKey, nameOverride = null) {
  const recipe = getRecipe(recipeKey);

  // Clone flowDefinition with regenerated node & edge IDs to prevent ID clash
  const idMap = new Map();
  const clonedNodes = recipe.flowDefinition.nodes.map((n) => {
    const newId = `node_${crypto.randomUUID().slice(0, 8)}`;
    idMap.set(n.id, newId);
    return {
      ...n,
      id: newId,
    };
  });

  const clonedEdges = recipe.flowDefinition.edges.map((e) => {
    return {
      ...e,
      id: `edge_${crypto.randomUUID().slice(0, 8)}`,
      source: idMap.get(e.source) || e.source,
      target: idMap.get(e.target) || e.target,
    };
  });

  const newFlow = await createFlow({
    organizationId,
    ownerId: userId,
    name: nameOverride || recipe.name,
    description: recipe.description,
    triggerType: recipe.triggerType,
    triggerConfig: recipe.triggerConfig,
    flowDefinition: {
      schemaVersion: '1.0',
      nodes: clonedNodes,
      edges: clonedEdges,
    },
  });

  return newFlow;
}

/**
 * 4. Export sanitized flow definition bundle
 */
export async function exportFlowDefinition(organizationId, flowId) {
  const flow = await getFlowById(organizationId, flowId);
  if (!flow) {
    throw new Error(`Flow not found or access denied (ID: ${flowId})`);
  }

  const def = flow.flow_definition || {};

  // Sanitize nodes (remove internal runtime outputs, sensitive tokens, or tenant IDs)
  const sanitizedNodes = (def.nodes || []).map((node) => {
    const params = { ...(node.data?.params || {}) };
    // Scrub any potential credential fields
    delete params.apiKey;
    delete params.password;
    delete params.secret;
    delete params.token;

    return {
      id: node.id,
      type: node.type || node.data?.type || 'action',
      label: node.data?.label || node.label || 'Action Step',
      category: node.data?.category || node.category || 'action',
      position: node.position || { x: 100, y: 100 },
      data: {
        label: node.data?.label || node.label || 'Action Step',
        type: node.data?.type || node.type || 'action',
        category: node.data?.category || node.category || 'action',
        params,
      },
    };
  });

  const sanitizedEdges = (def.edges || []).map((edge) => ({
    id: edge.id,
    source: edge.source || edge.sourceNodeId,
    target: edge.target || edge.targetNodeId,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
  }));

  return {
    $schema: 'https://i3dion.com/schemas/flow/v1.0.json',
    schemaVersion: '1.0',
    product: 'I3DION Flow',
    exportedAt: new Date().toISOString(),
    flow: {
      name: flow.name,
      description: flow.description || '',
      triggerType: flow.trigger_type || 'trigger_manual',
      triggerConfig: flow.trigger_config || {},
      flowDefinition: {
        schemaVersion: '1.0',
        nodes: sanitizedNodes,
        edges: sanitizedEdges,
      },
    },
  };
}

/**
 * 5. Import and validate flow definition bundle
 */
export async function importFlowDefinition(organizationId, userId, importPackage) {
  if (!importPackage || typeof importPackage !== 'object') {
    throw new Error('Invalid import package: Must be a valid JSON object');
  }

  const flowData = importPackage.flow || importPackage;
  if (!flowData.name) {
    throw new Error('Import validation failed: Flow "name" is required');
  }

  const flowDef = flowData.flowDefinition || {};
  const nodes = flowDef.nodes || [];
  const edges = flowDef.edges || [];

  if (!Array.isArray(nodes) || nodes.length === 0) {
    throw new Error('Import validation failed: Flow must contain at least one node');
  }

  // Validate DAG: Cycle detection via Kahn's algorithm
  const nodeMap = new Map();
  const inDegree = new Map();
  const adjacency = new Map();

  for (const n of nodes) {
    nodeMap.set(n.id, n);
    inDegree.set(n.id, 0);
    adjacency.set(n.id, []);
  }

  for (const e of edges) {
    const src = e.source || e.sourceNodeId;
    const tgt = e.target || e.targetNodeId;

    if (!nodeMap.has(src)) {
      throw new Error(`Import validation failed: Edge references missing source node "${src}"`);
    }
    if (!nodeMap.has(tgt)) {
      throw new Error(`Import validation failed: Edge references missing target node "${tgt}"`);
    }
    if (src === tgt) {
      throw new Error(`Import validation failed: Self-referencing cycle on node "${src}"`);
    }

    adjacency.get(src).push(tgt);
    inDegree.set(tgt, (inDegree.get(tgt) || 0) + 1);
  }

  // Topological sort
  const queue = [];
  for (const [id, deg] of inDegree.entries()) {
    if (deg === 0) queue.push(id);
  }

  let visited = 0;
  while (queue.length > 0) {
    const curr = queue.shift();
    visited++;
    for (const neighbor of adjacency.get(curr) || []) {
      const nextDeg = inDegree.get(neighbor) - 1;
      inDegree.set(neighbor, nextDeg);
      if (nextDeg === 0) queue.push(neighbor);
    }
  }

  if (visited < nodes.length) {
    throw new Error('Import validation failed: Cyclic dependency detected in workflow nodes');
  }

  // Regenerate UUIDs to guarantee no duplicate key collisions
  const idMap = new Map();
  const importedNodes = nodes.map((n) => {
    const freshId = `node_${crypto.randomUUID().slice(0, 8)}`;
    idMap.set(n.id, freshId);
    return {
      ...n,
      id: freshId,
    };
  });

  const importedEdges = edges.map((e) => ({
    ...e,
    id: `edge_${crypto.randomUUID().slice(0, 8)}`,
    source: idMap.get(e.source || e.sourceNodeId),
    target: idMap.get(e.target || e.targetNodeId),
  }));

  const created = await createFlow({
    organizationId,
    ownerId: userId,
    name: `${flowData.name} (Imported)`,
    description: flowData.description || 'Imported flow package',
    triggerType: flowData.triggerType || 'trigger_manual',
    triggerConfig: flowData.triggerConfig || {},
    flowDefinition: {
      schemaVersion: '1.0',
      nodes: importedNodes,
      edges: importedEdges,
    },
  });

  return created;
}
