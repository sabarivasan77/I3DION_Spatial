import React, { useState } from 'react';
import { useCollaborationStore } from '../store/collaborationStore';
import { validateExperienceForPublish } from '../../validation/publishValidator';
import { useStudioStore } from '../../store/useStudioStore';
import { Send, X, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';

export const PublishWorkflowModal: React.FC = () => {
  const { isPublishModalOpen, closePublishModal, publishCurrentExperience, currentDocument } = useCollaborationStore();
  const { experience } = useStudioStore();
  const [releaseNotes, setReleaseNotes] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  if (!isPublishModalOpen) return null;

  const validationResult = validateExperienceForPublish(experience);

  const handleConfirmPublish = async () => {
    if (!validationResult.valid) return;
    setIsPublishing(true);
    await publishCurrentExperience(releaseNotes || 'Published new release');
    setIsPublishing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4 select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col text-slate-200 font-sans">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <Send size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Publish Experience</h3>
              <p className="text-xs text-slate-400 font-mono">
                {currentDocument?.name || 'OmniStudio Experience'}
              </p>
            </div>
          </div>

          <button
            onClick={closePublishModal}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Validation Status Box */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 ${
              validationResult.valid
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
            }`}
          >
            {validationResult.valid ? (
              <ShieldCheck size={22} className="text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle size={22} className="text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="text-xs font-mono">
              <p className="font-bold text-sm">
                {validationResult.valid ? 'Pre-flight Validation Passed' : 'Pre-flight Validation Failed'}
              </p>
              {validationResult.valid ? (
                <p className="text-emerald-400/80 mt-1">
                  Experience schema, node IDs, media URLs, and action targets are 100% verified for canonical runtime.
                </p>
              ) : (
                <ul className="list-disc pl-4 mt-1.5 space-y-1 text-rose-300">
                  {validationResult.errors.map((err, idx) => (
                    <li key={idx}>{typeof err === 'string' ? err : err.message || JSON.stringify(err)}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Release Notes Input */}
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1.5 font-medium">
              Release / Version Summary Notes:
            </label>
            <textarea
              rows={3}
              value={releaseNotes}
              onChange={(e) => setReleaseNotes(e.target.value)}
              placeholder="e.g. Added 3D spatial model viewer, form lead integration, and interactive timeline."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <button
            onClick={closePublishModal}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-mono transition"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmPublish}
            disabled={!validationResult.valid || isPublishing}
            className={`px-5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition ${
              validationResult.valid && !isPublishing
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 size={15} />
            <span>{isPublishing ? 'Publishing...' : 'Publish Live Experience'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
