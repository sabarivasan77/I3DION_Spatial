import { create } from 'zustand';
import {
  LogicGraph,
  LogicGraphNode,
  LogicConnection,
  GraphValidationResult,
} from '../types/logic';
import { logicNodeRegistry } from '../registry/logicNodeRegistry';
import { validateLogicGraph } from '../engine/graphValidator';

const generateNodeId = (type: string): string => {
  const cleanType = type.toLowerCase().replace(/[^a-z0-9]/g, '');
  const randomHex = Math.random().toString(36).substring(2, 8);
  return `logic_node_${cleanType}_${randomHex}`;
};

const DEFAULT_GRAPH: LogicGraph = {
  version: 1,
  id: 'graph_default_01',
  name: 'Product Interaction Flow',
  description: 'Default visual logic graph for 3D model interaction and UI triggers',
  nodes: [
    {
      id: 'logic_node_widgetclick_initial',
      type: 'widget_click',
      name: 'Widget Click (Button)',
      position: { x: 80, y: 120 },
      properties: { targetWidgetId: 'widget_button_initial' },
      inputPorts: [],
      outputPorts: [
        { id: 'flow_out', name: 'out', label: 'On Click', type: 'FLOW', direction: 'output' },
        { id: 'widget_ref', name: 'widget', label: 'Widget Reference', type: 'WIDGET', direction: 'output' },
      ],
    },
    {
      id: 'logic_node_playanimation_initial',
      type: 'play_animation',
      name: 'Play 3D Animation',
      position: { x: 440, y: 120 },
      properties: { targetWidgetId: 'three_model_viewer_01', animationName: 'Open' },
      inputPorts: [{ id: 'flow_in', name: 'in', label: 'Flow In', type: 'FLOW', direction: 'input' }],
      outputPorts: [{ id: 'flow_out', name: 'out', label: 'Flow Out', type: 'FLOW', direction: 'output' }],
    },
  ],
  connections: [
    {
      id: 'conn_initial_01',
      sourceNodeId: 'logic_node_widgetclick_initial',
      sourcePortId: 'flow_out',
      targetNodeId: 'logic_node_playanimation_initial',
      targetPortId: 'flow_in',
    },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

interface LogicCraftState {
  graphs: LogicGraph[];
  activeGraphId: string;
  selectedNodeId: string | null;
  selectedConnectionId: string | null;
  isLogicPanelOpen: boolean;
  zoomLevel: number;
  panOffset: { x: number; y: number };
  copiedNode: LogicGraphNode | null;
  history: {
    past: LogicGraph[];
    future: LogicGraph[];
  };

  // Actions
  openLogicPanel: () => void;
  closeLogicPanel: () => void;
  createGraph: (name?: string) => string;
  selectGraph: (id: string) => void;
  deleteGraph: (id: string) => void;
  selectNode: (id: string | null) => void;
  selectConnection: (id: string | null) => void;
  addNode: (type: string, position?: { x: number; y: number }) => string | null;
  moveNode: (id: string, position: { x: number; y: number }) => void;
  updateNodeProperties: (id: string, updatedProps: Record<string, any>) => void;
  deleteNode: (id: string) => void;
  duplicateNode: (id: string) => string | null;
  copyNode: (id?: string) => void;
  pasteNode: () => string | null;
  addConnection: (
    sourceNodeId: string,
    sourcePortId: string,
    targetNodeId: string,
    targetPortId: string
  ) => boolean;
  deleteConnection: (id: string) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  setPanOffset: (offset: { x: number; y: number }) => void;
  undo: () => void;
  redo: () => void;
  getActiveGraph: () => LogicGraph;
  validateActiveGraph: (activeWidgets?: any[]) => GraphValidationResult;
  serializeActiveGraph: () => string;
  deserializeGraphIntoActive: (jsonString: string) => boolean;
}

export const useLogicCraftStore = create<LogicCraftState>((set, get) => ({
  graphs: [DEFAULT_GRAPH],
  activeGraphId: 'graph_default_01',
  selectedNodeId: 'logic_node_widgetclick_initial',
  selectedConnectionId: null,
  isLogicPanelOpen: false,
  zoomLevel: 1.0,
  panOffset: { x: 0, y: 0 },
  copiedNode: null,
  history: {
    past: [],
    future: [],
  },

  openLogicPanel: () => set({ isLogicPanelOpen: true }),
  closeLogicPanel: () => set({ isLogicPanelOpen: false }),

  createGraph: (name = 'New Logic Flow') => {
    const newId = `graph_${Math.random().toString(36).substring(2, 9)}`;
    const newGraph: LogicGraph = {
      version: 1,
      id: newId,
      name,
      description: 'Custom visual logic flow graph',
      nodes: [],
      connections: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set((state) => ({
      graphs: [...state.graphs, newGraph],
      activeGraphId: newId,
      selectedNodeId: null,
      selectedConnectionId: null,
      history: { past: [], future: [] },
    }));

    return newId;
  },

  selectGraph: (id) => set({ activeGraphId: id, selectedNodeId: null, selectedConnectionId: null }),

  deleteGraph: (id) => {
    const currentGraphs = get().graphs;
    if (currentGraphs.length <= 1) return; // Keep at least one graph

    const updated = currentGraphs.filter((g) => g.id !== id);
    set({
      graphs: updated,
      activeGraphId: updated[0].id,
      selectedNodeId: null,
      selectedConnectionId: null,
    });
  },

  selectNode: (id) => set({ selectedNodeId: id, selectedConnectionId: null }),
  selectConnection: (id) => set({ selectedConnectionId: id, selectedNodeId: null }),

  getActiveGraph: () => {
    const active = get().graphs.find((g) => g.id === get().activeGraphId);
    return active || get().graphs[0];
  },

  addNode: (type, position = { x: 200, y: 150 }) => {
    const def = logicNodeRegistry.get(type);
    if (!def) {
      console.error(`Logic node type "${type}" not registered.`);
      return null;
    }

    const newNodeId = generateNodeId(type);
    const newNode: LogicGraphNode = {
      id: newNodeId,
      type: def.type,
      name: `${def.name}`,
      position,
      properties: { ...def.defaultProperties },
      inputPorts: JSON.parse(JSON.stringify(def.inputPorts)),
      outputPorts: JSON.parse(JSON.stringify(def.outputPorts)),
    };

    const activeGraph = get().getActiveGraph();
    const historyPast = get().history.past;
    const updatedNodes = [...activeGraph.nodes, newNode];
    const updatedGraph: LogicGraph = {
      ...activeGraph,
      nodes: updatedNodes,
      updatedAt: new Date().toISOString(),
    };

    set({
      history: {
        past: [...historyPast, JSON.parse(JSON.stringify(activeGraph))],
        future: [],
      },
      graphs: get().graphs.map((g) => (g.id === activeGraph.id ? updatedGraph : g)),
      selectedNodeId: newNodeId,
    });

    return newNodeId;
  },

  moveNode: (id, position) => {
    const activeGraph = get().getActiveGraph();
    const updatedNodes = activeGraph.nodes.map((n) => (n.id === id ? { ...n, position } : n));
    const updatedGraph: LogicGraph = {
      ...activeGraph,
      nodes: updatedNodes,
      updatedAt: new Date().toISOString(),
    };

    set({
      graphs: get().graphs.map((g) => (g.id === activeGraph.id ? updatedGraph : g)),
    });
  },

  updateNodeProperties: (id, updatedProps) => {
    const activeGraph = get().getActiveGraph();
    const historyPast = get().history.past;
    const updatedNodes = activeGraph.nodes.map((node) => {
      if (node.id === id) {
        return {
          ...node,
          properties: { ...node.properties, ...updatedProps },
        };
      }
      return node;
    });

    const updatedGraph: LogicGraph = {
      ...activeGraph,
      nodes: updatedNodes,
      updatedAt: new Date().toISOString(),
    };

    set({
      history: {
        past: [...historyPast, JSON.parse(JSON.stringify(activeGraph))],
        future: [],
      },
      graphs: get().graphs.map((g) => (g.id === activeGraph.id ? updatedGraph : g)),
    });
  },

  deleteNode: (id) => {
    const activeGraph = get().getActiveGraph();
    const historyPast = get().history.past;

    // Filter out node and all orphan connections referencing it
    const updatedNodes = activeGraph.nodes.filter((n) => n.id !== id);
    const updatedConnections = activeGraph.connections.filter(
      (c) => c.sourceNodeId !== id && c.targetNodeId !== id
    );

    const updatedGraph: LogicGraph = {
      ...activeGraph,
      nodes: updatedNodes,
      connections: updatedConnections,
      updatedAt: new Date().toISOString(),
    };

    set({
      history: {
        past: [...historyPast, JSON.parse(JSON.stringify(activeGraph))],
        future: [],
      },
      graphs: get().graphs.map((g) => (g.id === activeGraph.id ? updatedGraph : g)),
      selectedNodeId: get().selectedNodeId === id ? null : get().selectedNodeId,
    });
  },

  duplicateNode: (id) => {
    const activeGraph = get().getActiveGraph();
    const targetNode = activeGraph.nodes.find((n) => n.id === id);
    if (!targetNode) return null;

    const newId = generateNodeId(targetNode.type);
    const duplicatedNode: LogicGraphNode = {
      ...JSON.parse(JSON.stringify(targetNode)),
      id: newId,
      name: `${targetNode.name} (Copy)`,
      position: { x: targetNode.position.x + 40, y: targetNode.position.y + 40 },
    };

    const historyPast = get().history.past;
    const updatedGraph: LogicGraph = {
      ...activeGraph,
      nodes: [...activeGraph.nodes, duplicatedNode],
      updatedAt: new Date().toISOString(),
    };

    set({
      history: {
        past: [...historyPast, JSON.parse(JSON.stringify(activeGraph))],
        future: [],
      },
      graphs: get().graphs.map((g) => (g.id === activeGraph.id ? updatedGraph : g)),
      selectedNodeId: newId,
    });

    return newId;
  },

  copyNode: (id) => {
    const targetId = id || get().selectedNodeId;
    if (!targetId) return;
    const activeGraph = get().getActiveGraph();
    const node = activeGraph.nodes.find((n) => n.id === targetId);
    if (node) {
      set({ copiedNode: JSON.parse(JSON.stringify(node)) });
    }
  },

  pasteNode: () => {
    const copied = get().copiedNode;
    if (!copied) return null;

    const activeGraph = get().getActiveGraph();
    const historyPast = get().history.past;
    const newId = generateNodeId(copied.type);

    const pastedNode: LogicGraphNode = {
      ...JSON.parse(JSON.stringify(copied)),
      id: newId,
      name: `${copied.name} (Pasted)`,
      position: { x: copied.position.x + 50, y: copied.position.y + 50 },
    };

    const updatedGraph: LogicGraph = {
      ...activeGraph,
      nodes: [...activeGraph.nodes, pastedNode],
      updatedAt: new Date().toISOString(),
    };

    set({
      history: {
        past: [...historyPast, JSON.parse(JSON.stringify(activeGraph))],
        future: [],
      },
      graphs: get().graphs.map((g) => (g.id === activeGraph.id ? updatedGraph : g)),
      selectedNodeId: newId,
    });

    return newId;
  },

  addConnection: (sourceNodeId, sourcePortId, targetNodeId, targetPortId) => {
    const activeGraph = get().getActiveGraph();

    // Prevent duplicate connections or self-connections
    if (sourceNodeId === targetNodeId) return false;

    const exists = activeGraph.connections.some(
      (c) =>
        c.sourceNodeId === sourceNodeId &&
        c.sourcePortId === sourcePortId &&
        c.targetNodeId === targetNodeId &&
        c.targetPortId === targetPortId
    );

    if (exists) return false;

    const newConnection: LogicConnection = {
      id: `conn_${Math.random().toString(36).substring(2, 9)}`,
      sourceNodeId,
      sourcePortId,
      targetNodeId,
      targetPortId,
    };

    const historyPast = get().history.past;
    const updatedGraph: LogicGraph = {
      ...activeGraph,
      connections: [...activeGraph.connections, newConnection],
      updatedAt: new Date().toISOString(),
    };

    set({
      history: {
        past: [...historyPast, JSON.parse(JSON.stringify(activeGraph))],
        future: [],
      },
      graphs: get().graphs.map((g) => (g.id === activeGraph.id ? updatedGraph : g)),
    });

    return true;
  },

  deleteConnection: (id) => {
    const activeGraph = get().getActiveGraph();
    const historyPast = get().history.past;
    const updatedConnections = activeGraph.connections.filter((c) => c.id !== id);

    const updatedGraph: LogicGraph = {
      ...activeGraph,
      connections: updatedConnections,
      updatedAt: new Date().toISOString(),
    };

    set({
      history: {
        past: [...historyPast, JSON.parse(JSON.stringify(activeGraph))],
        future: [],
      },
      graphs: get().graphs.map((g) => (g.id === activeGraph.id ? updatedGraph : g)),
      selectedConnectionId: get().selectedConnectionId === id ? null : get().selectedConnectionId,
    });
  },

  zoomIn: () => set((s) => ({ zoomLevel: Math.min(2.0, parseFloat((s.zoomLevel + 0.1).toFixed(2))) })),
  zoomOut: () => set((s) => ({ zoomLevel: Math.max(0.5, parseFloat((s.zoomLevel - 0.1).toFixed(2))) })),
  resetZoom: () => set({ zoomLevel: 1.0 }),
  setPanOffset: (offset) => set({ panOffset: offset }),

  undo: () => {
    const { past, future } = get().history;
    if (past.length === 0) return;

    const previousGraph = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    const activeGraph = get().getActiveGraph();

    set({
      history: {
        past: newPast,
        future: [JSON.parse(JSON.stringify(activeGraph)), ...future],
      },
      graphs: get().graphs.map((g) => (g.id === activeGraph.id ? previousGraph : g)),
    });
  },

  redo: () => {
    const { past, future } = get().history;
    if (future.length === 0) return;

    const nextGraph = future[0];
    const newFuture = future.slice(1);
    const activeGraph = get().getActiveGraph();

    set({
      history: {
        past: [...past, JSON.parse(JSON.stringify(activeGraph))],
        future: newFuture,
      },
      graphs: get().graphs.map((g) => (g.id === activeGraph.id ? nextGraph : g)),
    });
  },

  validateActiveGraph: (activeWidgets = []) => {
    return validateLogicGraph(get().getActiveGraph(), activeWidgets);
  },

  serializeActiveGraph: () => {
    return JSON.stringify(get().getActiveGraph(), null, 2);
  },

  deserializeGraphIntoActive: (jsonString) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && Array.isArray(parsed.nodes) && Array.isArray(parsed.connections)) {
        const activeGraph = get().getActiveGraph();
        const updatedGraph: LogicGraph = {
          ...parsed,
          id: activeGraph.id,
          updatedAt: new Date().toISOString(),
        };

        set({
          graphs: get().graphs.map((g) => (g.id === activeGraph.id ? updatedGraph : g)),
          selectedNodeId: null,
          selectedConnectionId: null,
          history: { past: [], future: [] },
        });
        return true;
      }
    } catch (e) {
      console.error('Failed to deserialize graph:', e);
    }
    return false;
  },
}));
