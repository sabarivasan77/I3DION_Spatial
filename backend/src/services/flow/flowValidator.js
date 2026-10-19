/**
 * Pure JavaScript Flow DAG Validator for Backend Runtime
 * Verifies acyclic DAG properties (Kahn's algorithm) without runtime TypeScript compilation dependencies.
 */

export function validateFlowDAG(flow) {
  if (!flow || !Array.isArray(flow.nodes)) {
    return { valid: false, errors: ['Invalid flow definition: missing nodes array'], warnings: [] };
  }

  const errors = [];
  const warnings = [];

  const nodeMap = new Map();
  for (const node of flow.nodes) {
    if (nodeMap.has(node.id)) {
      errors.push(`Duplicate node identifier found: "${node.id}"`);
    }
    nodeMap.set(node.id, node);
  }

  // Edge referential integrity
  const adjacency = new Map();
  const inDegree = new Map();

  for (const node of flow.nodes) {
    adjacency.set(node.id, []);
    inDegree.set(node.id, 0);
  }

  const edges = Array.isArray(flow.edges) ? flow.edges : [];
  for (const edge of edges) {
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
      adjacency.get(sourceId).push(targetId);
    }
    if (targetId && inDegree.has(targetId)) {
      inDegree.set(targetId, (inDegree.get(targetId) || 0) + 1);
    }
  }

  // Cycle detection via Kahn's algorithm (topological sort)
  if (errors.length === 0 && flow.nodes.length > 0) {
    const queue = [];
    const localInDegree = new Map(inDegree);

    for (const [nodeId, degree] of localInDegree.entries()) {
      if (degree === 0) queue.push(nodeId);
    }

    let visitedCount = 0;
    while (queue.length > 0) {
      const current = queue.shift();
      visitedCount++;

      for (const neighbor of adjacency.get(current) || []) {
        const nextDegree = (localInDegree.get(neighbor) || 0) - 1;
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
        warnings.push(`Node "${node.label || node.id}" (${node.id}) is disconnected from the workflow.`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
