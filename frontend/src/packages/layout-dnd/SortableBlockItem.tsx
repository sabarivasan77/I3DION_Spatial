import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface SortableBlockItemProps {
  id: string;
  children: (args: {
    setNodeRef: (element: HTMLElement | null) => void;
    attributes: any;
    listeners: any;
    isDragging: boolean;
    style: React.CSSProperties;
  }) => React.ReactNode;
}

export const SortableBlockItem: React.FC<SortableBlockItemProps> = ({ id, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.35 : 1,
  };

  return <>{children({ setNodeRef, attributes, listeners, isDragging, style })}</>;
};
