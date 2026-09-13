import React, { useState } from 'react';
import { widgetRegistry } from '../registry/widgetRegistry';
import { useStudioStore } from '../store/useStudioStore';
import { WidgetDefinition } from '../types/studio';
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
  ChevronDown,
  ChevronRight,
  Shapes,
  Sparkles,
  Database,
  LayoutGrid,
  Zap,
  Code2,
} from 'lucide-react';

export const WidgetLibraryPanel: React.FC = () => {
  const { addWidget } = useStudioStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'widgets' | 'hierarchy'>('widgets');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'Basic': true,
    'Layout': false,
    '3D & Models': false,
    'Media': false,
    'Forms': false,
    'Data & Integrations': false,
    'Product Components': false,
    'Interactive': false,
    'Advanced': false,
  });

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const getWidgetIcon = (iconName: string) => {
    switch (iconName) {
      case 'Type': return <Type size={16} className="text-red-500" />;
      case 'MousePointerClick': return <MousePointerClick size={16} className="text-amber-500" />;
      case 'Image': return <ImageIcon size={16} className="text-emerald-500" />;
      case 'Video': return <Video size={16} className="text-rose-500" />;
      case 'Box': return <Box size={16} className="text-blue-500" />;
      case 'Heading': return <Heading size={16} className="text-indigo-500" />;
      case 'Shapes': return <Shapes size={16} className="text-purple-500" />;
      default: return <Layers size={16} className="text-slate-500" />;
    }
  };

  // Pre-configured accordion category groups matching Reference UI Item 7
  const categoryGroups: Record<string, { label: string; desc: string; icon: string; type: string }[]> = {
    'Basic': [
      { label: 'Text', desc: 'Add text content', icon: 'Type', type: 'text' },
      { label: 'Button', desc: 'Interactive button', icon: 'MousePointerClick', type: 'button' },
      { label: 'Image', desc: 'Image with media library', icon: 'Image', type: 'image' },
      { label: 'Video Player', desc: 'HTML5 video player', icon: 'Video', type: 'video' },
      { label: 'Icon', desc: 'Icon with text', icon: 'Shapes', type: 'icon' },
      { label: 'Shape', desc: 'Basic shapes', icon: 'Box', type: 'shape' },
    ],
    'Layout': [
      { label: 'Container', desc: 'Layout container for widgets', icon: 'Box', type: 'widget_container_initial' },
      { label: 'Section', desc: 'Full-width content section', icon: 'Box', type: 'section' },
      { label: 'Grid', desc: 'Multi-column responsive grid', icon: 'Box', type: 'grid' },
    ],
    '3D & Models': [
      { label: '3D Product Viewer', desc: 'Interactive WebGL 3D Canvas', icon: 'Box', type: 'three_product_viewer' },
      { label: 'Hotspot Marker', desc: 'Interactive 3D spatial hotspot', icon: 'Box', type: 'hotspot' },
    ],
    'Media': [
      { label: 'Image Gallery', desc: 'Multi-image slideshow', icon: 'Image', type: 'gallery' },
      { label: 'Video Player', desc: 'HTML5 video streaming player', icon: 'Video', type: 'video' },
    ],
    'Forms': [
      { label: 'Text Input', desc: 'Text input field', icon: 'Type', type: 'input' },
      { label: 'Lead Capture Form', desc: 'Contact & inquiry form', icon: 'Type', type: 'lead_form' },
    ],
    'Data & Integrations': [
      { label: 'Data Table', desc: 'Interactive product data table', icon: 'Box', type: 'data_table' },
    ],
    'Product Components': [
      { label: 'Hero Banner', desc: 'Main hero section with 3D model', icon: 'Box', type: 'hero_banner' },
      { label: 'Spec Table', desc: 'Technical specifications list', icon: 'Box', type: 'spec_table' },
    ],
    'Interactive': [
      { label: 'View in AR Button', desc: 'WebXR / QuickLook AR button', icon: 'MousePointerClick', type: 'ar_button' },
    ],
    'Advanced': [
      { label: 'iScript Routine', desc: 'Custom Spatial iScript execution', icon: 'Box', type: 'iscript_runner' },
    ],
  };

  return (
    <aside className="flex h-full w-72 flex-col border-r border-slate-200 bg-white text-slate-800 shrink-0 select-none">
      {/* Top Header Tabs: Widgets | Hierarchy */}
      <div className="flex border-b border-slate-200 bg-slate-50 px-2 pt-2">
        <button
          onClick={() => setActiveTab('widgets')}
          className={`flex-1 py-2 text-center text-xs font-bold transition-all border-b-2 ${
            activeTab === 'widgets'
              ? 'border-blue-600 text-blue-600 bg-white rounded-t-md shadow-2xs'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Widgets
        </button>
        <button
          onClick={() => setActiveTab('hierarchy')}
          className={`flex-1 py-2 text-center text-xs font-bold transition-all border-b-2 ${
            activeTab === 'hierarchy'
              ? 'border-blue-600 text-blue-600 bg-white rounded-t-md shadow-2xs'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Hierarchy
        </button>
      </div>

      {activeTab === 'widgets' ? (
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Search Box */}
          <div className="p-3 border-b border-slate-200 bg-white">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search widgets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Accordion Category List (Matching Reference UI Item 7) */}
          <div className="no-scrollbar flex-1 overflow-y-auto p-2 space-y-1 bg-white">
            {Object.entries(categoryGroups).map(([catName, items]) => {
              const filtered = items.filter(
                (item) =>
                  item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  item.desc.toLowerCase().includes(searchQuery.toLowerCase())
              );
              if (searchQuery && filtered.length === 0) return null;

              const isExpanded = expandedCategories[catName] || Boolean(searchQuery);

              return (
                <div key={catName} className="rounded-lg">
                  {/* Category Accordion Header */}
                  <button
                    type="button"
                    onClick={() => toggleCategory(catName)}
                    className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown size={14} className="text-slate-400" />
                      ) : (
                        <ChevronRight size={14} className="text-slate-400" />
                      )}
                      <span>{catName}</span>
                    </div>
                  </button>

                  {/* Category Items */}
                  {isExpanded && (
                    <div className="mt-1 space-y-1 pl-3">
                      {filtered.map((item) => (
                        <div
                          key={item.label}
                          draggable={true}
                          onDragStart={(e) => {
                            e.dataTransfer.setData('widgetType', item.type);
                          }}
                          onClick={() => addWidget(item.type)}
                          className="group flex cursor-pointer items-start gap-2.5 rounded-lg border border-slate-100 bg-slate-50/70 p-2 transition-all hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-2xs"
                        >
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-white shadow-2xs">
                            {getWidgetIcon(item.icon)}
                          </div>
                          <div className="flex-1 pr-1">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold text-slate-800 group-hover:text-blue-600">
                                {item.label}
                              </h4>
                              <Plus size={12} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <p className="text-[10px] text-slate-500 leading-tight">
                              {item.desc}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          <LayerTreePanel />
        </div>
      )}
    </aside>
  );
};



