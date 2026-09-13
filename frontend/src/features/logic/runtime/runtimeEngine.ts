import { LogicGraph, LogicGraphNode, LogicConnection } from '../types/logic';
import { RuntimeEventPayload } from './runtimeTypes';
import { runtimeEventBus } from './runtimeEventBus';
import { useRuntimeStore } from './runtimeContext';
import { actionRegistry } from './runtimeActions';
import { validateLogicGraph } from '../engine/graphValidator';

export class RuntimeEngine {
  private activeTimers: Set<NodeJS.Timeout> = new Set();
  private isRunning: boolean = false;
  private unsubscribeEventBus: (() => void) | null = null;
  private currentGraph: LogicGraph | null = null;

  public initialize(graph: LogicGraph): boolean {
    this.stop();

    // Validate graph before running
    const validation = validateLogicGraph(graph);
    if (!validation.valid) {
      useRuntimeStore.getState().addLog(
        'ERROR',
        `Graph validation failed: ${validation.errors.join('; ')}`
      );
      return false;
    }

    this.currentGraph = graph;
    this.isRunning = true;
    useRuntimeStore.getState().setExecutionState('IDLE');

    // Subscribe to all trigger event types on event bus
    const eventTypes = [
      'widget_click',
      'widget_loaded',
      'model_loaded',
      'model_object_selected',
      'hotspot_click',
      'video_play',
      'video_ended',
      'form_submitted',
    ];

    const unsubs = eventTypes.map((evt) =>
      runtimeEventBus.subscribe(evt, (payload) => this.handleEvent(payload))
    );

    this.unsubscribeEventBus = () => unsubs.forEach((u) => u());
    useRuntimeStore.getState().addLog('INFO', `LogicCraft Runtime initialized for graph "${graph.name}"`);

    return true;
  }

  public stop(): void {
    this.isRunning = false;
    // Clear all pending delay timers
    this.activeTimers.forEach((timer) => clearTimeout(timer));
    this.activeTimers.clear();

    if (this.unsubscribeEventBus) {
      this.unsubscribeEventBus();
      this.unsubscribeEventBus = null;
    }

    useRuntimeStore.getState().setExecutionState('STOPPED');
  }

  public async triggerManualPreview(triggerNodeId: string): Promise<void> {
    if (!this.currentGraph) return;
    const triggerNode = this.currentGraph.nodes.find((n) => n.id === triggerNodeId);
    if (!triggerNode) return;

    const dummyPayload: RuntimeEventPayload = {
      eventType: triggerNode.type,
      widgetId: triggerNode.properties?.targetWidgetId || 'manual_trigger',
      timestamp: new Date().toISOString(),
    };

    useRuntimeStore.getState().startExecution('exp_manual', this.currentGraph.id);
    await this.processTrigger(triggerNode, dummyPayload);
  }

  private async handleEvent(payload: RuntimeEventPayload): Promise<void> {
    if (!this.isRunning || !this.currentGraph) return;

    // Find all matching trigger nodes in current graph
    const triggerNodes = this.currentGraph.nodes.filter((node) => {
      if (node.type !== payload.eventType) return false;
      const targetWidgetId = node.properties?.targetWidgetId;
      // Match widget ID if targetWidgetId is specified
      if (targetWidgetId && targetWidgetId !== payload.widgetId) return false;
      return true;
    });

    if (triggerNodes.length === 0) return;

    useRuntimeStore.getState().startExecution('exp_preview', this.currentGraph.id);

    for (const triggerNode of triggerNodes) {
      await this.processTrigger(triggerNode, payload);
    }
  }

  private async processTrigger(triggerNode: LogicGraphNode, payload: RuntimeEventPayload): Promise<void> {
    useRuntimeStore.getState().addLog(
      'INFO',
      `Trigger "${triggerNode.name}" activated by ${payload.eventType} (${payload.widgetId})`,
      triggerNode.id,
      triggerNode.name
    );

    useRuntimeStore.getState().setActiveNode(triggerNode.id);
    useRuntimeStore.getState().addCompletedNode(triggerNode.id);

    // Follow outgoing connections from output ports
    await this.traverseOutgoingConnections(triggerNode.id, 'flow_out', payload, 0);
  }

  private async traverseOutgoingConnections(
    sourceNodeId: string,
    sourcePortId: string,
    payload: RuntimeEventPayload,
    depth: number
  ): Promise<void> {
    if (!this.isRunning || !this.currentGraph) return;

    // Safety: Recursion / cycle depth protection (max 50 hops)
    if (depth > 50) {
      useRuntimeStore.getState().addLog(
        'ERROR',
        `Execution stopped: Maximum graph traversal depth (50 hops) exceeded. Cycle detected.`,
        sourceNodeId
      );
      useRuntimeStore.getState().setExecutionState('ERROR');
      return;
    }

    const outgoingConns = this.currentGraph.connections.filter(
      (c) => c.sourceNodeId === sourceNodeId && (c.sourcePortId === sourcePortId || sourcePortId === 'flow_out' || !sourcePortId)
    );

    for (const conn of outgoingConns) {
      useRuntimeStore.getState().setActiveConnection(conn.id);
      const targetNode = this.currentGraph.nodes.find((n) => n.id === conn.targetNodeId);
      if (targetNode) {
        // Small delay for visual connection highlight flow animation
        await this.delayMs(150);
        await this.executeNode(targetNode, conn, payload, depth + 1);
      }
    }
  }

