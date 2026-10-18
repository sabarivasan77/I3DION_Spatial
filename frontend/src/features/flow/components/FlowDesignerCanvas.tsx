import React, { useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  Connection,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { FlowNode } from './FlowNode';
import type { CustomFlowNode, CustomFlowEdge, FlowCategory } from '../types/flow';

interface FlowDesignerCanvasProps {
  nodes: CustomFlowNode[];
  edges: CustomFlowEdge[];
  selectedNodeId: string | null;
  onNodesChange: (nodes: CustomFlowNode[]) => void;
  onEdgesChange: (edges: CustomFlowEdge[]) => void;
  onSelectNode: (nodeId: string | null) => void;
}

const nodeTypes = {
  customFlowNode: FlowNode as any,
};

export const FlowDesignerCanvas: React.FC<FlowDesignerCanvasProps> = ({
  nodes,
  edges,
  selectedNodeId: _selectedNodeId,
  onNodesChange,
  onEdgesChange,
  onSelectNode,
}) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  // Handle node movement and selection changes
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const updatedNodes = applyNodeChanges(changes, nodes) as CustomFlowNode[];
      onNodesChange(updatedNodes);
    },
    [nodes, onNodesChange]
  );

  // Handle edge additions, removals, selections
  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const updatedEdges = applyEdgeChanges(changes, edges) as CustomFlowEdge[];
      onEdgesChange(updatedEdges);
    },
    [edges, onEdgesChange]
  );

  // Connect two node ports
  const onConnect = useCallback(
    (connection: Connection) => {
      const newEdge: CustomFlowEdge = {
        ...connection,
        id: `e_${connection.source}_${connection.target}_${Date.now()}`,
        animated: true,
        style: { stroke: '#0891b2', strokeWidth: 2 },
      } as CustomFlowEdge;

      onEdgesChange(addEdge(newEdge, edges) as CustomFlowEdge[]);
    },
    [edges, onEdgesChange]
  );

  // Drag-and-drop drop handler from FlowPalette
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow/type');
      const label = event.dataTransfer.getData('application/reactflow/label');
      const category = event.dataTransfer.getData('application/reactflow/category') as FlowCategory;

      if (!type || !label) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNodeId = `node_${Date.now()}`;
      const newNode: CustomFlowNode = {
        id: newNodeId,
        type: 'customFlowNode',
        position,
        data: {
          label,
          type,
          category: category || 'logic',
          params: {},
          errorPolicy: { retryCount: 0, timeoutSeconds: 30, onError: 'stop' },
          executionStatus: 'idle',
        },
      };

      onNodesChange([...nodes, newNode]);
      onSelectNode(newNodeId);
    },
    [nodes, onNodesChange, onSelectNode, screenToFlowPosition]
  );

  // Validate connection: prevent self-connection
  const isValidConnection = useCallback((connection: any) => {
    if (connection.source === connection.target) return false;
    return true;
  }, []);

  return (
    <div ref={reactFlowWrapper} className="w-full h-full relative bg-slate-50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        isValidConnection={isValidConnection}
        onNodeClick={(_, node) => onSelectNode(node.id)}
        onPaneClick={() => onSelectNode(null)}
        fitView
        snapToGrid
        snapGrid={[8, 8]}
        defaultEdgeOptions={{
          animated: true,
          style: { stroke: '#94a3b8', strokeWidth: 2 },
        }}
      >
        <Background color="#cbd5e1" gap={16} size={1} />
        <Controls className="bg-white border border-slate-200 shadow-sm rounded-lg" />
        <MiniMap
          nodeColor={(n: any) => {
            if (n.data?.category === 'trigger') return '#0891b2';
            if (n.data?.category === 'communication') return '#10b981';
            if (n.data?.category === 'ecosystem') return '#f59e0b';
            return '#8b5cf6';
          }}
          className="bg-white border border-slate-200 shadow-md rounded-xl"
        />
      </ReactFlow>
    </div>
  );
};
