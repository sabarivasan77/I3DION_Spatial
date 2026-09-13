import React from 'react';
import { WidgetRendererProps } from '../../types/studio';
import { Send } from 'lucide-react';

export const SubmitButtonWidget: React.FC<WidgetRendererProps> = ({
  node,
  isSelected,
  isPreview,
  onSelect,
}) => {
  const {
    label = 'Submit Inquiry',
    backgroundColor = '#2563eb',
    textColor = '#ffffff',
    borderRadius = 8,
  } = node.properties || {};

  return (
    <div
      onClick={onSelect}
      className={`relative w-full cursor-pointer transition-all ${
        isSelected && !isPreview
          ? 'outline-2 outline-dashed outline-blue-500 outline-offset-2'
          : ''
      }`}
    >
      <button
        type="submit"
        style={{
          backgroundColor,
          color: textColor,
          borderRadius: `${borderRadius}px`,
        }}
        className="flex w-full items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold shadow-md hover:brightness-110 active:scale-[0.99] transition-all"
      >
        <span>{label}</span>
        <Send size={13} />
      </button>
    </div>
  );
};
