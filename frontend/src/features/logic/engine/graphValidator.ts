import { LogicGraph, GraphValidationResult } from '../types/logic';
import { logicNodeRegistry } from '../registry/logicNodeRegistry';
import { StudioWidgetNode } from '../../studio/types/studio';

export function validateLogicGraph(
  graph: LogicGraph,
  activeWidgets: StudioWidgetNode[] = []
): GraphValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!graph || !Array.isArray(graph.nodes)) {
    return { valid: false, errors: ['Invalid logic graph structure.'] };
  }

  const validWidgetIds = new Set(activeWidgets.map((w) => w.id));

  // 1. Validate Nodes
  graph.nodes.forEach((node) => {
    const def = logicNodeRegistry.get(node.type);
    if (!def) {
      errors.push(`Node "${node.name}" (${node.id}) references unknown type "${node.type}".`);
      return;
    }

    // Check widget references in properties
    if (node.properties?.targetWidgetId) {
      const widgetId = node.properties.targetWidgetId;
      if (widgetId && activeWidgets.length > 0 && !validWidgetIds.has(widgetId)) {
        warnings.push(
          `Node "${node.name}" references widget ID "${widgetId}" which is not on the current OmniStudio canvas.`
        );
      } else if (!widgetId && (def.category === 'triggers' || def.category === 'actions')) {
        errors.push(`Node "${node.name}" requires a target OmniStudio widget.`);
      }
    }
  });

  // 2. Validate Connections & Port Types
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));

  graph.connections.forEach((conn) => {
    const sourceNode = nodeMap.get(conn.sourceNodeId);
    const targetNode = nodeMap.get(conn.targetNodeId);

    if (!sourceNode) {
      errors.push(`Connection references missing source node ID "${conn.sourceNodeId}".`);
      return;
    }
    if (!targetNode) {
      errors.push(`Connection references missing target node ID "${conn.targetNodeId}".`);
      return;
    }

    const sourcePort = sourceNode.outputPorts.find((p) => p.id === conn.sourcePortId);
    const targetPort = targetNode.inputPorts.find((p) => p.id === conn.targetPortId);

    if (!sourcePort) {
      errors.push(`Connection references missing output port "${conn.sourcePortId}" on node "${sourceNode.name}".`);
      return;
    }
    if (!targetPort) {
      errors.push(`Connection references missing input port "${conn.targetPortId}" on node "${targetNode.name}".`);
      return;
    }

    // Port Type Compatibility Check
    const srcType = sourcePort.type;
    const tgtType = targetPort.type;

    if (srcType !== 'ANY' && tgtType !== 'ANY' && srcType !== tgtType) {
      errors.push(
        `Incompatible connection between "${sourceNode.name}" (${srcType}) and "${targetNode.name}" (${tgtType}).`
      );
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
