import { LogicGraph, LogicGraphNode } from '../types/logic';

export interface ExecutionEvent {
  eventName: string;
  widgetId: string;
  data?: any;
}

export interface ExecutionLogItem {
  timestamp: string;
  nodeId: string;
  nodeName: string;
  nodeType: string;
  status: 'triggered' | 'executed' | 'skipped' | 'error';
  details?: string;
}

export async function executeLogicGraph(
  graph: LogicGraph,
  event: ExecutionEvent,
  variablesContext: Record<string, any> = {}
): Promise<ExecutionLogItem[]> {
  const logs: ExecutionLogItem[] = [];

  // Find matching trigger nodes
  const matchingTriggers = graph.nodes.filter((node) => {
    if (node.properties?.targetWidgetId && node.properties.targetWidgetId !== event.widgetId) {
      return false;
    }
    switch (event.eventName) {
      case 'onClick':
        return node.type === 'widget_click' || node.type === 'hotspot_click';
      case 'onModelLoaded':
        return node.type === 'model_loaded';
      case 'onObjectSelected':
        return node.type === 'model_object_selected';
      case 'onPlay':
        return node.type === 'video_play';
      case 'onEnded':
        return node.type === 'video_ended';
      case 'onSubmit':
        return node.type === 'form_submitted';
      default:
        return false;
    }
  });

  if (matchingTriggers.length === 0) {
    return logs;
  }

  // Helper to trace and execute downstream nodes
  const executeNode = async (currentNode: LogicGraphNode) => {
    const timestamp = new Date().toISOString();

    logs.push({
      timestamp,
      nodeId: currentNode.id,
      nodeName: currentNode.name,
      nodeType: currentNode.type,
      status: 'executed',
      details: `Executed action for target widget: ${currentNode.properties?.targetWidgetId || 'N/A'}`,
    });

    // Find outgoing connections
    const outgoingConnections = graph.connections.filter(
      (c) => c.sourceNodeId === currentNode.id
    );

    for (const conn of outgoingConnections) {
      const targetNode = graph.nodes.find((n) => n.id === conn.targetNodeId);
      if (targetNode) {
        await executeNode(targetNode);
      }
    }
  };

  for (const triggerNode of matchingTriggers) {
    logs.push({
      timestamp: new Date().toISOString(),
      nodeId: triggerNode.id,
      nodeName: triggerNode.name,
      nodeType: triggerNode.type,
      status: 'triggered',
      details: `Event "${event.eventName}" fired on widget "${event.widgetId}"`,
    });

    const outgoingConnections = graph.connections.filter(
      (c) => c.sourceNodeId === triggerNode.id
    );

    for (const conn of outgoingConnections) {
      const targetNode = graph.nodes.find((n) => n.id === conn.targetNodeId);
      if (targetNode) {
        await executeNode(targetNode);
      }
    }
  }

  return logs;
}
