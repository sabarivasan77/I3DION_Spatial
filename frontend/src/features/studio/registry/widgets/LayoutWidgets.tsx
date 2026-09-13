import React from 'react';
import { WidgetRendererProps } from '../../types/studio';

export const CardWidget: React.FC<WidgetRendererProps> = ({ node, isSelected, isPreview, onSelect }) => {
  const { title = 'Feature Card', subtitle = 'Card description text goes here...', padding = 20, borderRadius = 16, backgroundColor = '#ffffff' } = node.properties || {};

  return (
    <div
      onClick={onSelect}
      style={{ padding: `${padding}px`, borderRadius: `${borderRadius}px`, backgroundColor }}
      className={`w-full border border-slate-200 shadow-md space-y-2 ${
        isSelected && !isPreview ? 'outline-2 outline-dashed outline-blue-500 outline-offset-2' : ''
      }`}
    >
      <h4 className="text-sm font-bold text-slate-900">{title}</h4>
      <p className="text-xs text-slate-500 leading-relaxed">{subtitle}</p>
    </div>
  );
};

export const StatWidget: React.FC<WidgetRendererProps> = ({ node, isSelected, isPreview, onSelect }) => {
  const { label = 'Total Revenue', value = '$124,500', change = '+14.2%' } = node.properties || {};

  return (
    <div
      onClick={onSelect}
      className={`w-full p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-1 ${
        isSelected && !isPreview ? 'outline-2 outline-dashed outline-blue-500 outline-offset-2' : ''
      }`}
    >
      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">{label}</span>
      <div className="flex items-baseline justify-between">
        <span className="text-xl font-extrabold text-slate-900">{value}</span>
        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{change}</span>
      </div>
    </div>
  );
};

export const PriceWidget: React.FC<WidgetRendererProps> = ({ node, isSelected, isPreview, onSelect }) => {
  const { planName = 'Pro Plan', price = '$299', period = '/month', featureList = 'Unlimited Assets, 3D Export, Team Support' } = node.properties || {};
  const features = typeof featureList === 'string' ? featureList.split(',').map((s) => s.trim()) : ['Pro Feature 1', 'Pro Feature 2'];

  return (
    <div
      onClick={onSelect}
      className={`w-full p-6 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl shadow-xl space-y-4 ${
        isSelected && !isPreview ? 'outline-2 outline-dashed outline-blue-500 outline-offset-2' : ''
      }`}
    >
      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">{planName}</span>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-3xl font-black">{price}</span>
          <span className="text-xs text-slate-400">{period}</span>
        </div>
      </div>
      <ul className="space-y-1.5 border-t border-slate-800 pt-3 text-xs text-slate-300">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="text-cyan-400 font-bold">✓</span> {f}
          </li>
        ))}
      </ul>
      <button type="button" className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg transition">
        Get Started Now
      </button>
    </div>
  );
};
