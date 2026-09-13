import React from 'react';
import { WidgetRendererProps } from '../../types/studio';
import { MapPin } from 'lucide-react';

export const HotspotWidget: React.FC<WidgetRendererProps> = ({
  node,
  isSelected,
  isPreview,
  onSelect,
}) => {
  const {
    label = 'Hotspot Callout 01',
    description = 'Click to inspect internal component details',
    pinColor = '#3b82f6',
    backgroundColor = '#1e293b',
    textColor = '#f8fafc',
    borderRadius = 12,
  } = node.properties || {};

  return (
    <div
      onClick={onSelect}
      style={{
        backgroundColor,
        borderRadius: `${borderRadius}px`,
      }}
      className={`relative flex items-start gap-3 border border-slate-700/60 p-3.5 shadow-md cursor-pointer transition-all ${
        isSelected && !isPreview
          ? 'outline-2 outline-dashed outline-blue-500 outline-offset-2'
          : ''
      }`}
    >
      <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 border border-blue-400/40 shrink-0">
        <span
          style={{ backgroundColor: pinColor }}
          className="absolute inset-0 rounded-full opacity-40 animate-ping"
        />
        <MapPin size={16} />
      </div>
      <div>
        <h4 style={{ color: textColor }} className="text-xs font-bold font-sans">
          {label}
        </h4>
        <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
          {description}
        </p>
      </div>
    </div>
  );
};
