import React from 'react';
import { WidgetRendererProps } from '../../types/studio';

export const DividerWidget: React.FC<WidgetRendererProps> = ({
  node,
  isSelected,
  isPreview,
  onSelect,
}) => {
  const {
    color = '#e2e8f0',
    height = 1,
    margin = 16,
    borderStyle = 'solid',
  } = node.properties || {};

  return (
    <div
      onClick={onSelect}
      style={{
        marginTop: `${margin}px`,
        marginBottom: `${margin}px`,
      }}
      className={`relative w-full cursor-pointer py-1 transition-all ${
        isSelected && !isPreview
          ? 'outline-2 outline-dashed outline-blue-500 outline-offset-2'
          : ''
      }`}
    >
      <hr
        style={{
          borderColor: color,
          borderTopWidth: `${height}px`,
          borderStyle,
        }}
        className="w-full"
      />
    </div>
  );
};
