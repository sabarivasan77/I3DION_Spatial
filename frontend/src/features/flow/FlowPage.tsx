import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ReactFlowProvider } from '@xyflow/react';
import { FlowListView } from './components/FlowListView';
import { FlowCommandBar } from './components/FlowCommandBar';
import { FlowPalette } from './components/FlowPalette';
import { FlowDesignerCanvas } from './components/FlowDesignerCanvas';
import { FlowNodeInspector } from './components/FlowNodeInspector';
import { FlowTestConsole } from './components/FlowTestConsole';
import { useFlowDesignerStore } from './store/useFlowDesignerStore';
import { Loader2 } from 'lucide-react';

export const FlowPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const {
    nodes,
    edges,
    selectedNodeId,
    isLoading,
    isPaletteOpen,
    isInspectorOpen,
    loadFlow,
    setNodes,
    setEdges,
    selectNode,
    updateNodeData,
    deleteNode,
  } = useFlowDesignerStore();

  useEffect(() => {
    if (id && id !== 'new') {
      loadFlow(id);
    }
  }, [id, loadFlow]);

  // If no ID is specified in URL, display the Flows dashboard / list view
  if (!id) {
    return <FlowListView />;
  }

  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 gap-3">
        <Loader2 size={36} className="animate-spin text-cyan-600" />
        <span className="text-sm font-medium text-slate-600">Loading Flow Designer...</span>
      </div>
    );
  }

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-slate-50">
      <ReactFlowProvider>
        {/* Top Command Bar */}
        <FlowCommandBar />

        {/* Designer Main Workspace */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Left: Collapsible Component Palette */}
          {isPaletteOpen && <FlowPalette />}

          {/* Center: React Flow Canvas */}
          <main className="flex-1 h-full relative overflow-hidden">
            <FlowDesignerCanvas
              nodes={nodes}
              edges={edges}
              selectedNodeId={selectedNodeId}
              onNodesChange={setNodes}
              onEdgesChange={setEdges}
              onSelectNode={selectNode}
            />
          </main>

          {/* Right: Step Inspector */}
          {isInspectorOpen && selectedNode && (
            <FlowNodeInspector
              selectedNode={selectedNode}
              onUpdateNode={updateNodeData}
              onDeleteNode={deleteNode}
              onClose={() => selectNode(null)}
            />
          )}

          {/* Bottom: Diagnostics & Test Execution Console */}
          <FlowTestConsole />
        </div>
      </ReactFlowProvider>
    </div>
  );
};

export default FlowPage;
