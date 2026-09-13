import { LogicGraph, LogicGraphNode, LogicConnection } from '../../logic/types/logic';
import { IScriptParser } from '../parser/iscriptParser';
import { TriggerNode, ActionStatementNode } from '../ast/iscriptAst';
import { IScriptProblem } from '../types/iscriptTypes';
import { logicNodeRegistry } from '../../logic/registry/logicNodeRegistry';

export class LogicCraftBridge {
  /**
   * Converts a LogicCraft visual node graph into human-readable iScript text code.
   */
  public static graphToIScript(graph: LogicGraph): string {
    if (!graph || !graph.nodes || graph.nodes.length === 0) {
      return '# Empty LogicCraft Graph\n# Add visual nodes or write iScript instructions below\n\nWHEN Button_01 IS CLICKED\nDO\n    SHOW Widget_02\n';
    }

    const lines: string[] = [`# iScript generated for graph: ${graph.name}`, ''];

    // Identify trigger nodes (nodes with 0 input ports)
    const triggerNodes = graph.nodes.filter((n) => n.inputPorts.length === 0);

    for (const trigger of triggerNodes) {
      const widgetId = trigger.properties?.targetWidgetId || 'Button_01';
      let eventPhrase = 'IS CLICKED';
      if (trigger.type === 'model_loaded') eventPhrase = 'IS LOADED';
      if (trigger.type === 'model_object_selected') eventPhrase = 'IS SELECTED';

      lines.push(`WHEN ${widgetId} ${eventPhrase}`);
      lines.push('DO');

      // Trace outgoing connected nodes
      const outgoingConns = graph.connections.filter((c) => c.sourceNodeId === trigger.id);
      if (outgoingConns.length === 0) {
        lines.push('    # Wire connected action nodes');
      }

      for (const conn of outgoingConns) {
        const targetNode = graph.nodes.find((n) => n.id === conn.targetNodeId);
        if (targetNode) {
          lines.push(`    ${this.nodeToIScriptLine(targetNode)}`);
        }
      }

      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Converts iScript text code into a LogicCraft visual node graph.
   */
  public static iscriptToGraph(source: string, existingGraphId: string = 'graph_iscript_01'): { graph: LogicGraph; problems: IScriptProblem[] } {
    const parser = new IScriptParser();
    const program = parser.parse(source);
    const nodes: LogicGraphNode[] = [];
    const connections: LogicConnection[] = [];

    let currentX = 80;
    let currentY = 120;

    program.statements.forEach((stmt) => {
      if (stmt.type === 'Trigger') {
        const trigger = stmt as TriggerNode;
        const triggerId = `logic_node_${trigger.eventType}_${Math.random().toString(36).substring(2, 7)}`;

        const triggerDef = logicNodeRegistry.get(trigger.eventType) || logicNodeRegistry.get('widget_click')!;

        nodes.push({
          id: triggerId,
          type: triggerDef.type,
          name: triggerDef.name,
          position: { x: currentX, y: currentY },
          properties: { targetWidgetId: trigger.targetWidgetId || 'Button_01' },
          inputPorts: JSON.parse(JSON.stringify(triggerDef.inputPorts)),
          outputPorts: JSON.parse(JSON.stringify(triggerDef.outputPorts)),
        });

        let targetX = currentX + 360;
        let targetY = currentY;

        trigger.body.forEach((bodyStmt) => {
          if (bodyStmt.type === 'Action') {
            const act = bodyStmt as ActionStatementNode;
            const actionId = `logic_node_${act.actionType}_${Math.random().toString(36).substring(2, 7)}`;
            const actionDef = logicNodeRegistry.get(act.actionType) || logicNodeRegistry.get('show_widget')!;

            nodes.push({
              id: actionId,
              type: actionDef.type,
              name: actionDef.name,
              position: { x: targetX, y: targetY },
              properties: {
                targetWidgetId: act.targetWidgetId,
                animationName: act.animationName,
                cameraPreset: act.cameraPreset,
                objectId: act.objectId,
                text: act.text,
              },
              inputPorts: JSON.parse(JSON.stringify(actionDef.inputPorts)),
              outputPorts: JSON.parse(JSON.stringify(actionDef.outputPorts)),
            });

            connections.push({
              id: `conn_${Math.random().toString(36).substring(2, 8)}`,
              sourceNodeId: triggerId,
              sourcePortId: 'flow_out',
              targetNodeId: actionId,
              targetPortId: 'flow_in',
            });

            targetY += 160;
          }
        });

        currentY += 280;
      }
    });

    const graph: LogicGraph = {
      version: 1,
      id: existingGraphId,
      name: 'Synced iScript Graph',
      description: 'Visual graph synchronized with iScript source code',
      nodes,
      connections,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return { graph, problems: parser.problems };
  }

  private static nodeToIScriptLine(node: LogicGraphNode): string {
    const props = node.properties || {};
    const widgetId = props.targetWidgetId || 'Widget_01';

    switch (node.type) {
      case 'show_widget':
        return `SHOW ${widgetId}`;
      case 'hide_widget':
        return `HIDE ${widgetId}`;
      case 'toggle_visibility':
        return `TOGGLE ${widgetId}`;
      case 'set_text':
        return `SET TEXT OF ${widgetId} TO "${props.text || 'Sample Text'}"`;
      case 'play_animation':
        return `PLAY ANIMATION "${props.animationName || 'Open'}" ON ${widgetId}`;
      case 'stop_animation':
        return `STOP ANIMATION ON ${widgetId}`;
      case 'pause_animation':
        return `PAUSE ANIMATION ON ${widgetId}`;
      case 'set_camera':
        return `SET CAMERA "${props.cameraPreset || 'Front'}" ON ${widgetId}`;
      case 'focus_object':
        return `FOCUS OBJECT "${props.objectId || 'Impeller_01'}" ON ${widgetId}`;
      case 'delay':
        return `WAIT ${props.durationSeconds || 2} SECONDS`;
      case 'set_variable':
        return `SET VARIABLE ${props.variableName || 'mode'} TO "${props.value || 'demo'}"`;
      default:
        return `SHOW ${widgetId}`;
    }
  }
}
