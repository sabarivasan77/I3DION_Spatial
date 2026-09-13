import React from 'react';
import { useCollaborationStore } from '../store/collaborationStore';
import { History, RotateCcw, X, Clock, User, FileText, CheckCircle2 } from 'lucide-react';

export const VersionHistoryModal: React.FC = () => {
  const { isVersionHistoryOpen, closeVersionHistory, versions, restoreVersion, currentDocument } = useCollaborationStore();

  if (!isVersionHistoryOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4 select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-slate-200 font-sans">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400">
              <History size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Version History</h3>
              <p className="text-xs text-slate-400 font-mono">
                {currentDocument?.name || 'OmniStudio Experience'}
              </p>
            </div>
          </div>

          <button
            onClick={closeVersionHistory}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* List of Version Snapshots */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {versions.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm font-mono">
              <Clock size={32} className="mx-auto mb-2 opacity-40 text-cyan-400" />
              <p>No historical versions recorded yet.</p>
              <p className="text-xs text-slate-600 mt-1">
                Versions are automatically created upon meaningful saves or publishing.
              </p>
            </div>
          ) : (
            versions.map((ver) => {
              const isCurrent = ver.versionNumber === currentDocument?.currentVersion;
              return (
                <div
                  key={ver.versionId}
                  className={`p-4 rounded-xl border transition flex items-center justify-between ${
                    isCurrent
                      ? 'bg-cyan-950/30 border-cyan-500/50 shadow-md'
                      : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-slate-800 rounded-lg text-amber-400 font-mono text-xs font-bold mt-0.5">
                      v{ver.versionNumber}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-200">
                          {ver.changeSummary || 'Snapshot created'}
                        </span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-mono rounded-full flex items-center gap-1 border border-emerald-500/30">
                            <CheckCircle2 size={10} /> Active Version
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-400 font-mono mt-1">
                        <span className="flex items-center gap-1">
                          <User size={12} className="text-slate-500" />
                          {ver.createdBy}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} className="text-slate-500" />
                          {new Date(ver.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {!isCurrent && (
                    <button
                      onClick={() => restoreVersion(ver.versionId)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 rounded-lg text-xs font-mono font-medium transition flex items-center gap-1.5"
                    >
                      <RotateCcw size={13} />
                      <span>Restore</span>
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs font-mono text-slate-400">
          <span>Restoring an older version creates a new current version safely without overwriting history.</span>
          <button
            onClick={closeVersionHistory}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
