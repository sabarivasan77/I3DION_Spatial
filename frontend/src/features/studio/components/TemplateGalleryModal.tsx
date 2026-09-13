import React, { useState } from 'react';
import { useStudioStore } from '../store/useStudioStore';
import { templateRegistry } from '../templates/templateRegistry';
import { TemplateDefinition, StudioWidgetNode } from '../types/studio';
import { widgetRegistry } from '../registry/widgetRegistry';
import {
  X,
  Sparkles,
  CheckCircle2,
  Eye,
  ArrowRight,
  Layers,
  Box,
  TrendingUp,
  Cpu,
} from 'lucide-react';

export const TemplateGalleryModal: React.FC = () => {
  const { isTemplateGalleryOpen, closeTemplateGallery, loadTemplate } =
    useStudioStore();
  const [selectedPreviewTemplate, setSelectedPreviewTemplate] =
    useState<TemplateDefinition | null>(null);

  if (!isTemplateGalleryOpen) return null;

  const templates = templateRegistry.getAll();

  const getTemplateIcon = (iconName: string) => {
    switch (iconName) {
      case 'Cpu':
        return <Cpu size={24} className="text-blue-400" />;
      case 'Box':
        return <Box size={24} className="text-indigo-400" />;
      case 'TrendingUp':
        return <TrendingUp size={24} className="text-emerald-400" />;
      default:
        return <Layers size={24} className="text-slate-400" />;
    }
  };

  const renderPreviewWidgetNode = (node: StudioWidgetNode) => {
    const definition = widgetRegistry.get(node.type);
    if (!definition) return null;
    const WidgetComponent = definition.component;

    return (
      <div key={node.id} className="relative my-2">
        <WidgetComponent
          node={node}
          isSelected={false}
          isPreview={true}
          onSelect={() => {}}
        />
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-2xl border border-slate-800 bg-slate-900 text-slate-100 shadow-2xl overflow-hidden">
        {/* Gallery Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                3DION OmniStudio Starter Templates
              </h2>
              <p className="text-xs text-slate-400">
                Choose an independent starter template architecture to launch your spatial experience.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeTemplateGallery}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Templates Grid Content */}
        <div className="no-scrollbar flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {templates.map((template) => (
              <div
                key={template.id}
                className="group relative flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-5 transition-all duration-300 hover:border-blue-500/50 hover:bg-slate-800/40 hover:shadow-xl hover:shadow-blue-500/5"
              >
                <div>
                  {/* Card Header Metadata */}
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-800 bg-slate-950 shadow-inner">
                      {getTemplateIcon(template.previewMetadata.icon)}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-400 border border-blue-500/20">
                        {template.access}
                      </span>
                      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-400">
                        v{template.version}
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">
                    {template.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {template.description}
                  </p>

                  {/* Use Case Callout */}
                  <div className="mt-3 rounded-lg border border-slate-800/60 bg-slate-950/40 p-2.5 text-[11px]">
                    <span className="font-semibold text-slate-300">Target Use: </span>
                    <span className="text-slate-400">{template.useCase}</span>
                  </div>

                  {/* Supported Capabilities Tags */}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {template.supportedCapabilities.map((cap, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 rounded bg-slate-800/60 px-2 py-0.5 text-[10px] text-slate-300"
                      >
                        <CheckCircle2 size={10} className="text-blue-400" />
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="mt-6 flex items-center gap-2 pt-4 border-t border-slate-800/60">
                  <button
                    type="button"
                    onClick={() => setSelectedPreviewTemplate(template)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                  >
                    <Eye size={14} />
                    Preview
                  </button>

                  <button
                    type="button"
                    onClick={() => loadTemplate(template.id)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 py-2 text-xs font-semibold text-white shadow-md hover:bg-blue-500 transition-all"
                  >
                    Use Template
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Template Preview Modal Sub-Layer */}
      {selectedPreviewTemplate && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/90 p-6 backdrop-blur-lg animate-in zoom-in-95 duration-150">
          <div className="flex h-[85vh] w-full max-w-4xl flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/50">
              <div>
                <h3 className="text-base font-bold text-white">
                  Preview: {selectedPreviewTemplate.name}
                </h3>
                <p className="text-xs text-slate-400">
                  Interactive template layout preview using native widget rendering definitions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPreviewTemplate(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Preview Canvas Area */}
            <div className="no-scrollbar flex-1 overflow-y-auto bg-slate-950 p-6 flex flex-col items-center justify-start">
              <div
                style={{
                  backgroundColor:
                    selectedPreviewTemplate.canvasConfig.backgroundColor,
                }}
                className="w-full max-w-[800px] min-h-[500px] rounded-xl border border-slate-800 p-6 shadow-inner"
              >
                {selectedPreviewTemplate.initialWidgetTree.map((node) =>
                  renderPreviewWidgetNode(node)
                )}
              </div>
            </div>

            {/* Preview Footer Actions */}
            <div className="flex items-center justify-between border-t border-slate-800 px-6 py-4 bg-slate-950/50">
              <button
                type="button"
                onClick={() => setSelectedPreviewTemplate(null)}
                className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Back to Gallery
              </button>

              <button
                type="button"
                onClick={() => {
                  const id = selectedPreviewTemplate.id;
                  setSelectedPreviewTemplate(null);
                  loadTemplate(id);
                }}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-lg hover:bg-blue-500"
              >
                <span>Use This Template</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
