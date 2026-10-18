import type { Edge } from '@xyflow/react';

/**
 * Checks if adding candidateEdge to existing edges introduces a cycle.
 */
export function wouldCreateCycle(existingEdges: Edge[], candidateEdge: Edge): boolean {
  const adj = new Map<string, string[]>();

  for (const edge of existingEdges) {
    if (!adj.has(edge.source)) adj.set(edge.source, []);
    adj.get(edge.source)!.push(edge.target);
  }

  // Add the candidate edge
  if (!adj.has(candidateEdge.source)) adj.set(candidateEdge.source, []);
  adj.get(candidateEdge.source)!.push(candidateEdge.target);

  const visited = new Set<string>();
  const recStack = new Set<string>();

  function dfs(node: string): boolean {
    visited.add(node);
    recStack.add(node);

    const neighbors = adj.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true;
      } else if (recStack.has(neighbor)) {
        return true; // Cycle detected!
      }
    }

    recStack.delete(node);
    return false;
  }

  for (const node of adj.keys()) {
    if (!visited.has(node)) {
      if (dfs(node)) return true;
    }
  }

  return false;
}
