import React, { useState } from 'react';
import { useStudioStore } from '../store/useStudioStore';
import { widgetRegistry } from '../registry/widgetRegistry';
import { PropertySchemaItem } from '../types/studio';
import {
  SlidersHorizontal,
  Trash2,
  Copy,
  Image as ImageIcon,
  ChevronRight,
  ChevronDown,
  Info,
  Lock,
  Eye,
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

  const [activeTab, setActiveTab] = useState<'Content' | 'Style' | 'Layout' | 'Events'>('Content');
  const [backgroundExpanded, setBackgroundExpanded] = useState(true);
  const [spacingExpanded, setSpacingExpanded] = useState(true);

  const selectedNode = experience.widgets.find((w) => w.id === selectedWidgetId);
  const widgetDefinition = selectedNode
    ? widgetRegistry.get(selectedNode.type)
    : undefined;

  if (!selectedNode || !widgetDefinition) {
    return (
      <aside className="flex h-full w-80 flex-col items-center justify-center border-l border-slate-200 bg-white p-6 text-center select-none">
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
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
          />
        );

      case 'textarea':
        return (
          <textarea
            rows={2}
            value={currentValue || ''}
            onChange={(e) => handlePropertyChange(item.name, e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
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
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
          />
        );

      case 'color':
        return (
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={currentValue || '#ffffff'}
              onChange={(e) => handlePropertyChange(item.name, e.target.value)}
              className="h-7 w-9 cursor-pointer rounded border border-slate-200 bg-transparent p-0.5"
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
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
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
            <div className="peer h-4 w-8 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-3 after:w-3 after:rounded-full after:bg-white after:transition-all peer-checked:bg-blue-600 peer-checked:after:translate-x-full" />
            <span className="ml-2 text-xs text-slate-600">
              {currentValue ? 'Enabled' : 'Disabled'}
            </span>
          </label>
        );

      default:
        return null;
    }
  };

  return (
    <aside className="flex h-full w-80 flex-col border-l border-slate-200 bg-white text-slate-800 shrink-0 select-none">
      {/* 4 Tabs Matching Image 1 Item 9: Content | Style | Layout | Events */}
      <div className="flex border-b border-slate-200 bg-slate-50 px-2 pt-2">
        {(['Content', 'Style', 'Layout', 'Events'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`flex-1 py-1.5 text-center text-xs font-bold transition-all border-b-2 ${
              activeTab === t
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-md shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Main Content Body */}
      <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto p-4">
        {/* Header Widget Meta & Actions */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
            {widgetDefinition.displayName}
          </h3>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => duplicateWidget(selectedNode.id)}
              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              title="Duplicate"
            >
              <Copy size={13} />
            </button>
            <button
              type="button"
              onClick={() => deleteWidget(selectedNode.id)}
              className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
              title="Delete"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* ID Field with Lock Icon & Description Field (Matching Image 1 Item 9) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label className="text-[11px] font-semibold text-slate-500">ID</label>
            <div className="relative flex-1">
              <input
                type="text"
                readOnly
                value={selectedNode.id}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1 pl-2 pr-7 text-xs font-mono text-slate-700"
              />
              <Lock size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <label className="text-[11px] font-semibold text-slate-500">Description</label>
            <input
              type="text"
              defaultValue="Main hero section with 3D model"
              className="flex-1 rounded-lg border border-slate-200 bg-white py-1 px-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {activeTab === 'Events' ? (
          <EventActionBuilder node={selectedNode} />
        ) : (
          <>
            {/* Background Accordion */}
            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setBackgroundExpanded(!backgroundExpanded)}
                className="flex w-full items-center justify-between bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                <div className="flex items-center gap-1.5">
                  {backgroundExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <span>Background</span>
                </div>
              </button>
              {backgroundExpanded && (
                <div className="p-3 space-y-2.5 bg-white border-t border-slate-200">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-slate-500">Background Type</span>
                    <select className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800 focus:border-blue-500 focus:outline-none">
                      <option value="Gradient">Gradient</option>
                      <option value="Solid">Solid</option>
                      <option value="Image">Image</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-slate-500">Color 1</span>
                    <div className="flex items-center gap-1.5">
                      <input type="color" defaultValue="#F8FAFC" className="h-6 w-6 cursor-pointer rounded border border-slate-200 bg-transparent p-0" />
                      <input defaultValue="#F8FAFC" className="w-20 rounded border border-slate-200 px-2 py-0.5 text-xs font-mono uppercase" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-slate-500">Color 2</span>
                    <div className="flex items-center gap-1.5">
                      <input type="color" defaultValue="#E2E8F0" className="h-6 w-6 cursor-pointer rounded border border-slate-200 bg-transparent p-0" />
                      <input defaultValue="#E2E8F0" className="w-20 rounded border border-slate-200 px-2 py-0.5 text-xs font-mono uppercase" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-slate-500">Direction</span>
                    <select className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800 focus:border-blue-500 focus:outline-none">
                      <option value="135">135°</option>
                      <option value="90">90°</option>
                      <option value="180">180°</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Spacing 4-Box Grid Accordion (Matching Image 1 Item 9) */}
            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setSpacingExpanded(!spacingExpanded)}
                className="flex w-full items-center justify-between bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                <div className="flex items-center gap-1.5">
                  {spacingExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <span>Spacing</span>
                </div>
              </button>
              {spacingExpanded && (
                <div className="p-3 space-y-2 bg-white border-t border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500">Padding</span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {['Top', 'Right', 'Bottom', 'Left'].map((side) => (
                      <div key={side} className="flex flex-col items-center gap-1 rounded border border-slate-200 bg-slate-50 p-1.5">
                        <input type="number" defaultValue={40} className="w-full text-center text-xs font-bold font-mono bg-white rounded border border-slate-200 py-0.5" />
                        <span className="text-[9px] text-slate-400">{side}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Schema Driven Additional Properties */}
            {widgetDefinition.propertySchema.map((group, groupIdx) => (
              <div key={groupIdx} className="space-y-2">
                <h4 className="flex items-center gap-1 text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <ChevronRight size={13} className="text-blue-500" />
                  {group.title}
                </h4>
                <div className="space-y-2.5 pl-2">
                  {group.properties.map((item) => (
                    <div key={item.name} className="space-y-1">
                      <label className="block text-[11px] font-semibold text-slate-600">
                        {item.label}
                      </label>
                      {renderControl(item)}
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

