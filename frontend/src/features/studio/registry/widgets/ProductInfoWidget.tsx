import React from 'react';
import { WidgetRendererProps } from '../../types/studio';
import { Tag, ShieldCheck } from 'lucide-react';

export const ProductInfoWidget: React.FC<WidgetRendererProps> = ({
  node,
  isSelected,
  isPreview,
  onSelect,
}) => {
  const {
    title = 'Spatial Precision Scanner X1',
    subtitle = 'High-Speed Sub-Millimeter Optical 3D Measurement System',
    price = '$4,999.00',
    sku = 'SKU-SPATIAL-X100',
    inStock = true,
    backgroundColor = '#ffffff',
    borderColor = '#e2e8f0',
    borderRadius = 16,
    padding = 24,
  } = node.properties || {};

  return (
    <div
      onClick={onSelect}
      style={{
        backgroundColor,
        borderColor,
        borderRadius: `${borderRadius}px`,
        padding: `${padding}px`,
      }}
      className={`relative w-full border border-slate-200 shadow-sm cursor-pointer transition-all ${
        isSelected && !isPreview
          ? 'outline-2 outline-dashed outline-blue-500 outline-offset-2'
          : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-400">
          <Tag size={12} />
          {sku}
        </span>
        {inStock && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-600 border border-emerald-200">
            <ShieldCheck size={12} />
            In Stock
          </span>
        )}
      </div>

      <h3 className="mt-2 text-xl font-bold text-slate-900">{title}</h3>
      <p className="mt-1 text-xs text-slate-500 leading-relaxed">{subtitle}</p>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-2xl font-extrabold text-blue-600">{price}</span>
        <span className="text-xs text-slate-400">MSRP / Unit</span>
      </div>
    </div>
  );
};
