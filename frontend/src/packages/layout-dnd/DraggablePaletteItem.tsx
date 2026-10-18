import React from 'react';
import { useDraggable } from '@dnd-kit/core';

export interface DraggablePaletteItemProps {
  id: string;
  data: any;
  children: (args: {
    setNodeRef: (element: HTMLElement | null) => void;
    attributes: any;
    listeners: any;
    isDragging: boolean;
  }) => React.ReactNode;
}

export const DraggablePaletteItem: React.FC<DraggablePaletteItemProps> = ({ id, data, children }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    data,
  });

  return <>{children({ setNodeRef, attributes, listeners, isDragging })}</>;
};
