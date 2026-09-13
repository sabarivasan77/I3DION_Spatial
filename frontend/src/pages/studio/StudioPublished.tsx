import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, QrCode, ExternalLink, Copy, Check, Trash2 } from 'lucide-react';
import { studioApi, StudioProject } from '../../api/studioApi';

export const StudioPublished: React.FC = () => {
  const navigate = useNavigate();
  const [publishedProjects, setPublishedProjects] = useState<StudioProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeQrModalProj, setActiveQrModalProj] = useState<StudioProject | null>(null);

  useEffect(() => {
    loadPublished();
  }, []);

  const loadPublished = async () => {
    setLoading(true);
    try {
      const data = await studioApi.getProjects();
      setPublishedProjects(data.filter(p => p.status === 'Published'));
    } catch (err) {
      console.error('Failed to load published projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const getHubUrl = (proj: StudioProject) => {
    return `${window.location.origin}/product/${proj.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  };

  const handleCopyLink = (proj: StudioProject) => {
    const url = getHubUrl(proj);
    navigator.clipboard.writeText(url);
    setCopiedId(proj.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleUnpublish = async (id: string) => {
    if (!window.confirm('Unpublish this catalog experience? It will revert to draft.')) return;
    try {
      await studioApi.updateProject(id, { status: 'Draft' });
      loadPublished();
    } catch (err) {
      console.error('Failed to unpublish project:', err);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <span className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-200/50 dark:border-emerald-800/50">
              <Globe className="w-6 h-6" />
            </span>
            Published Catalog Experiences
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Active live catalogs accessible via Spatial Hub and mobile QR experiences.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : publishedProjects.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <Globe className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">No Published Catalogs</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            You haven't published any catalog projects yet. Complete a composition in the builder and click "Publish Catalog".
          </p>
          <button
            onClick={() => navigate('/studio/projects')}
            className="mt-2 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition"
          >
            Go to Projects
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {publishedProjects.map(proj => {
            const hubUrl = getHubUrl(proj);

            return (
              <div
                key={proj.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm hover:shadow-md transition"
              >
                <div className="space-y-2 max-w-xl">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">{proj.name}</h3>
                    <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold rounded-full uppercase tracking-wider">
                      Live • v{proj.last_published_version || proj.version}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                    {proj.description || 'No description'}
                  </p>

                  <div className="flex items-center gap-2 pt-1 font-mono text-xs text-indigo-600 dark:text-indigo-400">
                    <span className="text-slate-400">Target Hub URL:</span>
                    <a href={hubUrl} target="_blank" rel="noreferrer" className="hover:underline truncate max-w-md flex items-center gap-1">
                      {hubUrl}
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 flex-wrap">
                  <button
                    onClick={() => setActiveQrModalProj(proj)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition"
                  >
                    <QrCode className="w-4 h-4 text-indigo-600" />
                    QR Experience
                  </button>

                  <button
                    onClick={() => handleCopyLink(proj)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition"
                  >
                    {copiedId === proj.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    {copiedId === proj.id ? 'Copied' : 'Copy Link'}
                  </button>

                  <button
                    onClick={() => navigate(`/studio/builder/${proj.id}`)}
                    className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition"
                  >
                    Edit Draft
                  </button>

                  <button
                    onClick={() => handleUnpublish(proj.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition"
                    title="Unpublish"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QR Code Experience Modal */}
      {activeQrModalProj && (
        <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 text-center space-y-5 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">QR Experience Target</h3>
            <p className="text-xs text-slate-500">{activeQrModalProj.name}</p>

            {/* Generated QR Mock Canvas */}
            <div className="w-48 h-48 mx-auto bg-slate-100 dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center">
              <QrCode className="w-32 h-32 text-slate-900 dark:text-white" />
              <span className="text-[10px] font-mono text-slate-400 mt-2">Scan for Spatial Hub</span>
            </div>

            <div className="text-xs font-mono text-slate-400 truncate">
              {getHubUrl(activeQrModalProj)}
            </div>

            <button
              onClick={() => setActiveQrModalProj(null)}
              className="w-full py-2 bg-slate-900 text-white font-semibold text-xs rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
