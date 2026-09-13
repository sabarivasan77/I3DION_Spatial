import React from 'react';
import { WidgetRendererProps } from '../../types/studio';

export const EmailInputWidget: React.FC<WidgetRendererProps> = ({
  node,
  isSelected,
  isPreview,
  onSelect,
}) => {
  const {
    label = 'Email Address',
    placeholder = 'name@company.com',
    required = true,
    name = 'email',
  } = node.properties || {};

  return (
    <div
      onClick={onSelect}
      className={`relative w-full flex flex-col gap-1 cursor-pointer transition-all ${
        isSelected && !isPreview
          ? 'outline-2 outline-dashed outline-blue-500 outline-offset-2'
          : ''
      }`}
    >
      <label className="text-xs font-semibold text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="email"
        name={name}
        placeholder={placeholder}
        required={required}
        readOnly={!isPreview}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
      />
    </div>
  );
};
