import React from 'react';
import { WidgetRendererProps } from '../../types/studio';

export const SpacerWidget: React.FC<WidgetRendererProps> = ({
  node,
  isSelected,
  isPreview,
  onSelect,
}) => {
  const { height = 32 } = node.properties || {};

  return (
    <div
      onClick={onSelect}
      style={{ height: `${height}px` }}
      className={`relative w-full cursor-pointer transition-all ${
        isSelected && !isPreview
          ? 'bg-blue-50/50 border border-dashed border-blue-400'
          : 'bg-transparent'
      }`}
    >
      {!isPreview && isSelected && (
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-blue-500">
          Spacer ({height}px)
        </span>
      )}
    </div>
  );
};
