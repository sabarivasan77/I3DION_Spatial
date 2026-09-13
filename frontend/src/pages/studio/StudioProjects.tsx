import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FolderPlus, 
  Search, 
  Filter, 
  Grid, 
  List, 
  MoreVertical, 
  Edit3, 
  Copy, 
  Archive, 
  Trash2, 
  Layers, 
  Plus, 
  X,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { studioApi, StudioProject } from '../../api/studioApi';

export const StudioProjects: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<StudioProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // New Project Form
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await studioApi.getProjects();
      setProjects(data);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setCreating(true);
    try {
      const newProj = await studioApi.createProject({
        name: newProjectName.trim(),
        description: newProjectDesc.trim(),
      });
      setShowCreateModal(false);
      setNewProjectName('');
      setNewProjectDesc('');
      navigate(`/studio/builder/${newProj.id}`);
    } catch (err) {
      console.error('Failed to create project:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await studioApi.duplicateProject(id);
      setActiveMenuId(null);
      loadProjects();
    } catch (err) {
      console.error('Failed to duplicate project:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      await studioApi.deleteProject(id);
      setActiveMenuId(null);
      loadProjects();
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await studioApi.updateProject(id, { status: 'Archived' });
      setActiveMenuId(null);
      loadProjects();
    } catch (err) {
      console.error('Failed to archive project:', err);
    }
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || (p.status || '').toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 text-slate-900">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-6 h-6 text-indigo-600" />
            Catalog & Visual Projects
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage your visual catalog compositions and spatial presentation workspaces.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Create New Project
        </button>
      </div>

      {/* Filter and Controls Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
          />
        </div>

        {/* Status Filter & View Toggle */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="in review">In Review</option>
              <option value="ready to publish">Ready to Publish</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition ${viewMode === 'grid' ? 'bg-white shadow-xs text-indigo-600' : 'text-slate-400'}`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition ${viewMode === 'list' ? 'bg-white shadow-xs text-indigo-600' : 'text-slate-400'}`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-48 bg-slate-200/60 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 space-y-3 shadow-xs">
          <FolderPlus className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-semibold text-slate-800">No Projects Found</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            {searchQuery ? 'Try adjusting your search query or filter settings.' : 'Start creating your first visual spatial catalog project.'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-2 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition"
            >
              Create Project
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map(proj => (
            <div
              key={proj.id}
              className="group bg-white rounded-xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition flex flex-col justify-between relative overflow-hidden"
            >
              {/* Card Header & Preview Placeholder */}
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    proj.status === 'Published' 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                      : proj.status === 'Ready to Publish'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : proj.status === 'Archived'
                      ? 'bg-slate-100 text-slate-600'
                      : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                  }`}>
                    {proj.status}
                  </span>

                  {/* Menu Button */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === proj.id ? null : proj.id);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {activeMenuId === proj.id && (
                      <div className="absolute right-0 top-7 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-20 py-1 text-xs text-slate-700">
                        <button
                          onClick={() => navigate(`/studio/builder/${proj.id}`)}
                          className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 font-medium"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Open Builder
                        </button>
                        <button
                          onClick={() => handleDuplicate(proj.id)}
                          className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 font-medium"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          Duplicate
                        </button>
                        <button
                          onClick={() => handleArchive(proj.id)}
                          className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 font-medium"
                        >
                          <Archive className="w-3.5 h-3.5" />
                          Archive
                        </button>
                        <div className="my-1 border-t border-slate-100" />
                        <button
                          onClick={() => handleDelete(proj.id)}
                          className="w-full px-3 py-2 text-left hover:bg-red-50 text-red-600 flex items-center gap-2 font-medium"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3
                    onClick={() => navigate(`/studio/builder/${proj.id}`)}
                    className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition cursor-pointer"
                  >
                    {proj.name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1 min-h-[32px]">
                    {proj.description || 'No description added for this catalog workspace.'}
                  </p>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-3 font-medium">
                  <span>{proj.catalog_data?.sections?.length || 0} Sections</span>
                  <span>•</span>
                  <span>v{proj.version}</span>
                </div>
                <button
                  onClick={() => navigate(`/studio/builder/${proj.id}`)}
                  className="text-indigo-600 font-bold hover:underline flex items-center gap-1"
                >
                  Edit
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-xs">
          {filteredProjects.map(proj => (
            <div
              key={proj.id}
              className="p-4 hover:bg-slate-50 transition flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h4
                    onClick={() => navigate(`/studio/builder/${proj.id}`)}
                    className="font-bold text-slate-900 text-sm hover:text-indigo-600 cursor-pointer"
                  >
                    {proj.name}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-1">
                    {proj.description || 'No description'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6 text-xs text-slate-500">
                <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px] ${
                  proj.status === 'Published' 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-indigo-100 text-indigo-800'
                }`}>
                  {proj.status}
                </span>

                <span>Updated {new Date(proj.updated_at).toLocaleDateString()}</span>

                <button
                  onClick={() => navigate(`/studio/builder/${proj.id}`)}
                  className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition"
                >
                  Edit in Builder
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                Create New Catalog Project
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2026 Industrial Equipment Catalog"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Briefly describe the purpose of this catalog composition..."
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 font-medium"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newProjectName.trim()}
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create & Open Builder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
