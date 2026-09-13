import React, { useState } from 'react';
import { Monitor, Tablet, Smartphone, X, Box, ArrowRight } from 'lucide-react';
import { StudioProject, StudioSection } from '../../api/studioApi';

interface StudioPreviewModalProps {
  project: StudioProject;
  onClose: () => void;
}

export const StudioPreviewModal: React.FC<StudioPreviewModalProps> = ({ project, onClose }) => {
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [selectedAsset3DUrl, setSelectedAsset3DUrl] = useState<string | null>(null);

  const containerWidths = {
    desktop: 'w-full max-w-6xl',
    tablet: 'w-[768px]',
    mobile: 'w-[375px]',
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex flex-col">
      {/* Top Controls Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="px-2 py-1 text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded uppercase tracking-wider">
            Live Preview Mode
          </span>
          <h2 className="text-sm font-bold text-white truncate">{project.name}</h2>
        </div>

        {/* Device Switcher */}
        <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
          <button
            onClick={() => setDevice('desktop')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              device === 'desktop' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            Desktop
          </button>

          <button
            onClick={() => setDevice('tablet')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              device === 'tablet' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
            Tablet
          </button>

          <button
            onClick={() => setDevice('mobile')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              device === 'mobile' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            Mobile
          </button>
        </div>

        <button
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          title="Exit Preview"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Preview Screen */}
      <div className="flex-1 overflow-y-auto bg-slate-950 p-6 flex justify-center items-start">
        <div className={`bg-white dark:bg-slate-900 min-h-[800px] rounded-2xl shadow-2xl transition-all duration-300 overflow-hidden border border-slate-800 ${containerWidths[device]}`}>
          {/* Catalog Top Banner / Theme */}
          <div 
            className="p-10 text-center space-y-4 relative"
            style={{ backgroundColor: project.catalog_data.background_color || '#0F172A' }}
          >
            <span className="text-xs font-semibold uppercase tracking-widest text-indigo-400">
              I3DION Published Catalog Experience
            </span>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              {project.name}
            </h1>
            <p className="text-slate-400 max-w-xl mx-auto text-sm">
              {project.description || 'Explore our verified spatial asset collection and product showcase.'}
            </p>
          </div>

          {/* Render Sections */}
          <div className="p-8 space-y-12">
            {project.catalog_data.sections.map((section: StudioSection) => (
              <div key={section.id} className="space-y-6 border-b border-slate-100 dark:border-slate-800 pb-10 last:border-b-0">
                <div className="border-l-4 border-indigo-600 pl-4">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">{section.title}</h2>
                  {section.subtitle && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{section.subtitle}</p>
                  )}
                </div>

                {/* Section Content Grid */}
                {section.items && section.items.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {section.items.map((product: any) => (
                      <div
                        key={product.id}
                        className="bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 overflow-hidden shadow-sm hover:shadow-md transition"
                      >
                        <div className="h-44 bg-slate-200 dark:bg-slate-700/50 relative flex items-center justify-center">
                          {product.public_url ? (
                            <div className="text-center p-4 text-slate-400">
                              <Box className="w-10 h-10 mx-auto mb-1 opacity-70 text-indigo-400" />
                              <span className="text-xs font-mono">{product.name}</span>
                            </div>
                          ) : (
                            <div className="text-center p-4 text-slate-400">
                              <Box className="w-10 h-10 mx-auto mb-1 opacity-50" />
                              <span className="text-xs font-mono">Spatial Asset</span>
                            </div>
                          )}
                          {product.public_url && (
                            <button
                              onClick={() => setSelectedAsset3DUrl(product.public_url || null)}
                              className="absolute bottom-2 right-2 px-2.5 py-1 bg-indigo-600 text-white text-[11px] font-semibold rounded-md shadow flex items-center gap-1 hover:bg-indigo-700 transition"
                            >
                              <Box className="w-3.5 h-3.5" />
                              View 3D
                            </button>
                          )}
                        </div>

                        <div className="p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">
                              {product.category || 'Spatial Item'}
                            </span>
                            <span className="text-[10px] text-slate-400">Ref: #{product.id.slice(0, 6)}</span>
                          </div>
                          <h4 className="font-semibold text-slate-900 dark:text-white text-sm">{product.name}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{product.description}</p>
                          <div className="pt-2 flex items-center justify-between">
                            <button className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                              View Details
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                    Section items will be rendered here.
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-8 bg-slate-900 text-slate-400 text-xs text-center border-t border-slate-800">
            Powered by <span className="font-bold text-white">I3DION Spatial Hub</span> • Published via Omni Studio
          </div>
        </div>
      </div>

      {/* Optional 3D Preview Modal Overlay inside Preview */}
      {selectedAsset3DUrl && (
        <div className="fixed inset-0 bg-slate-950/90 z-60 flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 text-white">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Box className="w-4 h-4 text-indigo-400" />
                Interactive 3D Asset Preview
              </h3>
              <button onClick={() => setSelectedAsset3DUrl(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="h-80 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center text-slate-500 text-xs font-mono">
              [ Spatial Viewport: Model URL {selectedAsset3DUrl} ]
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setSelectedAsset3DUrl(null)}
                className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg"
              >
                Close 3D Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
