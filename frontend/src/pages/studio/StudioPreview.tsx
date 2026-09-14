import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Monitor,
  Tablet,
  Smartphone,
  Sparkles
} from 'lucide-react';
import { studioApi, StudioProject } from '../../api/studioApi';
import { RuntimeRenderer } from '../../components/studio/runtimeRenderer';

export function StudioPreview() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState<StudioProject | null>(null);
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      studioApi.getProject(projectId!).then(p => {
        if (p) setProject(p);
        setIsLoading(false);
      });
    }
  }, [projectId]);

  if (isLoading || !project) {
    return <div className="h-screen flex items-center justify-center bg-slate-950 text-white font-bold">Initializing Preview Runtime...</div>;
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 font-sans text-slate-200 select-none overflow-hidden">
      {/* Top Preview Control Bar */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/omni-studio/editor/${projectId}`)}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <span className="font-bold text-sm text-white block leading-none">{project?.name || 'Studio Experience'}</span>
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Live Runtime Preview</span>
          </div>
        </div>

        {/* Device Viewport Selector */}
        <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-xl border border-slate-700">
          <button
            onClick={() => setDeviceMode('desktop')}
            className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
              deviceMode === 'desktop' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Monitor size={14} /> Desktop
          </button>
          <button
            onClick={() => setDeviceMode('tablet')}
            className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
              deviceMode === 'tablet' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Tablet size={14} /> Tablet
          </button>
          <button
            onClick={() => setDeviceMode('mobile')}
            className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
              deviceMode === 'mobile' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone size={14} /> Mobile
          </button>
        </div>

        <button
          onClick={() => navigate(`/omni-studio/editor/${projectId}`)}
          className="px-4 py-1.5 rounded-lg bg-indigo-600 font-bold text-xs text-white hover:bg-indigo-500 shadow-xs"
        >
          Return to Visual Editor
        </button>
      </header>

      {/* Main Preview Container */}
      <main className="flex-1 bg-[#050811] flex items-center justify-center p-8 overflow-auto">
        <div
          className={`bg-white rounded-2xl border border-slate-200 shadow-2xl relative overflow-hidden transition-all duration-300 ${
            deviceMode === 'desktop' ? 'w-[1024px] h-[640px]' :
            deviceMode === 'tablet' ? 'w-[768px] h-[600px]' :
            'w-[375px] h-[640px]'
          }`}
        >
          <RuntimeRenderer project={project} breakpoint={deviceMode} />
        </div>
      </main>
    </div>
  );
}
