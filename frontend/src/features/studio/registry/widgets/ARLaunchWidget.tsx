import React from 'react';
import { WidgetRendererProps } from '../../types/studio';
import { Smartphone, Sparkles } from 'lucide-react';

export const ARLaunchWidget: React.FC<WidgetRendererProps> = ({
  node,
  isSelected,
  isPreview,
  onSelect,
}) => {
  const {
    label = 'Launch Augmented Reality (AR)',
    subtitle = 'Scan QR or tap to place model in your environment',
    backgroundColor = '#4f46e5',
    textColor = '#ffffff',
    borderRadius = 14,
  } = node.properties || {};

  return (
    <div
      onClick={onSelect}
      style={{
        backgroundColor,
        borderRadius: `${borderRadius}px`,
      }}
      className={`relative w-full p-4 shadow-lg cursor-pointer transition-all flex items-center justify-between text-white ${
        isSelected && !isPreview
          ? 'outline-2 outline-dashed outline-blue-500 outline-offset-2'
          : ''
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
          <Smartphone size={20} />
        </div>
        <div>
          <h4 style={{ color: textColor }} className="text-sm font-bold">
            {label}
          </h4>
          <p className="text-xs text-white/80 mt-0.5">{subtitle}</p>
        </div>
      </div>
      <Sparkles size={18} className="text-amber-300 animate-pulse" />
    </div>
  );
};
