import { withTenant, query } from '../../db/pool.js';
import { executeFlowRun } from './flowExecutor.js';

/**
 * Flow Monitoring & Diagnostics Service
 * Powers live run history, latency metrics, step-by-step diagnostic inspection, and retries.
 */

/**
 * 1. List organization workflow runs with filtering and pagination
 */
export async function listOrganizationRuns(
  organizationId,
  { flowId = null, status = null, search = null, limit = 50, offset = 0 } = {}
) {
  return withTenant(organizationId, async (client) => {
    const conditions = ['r.organization_id = $1'];
    const params = [organizationId];
    let idx = 2;

    if (flowId) {
      conditions.push(`r.flow_id = $${idx++}`);
      params.push(flowId);
    }

    if (status && status !== 'all') {
      conditions.push(`r.status = $${idx++}`);
      params.push(status);
    }

    if (search) {
      conditions.push(`(f.name ILIKE $${idx} OR r.error ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }

    const whereClause = conditions.join(' AND ');

    // Count total matches
    const countRes = await client.query(
      `SELECT COUNT(*)::integer AS total
       FROM flow_runs r
       JOIN flows f ON r.flow_id = f.id
       WHERE ${whereClause}`,
      params
    );
    const total = countRes.rows[0]?.total || 0;

    // Fetch paginated run records
    params.push(limit, offset);
    const limitIdx = idx++;
    const offsetIdx = idx++;

    const runsRes = await client.query(
      `SELECT 
         r.id,
         r.flow_id,
         r.flow_version,
         r.status,
         r.started_at,
         r.completed_at,
         r.error,
         r.trigger_payload,
         r.step_results,
         ROUND(EXTRACT(EPOCH FROM (COALESCE(r.completed_at, now()) - r.started_at)) * 1000)::integer AS duration_ms,
         f.name AS flow_name,
         f.trigger_type,
         u.name AS triggered_by_name,
         u.email AS triggered_by_email
       FROM flow_runs r
       JOIN flows f ON r.flow_id = f.id
       LEFT JOIN users u ON r.triggered_by = u.id
       WHERE ${whereClause}
       ORDER BY r.started_at DESC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      params
    );

    return {
      runs: runsRes.rows,
      total,
      limit,
      offset,
    };
  });
}

/**
 * 2. Get detailed run record with full step diagnostics
 */
export async function getRunDetails(organizationId, runId) {
  return withTenant(organizationId, async (client) => {
    const res = await client.query(
      `SELECT 
         r.*,
         ROUND(EXTRACT(EPOCH FROM (COALESCE(r.completed_at, now()) - r.started_at)) * 1000)::integer AS duration_ms,
         f.name AS flow_name,
         f.description AS flow_description,
         f.trigger_type,
         f.version AS current_flow_version,
         u.name AS triggered_by_name,
         u.email AS triggered_by_email
       FROM flow_runs r
       JOIN flows f ON r.flow_id = f.id
       LEFT JOIN users u ON r.triggered_by = u.id
       WHERE r.id = $1 AND r.organization_id = $2`,
      [runId, organizationId]
    );

    if (res.rows.length === 0) {
      return null;
    }

    const row = res.rows[0];
    return {
      ...row,
      step_results: Array.isArray(row.step_results)
        ? row.step_results
        : JSON.parse(row.step_results || '[]'),
    };
  });
}

/**
 * 3. Re-execute a run with the original or modified trigger payload
 */
export async function retryRun(organizationId, runId, userId, payloadOverride = null) {
  const originalRun = await getRunDetails(organizationId, runId);
  if (!originalRun) {
    throw new Error(`Run not found or access denied (ID: ${runId})`);
  }

  const payload = payloadOverride || originalRun.trigger_payload || {};

  return executeFlowRun({
    flowId: originalRun.flow_id,
    organizationId,
    triggerPayload: payload,
    userId,
  });
}

/**
 * 4. Compute comprehensive execution throughput, latency & failure analytics
 */
export async function getFlowAnalytics(organizationId, flowId = null) {
  return withTenant(organizationId, async (client) => {
    const conditions = ['r.organization_id = $1'];
    const params = [organizationId];

    if (flowId) {
      conditions.push('r.flow_id = $2');
      params.push(flowId);
    }

    const whereClause = conditions.join(' AND ');

    // Aggregate summary KPIs
    const summaryRes = await client.query(
      `SELECT 
         COUNT(*)::integer AS total_runs,
         COUNT(*) FILTER (WHERE r.status = 'completed')::integer AS completed_runs,
         COUNT(*) FILTER (WHERE r.status = 'failed')::integer AS failed_runs,
         COUNT(*) FILTER (WHERE r.status = 'running')::integer AS running_runs,
         COALESCE(ROUND(AVG(EXTRACT(EPOCH FROM (r.completed_at - r.started_at)) * 1000) FILTER (WHERE r.completed_at IS NOT NULL))::integer, 0) AS avg_duration_ms,
         COALESCE(ROUND(percentile_cont(0.50) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (r.completed_at - r.started_at)) * 1000) FILTER (WHERE r.completed_at IS NOT NULL))::integer, 0) AS p50_duration_ms,
         COALESCE(ROUND(percentile_cont(0.90) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (r.completed_at - r.started_at)) * 1000) FILTER (WHERE r.completed_at IS NOT NULL))::integer, 0) AS p90_duration_ms,
         COALESCE(ROUND(percentile_cont(0.95) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (r.completed_at - r.started_at)) * 1000) FILTER (WHERE r.completed_at IS NOT NULL))::integer, 0) AS p95_duration_ms
       FROM flow_runs r
       WHERE ${whereClause}`,
      params
    );

    const summary = summaryRes.rows[0] || {};
    const totalRuns = summary.total_runs || 0;
    const completedRuns = summary.completed_runs || 0;
    const successRate = totalRuns > 0 ? Number(((completedRuns / totalRuns) * 100).toFixed(1)) : 100.0;

    // Daily breakdown for the past 7 days
    const dailyRes = await client.query(
      `SELECT 
         DATE_TRUNC('day', r.started_at)::date AS date,
         COUNT(*)::integer AS total,
         COUNT(*) FILTER (WHERE r.status = 'completed')::integer AS completed,
         COUNT(*) FILTER (WHERE r.status = 'failed')::integer AS failed
       FROM flow_runs r
       WHERE ${whereClause} AND r.started_at >= (now() - interval '7 days')
       GROUP BY DATE_TRUNC('day', r.started_at)::date
       ORDER BY date ASC`,
      params
    );

    // Recent errors breakdown
    const errorsRes = await client.query(
      `SELECT 
         r.error,
         COUNT(*)::integer AS count,
         MAX(r.started_at) AS last_occurred_at
       FROM flow_runs r
       WHERE ${whereClause} AND r.status = 'failed' AND r.error IS NOT NULL
       GROUP BY r.error
       ORDER BY count DESC
       LIMIT 5`,
      params
    );

    return {
      overview: {
        totalRuns,
        completedRuns,
        failedRuns: summary.failed_runs || 0,
        runningRuns: summary.running_runs || 0,
        successRate,
        avgDurationMs: summary.avg_duration_ms || 0,
        p50DurationMs: summary.p50_duration_ms || 0,
        p90DurationMs: summary.p90_duration_ms || 0,
        p95DurationMs: summary.p95_duration_ms || 0,
      },
      dailyHistory: dailyRes.rows,
      topErrors: errorsRes.rows,
    };
  });
}
