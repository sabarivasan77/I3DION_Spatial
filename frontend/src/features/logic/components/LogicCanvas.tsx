import React, { useState, useRef, useEffect } from 'react';
import { useLogicCraftStore } from '../store/useLogicCraftStore';
import { useRuntimeStore } from '../runtime/runtimeContext';
import { LogicNode } from './LogicNode';
import { LogicConnection } from '../types/logic';

export const LogicCanvas: React.FC = () => {
  const {
    getActiveGraph,
    selectedNodeId,
    zoomLevel,
    panOffset,
    selectNode,
    selectConnection,
    moveNode,
    addConnection,
    copyNode,
    pasteNode,
    deleteNode,
    undo,
    redo,
  } = useLogicCraftStore();

  const activeConnectionId = useRuntimeStore((s) => s.activeConnectionId);

  const activeGraph = getActiveGraph();
  const nodes = activeGraph.nodes || [];
  const connections = activeGraph.connections || [];

  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragStartOffset, setDragStartOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Connection dragging state
  const [activePortDrag, setActivePortDrag] = useState<{
    nodeId: string;
    portId: string;
    isOutput: boolean;
    currentMousePos: { x: number; y: number };
  } | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);

  // Keyboard Shortcuts (Copy, Paste, Delete, Undo, Redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInput =
        activeElement?.tagName === 'INPUT' ||
        activeElement?.tagName === 'TEXTAREA' ||
        (activeElement as HTMLElement)?.isContentEditable;

      if (isInput) return;

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (cmdOrCtrl && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        copyNode();
      } else if (cmdOrCtrl && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        pasteNode();
      } else if (cmdOrCtrl && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (cmdOrCtrl && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeId) {
          e.preventDefault();
          deleteNode(selectedNodeId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [copyNode, pasteNode, undo, redo, deleteNode, selectedNodeId]);

  const handleMouseDownNode = (id: string, e: React.MouseEvent) => {
    setDraggingNodeId(id);
    const node = nodes.find((n) => n.id === id);
    if (node) {
      setDragStartOffset({
        x: e.clientX - node.position.x * zoomLevel,
        y: e.clientY - node.position.y * zoomLevel,
      });
    }
  };

  const handleMouseMoveCanvas = (e: React.MouseEvent) => {
    if (draggingNodeId) {
      const newX = Math.round((e.clientX - dragStartOffset.x) / zoomLevel);
      const newY = Math.round((e.clientY - dragStartOffset.y) / zoomLevel);
      moveNode(draggingNodeId, { x: Math.max(0, newX), y: Math.max(0, newY) });
    }

    if (activePortDrag) {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setActivePortDrag({
          ...activePortDrag,
          currentMousePos: {
            x: (e.clientX - rect.left) / zoomLevel,
            y: (e.clientY - rect.top) / zoomLevel,
          },
        });
      }
    }
  };

  const handleMouseUpCanvas = () => {
    setDraggingNodeId(null);
    setActivePortDrag(null);
  };

  const handleStartConnection = (nodeId: string, portId: string, isOutput: boolean, e: React.MouseEvent) => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setActivePortDrag({
        nodeId,
        portId,
        isOutput,
        currentMousePos: {
          x: (e.clientX - rect.left) / zoomLevel,
          y: (e.clientY - rect.top) / zoomLevel,
        },
      });
    }
  };

  const handleEndConnection = (targetNodeId: string, targetPortId: string, targetIsOutput: boolean) => {
    if (activePortDrag) {
      if (activePortDrag.isOutput && !targetIsOutput) {
        addConnection(
          activePortDrag.nodeId,
          activePortDrag.portId,
          targetNodeId,
          targetPortId
        );
      } else if (!activePortDrag.isOutput && targetIsOutput) {
        addConnection(
          targetNodeId,
          targetPortId,
          activePortDrag.nodeId,
          activePortDrag.portId
        );
      }
      setActivePortDrag(null);
    }
  };

  const getPortPosition = (nodeId: string, portId: string, isOutput: boolean) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };

    // Standard card geometry: width 288px (w-72)
    const x = isOutput ? node.position.x + 288 : node.position.x;
    const portIndex = isOutput
      ? node.outputPorts.findIndex((p) => p.id === portId)
      : node.inputPorts.findIndex((p) => p.id === portId);

    const y = node.position.y + 115 + Math.max(0, portIndex) * 24;
    return { x, y };
  };

  return (
    <main
      ref={canvasRef}
      onMouseMove={handleMouseMoveCanvas}
      onMouseUp={handleMouseUpCanvas}
      onClick={() => selectNode(null)}
      className="no-scrollbar relative flex-1 overflow-hidden bg-slate-950 p-6 select-none cursor-crosshair min-h-[calc(100vh-4rem)]"
    >
      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#475569 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Main Scaled Viewport Container */}
      <div
        style={{
          transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
          transformOrigin: 'top left',
        }}
        className="relative h-full w-full"
      >
        {/* SVG Connection Lines Layer */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible z-0">
          {connections.map((conn: LogicConnection) => {
            const start = getPortPosition(conn.sourceNodeId, conn.sourcePortId, true);
            const end = getPortPosition(conn.targetNodeId, conn.targetPortId, false);
            const dx = Math.abs(end.x - start.x) * 0.5;
            const isExecutingConn = activeConnectionId === conn.id;

            return (
              <g key={conn.id} className="pointer-events-auto">
                <path
                  d={`M ${start.x} ${start.y} C ${start.x + dx} ${start.y}, ${end.x - dx} ${end.y}, ${end.x} ${end.y}`}
                  fill="none"
                  stroke={isExecutingConn ? '#10b981' : '#3b82f6'}
                  strokeWidth={isExecutingConn ? '5' : '3'}
                  className={`cursor-pointer transition-all hover:stroke-indigo-400 hover:stroke-[5] ${
                    isExecutingConn ? 'animate-pulse' : ''
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    selectConnection(conn.id);
                  }}
                />
                {/* Flow Animation Indicator Particle */}
                <circle r={isExecutingConn ? '6' : '4'} fill={isExecutingConn ? '#34d399' : '#60a5fa'}>
                  <animateMotion
                    path={`M ${start.x} ${start.y} C ${start.x + dx} ${start.y}, ${end.x - dx} ${end.y}, ${end.x} ${end.y}`}
                    dur={isExecutingConn ? '1.0s' : '2.5s'}
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
            );
          })}

          {/* Active Connection Line Dragging Feedback */}
          {activePortDrag && (() => {
            const start = getPortPosition(activePortDrag.nodeId, activePortDrag.portId, activePortDrag.isOutput);
            const end = activePortDrag.currentMousePos;
            const dx = Math.abs(end.x - start.x) * 0.4;

            return (
              <path
                d={`M ${start.x} ${start.y} C ${start.x + (activePortDrag.isOutput ? dx : -dx)} ${start.y}, ${end.x + (activePortDrag.isOutput ? -dx : dx)} ${end.y}, ${end.x} ${end.y}`}
                fill="none"
                stroke="#60a5fa"
                strokeWidth="3"
                strokeDasharray="6 4"
                className="animate-pulse"
              />
            );
          })()}
        </svg>

        {/* Nodes Layer */}
        {nodes.map((node) => (
          <LogicNode
            key={node.id}
            node={node}
            isSelected={selectedNodeId === node.id}
            onSelect={(id, e) => {
              e.stopPropagation();
              selectNode(id);
            }}
            onMouseDownNode={handleMouseDownNode}
            onStartConnection={handleStartConnection}
            onEndConnection={handleEndConnection}
          />
        ))}
      </div>
    </main>
  );
};
