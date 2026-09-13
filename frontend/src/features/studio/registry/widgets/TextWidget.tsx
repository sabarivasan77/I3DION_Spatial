import React from 'react';
import { WidgetRendererProps } from '../../types/studio';

export const TextWidget: React.FC<WidgetRendererProps> = ({
  node,
  isSelected,
  isPreview,
  onSelect,
}) => {
  const {
    content = 'Sample text content',
    variant = 'body',
    fontSize = 16,
    fontWeight = 'normal',
    color = '#1e293b',
    textAlign = 'left',
    lineHeight = 1.5,
  } = node.properties || {};

  const getWeightClass = () => {
    switch (fontWeight) {
      case 'medium':
        return 'font-medium';
      case 'semibold':
        return 'font-semibold';
      case 'bold':
        return 'font-bold';
      default:
        return 'font-normal';
    }
  };

  const Component = variant === 'h1' ? 'h1' : variant === 'h2' ? 'h2' : variant === 'h3' ? 'h3' : 'p';

  return (
    <div
      onClick={onSelect}
      className={`relative cursor-pointer transition-all ${
        isSelected && !isPreview ? 'ring-2 ring-blue-500 ring-offset-2 rounded-sm' : ''
      }`}
    >
      <Component
        style={{
          fontSize: `${fontSize}px`,
          color,
          textAlign: textAlign as any,
          lineHeight,
        }}
        className={getWeightClass()}
      >
        {content}
      </Component>
    </div>
  );
};
