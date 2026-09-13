import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  BookOpen, 
  Upload, 
  Play, 
  ChevronLeft, 
  ChevronRight, 
  MoreVertical, 
  Layers, 
  Folder, 
  CloudUpload, 
  Edit3, 
  Smartphone, 
  Box, 
  CheckCircle2, 
  ArrowRight
} from 'lucide-react';
import { studioApi, StudioProject } from '../../api/studioApi';

export const StudioOverview: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<StudioProject[]>([]);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const heroCarouselItems = [
    {
      title: 'Transform your products into powerful experiences.',
      image: '/models/model_1.gltf', // 3D Render
      badge: 'Featured Showcase'
    },
    {
      title: 'Interactive 3D GLTF CAD Models & AR Presentations.',
      image: '/models/model_2.gltf',
      badge: 'Spatial Vault Sync'
    },
    {
      title: 'Deploy published catalogs directly to Spatial Hub.',
      image: '/models/model_3.gltf',
      badge: 'Instant Publishing'
    }
  ];

  useEffect(() => {
    loadOverviewData();
  }, []);

  const loadOverviewData = async () => {
    try {
      const data = await studioApi.getProjects();
      setProjects(data);
    } catch (err) {
      console.error('Failed to load studio overview data:', err);
    }
  };

  const handleCreateNewProject = async () => {
    try {
      const newProj = await studioApi.createProject({
        name: 'Industrial Pump Catalog',
        description: 'Visual catalog presentation workspace',
      });
      navigate(`/studio/builder/${newProj.id}`);
    } catch (err) {
      console.error('Failed to create new project:', err);
    }
  };

  // Mock initial items matching exact screenshot 1
  const displayProjects = projects.length > 0 ? projects.slice(0, 4) : [
    {
      id: 'proj-1',
      name: 'Industrial Pump Catalog',
      updated_at: new Date(Date.now() - 7200000).toISOString(),
      status: 'In Review',
      thumbnail: 'pump'
    },
    {
      id: 'proj-2',
      name: 'HVAC Solutions 2025',
      updated_at: new Date(Date.now() - 86400000).toISOString(),
      status: 'Draft',
      thumbnail: 'hvac'
    },
    {
      id: 'proj-3',
      name: 'Power Transmission Line',
      updated_at: new Date(Date.now() - 259200000).toISOString(),
      status: 'Ready to Publish',
      thumbnail: 'gear'
    },
    {
      id: 'proj-4',
      name: 'Smart Factory Experience',
      updated_at: new Date(Date.now() - 432000000).toISOString(),
      status: 'Published',
      thumbnail: 'factory'
    }
  ];

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 text-slate-100">
      {/* 1. Hero Welcome Banner */}
      <div className="bg-[#121827] border border-slate-800/80 rounded-2xl p-8 relative overflow-hidden shadow-2xl flex flex-col lg:flex-row justify-between items-stretch gap-8">
        <div className="space-y-6 max-w-2xl flex-1 flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">
              WELCOME TO
            </span>
            <h1 className="text-4xl font-extrabold text-white tracking-tight">
              I3DION <span className="bg-gradient-to-r from-indigo-400 to-violet-500 bg-clip-text text-transparent">Omni Studio</span>
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Design stunning product presentations, catalogs and visual experiences using your assets from Spatial Vault.
            </p>
          </div>

          {/* 4 Pill Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handleCreateNewProject}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/25 transition"
            >
              <Plus className="w-4 h-4" />
              New Catalog
            </button>

            <button
              onClick={() => navigate('/omni-studio/templates')}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#1A2234] hover:bg-slate-800 text-slate-200 font-medium text-xs rounded-xl border border-slate-700/80 transition"
            >
              <BookOpen className="w-4 h-4 text-indigo-400" />
              Use Template
            </button>

            <a
              href="/vault"
              className="flex items-center gap-2 px-4 py-2.5 bg-[#1A2234] hover:bg-slate-800 text-slate-200 font-medium text-xs rounded-xl border border-slate-700/80 transition"
            >
              <Upload className="w-4 h-4 text-emerald-400" />
              Assets from Vault
            </a>

            <button
              onClick={() => navigate('/omni-studio/support')}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#1A2234] hover:bg-slate-800 text-slate-200 font-medium text-xs rounded-xl border border-slate-700/80 transition"
            >
              <Play className="w-4 h-4 text-violet-400 fill-violet-400" />
              Watch Tutorial
            </button>
          </div>
        </div>

        {/* Hero Feature Showcase Carousel Box */}
        <div className="w-full lg:w-[420px] bg-[#1A2234] border border-slate-700/60 rounded-xl p-5 flex flex-col justify-between shrink-0 relative overflow-hidden">
          <div className="h-44 bg-slate-900/80 rounded-lg border border-slate-800 flex items-center justify-center relative overflow-hidden">
            <div className="w-32 h-32 rounded-xl bg-gradient-to-tr from-indigo-950 to-slate-800 flex items-center justify-center text-indigo-400 shadow-inner">
              <Box className="w-16 h-16 animate-pulse opacity-80" />
            </div>
            <span className="absolute top-2 left-2 px-2 py-0.5 bg-indigo-600/30 text-indigo-300 text-[10px] font-semibold rounded border border-indigo-500/30">
              {heroCarouselItems[carouselIndex].badge}
            </span>
          </div>

          <div className="pt-4 flex items-end justify-between">
            <p className="text-xs font-semibold text-slate-200 max-w-[240px]">
              {heroCarouselItems[carouselIndex].title}
            </p>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-mono text-slate-400 mr-1">
                0{carouselIndex + 1} / 03
              </span>
              <button
                onClick={() => setCarouselIndex((carouselIndex - 1 + 3) % 3)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md transition"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setCarouselIndex((carouselIndex + 1) % 3)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md transition"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Middle Section: Recent Projects (Left 3/4) & Quick Actions (Right 1/4) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Recent Projects (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white tracking-wide">Recent Projects</h2>
            <button
              onClick={() => navigate('/omni-studio/projects')}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition"
            >
              View all
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {displayProjects.map((proj: any) => (
              <div
                key={proj.id}
                onClick={() => navigate(`/omni-studio/builder/${proj.id}`)}
                className="group bg-[#121827] border border-slate-800 hover:border-indigo-500/60 rounded-xl p-4 transition cursor-pointer flex flex-col justify-between space-y-3 relative shadow-md"
              >
                <div className="space-y-3">
                  <div className="h-32 bg-[#1A2234] rounded-lg border border-slate-700/60 flex items-center justify-center relative overflow-hidden">
                    <Box className="w-10 h-10 text-indigo-400 opacity-70 group-hover:scale-110 transition-transform" />

                    <button className="absolute top-2 right-2 p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <h3 className="font-bold text-white text-sm group-hover:text-indigo-400 transition truncate">
                      {proj.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Modified {new Date(proj.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ago
                    </p>
                  </div>
                </div>

                <div>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                    proj.status === 'Published'
                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                      : proj.status === 'Ready to Publish'
                      ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50'
                      : proj.status === 'In Review'
                      ? 'bg-indigo-950/80 text-indigo-400 border border-indigo-800/60'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {proj.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions (1 col) */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-white tracking-wide">Quick Actions</h2>
          <div className="bg-[#121827] border border-slate-800 rounded-xl p-4 space-y-2.5">
            <button
              onClick={() => navigate('/omni-studio/templates')}
              className="w-full p-3 bg-[#1A2234] hover:bg-indigo-950/50 border border-slate-700/60 hover:border-indigo-500/50 rounded-xl transition flex items-center gap-3 text-left group"
            >
              <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition">
                <Layers className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-200 group-hover:text-white">Create from Template</span>
            </button>

            <a
              href="/vault"
              className="w-full p-3 bg-[#1A2234] hover:bg-indigo-950/50 border border-slate-700/60 hover:border-indigo-500/50 rounded-xl transition flex items-center gap-3 text-left group"
            >
              <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition">
                <Folder className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-200 group-hover:text-white">Browse Assets</span>
            </a>

            <button
              onClick={() => navigate('/omni-studio/projects')}
              className="w-full p-3 bg-[#1A2234] hover:bg-indigo-950/50 border border-slate-700/60 hover:border-indigo-500/50 rounded-xl transition flex items-center gap-3 text-left group"
            >
              <div className="p-2 bg-cyan-600/20 text-cyan-400 rounded-lg group-hover:bg-cyan-600 group-hover:text-white transition">
                <CloudUpload className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-200 group-hover:text-white">Import Content</span>
            </button>

            <button
              onClick={handleCreateNewProject}
              className="w-full p-3 bg-[#1A2234] hover:bg-indigo-950/50 border border-slate-700/60 hover:border-indigo-500/50 rounded-xl transition flex items-center gap-3 text-left group"
            >
              <div className="p-2 bg-violet-600/20 text-violet-400 rounded-lg group-hover:bg-violet-600 group-hover:text-white transition">
                <Edit3 className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-200 group-hover:text-white">Design with Canvas</span>
            </button>

            <button
              onClick={() => navigate('/omni-studio/published')}
              className="w-full p-3 bg-[#1A2234] hover:bg-indigo-950/50 border border-slate-700/60 hover:border-indigo-500/50 rounded-xl transition flex items-center gap-3 text-left group"
            >
              <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition">
                <Smartphone className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-200 group-hover:text-white">Preview on Mobile</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Lower Section: Templates (Left 3/4) & Recent Activity (Right 1/4) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Templates (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white tracking-wide">Templates</h2>
            <button
              onClick={() => navigate('/omni-studio/templates')}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition"
            >
              View all
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { name: 'Industrial Product', pages: '6 pages' },
              { name: 'Minimal Showcase', pages: '4 pages' },
              { name: 'Technical Datasheet', pages: '5 pages' },
              { name: 'Product Collection', pages: '8 pages' },
            ].map((tmpl, idx) => (
              <div
                key={idx}
                onClick={() => navigate('/omni-studio/templates')}
                className="group bg-[#121827] border border-slate-800 hover:border-indigo-500/60 rounded-xl p-4 transition cursor-pointer flex flex-col justify-between space-y-3 shadow-md"
              >
                <div className="h-36 bg-slate-900/90 rounded-lg border border-slate-800 p-3 flex flex-col justify-between relative overflow-hidden group-hover:border-indigo-500/40 transition">
                  <div className="text-[10px] uppercase font-bold text-slate-500">I3DION Template</div>
                  <div className="space-y-1">
                    <div className="h-2 w-16 bg-indigo-500/40 rounded" />
                    <div className="h-1.5 w-24 bg-slate-700 rounded" />
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-white text-sm group-hover:text-indigo-400 transition">{tmpl.name}</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">{tmpl.pages}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity (1 col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white tracking-wide">Recent Activity</h2>
            <button
              onClick={() => navigate('/omni-studio/versions')}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
            >
              View all
            </button>
          </div>

          <div className="bg-[#121827] border border-slate-800 rounded-xl p-4 space-y-4 text-xs">
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-indigo-950 text-indigo-400 rounded-lg shrink-0 mt-0.5">
                <Box className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="font-medium text-slate-200">You updated Industrial Pump Catalog</div>
                <div className="text-[10px] text-slate-500 mt-0.5">2 hours ago</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-blue-950 text-blue-400 rounded-lg shrink-0 mt-0.5">
                <Folder className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="font-medium text-slate-200">You created HVAC Solutions 2025</div>
                <div className="text-[10px] text-slate-500 mt-0.5">1 day ago</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-emerald-950 text-emerald-400 rounded-lg shrink-0 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="font-medium text-slate-200">You published Smart Factory Experience</div>
                <div className="text-[10px] text-slate-500 mt-0.5">5 days ago</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-violet-950 text-violet-400 rounded-lg shrink-0 mt-0.5">
                <Play className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="font-medium text-slate-200">Template "Minimal Showcase" added</div>
                <div className="text-[10px] text-slate-500 mt-0.5">6 days ago</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Footer */}
      <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
        <div>I3DION Omni Studio | v1.0.0</div>
        <div className="font-semibold text-slate-400">Build Visual. Share Ideas. Create Impact.</div>
      </div>
    </div>
  );
};

export default StudioOverview;
