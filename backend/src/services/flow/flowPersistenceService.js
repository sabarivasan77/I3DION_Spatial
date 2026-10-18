import { withTenant, query } from '../../db/pool.js';
import { validateFlowDAG } from '../../../../packages/contracts/src/flow.ts';
import { assertFlowCreationQuota } from '../billing/quotaService.js';

/**
 * Flow Persistence Service (Phase 2 Foundation)
 * Multi-tenant PostgreSQL persistence with versioning, validation, and audit trail.
 */

export async function createFlow({
  organizationId,
  ownerId = null,
  name,
  description = '',
  triggerType = 'manual',
  triggerConfig = {},
  flowDefinition = null,
}) {
  if (!name || typeof name !== 'string') {
    throw new Error('Flow name is required');
  }

  // Commercial Readiness: Strict server-side creation quota check
  await assertFlowCreationQuota(organizationId);

  const defaultDefinition = flowDefinition || {
    trigger: {
      id: 'trig_1',
      type: triggerType,
      label: 'Manual Trigger',
      config: triggerConfig,
    },
    nodes: [],
    edges: [],
    variables: [],
    settings: { concurrency: 5, timeoutSeconds: 120, retentionDays: 30 },
  };

  // Graph validation if nodes exist
  if (defaultDefinition.nodes && defaultDefinition.nodes.length > 0) {
    const val = validateFlowDAG(defaultDefinition);
    if (!val.valid) {
      throw new Error(`Invalid workflow graph: ${val.errors.join('; ')}`);
    }
  }

  return withTenant(organizationId, async (client) => {
    const res = await client.query(
      `INSERT INTO flows (
        organization_id, owner_id, name, description, status, version,
        trigger_type, trigger_config, flow_definition
      ) VALUES ($1, $2, $3, $4, 'draft', 1, $5, $6, $7)
      RETURNING *`,
      [
        organizationId,
        ownerId,
        name.trim(),
        description ? description.trim() : '',
        triggerType,
        JSON.stringify(triggerConfig),
        JSON.stringify(defaultDefinition),
      ]
    );

    const flow = res.rows[0];

    // Audit log
    try {
      await client.query(
        `INSERT INTO audit_logs (organization_id, user_id, action, entity_type, entity_id, details)
         VALUES ($1, $2, 'create', 'flow', $3, $4)`,
        [organizationId, ownerId, flow.id, JSON.stringify({ name: flow.name, version: flow.version })]
      );
    } catch {
      // Non-blocking audit log
    }

    return flow;
  });
}

export async function getFlowById(organizationId, flowId) {
  return withTenant(organizationId, async (client) => {
    const res = await client.query(
      `SELECT f.*, u.name as owner_name, u.email as owner_email
       FROM flows f
       LEFT JOIN users u ON f.owner_id = u.id
       WHERE f.id = $1 AND f.organization_id = $2`,
      [flowId, organizationId]
    );
    return res.rows[0] || null;
  });
}

