import React, { useState, useEffect } from 'react';
import { useCollaborationStore } from '../store/collaborationStore';
import { ExperienceDocument } from '../types/collaborationTypes';
import { api } from '../../../../services/api';
import {
  FolderKanban,
  Plus,
  Search,
  X,
  FileText,
  Clock,
  User,
  Copy,
  Trash2,
  Archive,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const ExperienceDashboard: React.FC = () => {
  const { isDashboardOpen, closeDashboard, loadExperienceDocument } = useCollaborationStore();
  const [experiences, setExperiences] = useState<ExperienceDocument[]>([]);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchExperiences = async () => {
    setLoading(true);
    try {
      const docs = await api.listExperiences({ status: activeFilter === 'ALL' ? undefined : activeFilter });
      setExperiences(docs || []);
    } catch (e) {
      console.error('Failed to fetch experiences:', e);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isDashboardOpen) {
      fetchExperiences();
    }
  }, [isDashboardOpen, activeFilter]);

  if (!isDashboardOpen) return null;

  const filteredDocs = experiences.filter((doc) =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (doc.description && doc.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleDuplicate = async (e: React.MouseEvent, doc: ExperienceDocument) => {
    e.stopPropagation();
    try {
      const duplicated = await api.createExperience({
        name: `${doc.name} (Copy)`,
        description: doc.description,
      });
      if (duplicated) {
        fetchExperiences();
      }
    } catch (err) {
      console.error('Failed to duplicate experience:', err);
    }
  };

  const handleArchive = async (e: React.MouseEvent, id: string, currentStatus: string) => {
    e.stopPropagation();
    try {
      const nextStatus = currentStatus === 'ARCHIVED' ? 'DRAFT' : 'ARCHIVED';
      await api.updateExperience(id, { status: nextStatus });
      fetchExperiences();
    } catch (err) {
      console.error('Failed to archive experience:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6 select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl h-[85vh] shadow-2xl overflow-hidden flex flex-col text-slate-200 font-sans">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400">
              <FolderKanban size={22} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Experience Workspace</h3>
              <p className="text-xs text-slate-400 font-mono">
                Manage tenant-isolated cloud experiences, draft versions & published releases
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCreateNew}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl text-xs font-mono transition flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
            >
              <Plus size={16} />
              <span>New Experience</span>
            </button>
            <button
              onClick={closeDashboard}
              className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Toolbar & Search */}
        <div className="px-6 py-3 border-b border-slate-800 bg-slate-950/30 flex items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            {(['ALL', 'DRAFT', 'PUBLISHED', 'ARCHIVED'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeFilter === filter
                    ? 'bg-cyan-600/30 text-cyan-400 border border-cyan-500/40 font-bold'
                    : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search experiences by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition"
            />
          </div>
        </div>

        {/* Experience Cards Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-16 text-slate-500 font-mono text-xs">
              Loading cloud experience workspace...
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-cyan-400 mb-3 border border-slate-700">
                <FileText size={28} />
              </div>
              <h4 className="text-base font-bold text-slate-200">No experiences found</h4>
              <p className="text-xs text-slate-400 max-w-xs mt-1 mb-4 font-mono">
                {searchQuery
                  ? 'No experiences match your search query.'
                  : 'Start by creating your first interactive 3D spatial experience.'}
              </p>
              <button
                onClick={handleCreateNew}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs font-mono transition flex items-center gap-1.5 shadow-md"
              >
                <Plus size={15} />
                <span>Create New Experience</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => handleOpenExperience(doc.id)}
                  className="bg-slate-950/60 border border-slate-800 hover:border-cyan-500/50 p-4 rounded-xl cursor-pointer transition flex flex-col justify-between group hover:shadow-xl hover:shadow-cyan-500/5"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-slate-200 group-hover:text-cyan-400 transition truncate pr-2">
                        {doc.name}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-mono rounded-full border shrink-0 ${
                          doc.status === 'PUBLISHED'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : doc.status === 'ARCHIVED'
                            ? 'bg-slate-800 text-slate-400 border-slate-700'
                            : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {doc.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                      {doc.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} />
                      <span>{new Date(doc.updatedAt).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleDuplicate(e, doc)}
                        className="p-1 hover:text-cyan-400 transition"
                        title="Duplicate Experience"
                      >
                        <Copy size={13} />
                      </button>
                      <button
                        onClick={(e) => handleArchive(e, doc.id, doc.status)}
                        className="p-1 hover:text-amber-400 transition"
                        title={doc.status === 'ARCHIVED' ? 'Restore Experience' : 'Archive Experience'}
                      >
                        <Archive size={13} />
                      </button>
                      <span className="text-cyan-400 font-semibold">v{doc.currentVersion}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
