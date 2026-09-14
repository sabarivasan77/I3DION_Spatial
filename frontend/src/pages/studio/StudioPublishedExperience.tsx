import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { studioApi, StudioProject } from '../../api/studioApi';
import { RuntimeRenderer } from '../../components/studio/runtimeRenderer';
import { Box, Sparkles, ArrowLeft } from 'lucide-react';

export function StudioPublishedExperience() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<StudioProject | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      setIsLoading(true);
      studioApi.getProject(projectId)
        .then(p => {
          if (p) setProject(p);
        })
        .catch(err => console.error('Failed to load published experience', err))
        .finally(() => setIsLoading(false));
    }
  }, [projectId]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950 text-white font-sans">
        <Sparkles className="w-10 h-10 text-indigo-400 animate-pulse mb-3" />
        <h3 className="text-base font-bold">Initializing Experience Runtime...</h3>
        <p className="text-xs text-slate-500 mt-1">Fetching Spatial Vault data & loading interactive components</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950 text-white font-sans p-6 text-center">
        <Box className="w-12 h-12 text-red-400 mb-3" />
        <h3 className="text-lg font-bold">Experience Not Found</h3>
        <p className="text-xs text-slate-400 max-w-md mt-1">
          The requested application or catalog experience could not be loaded or is not published.
        </p>
        <button
          onClick={() => navigate('/omni-studio/projects')}
          className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition"
        >
          Return to Studio Projects
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-900 font-sans text-slate-100 select-none overflow-hidden relative">
      {/* Top Experience Header Bar */}
      <header className="h-12 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 flex items-center justify-between shrink-0 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/omni-studio/projects')}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition"
            title="Back to Studio"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <h2 className="font-extrabold text-xs text-white leading-none">{project.name}</h2>
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider bg-indigo-600/20 px-2 py-0.5 rounded-md border border-indigo-500/30">
              {project.project_type || 'Published Experience'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-slate-400">
            v{project.version || '1.0'} Published
          </span>
        </div>
      </header>

      {/* Standalone Application Runtime Canvas */}
      <main className="flex-1 relative overflow-hidden bg-slate-900">
        <RuntimeRenderer project={project} breakpoint="desktop" />
      </main>
    </div>
  );
}
