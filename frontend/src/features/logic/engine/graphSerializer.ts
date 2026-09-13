import { LogicGraph } from '../types/logic';

export function serializeLogicGraph(graph: LogicGraph): string {
  return JSON.stringify(graph, null, 2);
}

export function deserializeLogicGraph(jsonString: string): LogicGraph | null {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.nodes) && Array.isArray(parsed.connections)) {
      return parsed as LogicGraph;
    }
  } catch (e) {
    console.error('Failed to deserialize logic graph JSON:', e);
  }
  return null;
}
