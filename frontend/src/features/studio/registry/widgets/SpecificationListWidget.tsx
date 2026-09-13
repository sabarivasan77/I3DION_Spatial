import React from 'react';
import { WidgetRendererProps } from '../../types/studio';
import { Sliders } from 'lucide-react';

export const SpecificationListWidget: React.FC<WidgetRendererProps> = ({
  node,
  isSelected,
  isPreview,
  onSelect,
}) => {
  const {
    title = 'Technical Specifications',
    items = [
      { name: 'Resolution', value: '0.005', unit: 'mm' },
      { name: 'Scan Rate', value: '2.4M', unit: 'pts/sec' },
      { name: 'Wavelength', value: '450', unit: 'nm' },
      { name: 'Enclosure Rating', value: 'IP67', unit: '' },
    ],
    backgroundColor = '#f8fafc',
    borderColor = '#e2e8f0',
    borderRadius = 12,
    padding = 20,
  } = node.properties || {};

  const specItems = Array.isArray(items) ? items : [];

  return (
    <div
      onClick={onSelect}
      style={{
        backgroundColor,
        borderColor,
        borderRadius: `${borderRadius}px`,
        padding: `${padding}px`,
      }}
      className={`relative w-full border shadow-sm cursor-pointer transition-all ${
        isSelected && !isPreview
          ? 'outline-2 outline-dashed outline-blue-500 outline-offset-2'
          : ''
      }`}
    >
      <div className="mb-3 flex items-center gap-2 border-b border-slate-200/80 pb-2">
        <Sliders size={16} className="text-blue-500" />
        <h4 className="text-sm font-bold text-slate-800">{title}</h4>
      </div>

      <div className="divide-y divide-slate-200/60">
        {specItems.map((item: any, idx: number) => (
          <div key={idx} className="flex items-center justify-between py-2 text-xs">
            <span className="font-medium text-slate-500">{item.name}</span>
            <span className="font-mono font-semibold text-slate-900">
              {item.value} {item.unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
