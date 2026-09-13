import React from 'react';
import { WidgetRendererProps } from '../../types/studio';
import { Image as ImageIcon } from 'lucide-react';

export const ImageWidget: React.FC<WidgetRendererProps> = ({
  node,
  isSelected,
  isPreview,
  onSelect,
}) => {
  const {
    src = '',
    alt = 'Image element',
    objectFit = 'cover',
    height = 240,
    borderRadius = 8,
    borderWidth = 0,
    borderColor = '#e2e8f0',
  } = node.properties || {};

  return (
    <div
      onClick={onSelect}
      style={{
        borderRadius: `${borderRadius}px`,
        borderWidth: `${borderWidth}px`,
        borderStyle: borderWidth > 0 ? 'solid' : 'none',
        borderColor,
      }}
      className={`relative overflow-hidden cursor-pointer transition-all ${
        isSelected && !isPreview ? 'ring-2 ring-blue-500 ring-offset-2' : ''
      }`}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          style={{
            height: typeof height === 'number' ? `${height}px` : height,
            objectFit: objectFit as any,
          }}
          className="w-full transition-transform duration-200 hover:scale-[1.01]"
        />
      ) : (
        <div
          style={{ height: typeof height === 'number' ? `${height}px` : height }}
          className="flex w-full flex-col items-center justify-center bg-slate-100 text-slate-400"
        >
          <ImageIcon size={32} className="mb-2 opacity-60" />
          <span className="text-xs font-medium">Select image source</span>
        </div>
      )}
    </div>
  );
};
