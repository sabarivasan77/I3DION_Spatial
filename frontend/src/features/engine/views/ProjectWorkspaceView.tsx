import React, { useState } from 'react';
import { useEngineStore } from '../store/useEngineStore';
import { Plus, Box, Database, FileCode, Layers, MoreVertical, Play, Trash2, Copy, Search, ExternalLink } from 'lucide-react';

export const ProjectWorkspaceView: React.FC = () => {
  const { projectsList, selectProject, createNewProject, duplicateProject, deleteProject } = useEngineStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  const filteredProjects = projectsList.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleCreate = (templateId?: string) => {
    createNewProject(newProjectName || 'Industrial Assembly Experience', templateId);
    setShowNewModal(false);
    setNewProjectName('');
  };

  return (
    <div className="flex-1 bg-slate-50 overflow-y-auto p-8 font-sans select-none">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Title Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Build Interactive 3D Experiences</h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              Add behavior. Create interactions. Bring your industrial 3D products to life.
            </p>
          </div>
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 bg-[#E94B4B] hover:bg-[#D63B3B] text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-md transition active:scale-95"
          >
            <Plus size={18} />
            <span>New Project</span>
          </button>
        </div>

        {/* Quick Action Creation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => handleCreate()}
            className="group flex items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-[#E94B4B]/50 transition text-left active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-[#E94B4B] flex items-center justify-center shrink-0 group-hover:scale-110 transition">
              <Plus size={24} />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm">Empty Project</div>
              <div className="text-xs text-slate-400 mt-0.5">Start from scratch</div>
            </div>
          </button>

          <button
            onClick={() => handleCreate('proj_industrial_compressor_01')}
            className="group flex items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-[#E94B4B]/50 transition text-left active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition">
              <Box size={24} />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm">From GLB</div>
              <div className="text-xs text-slate-400 mt-0.5">Import 3D model</div>
            </div>
          </button>

          <button
            onClick={() => handleCreate('proj_valve_assembly_03')}
            className="group flex items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-[#E94B4B]/50 transition text-left active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition">
              <Database size={24} />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm">From Vault</div>
              <div className="text-xs text-slate-400 mt-0.5">Choose from assets</div>
            </div>
          </button>

          <button
            onClick={() => handleCreate('proj_industrial_compressor_01')}
            className="group flex items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-[#E94B4B]/50 transition text-left active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition">
              <Layers size={24} />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm">From Template</div>
              <div className="text-xs text-slate-400 mt-0.5">Use a ready setup</div>
            </div>
          </button>
        </div>

        {/* Recent Projects Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Recent Projects</h2>
            <div className="relative w-64">
              <Search size={14} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#E94B4B]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="group bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden hover:shadow-lg hover:border-slate-300 transition flex flex-col"
              >
                {/* Thumbnail Preview Box */}
                <div className="h-44 bg-slate-900 relative overflow-hidden flex items-center justify-center">
                  <img
                    src={project.thumbnailUrl}
                    alt={project.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60" />

                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-md shadow-sm border ${
                        project.status === 'Published'
                          ? 'bg-emerald-500/80 text-white border-emerald-400'
                          : 'bg-slate-900/80 text-slate-200 border-slate-700'
                      }`}
                    >
                      {project.status}
                    </span>
                  </div>
                </div>

                {/* Info & Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 text-sm truncate">{project.name}</h3>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={() => duplicateProject(project.id)}
                          title="Duplicate project"
                          className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                        >
                          <Copy size={13} />
                        </button>
                        <button
                          onClick={() => deleteProject(project.id)}
                          title="Delete project"
                          className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">{project.description}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-[11px] text-slate-400 font-medium">Updated {project.updatedAt}</span>
                    <button
                      onClick={() => selectProject(project.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-[#E94B4B] text-[#E94B4B] hover:text-white font-bold text-xs transition active:scale-95"
                    >
                      <Play size={12} className="fill-current" />
                      <span>Open</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* New Project Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 border border-slate-200">
            <h3 className="font-black text-slate-900 text-lg">Create New Experience</h3>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Project Name</label>
              <input
                type="text"
                placeholder="e.g. Industrial Turbine Experience"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#E94B4B]"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowNewModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCreate()}
                className="px-4 py-2 rounded-xl bg-[#E94B4B] hover:bg-[#D63B3B] text-white text-xs font-bold shadow-md"
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
