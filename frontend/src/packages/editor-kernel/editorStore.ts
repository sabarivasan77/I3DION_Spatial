import { create } from 'zustand';
import type { BlockData, CircuitNodeData, CircuitConnection, EditorMode, Command, SelectionState } from './types';
import { editorEventBus } from './eventBus';

export interface EditorStoreState {
  mode: EditorMode;
  selection: SelectionState;
  blocks: BlockData[];
  nodes: CircuitNodeData[];
  connections: CircuitConnection[];
  past: Command[];
  future: Command[];

  // Actions
  setMode: (mode: EditorMode) => void;
  selectBlock: (id: string | null) => void;
  selectNode: (id: string | null) => void;
  select3DObject: (id: string | null) => void;

  // Block Operations
  setBlocks: (blocks: BlockData[]) => void;
  addBlock: (block: BlockData, targetIndex?: number) => void;
  updateBlockProps: (id: string, props: Record<string, any>) => void;
  moveBlock: (activeId: string, overId: string) => void;
  removeBlock: (id: string) => void;

  // Circuit Operations
  setNodes: (nodes: CircuitNodeData[]) => void;
  addNode: (node: CircuitNodeData) => void;
  updateNodeData: (id: string, data: Partial<CircuitNodeData>) => void;
  removeNode: (id: string) => void;
  setConnections: (connections: CircuitConnection[]) => void;
  addConnection: (connection: CircuitConnection) => void;

  // Undo / Redo
  executeCommand: (command: Command) => Promise<void>;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

export const useEditorStore = create<EditorStoreState>((set, get) => ({
  mode: 'layout',
  selection: {
    selectedBlockId: null,
    selectedNodeId: null,
    selected3DObjectId: null,
    multiSelectIds: [],
  },
  blocks: [
    {
      id: 'block-hero-default',
      type: 'hero_3d',
      title: '3D Spatial Product Hero',
      category: 'presentation',
      props: {
        headline: 'Next-Generation Industrial Robotics',
        subheadline: 'Interactive 3D configurator and real-time kinematic simulation.',
        ctaText: 'Explore System',
        cameraPreset: 'front',
        modelUrl: '/models/industrial-arm.glb',
      },
    },
    {
      id: 'block-specs-default',
      type: 'product_specs',
      title: 'Technical Specifications',
      category: 'content',
      props: {
        items: [
          { label: 'Payload Capacity', value: '25.0 kg' },
          { label: 'Reach Radius', value: '1,820 mm' },
          { label: 'Repeatability', value: '±0.02 mm' },
          { label: 'Power Consumption', value: '1.2 kW' },
        ],
      },
    },
  ],
  nodes: [],
  connections: [],
  past: [],
  future: [],

  setMode: (mode) => set({ mode }),

  selectBlock: (id) =>
    set((state) => ({
      selection: { ...state.selection, selectedBlockId: id, selectedNodeId: null },
    })),

  selectNode: (id) =>
    set((state) => ({
      selection: { ...state.selection, selectedNodeId: id, selectedBlockId: null },
    })),

  select3DObject: (id) =>
    set((state) => ({
      selection: { ...state.selection, selected3DObjectId: id },
    })),

  setBlocks: (blocks) => set({ blocks }),

  addBlock: (block, targetIndex) => {
    const prevBlocks = get().blocks;
    const newBlocks = [...prevBlocks];
    if (typeof targetIndex === 'number' && targetIndex >= 0 && targetIndex <= newBlocks.length) {
      newBlocks.splice(targetIndex, 0, block);
    } else {
      newBlocks.push(block);
    }

    get().executeCommand({
      id: `add-block-${Date.now()}`,
      name: `Add ${block.title}`,
      timestamp: Date.now(),
      execute: () => set({ blocks: newBlocks, selection: { ...get().selection, selectedBlockId: block.id } }),
      undo: () => set({ blocks: prevBlocks }),
    });

    editorEventBus.emit('block:added', block);
  },

  updateBlockProps: (id, props) => {
    const prevBlocks = get().blocks;
    const target = prevBlocks.find((b) => b.id === id);
    if (!target) return;

    const oldProps = { ...target.props };
    const newBlocks = prevBlocks.map((b) => (b.id === id ? { ...b, props: { ...b.props, ...props } } : b));

    get().executeCommand({
      id: `update-block-${id}-${Date.now()}`,
      name: `Update ${target.title}`,
      timestamp: Date.now(),
      execute: () => set({ blocks: newBlocks }),
      undo: () =>
        set((s) => ({
          blocks: s.blocks.map((b) => (b.id === id ? { ...b, props: oldProps } : b)),
        })),
    });

    editorEventBus.emit('block:updated', { id, props });
  },

  moveBlock: (activeId, overId) => {
    const { blocks } = get();
    const oldIndex = blocks.findIndex((b) => b.id === activeId);
    const newIndex = blocks.findIndex((b) => b.id === overId);
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

    const reordered = [...blocks];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    set({ blocks: reordered });
    editorEventBus.emit('blocks:reordered', reordered);
  },

  removeBlock: (id) => {
    const prevBlocks = get().blocks;
    const blockToRemove = prevBlocks.find((b) => b.id === id);
    if (!blockToRemove) return;

    const newBlocks = prevBlocks.filter((b) => b.id !== id);

    get().executeCommand({
      id: `remove-block-${id}`,
      name: `Remove ${blockToRemove.title}`,
      timestamp: Date.now(),
      execute: () => set({ blocks: newBlocks, selection: { ...get().selection, selectedBlockId: null } }),
      undo: () => set({ blocks: prevBlocks }),
    });

    editorEventBus.emit('block:removed', id);
  },

  setNodes: (nodes) => set({ nodes }),
  addNode: (node) => set((state) => ({ nodes: [...state.nodes, node] })),
  updateNodeData: (id, data) =>
    set((state) => ({
      nodes: state.nodes.map((n) => (n.id === id ? { ...n, ...data } : n)),
    })),
  removeNode: (id) =>
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== id),
      connections: state.connections.filter((c) => c.source !== id && c.target !== id),
    })),

  setConnections: (connections) => set({ connections }),
  addConnection: (connection) =>
    set((state) => ({ connections: [...state.connections, connection] })),

  executeCommand: async (cmd) => {
    await cmd.execute();
    set((state) => ({
      past: [...state.past.slice(-20), cmd],
      future: [],
    }));
  },

  undo: async () => {
    const { past, future } = get();
    if (past.length === 0) return;
    const cmd = past[past.length - 1];
    await cmd.undo();
    set({
      past: past.slice(0, -1),
      future: [cmd, ...future],
    });
  },

  redo: async () => {
    const { past, future } = get();
    if (future.length === 0) return;
    const cmd = future[0];
    await cmd.execute();
    set({
      past: [...past, cmd],
      future: future.slice(1),
    });
  },

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,
}));
