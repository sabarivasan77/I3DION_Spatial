import React, { useState } from 'react';
import { widgetRegistry } from '../registry/widgetRegistry';
import { useStudioStore } from '../store/useStudioStore';
import { WidgetCategory, WidgetDefinition } from '../types/studio';
import { LayerTreePanel } from './LayerTreePanel';
import {
  Search,
  Box,
  Type,
  Heading,
  Image as ImageIcon,
  Video,
  MousePointerClick,
  ShoppingBag,
  Sliders,
  MapPin,
  Smartphone,
  FileText,
  FormInput,
  Mail,
  Send,
  Minus,
  MoveVertical,
  Plus,
  Layers,
} from 'lucide-react';

const CATEGORIES: { key: 'all' | WidgetCategory; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'BASIC', label: 'Basic' },
  { key: 'LAYOUT', label: 'Layout' },
  { key: 'MEDIA', label: 'Media' },
  { key: 'FORM', label: 'Form' },
  { key: 'DATA', label: 'Data' },
  { key: '3D / SPATIAL', label: '3D / Spatial' },
  { key: 'NAVIGATION', label: 'Navigation' },
  { key: 'FEEDBACK', label: 'Feedback' },
  { key: 'ADVANCED', label: 'Advanced' },
];

export const WidgetLibraryPanel: React.FC = () => {
  const { addWidget } = useStudioStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | WidgetCategory>('all');

  const allWidgets = widgetRegistry.getAll();

  const filteredWidgets = allWidgets.filter((widget) => {
    const matchesCategory =
      activeCategory === 'all' || widget.category === activeCategory;
    const matchesSearch =
      widget.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      widget.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getWidgetIcon = (iconName: string) => {
    switch (iconName) {
      case 'Box':
        return <Box size={18} className="text-blue-400" />;
      case 'Heading':
        return <Heading size={18} className="text-indigo-400" />;
      case 'Type':
        return <Type size={18} className="text-slate-400" />;
      case 'Image':
        return <ImageIcon size={18} className="text-emerald-400" />;
      case 'Video':
        return <Video size={18} className="text-rose-400" />;
      case 'MousePointerClick':
        return <MousePointerClick size={18} className="text-amber-400" />;
      case 'ShoppingBag':
        return <ShoppingBag size={18} className="text-violet-400" />;
      case 'Sliders':
        return <Sliders size={18} className="text-cyan-400" />;
      case 'MapPin':
        return <MapPin size={18} className="text-sky-400" />;
      case 'Smartphone':
        return <Smartphone size={18} className="text-teal-400" />;
      case 'FileText':
        return <FileText size={18} className="text-orange-400" />;
      case 'FormInput':
        return <FormInput size={18} className="text-amber-400" />;
      case 'Mail':
        return <Mail size={18} className="text-blue-400" />;
      case 'Send':
        return <Send size={18} className="text-blue-400" />;
      case 'Minus':
        return <Minus size={18} className="text-slate-400" />;
      case 'MoveVertical':
        return <MoveVertical size={18} className="text-slate-400" />;
      default:
        return <Layers size={18} className="text-slate-400" />;
    }
  };

  return (
    <aside className="flex h-full w-80 flex-col border-r border-slate-200 bg-white text-slate-800">
      {/* Library Header */}
      <div className="border-b border-slate-200 p-4 bg-white">
        <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <Layers size={18} className="text-blue-600" />
          Widget Ecosystem
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Click or drag widgets directly onto the spatial canvas
        </p>

        {/* Search Input */}
        <div className="relative mt-3">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search widgets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="no-scrollbar flex gap-1 overflow-x-auto border-b border-slate-200 p-2.5 bg-slate-50">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            type="button"
            onClick={() => setActiveCategory(cat.key)}
            className={`whitespace-nowrap rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
              activeCategory === cat.key
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 border border-slate-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Widget Cards List with HTML5 Drag & Drop Support */}
      <div className="no-scrollbar flex-1 space-y-2 overflow-y-auto p-3 bg-white">
        {filteredWidgets.length > 0 ? (
          filteredWidgets.map((widget: WidgetDefinition) => (
            <div
              key={widget.type}
              draggable={true}
              onDragStart={(e) => {
                e.dataTransfer.setData('widgetType', widget.type);
              }}
              onClick={() => addWidget(widget.type)}
              className="group relative flex cursor-grab active:cursor-grabbing items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 transition-all hover:border-blue-400 hover:bg-slate-50 hover:shadow-sm"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 shadow-inner">
                {getWidgetIcon(widget.iconName)}
              </div>
              <div className="flex-1 pr-6">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {widget.displayName}
                  </h3>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-mono text-slate-500 capitalize">
                    {widget.category}
                  </span>
                </div>
                <p className="mt-0.5 text-[10px] text-slate-500 line-clamp-2 leading-tight">
                  {widget.description}
                </p>
              </div>
              <button
                type="button"
                className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-slate-500 opacity-0 group-hover:bg-blue-600 group-hover:text-white group-hover:opacity-100 transition-all"
                title={`Add ${widget.displayName}`}
              >
                <Plus size={14} />
              </button>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-xs text-slate-400">
            No matching widgets found.
          </div>
        )}
      </div>

      {/* Integrated Layer Tree Panel */}
      <LayerTreePanel />
    </aside>
  );
};


