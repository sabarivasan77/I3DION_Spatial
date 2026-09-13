import React from 'react';
import { WidgetRendererProps } from '../../types/studio';

export const ContainerWidget: React.FC<WidgetRendererProps> = ({
  node,
  isSelected,
  isPreview,
  onSelect,
}) => {
  const {
    backgroundColor = '#ffffff',
    borderColor = '#e2e8f0',
    borderWidth = 1,
    borderRadius = 12,
    padding = 16,
    minHeight = 120,
    flexDirection = 'column',
    justifyContent = 'flex-start',
    alignItems = 'stretch',
    shadow = 'none',
  } = node.properties || {};

  const getShadowStyle = () => {
    switch (shadow) {
      case 'sm':
        return '0 1px 2px 0 rgb(0 0 0 / 0.05)';
      case 'md':
        return '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)';
      case 'lg':
        return '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)';
      default:
        return 'none';
    }
  };

  return (
    <div
      onClick={onSelect}
      style={{
        backgroundColor,
        borderColor,
        borderWidth: `${borderWidth}px`,
        borderStyle: borderWidth > 0 ? 'solid' : 'none',
        borderRadius: `${borderRadius}px`,
        padding: `${padding}px`,
        minHeight: `${minHeight}px`,
        display: 'flex',
        flexDirection: flexDirection as any,
        justifyContent: justifyContent as any,
        alignItems: alignItems as any,
        boxShadow: getShadowStyle(),
        transition: 'all 0.15s ease',
      }}
      className={`relative w-full overflow-hidden ${
        isSelected && !isPreview
          ? 'ring-2 ring-blue-500 ring-offset-2'
          : 'hover:border-blue-300'
      }`}
    >
      {(!node.children || node.children.length === 0) && !isPreview && (
        <div className="flex flex-1 items-center justify-center border-2 border-dashed border-slate-200 py-6 text-center text-xs font-medium text-slate-400">
          Drop or add child widgets here
        </div>
      )}
    </div>
  );
};
