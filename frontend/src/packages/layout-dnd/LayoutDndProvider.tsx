import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import {
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';

export interface LayoutDndProviderProps {
  children: React.ReactNode;
  onDragEnd: (event: DragEndEvent) => void;
  onDragStart?: (event: DragStartEvent) => void;
  onDragOver?: (event: DragOverEvent) => void;
  renderOverlay?: (activeId: string | null, activeData: any) => React.ReactNode;
}

export const LayoutDndProvider: React.FC<LayoutDndProviderProps> = ({
  children,
  onDragEnd,
  onDragStart,
  onDragOver,
  renderOverlay,
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeData, setActiveData] = useState<any>(null);

  // Configure high-fidelity sensors (Pointer + Touch + Keyboard for WCAG 2.2 AA)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px deadzone ensures inputs and buttons can be clicked normally
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
    setActiveData(event.active.data.current);
    onDragStart?.(event);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    setActiveData(null);
    onDragEnd(event);
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setActiveData(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={onDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {children}
      <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
        {activeId && renderOverlay ? (
          renderOverlay(activeId, activeData)
        ) : activeId ? (
          <div className="bg-slate-900/90 border border-cyan-500/50 shadow-2xl rounded-xl p-4 text-white text-sm backdrop-blur-md opacity-95 flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="font-semibold">Moving Layout Component</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
