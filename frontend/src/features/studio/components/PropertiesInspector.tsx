import React from 'react';
import { useStudioStore } from '../store/useStudioStore';
import { widgetRegistry } from '../registry/widgetRegistry';
import { PropertySchemaItem } from '../types/studio';
import {
  SlidersHorizontal,
  Trash2,
  Copy,
  Image as ImageIcon,
  ChevronRight,
  Info,
} from 'lucide-react';

import { ThreePropertiesInspector } from './ThreePropertiesInspector';

import { EventActionBuilder } from './EventActionBuilder';

export const PropertiesInspector: React.FC = () => {
  const {
    experience,
    selectedWidgetId,
    updateWidgetProperties,
    deleteWidget,
    duplicateWidget,
    openAssetPicker,
  } = useStudioStore();

  const [activeTab, setActiveTab] = React.useState<'CONTENT' | 'STYLE' | 'LAYOUT' | 'DATA' | 'EVENTS' | 'ADVANCED'>('CONTENT');

  const selectedNode = experience.widgets.find((w) => w.id === selectedWidgetId);
  const widgetDefinition = selectedNode
    ? widgetRegistry.get(selectedNode.type)
    : undefined;

  if (!selectedNode || !widgetDefinition) {
    return (
      <aside className="flex h-full w-80 flex-col items-center justify-center border-l border-slate-200 bg-white p-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <SlidersHorizontal size={24} />
        </div>
        <h3 className="mt-4 text-sm font-bold text-slate-800">Properties Inspector</h3>
        <p className="mt-1 text-xs text-slate-400">
          Select any widget on the canvas to inspect and edit its properties.
        </p>
      </aside>
    );
  }

  const handlePropertyChange = (propName: string, value: any) => {
    updateWidgetProperties(selectedNode.id, { [propName]: value });
  };

  const renderControl = (item: PropertySchemaItem) => {
    const currentValue =
      selectedNode.properties[item.name] !== undefined
        ? selectedNode.properties[item.name]
        : item.default;

    switch (item.type) {
      case 'text':
        return (
          <input
            type="text"
            value={currentValue || ''}
            onChange={(e) => handlePropertyChange(item.name, e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        );

      case 'textarea':
        return (
          <textarea
            rows={3}
            value={currentValue || ''}
            onChange={(e) => handlePropertyChange(item.name, e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        );

      case 'number':
        return (
          <input
            type="number"
            min={item.min}
            max={item.max}
            step={item.step || 1}
            value={currentValue !== undefined ? currentValue : ''}
            onChange={(e) => handlePropertyChange(item.name, Number(e.target.value))}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        );

      case 'color':
        return (
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={currentValue || '#ffffff'}
              onChange={(e) => handlePropertyChange(item.name, e.target.value)}
              className="h-8 w-10 cursor-pointer rounded border border-slate-200 bg-transparent p-0.5"
            />
            <input
              type="text"
              value={currentValue || '#ffffff'}
              onChange={(e) => handlePropertyChange(item.name, e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-mono text-slate-700 uppercase"
            />
          </div>
        );

      case 'select':
        return (
          <select
            value={currentValue}
            onChange={(e) => handlePropertyChange(item.name, e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {item.options?.map((opt) => (
              <option key={String(opt.value)} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case 'boolean':
        return (
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={Boolean(currentValue)}
              onChange={(e) => handlePropertyChange(item.name, e.target.checked)}
              className="peer sr-only"
            />
            <div className="peer h-5 w-9 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none" />
            <span className="ml-2 text-xs text-slate-600">
              {currentValue ? 'Enabled' : 'Disabled'}
            </span>
          </label>
        );

      case 'image':
        return (
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Paste image URL..."
              value={currentValue || ''}
              onChange={(e) => handlePropertyChange(item.name, e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => openAssetPicker(selectedNode.id)}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
            >
              <ImageIcon size={14} />
              Select from I3DION Assets
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <aside className="flex h-full w-80 flex-col border-l border-slate-200 bg-white">
      {/* Widget Meta Header */}
      <div className="border-b border-slate-100 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-blue-50 p-1.5 text-blue-600">
              <SlidersHorizontal size={16} />
            </span>
            <div>
              <h3 className="text-xs font-bold text-slate-900">
                {widgetDefinition.displayName}
              </h3>
              <p className="text-[10px] font-mono text-slate-400">{selectedNode.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => duplicateWidget(selectedNode.id)}
              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              title="Duplicate"
            >
              <Copy size={15} />
            </button>
            <button
              type="button"
              onClick={() => deleteWidget(selectedNode.id)}
              className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
              title="Delete"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg mt-3">
          {(['CONTENT', 'STYLE', 'LAYOUT', 'DATA', 'EVENTS', 'ADVANCED'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`py-1 text-[10px] font-bold rounded transition ${
                activeTab === t ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Property Groups */}
      <div className="no-scrollbar flex-1 space-y-6 overflow-y-auto p-4">
        {selectedNode.type === '3d-model-viewer' ? (
          <ThreePropertiesInspector node={selectedNode} />
        ) : activeTab === 'EVENTS' ? (
          <EventActionBuilder node={selectedNode} />
        ) : activeTab === 'DATA' ? (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">DataBridge Binding</h4>
            <p className="text-xs text-slate-500">Bind connector outputs to widget properties e.g. <code className="text-blue-600">{"{{product.name}}"}</code></p>
          </div>
        ) : (
          <>
            {/* Stable ID Badge Section */}
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                <Info size={13} className="text-blue-500" />
                <span>Target Identifier (LogicCraft Ready)</span>
              </div>
              <input
                type="text"
                readOnly
                value={selectedNode.id}
                className="mt-1.5 w-full rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-mono text-slate-600"
              />
            </div>

            {/* Schema Driven Groups */}
            {widgetDefinition.propertySchema.map((group, groupIdx) => (
              <div key={groupIdx} className="space-y-3">
                <h4 className="flex items-center gap-1 text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <ChevronRight size={14} className="text-blue-500" />
                  {group.title}
                </h4>
                <div className="space-y-3.5 pl-2">
                  {group.properties.map((item) => (
                    <div key={item.name} className="space-y-1">
                      <label className="block text-[11px] font-semibold text-slate-600">
                        {item.label}
                      </label>
                      {renderControl(item)}
                      {item.description && (
                        <p className="text-[10px] text-slate-400">{item.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </aside>
  );
};
