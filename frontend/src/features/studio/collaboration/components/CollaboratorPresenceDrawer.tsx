import React from 'react';
import { useRealtimeCollaborationStore } from '../store/realtimeCollaborationStore';
import { useCollaborationStore } from '../store/collaborationStore';
import { Users, X, Activity, Lock, Layers, Film, Box } from 'lucide-react';

export const CollaboratorPresenceDrawer: React.FC = () => {
  const { isPresenceDrawerOpen, togglePresenceDrawer, softLocks, transportStatus } = useRealtimeCollaborationStore();
  const { collaborators } = useCollaborationStore();

  if (!isPresenceDrawerOpen) return null;

  const getSectionIcon = (section?: string) => {
    if (section === 'Timeline') return <Film size={12} className="text-amber-400" />;
    if (section === '3D Viewport') return <Box size={12} className="text-cyan-400" />;
    return <Layers size={12} className="text-blue-400" />;
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-80 bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col text-slate-200 font-sans select-none">
      {/* Header */}
      <div className="h-14 px-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70 shrink-0">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-cyan-400" />
          <h3 className="font-bold text-sm text-white">Active Collaborators</h3>
          <span className="px-2 py-0.5 bg-cyan-950 text-cyan-400 text-[10px] font-mono rounded-full font-bold border border-cyan-800">
            {collaborators.length}
          </span>
        </div>

        <button
          onClick={togglePresenceDrawer}
          className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
        >
          <X size={16} />
        </button>
      </div>

      {/* Collaborator List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">
          Online Presence ({transportStatus})
        </div>

        {collaborators.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs font-mono">
            No active collaborators online
          </div>
        ) : (
          collaborators.map((col, idx) => (
            <div
              key={col.userId || idx}
              className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-600 to-indigo-600 font-bold text-xs text-white font-mono flex items-center justify-center border border-slate-700 shadow">
                    {col.name ? col.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-950" />
                </div>

                <div>
                  <div className="font-bold text-xs text-slate-200">{col.name}</div>
                  <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 mt-0.5">
                    {getSectionIcon(col.editingSection)}
                    <span>{col.editingSection || 'Viewing'}</span>
                  </div>
                </div>
              </div>

              <div className="text-[10px] font-mono text-slate-500">{col.lastActive || 'Active'}</div>
            </div>
          ))
        )}

        {/* Soft Locks Section */}
        <div className="pt-4 border-t border-slate-800">
          <div className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
            <Lock size={11} className="text-amber-400" />
            <span>Active Soft Locks</span>
          </div>

          {softLocks.size === 0 ? (
            <div className="text-xs font-mono text-slate-500">No active editing locks</div>
          ) : (
            Array.from(softLocks.values()).map((lock) => (
              <div
                key={lock.targetId}
                className="p-2.5 bg-amber-950/20 border border-amber-500/30 rounded-lg text-xs font-mono text-amber-300 flex items-center justify-between mb-2"
              >
                <div className="truncate">
                  <span className="font-bold">{lock.actorName}</span> editing {lock.targetId}
                </div>
                <Lock size={12} className="text-amber-400 shrink-0" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