  private async executeNode(
    node: LogicGraphNode,
    _connection: LogicConnection,
    payload: RuntimeEventPayload,
    depth: number
  ): Promise<void> {
    if (!this.isRunning) return;

    useRuntimeStore.getState().setActiveNode(node.id);

    // Node Type Execution Handlers
    switch (node.type) {
      // --- LOGIC NODES ---
      case 'sequence': {
        useRuntimeStore.getState().addLog('INFO', `Executing Sequence node`, node.id, node.name);
        useRuntimeStore.getState().addCompletedNode(node.id);
        // Execute output flow 1 then flow 2 sequentially
        await this.traverseOutgoingConnections(node.id, 'flow_out_1', payload, depth);
        await this.traverseOutgoingConnections(node.id, 'flow_out_2', payload, depth);
        break;
      }

      case 'delay': {
        const durationSec = parseFloat(node.properties?.durationSeconds || node.properties?.duration || 1);
        useRuntimeStore.getState().addLog(
          'INFO',
          `Delaying execution for ${durationSec}s...`,
          node.id,
          node.name
        );
        await this.delayMs(durationSec * 1000);
        if (!this.isRunning) return;
        useRuntimeStore.getState().addCompletedNode(node.id);
        await this.traverseOutgoingConnections(node.id, 'flow_out', payload, depth);
        break;
      }

      case 'set_variable': {
        const varName = node.properties?.variableName || 'myVar';
        const value = node.properties?.value || '';
        useRuntimeStore.getState().setVariable(varName, value);
        useRuntimeStore.getState().addCompletedNode(node.id);
        await this.traverseOutgoingConnections(node.id, 'flow_out', payload, depth);
        break;
      }

      case 'get_variable': {
        const varName = node.properties?.variableName || 'myVar';
        const val = useRuntimeStore.getState().getVariable(varName);
        useRuntimeStore.getState().addLog('INFO', `Get Variable "${varName}" = "${val}"`, node.id, node.name);
        useRuntimeStore.getState().addCompletedNode(node.id);
        await this.traverseOutgoingConnections(node.id, 'flow_out', payload, depth);
        break;
      }

      // --- CONDITION NODES ---
      case 'if':
      case 'equals':
      case 'not_equals':
      case 'greater_than':
      case 'less_than':
      case 'is_true':
      case 'is_false':
      case 'branch': {
        const result = this.evaluateCondition(node);
        useRuntimeStore.getState().addLog(
          'INFO',
          `Condition "${node.name}" evaluated to: ${result ? 'TRUE' : 'FALSE'}`,
          node.id,
          node.name
        );
        useRuntimeStore.getState().addCompletedNode(node.id);

        if (result) {
          await this.traverseOutgoingConnections(node.id, 'flow_true', payload, depth);
        } else {
          await this.traverseOutgoingConnections(node.id, 'flow_false', payload, depth);
        }
        break;
      }

      // --- ACTION NODES ---
      default: {
        // Execute registered action
        if (actionRegistry.has(node.type)) {
          useRuntimeStore.getState().addLog('INFO', `Running action "${node.name}"`, node.id, node.name);
          const outcome = await actionRegistry.execute(
            node.type,
            node.properties,
            payload,
            useRuntimeStore.getState()
          );

          if (outcome.success) {
            useRuntimeStore.getState().addLog('SUCCESS', outcome.message, node.id, node.name, node.type);
            useRuntimeStore.getState().addCompletedNode(node.id);
            await this.traverseOutgoingConnections(node.id, 'flow_out', payload, depth);
          } else {
            useRuntimeStore.getState().addLog('ERROR', outcome.message, node.id, node.name, node.type);
            useRuntimeStore.getState().setExecutionState('ERROR');
          }
        } else {
          useRuntimeStore.getState().addLog(
            'WARNING',
            `Unrecognized node type "${node.type}". Skipping execution step.`,
            node.id,
            node.name
          );
        }
        break;
      }
    }
  }

  private evaluateCondition(node: LogicGraphNode): boolean {
    const props = node.properties || {};
    const varName = props.variableName;
    const valueA = varName ? useRuntimeStore.getState().getVariable(varName) : props.valueA;
    const valueB = props.valueB;
    const op = props.operator || '==';

    switch (node.type) {
      case 'is_true':
        return Boolean(valueA) === true;
      case 'is_false':
        return Boolean(valueA) === false;
      case 'equals':
        return String(valueA) == String(valueB);
      case 'not_equals':
        return String(valueA) != String(valueB);
      case 'greater_than':
        return Number(valueA) > Number(valueB);
      case 'less_than':
        return Number(valueA) < Number(valueB);
      case 'if':
      case 'branch':
      default: {
        if (op === '==') return String(valueA) == String(valueB);
        if (op === '!=') return String(valueA) != String(valueB);
        if (op === '>') return Number(valueA) > Number(valueB);
        if (op === '<') return Number(valueA) < Number(valueB);
        return Boolean(valueA);
      }
    }
  }

  private delayMs(ms: number): Promise<void> {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        this.activeTimers.delete(timer);
        resolve();
      }, ms);
      this.activeTimers.add(timer);
    });
  }
}

export const runtimeEngine = new RuntimeEngine();
