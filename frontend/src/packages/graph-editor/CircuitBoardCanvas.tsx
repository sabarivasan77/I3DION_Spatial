import React, { useCallback } from 'react';
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Edge,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { CircuitChipNode } from './CircuitChipNode';
import { wouldCreateCycle } from './cycleDetection';
import type { CircuitChipData } from './types';
import { editorEventBus } from '../editor-kernel/eventBus';

const nodeTypes = {
  circuitChip: CircuitChipNode,
};

const initialNodes: Node<CircuitChipData>[] = [
  {
    id: 'node-on-click',
    type: 'circuitChip',
    position: { x: 50, y: 120 },
    data: {
      chipType: 'event',
      label: 'On Mesh Click',
      category: 'Input Trigger',
      inputs: [],
      outputs: [
        { id: 'out-exec', name: 'Trigger', type: 'exec' },
        { id: 'out-meshId', name: 'Mesh ID', type: 'string' },
      ],
    },
  },
  {
    id: 'node-explode-action',
    type: 'circuitChip',
    position: { x: 380, y: 80 },
    data: {
      chipType: 'action',
      label: 'Explode Subassembly',
      category: 'Kinematics',
      inputs: [
        { id: 'in-exec', name: 'Execute', type: 'exec' },
        { id: 'in-factor', name: 'Distance Factor', type: 'number', defaultValue: 1.5 },
      ],
      outputs: [
        { id: 'out-exec', name: 'On Complete', type: 'exec' },
      ],
    },
  },
  {
    id: 'node-toggle-color',
    type: 'circuitChip',
    position: { x: 700, y: 150 },
    data: {
      chipType: 'transform',
      label: 'Highlight Thermal State',
      category: 'Visual Material',
      inputs: [
        { id: 'in-exec', name: 'Execute', type: 'exec' },
        { id: 'in-color', name: 'Albedo Tint', type: 'data' },
      ],
      outputs: [
        { id: 'out-success', name: 'Success', type: 'boolean' },
      ],
    },
  },
];

const initialEdges: Edge[] = [
  {
    id: 'edge-1',
    source: 'node-on-click',
    sourceHandle: 'out-exec',
    target: 'node-explode-action',
    targetHandle: 'in-exec',
    animated: true,
    style: { stroke: '#f59e0b', strokeWidth: 2 },
  },
  {
    id: 'edge-2',
    source: 'node-explode-action',
    sourceHandle: 'out-exec',
    target: 'node-toggle-color',
    targetHandle: 'in-exec',
    animated: true,
    style: { stroke: '#f59e0b', strokeWidth: 2 },
  },
];

export interface CircuitBoardCanvasProps {
  onNodeSelect?: (nodeId: string | null) => void;
  className?: string;
}

export const CircuitBoardCanvas: React.FC<CircuitBoardCanvasProps> = ({
  onNodeSelect,
  className = '',
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (connection: Connection) => {
      // Prevent cycle loops in execution flow
      const candidateEdge: Edge = {
        id: `edge-${connection.source}-${connection.target}-${Date.now()}`,
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
        animated: true,
        style: { stroke: '#06b6d4', strokeWidth: 2 },
      };

      if (wouldCreateCycle(edges, candidateEdge)) {
        console.warn('Circuit wire connection rejected: cycle detected in graph!');
        editorEventBus.emit('circuit:cycle-rejected', { source: connection.source, target: connection.target });
        return;
      }

      setEdges((eds) => addEdge(candidateEdge, eds));
      editorEventBus.emit('circuit:edge-connected', candidateEdge);
    },
    [edges, setEdges]
  );

  const onNodeClick = useCallback(
    (_: any, node: Node) => {
      onNodeSelect?.(node.id);
      editorEventBus.emit('circuit:node-selected', node);
    },
    [onNodeSelect]
  );

  const onPaneClick = useCallback(() => {
    onNodeSelect?.(null);
  }, [onNodeSelect]);

  return (
    <div className={`w-full h-full min-h-[500px] relative bg-slate-950 overflow-hidden ${className}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#334155" />
        <Controls className="!bg-slate-900/90 !border-slate-800 !text-slate-200 fill-slate-200" />
        <MiniMap
          nodeColor="#06b6d4"
          maskColor="rgba(15, 23, 42, 0.85)"
          className="!bg-slate-900 !border !border-slate-800 rounded-lg overflow-hidden"
        />
      </ReactFlow>

      {/* Circuit Board Status Header Bar */}
      <div className="absolute top-3 left-4 z-10 flex items-center gap-3 bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-1.5 backdrop-blur-md">
        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
        <span className="text-xs font-semibold text-slate-200">Omni Circuits Active Board</span>
        <span className="text-[10px] text-slate-500 font-mono">React Flow v12 Engine</span>
      </div>
    </div>
  );
};
