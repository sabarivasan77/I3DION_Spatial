import React, { useEffect, useRef } from 'react';
import { useStudioStore } from '../store/useStudioStore';
import { widgetRegistry } from '../registry/widgetRegistry';
import { StudioWidgetNode } from '../types/studio';
import {
  Copy,
  Trash2,
  ChevronUp,
  ChevronDown,
  Layers,
  MousePointer,
} from 'lucide-react';

import { AlignmentToolbar } from './AlignmentToolbar';
import { CollaboratorCursors } from '../collaboration/components/CollaboratorCursors';
import { collaborationTransport } from '../collaboration/transport/collaborationTransport';
import { useAuthStore } from '../../../store/authStore';

export const CanvasArea: React.FC = () => {
  const {
    experience,
    selectedWidgetId,
    selectedWidgetIds,
    canvasViewport,
    isPreview,
    zoomLevel,
    panOffset,
    selectWidget,
    addWidget,
    deleteWidget,
    deleteSelectedWidgets,
    duplicateWidget,
    copyWidget,
    pasteWidget,
    moveWidget,
    undo,
    redo,
  } = useStudioStore();

  const user = useAuthStore((s) => s.user);
  const containerRef = useRef<HTMLDivElement>(null);

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
        copyWidget();
      } else if (cmdOrCtrl && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        pasteWidget();
      } else if (cmdOrCtrl && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (cmdOrCtrl && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedWidgetIds.length > 0) {
          e.preventDefault();
          deleteSelectedWidgets();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [copyWidget, pasteWidget, undo, redo, deleteSelectedWidgets, selectedWidgetIds]);

  const handleMouseMoveCanvas = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);

    collaborationTransport.broadcastCursor({
      actorId: user?.id || 'user_local',
      actorName: user?.name || 'Local Editor',
      actorColor: '#06b6d4',
      x,
      y,
      editingSection: 'Canvas',
      timestamp: Date.now(),
    });
  };

  const getViewportWidthClass = () => {
    switch (canvasViewport) {
      case 'tablet':
        return 'w-[768px]';
      case 'mobile':
        return 'w-[375px]';
      default:
        return 'w-[1200px] max-w-full';
    }
  };

  const renderWidgetNode = (node: StudioWidgetNode) => {
    const definition = widgetRegistry.get(node.type);
    if (!definition) {
      return (
        <div key={node.id} className="rounded border border-red-300 bg-red-50 p-3 text-xs text-red-600">
          Unregistered widget type: {node.type} ({node.id})
        </div>
      );
    }

    const WidgetComponent = definition.component;
    const isSelected = selectedWidgetId === node.id || selectedWidgetIds.includes(node.id);

    return (
      <div key={node.id} className="group/item relative my-2">
        {/* Selection Floating Toolbar */}
        {isSelected && !isPreview && selectedWidgetIds.length <= 1 && (
          <div className="absolute -top-9 right-0 z-30 flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-white shadow-xl animate-in fade-in zoom-in-95">
            <span className="max-w-[120px] truncate text-[10px] font-mono text-slate-300">
              {node.id}
            </span>
            <span className="text-slate-600">|</span>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                moveWidget(node.id, 'up');
              }}
              className="rounded p-1 hover:bg-slate-800 text-slate-300 hover:text-white"
              title="Move Up"
            >
              <ChevronUp size={14} />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                moveWidget(node.id, 'down');
              }}
              className="rounded p-1 hover:bg-slate-800 text-slate-300 hover:text-white"
              title="Move Down"
            >
              <ChevronDown size={14} />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                duplicateWidget(node.id);
              }}
              className="rounded p-1 hover:bg-slate-800 text-slate-300 hover:text-white"
              title="Duplicate Widget"
            >
              <Copy size={14} />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                deleteWidget(node.id);
              }}
              className="rounded p-1 hover:bg-red-900/60 text-red-400 hover:text-red-300"
              title="Delete Widget"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}

        {/* Component Renderer */}
        <WidgetComponent
          node={node}
          isSelected={isSelected}
          isPreview={isPreview}
          onSelect={(e) => {
            e.stopPropagation();
            const isMulti = e.ctrlKey || e.metaKey;
            selectWidget(node.id, isMulti);
          }}
        />
      </div>
    );
  };

  return (
    <main
      onClick={() => selectWidget(null)}
      onMouseMove={handleMouseMoveCanvas}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const widgetType = e.dataTransfer.getData('widgetType');
        if (widgetType) {
          addWidget(widgetType);
        }
      }}
      className="no-scrollbar relative flex-1 overflow-auto bg-slate-100/70 p-6 flex flex-col items-center justify-start min-h-[calc(100vh-4rem)] select-none"
    >
      <AlignmentToolbar />

      {/* Viewport & Multi-selection Status Bar */}
      <div className="mb-3 flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-500 shadow-sm">
          <MousePointer size={13} className="text-blue-500" />
          <span>Viewport: {canvasViewport.toUpperCase()}</span>
          <span className="text-slate-300">|</span>
          <span>Zoom: {Math.round(zoomLevel * 100)}%</span>
        </div>

        {selectedWidgetIds.length > 1 && (
          <div className="flex items-center gap-2 rounded-full border border-blue-300 bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700 shadow-sm">
            <span>{selectedWidgetIds.length} Widgets Selected</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                deleteSelectedWidgets();
              }}
              className="ml-1 rounded bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600 hover:bg-red-200"
            >
              Delete Selected
            </button>
          </div>
        )}
      </div>

      {/* Main Canvas Workspace Container with Zoom Transform */}
      <div
        ref={containerRef}
        style={{
          transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
          transformOrigin: 'top center',
        }}
        className="transition-transform duration-150 ease-out flex justify-center w-full relative"
      >
        <CollaboratorCursors />

        <div
          style={{
            backgroundColor: experience.canvas.backgroundColor || '#ffffff',
          }}
          className={`relative min-h-[720px] transition-all duration-300 ease-out rounded-2xl border border-slate-200 shadow-lg p-6 ${getViewportWidthClass()}`}
        >
          {experience.widgets && experience.widgets.length > 0 ? (
            experience.widgets.map((node) => renderWidgetNode(node))
          ) : (
            <div className="flex h-96 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 text-center">
              <Layers size={40} className="mb-3 text-slate-300" />
              <h3 className="text-sm font-bold text-slate-700">Canvas Empty</h3>
              <p className="mt-1 text-xs text-slate-400">
                Click or drag any widget from the left library onto the canvas.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};


