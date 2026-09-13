import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ArrowRight } from 'lucide-react';
import { studioApi, StudioTemplate } from '../../api/studioApi';

export const StudioTemplates: React.FC = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<StudioTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await studioApi.getTemplates();
      setTemplates(data);
    } catch (err) {
      console.error('Failed to load studio templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyTemplate = async (template: StudioTemplate) => {
    try {
      const newProj = await studioApi.createProject({
        name: `${template.name} Catalog`,
        description: template.description,
        templateId: template.id,
      });
      navigate(`/studio/builder/${newProj.id}`);
    } catch (err) {
      console.error('Failed to apply template:', err);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 text-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <BookOpen className="w-6 h-6" />
            </span>
            Catalog Templates
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Choose from industry-specific visual templates or create custom organizational layouts.
          </p>
        </div>
      </div>

      {/* Grid of Templates */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-slate-200/60 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map(tpl => (
            <div
              key={tpl.id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 shadow-xs hover:shadow-md transition flex flex-col justify-between overflow-hidden group"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">
                    {tpl.theme}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Preset Template</span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-lg group-hover:text-indigo-600 transition">
                    {tpl.name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                    {tpl.description}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs text-slate-500">
                  <div className="flex justify-between">
                    <span>Preset Sections:</span>
                    <span className="font-bold text-slate-800">{tpl.sections.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Theme:</span>
                    <span className="font-bold text-indigo-600">{tpl.theme}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Ready to compose</span>
                <button
                  onClick={() => handleApplyTemplate(tpl)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
                >
                  Use Template
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
