import React, { useState } from 'react';
import { StudioWidgetNode } from '../types/studio';
import { useStudioStore } from '../store/useStudioStore';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface ThreePropertiesInspectorProps {
  node: StudioWidgetNode;
}

export const ThreePropertiesInspector: React.FC<ThreePropertiesInspectorProps> = ({ node }) => {
  const updateWidgetProperties = useStudioStore((s) => s.updateWidgetProperties);
  const openAssetPicker = useStudioStore((s) => s.openAssetPicker);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    model: true,
    transform: false,
    animation: false,
    material: false,
    interactions: false,
    advanced: false,
  });

  const [defaultView, setDefaultView] = useState<'Perspective' | 'Orthographic'>('Perspective');
  const [showHotspots, setShowHotspots] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);

  const props = node.properties || {};

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleUpdate = (updated: Record<string, any>) => {
    updateWidgetProperties(node.id, updated);
  };

  return (
    <div className="space-y-3 text-xs text-slate-800 select-none">
      {/* 3D Model Accordion (Matching Top Screenshot) */}
      <div className="rounded-lg border border-slate-200 overflow-hidden bg-white">
        <button
          type="button"
          onClick={() => toggleSection('model')}
          className="flex w-full items-center justify-between bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
        >
          <div className="flex items-center gap-1.5">
            {expandedSections.model ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span>3D Model</span>
          </div>
        </button>

        {expandedSections.model && (
          <div className="p-3 space-y-3 bg-white border-t border-slate-200">
            {/* Model Source */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500">Model Source</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={props.modelUrl || 'Compressor_Model.glb'}
                  className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-mono text-slate-700"
                />
                <button
                  type="button"
                  onClick={() => openAssetPicker(node.id)}
                  className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100 border border-blue-200 shadow-2xs"
                >
                  Change
                </button>
              </div>
            </div>

            {/* Default View */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500">Default View</label>
              <div className="flex items-center gap-4 pt-0.5">
                <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                  <input
                    type="radio"
                    name="defaultView"
                    checked={defaultView === 'Perspective'}
                    onChange={() => {
                      setDefaultView('Perspective');
                      handleUpdate({ defaultView: 'Perspective' });
                    }}
                    className="text-blue-600 focus:ring-0"
                  />
                  <span>Perspective</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                  <input
                    type="radio"
                    name="defaultView"
                    checked={defaultView === 'Orthographic'}
                    onChange={() => {
                      setDefaultView('Orthographic');
                      handleUpdate({ defaultView: 'Orthographic' });
                    }}
                    className="text-blue-600 focus:ring-0"
                  />
                  <span>Orthographic</span>
                </label>
              </div>
            </div>

            {/* Display Options */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <span className="text-[11px] font-semibold text-slate-500">Display Options</span>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-700">Show Hotspots</span>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={showHotspots}
                    onChange={(e) => {
                      setShowHotspots(e.target.checked);
                      handleUpdate({ showHotspots: e.target.checked });
                    }}
                    className="peer sr-only"
                  />
                  <div className="peer h-4 w-8 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-3 after:w-3 after:rounded-full after:bg-white after:transition-all peer-checked:bg-blue-600 peer-checked:after:translate-x-full" />
                </label>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-700">Show Labels</span>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={showLabels}
                    onChange={(e) => {
                      setShowLabels(e.target.checked);
                      handleUpdate({ showLabels: e.target.checked });
                    }}
                    className="peer sr-only"
                  />
                  <div className="peer h-4 w-8 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-3 after:w-3 after:rounded-full after:bg-white after:transition-all peer-checked:bg-blue-600 peer-checked:after:translate-x-full" />
                </label>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-700">Auto Rotate (Preview)</span>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={autoRotate}
                    onChange={(e) => {
                      setAutoRotate(e.target.checked);
                      handleUpdate({ autoRotate: e.target.checked });
                    }}
                    className="peer sr-only"
                  />
                  <div className="peer h-4 w-8 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-3 after:w-3 after:rounded-full after:bg-white after:transition-all peer-checked:bg-blue-600 peer-checked:after:translate-x-full" />
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Accordions: Transform, Animation, Material, Interactions, Advanced */}
      {['Transform', 'Animation', 'Material', 'Interactions', 'Advanced'].map((sec) => (
        <div key={sec} className="rounded-lg border border-slate-200 overflow-hidden bg-white">
          <button
            type="button"
            onClick={() => toggleSection(sec.toLowerCase())}
            className="flex w-full items-center justify-between bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            <div className="flex items-center gap-1.5">
              {expandedSections[sec.toLowerCase()] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <span>{sec}</span>
            </div>
          </button>
        </div>
      ))}
    </div>
  );
};

