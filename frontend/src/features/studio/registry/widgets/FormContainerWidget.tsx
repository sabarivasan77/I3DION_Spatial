import React from 'react';
import { WidgetRendererProps } from '../../types/studio';
import { widgetRegistry } from '../widgetRegistry';
import { StudioWidgetNode } from '../../types/studio';
import { FileText } from 'lucide-react';

export const FormContainerWidget: React.FC<WidgetRendererProps> = ({
  node,
  isSelected,
  isPreview,
  onSelect,
}) => {
  const {
    title = 'Lead Capture Form',
    description = 'Submit your information for an instant spatial product quote.',
    backgroundColor = '#ffffff',
    borderColor = '#e2e8f0',
    borderRadius = 16,
    padding = 24,
  } = node.properties || {};

  const renderChildNode = (childNode: StudioWidgetNode) => {
    const definition = widgetRegistry.get(childNode.type);
    if (!definition) return null;
    const WidgetComponent = definition.component;

    return (
      <WidgetComponent
        key={childNode.id}
        node={childNode}
        isSelected={false}
        isPreview={isPreview}
        onSelect={onSelect}
      />
    );
  };

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      onClick={onSelect}
      style={{
        backgroundColor,
        borderColor,
        borderRadius: `${borderRadius}px`,
        padding: `${padding}px`,
      }}
      className={`relative w-full border shadow-md cursor-pointer transition-all flex flex-col gap-3 ${
        isSelected && !isPreview
          ? 'outline-2 outline-dashed outline-blue-500 outline-offset-2'
          : ''
      }`}
    >
      <div className="border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-blue-600" />
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
        </div>
        {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
      </div>

      {/* Form Children Container */}
      <div className="flex flex-col gap-3 min-h-[100px]">
        {node.children && node.children.length > 0 ? (
          node.children.map((child) => renderChildNode(child))
        ) : (
          <div className="flex h-20 w-full items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 text-[11px] text-slate-400">
            Form Container Empty (Drag Inputs Here)
          </div>
        )}
      </div>
    </form>
  );
};
