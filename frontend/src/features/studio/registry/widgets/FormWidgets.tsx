import React from 'react';
import { WidgetRendererProps } from '../../types/studio';

export const FormContainerWidget: React.FC<WidgetRendererProps> = ({ node, isSelected, isPreview, onSelect }) => {
  const { title = 'Lead Contact Form', padding = 20, borderRadius = 12, backgroundColor = '#ffffff' } = node.properties || {};

  return (
    <div
      onClick={onSelect}
      style={{ padding: `${padding}px`, borderRadius: `${borderRadius}px`, backgroundColor }}
      className={`w-full border border-slate-200 shadow-sm space-y-4 ${
        isSelected && !isPreview ? 'outline-2 outline-dashed outline-blue-500 outline-offset-2' : ''
      }`}
    >
      <h3 className="text-sm font-bold text-slate-800 border-b pb-2 border-slate-100">{title}</h3>
      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Full Name</label>
          <input type="text" placeholder="John Doe" className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-slate-50" readOnly={!isPreview} />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Work Email *</label>
          <input type="email" placeholder="john@company.com" className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-slate-50" readOnly={!isPreview} />
        </div>
        <button type="button" className="w-full py-2 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-sm">
          Submit Form
        </button>
      </div>
    </div>
  );
};

export const InputWidget: React.FC<WidgetRendererProps> = ({ node, isSelected, isPreview, onSelect }) => {
  const { label = 'Input Label', placeholder = 'Enter value...', required = false } = node.properties || {};

  return (
    <div
      onClick={onSelect}
      className={`w-full space-y-1 ${
        isSelected && !isPreview ? 'outline-2 outline-dashed outline-blue-500 outline-offset-2 p-1 rounded' : ''
      }`}
    >
      <label className="text-xs font-semibold text-slate-700 block">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <input
        type="text"
        placeholder={placeholder}
        className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
        readOnly={!isPreview}
      />
    </div>
  );
};

export const SelectWidget: React.FC<WidgetRendererProps> = ({ node, isSelected, isPreview, onSelect }) => {
  const { label = 'Select Option', options = 'Option 1, Option 2, Option 3' } = node.properties || {};
  const optionList = typeof options === 'string' ? options.split(',').map((s) => s.trim()) : ['Option 1', 'Option 2'];

  return (
    <div
      onClick={onSelect}
      className={`w-full space-y-1 ${
        isSelected && !isPreview ? 'outline-2 outline-dashed outline-blue-500 outline-offset-2 p-1 rounded' : ''
      }`}
    >
      <label className="text-xs font-semibold text-slate-700 block">{label}</label>
      <select className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none">
        {optionList.map((opt, i) => (
          <option key={i} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
};

export const CheckboxWidget: React.FC<WidgetRendererProps> = ({ node, isSelected, isPreview, onSelect }) => {
  const { label = 'I agree to terms and conditions', checked = false } = node.properties || {};

  return (
    <div
      onClick={onSelect}
      className={`flex items-center gap-2 ${
        isSelected && !isPreview ? 'outline-2 outline-dashed outline-blue-500 outline-offset-2 p-1 rounded' : ''
      }`}
    >
      <input type="checkbox" defaultChecked={checked} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
      <span className="text-xs text-slate-700 font-medium">{label}</span>
    </div>
  );
};