export async function listFlows(organizationId, { status = null, search = null, limit = 50, offset = 0 } = {}) {
  return withTenant(organizationId, async (client) => {
    const conditions = ['f.organization_id = $1'];
    const params = [organizationId];
    let idx = 2;

    if (status && status !== 'all') {
      conditions.push(`f.status = $${idx++}`);
      params.push(status);
    }

    if (search && search.trim()) {
      conditions.push(`(f.name ILIKE $${idx} OR f.description ILIKE $${idx})`);
      params.push(`%${search.trim()}%`);
      idx++;
    }

    params.push(limit);
    const limitIdx = idx++;
    params.push(offset);
    const offsetIdx = idx++;

    const res = await client.query(
      `SELECT f.*, u.name as owner_name,
        (SELECT COUNT(*)::int FROM flow_runs r WHERE r.flow_id = f.id) as total_runs_count,
        (SELECT started_at FROM flow_runs r WHERE r.flow_id = f.id ORDER BY started_at DESC LIMIT 1) as last_run_at
       FROM flows f
       LEFT JOIN users u ON f.owner_id = u.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY f.updated_at DESC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      params
    );

    return res.rows;
  });
}

export async function updateFlow(organizationId, flowId, updates) {
  return withTenant(organizationId, async (client) => {
    // 1. Fetch current flow
    const currentRes = await client.query(
      `SELECT * FROM flows WHERE id = $1 AND organization_id = $2`,
      [flowId, organizationId]
    );
    const current = currentRes.rows[0];
    if (!current) {
      throw new Error(`Flow ${flowId} not found`);
    }

    const name = updates.name !== undefined ? updates.name.trim() : current.name;
    const description = updates.description !== undefined ? updates.description : current.description;
    const triggerType = updates.triggerType !== undefined ? updates.triggerType : current.trigger_type;
    const triggerConfig = updates.triggerConfig !== undefined ? updates.triggerConfig : current.trigger_config;
    const flowDefinition = updates.flowDefinition !== undefined ? updates.flowDefinition : current.flow_definition;
    const status = updates.status !== undefined ? updates.status : current.status;

    // Validate graph if updated
    if (flowDefinition && flowDefinition.nodes && flowDefinition.nodes.length > 0) {
      const val = validateFlowDAG(flowDefinition);
      if (!val.valid) {
        throw new Error(`Invalid workflow graph: ${val.errors.join('; ')}`);
      }
    }

    const res = await client.query(
      `UPDATE flows
       SET name = $1, description = $2, trigger_type = $3, trigger_config = $4,
           flow_definition = $5, status = $6, updated_at = now()
       WHERE id = $7 AND organization_id = $8
       RETURNING *`,
      [
        name,
        description,
        triggerType,
        JSON.stringify(triggerConfig),
        JSON.stringify(flowDefinition),
        status,
        flowId,
        organizationId,
      ]
    );

    return res.rows[0];
  });
}

export async function publishFlow(organizationId, flowId, authorId = null, changeSummary = 'Published new version') {
  return withTenant(organizationId, async (client) => {
    const currentRes = await client.query(
      `SELECT * FROM flows WHERE id = $1 AND organization_id = $2`,
      [flowId, organizationId]
    );
    const flow = currentRes.rows[0];
    if (!flow) {
      throw new Error(`Flow ${flowId} not found`);
    }

    const definition = typeof flow.flow_definition === 'string'
      ? JSON.parse(flow.flow_definition)
      : flow.flow_definition;

    // Validation gate: cannot publish invalid DAG
    if (definition && definition.nodes && definition.nodes.length > 0) {
      const val = validateFlowDAG(definition);
      if (!val.valid) {
        throw new Error(`Cannot publish flow with graph errors: ${val.errors.join('; ')}`);
      }
    }

    const newVersionNumber = (flow.version || 1);

    // 1. Create immutable snapshot in flow_versions
    await client.query(
      `INSERT INTO flow_versions (
        flow_id, organization_id, version_number, author_id, change_summary, flow_definition
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (flow_id, version_number)
      DO UPDATE SET flow_definition = $6, change_summary = $5, published_at = now()`,
      [
        flowId,
        organizationId,
        newVersionNumber,
        authorId,
        changeSummary,
        JSON.stringify(definition),
      ]
    );

    // 2. Mark flow published and advance version
    const updatedRes = await client.query(
      `UPDATE flows
       SET status = 'published',
           last_published_version = $1,
           version = version + 1,
           published_at = now(),
           updated_at = now()
       WHERE id = $2 AND organization_id = $3
       RETURNING *`,
      [newVersionNumber, flowId, organizationId]
    );

    // 3. Audit log
    try {
      await client.query(
        `INSERT INTO audit_logs (organization_id, user_id, action, entity_type, entity_id, details)
         VALUES ($1, $2, 'publish', 'flow', $3, $4)`,
        [
          organizationId,
          authorId,
          flowId,
          JSON.stringify({ versionPublished: newVersionNumber, changeSummary }),
        ]
      );
    } catch {
      // Non-blocking
    }

    return updatedRes.rows[0];
  });
}

export async function duplicateFlow(organizationId, flowId, newOwnerId = null) {
  // Commercial Readiness: Strict server-side creation quota check
  await assertFlowCreationQuota(organizationId);

  return withTenant(organizationId, async (client) => {
    const currentRes = await client.query(
      `SELECT * FROM flows WHERE id = $1 AND organization_id = $2`,
      [flowId, organizationId]
    );
    const flow = currentRes.rows[0];
    if (!flow) {
      throw new Error(`Flow ${flowId} not found`);
    }

    const newName = `${flow.name} (Copy)`;
    const res = await client.query(
      `INSERT INTO flows (
        organization_id, owner_id, name, description, status, version,
        trigger_type, trigger_config, flow_definition
      ) VALUES ($1, $2, $3, $4, 'draft', 1, $5, $6, $7)
      RETURNING *`,
      [
        organizationId,
        newOwnerId || flow.owner_id,
        newName,
        flow.description,
        flow.trigger_type,
        flow.trigger_config,
        flow.flow_definition,
      ]
    );

    return res.rows[0];
  });
}

export async function archiveFlow(organizationId, flowId) {
  return withTenant(organizationId, async (client) => {
    const res = await client.query(
      `UPDATE flows
       SET status = 'archived', updated_at = now()
       WHERE id = $1 AND organization_id = $2
       RETURNING *`,
      [flowId, organizationId]
    );
    if (res.rows.length === 0) {
      throw new Error(`Flow ${flowId} not found`);
    }
    return res.rows[0];
  });
}

export async function listFlowVersions(organizationId, flowId) {
  return withTenant(organizationId, async (client) => {
    const res = await client.query(
      `SELECT v.*, u.name as author_name
       FROM flow_versions v
       LEFT JOIN users u ON v.author_id = u.id
       WHERE v.flow_id = $1 AND v.organization_id = $2
       ORDER BY v.version_number DESC`,
      [flowId, organizationId]
    );
    return res.rows;
  });
}
