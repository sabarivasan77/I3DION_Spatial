import React from 'react';
import { useDroppable } from '@dnd-kit/core';

export interface DroppableCanvasProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export const DroppableCanvas: React.FC<DroppableCanvasProps> = ({ id, children, className = '' }) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`${className} ${
        isOver ? 'ring-2 ring-cyan-500/80 bg-cyan-950/20 shadow-[0_0_30px_rgba(6,182,212,0.15)]' : ''
      } transition-colors duration-200`}
    >
      {children}
    </div>
  );
};
