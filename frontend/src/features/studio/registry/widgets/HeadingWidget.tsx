import React from 'react';
import { WidgetRendererProps } from '../../types/studio';

export const HeadingWidget: React.FC<WidgetRendererProps> = ({
  node,
  isSelected,
  isPreview,
  onSelect,
}) => {
  const {
    content = 'Section Heading',
    level = 'h2',
    fontSize = 24,
    fontWeight = 'bold',
    color = '#0f172a',
    textAlign = 'left',
    marginBottom = 12,
  } = node.properties || {};

  const Tag = (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(level)
    ? level
    : 'h2') as keyof JSX.IntrinsicElements;

  return (
    <div
      onClick={onSelect}
      className={`relative cursor-pointer transition-all ${
        isSelected && !isPreview
          ? 'outline-2 outline-dashed outline-blue-500 outline-offset-2'
          : ''
      }`}
    >
      <Tag
        style={{
          fontSize: `${fontSize}px`,
          fontWeight,
          color,
          textAlign,
          marginBottom: `${marginBottom}px`,
        }}
        className="font-sans leading-tight"
      >
        {content}
      </Tag>
    </div>
  );
};
