import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Globe, 
  Lock, 
  Users, 
  X, 
  ArrowRight, 
  Sparkles
} from 'lucide-react';
import { studioApi, StudioProject } from '../../api/studioApi';

interface StudioPublishModalProps {
  project: StudioProject;
  onClose: () => void;
  onSuccess: (updatedProject: StudioProject) => void;
}

export const StudioPublishModal: React.FC<StudioPublishModalProps> = ({ project, onClose, onSuccess }) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [publishing, setPublishing] = useState(false);

  // Form states
  const [visibility, setVisibility] = useState<'Public' | 'Organization' | 'Restricted'>('Organization');
  const [changeSummary, setChangeSummary] = useState('');
  const [versionLabel, setVersionLabel] = useState(`v${project.version + 1}.0`);

  // Validation Results
  const validationIssues: { type: 'error' | 'warning'; message: string }[] = [];
  
  if (!project.catalog_data?.sections || project.catalog_data.sections.length === 0) {
    validationIssues.push({ type: 'error', message: 'Catalog must contain at least one section before publishing.' });
  }

  const totalProducts = (project.catalog_data?.sections || []).reduce((acc: number, sec: any) => acc + (sec.items?.length || 0), 0);
  if (totalProducts === 0) {
    validationIssues.push({ type: 'warning', message: 'No product assets added. The catalog will render empty sections.' });
  }

  const hasErrors = validationIssues.some(i => i.type === 'error');

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const res = await studioApi.publishProject(project.id, {
        visibility,
        changeSummary: changeSummary || `Published version ${versionLabel}`,
      });
      setStep(4);
      onSuccess(res.project);
    } catch (err) {
      console.error('Failed to publish project:', err);
    } finally {
      setPublishing(false);
    }
  };

  const hubTargetUrl = `${window.location.origin}/product/${project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Publish Catalog Experience</h2>
              <p className="text-xs text-slate-500">Step {step} of 4 • {project.name}</p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Pre-publish Validation */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Pre-Publish Integrity Check
            </h3>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-3">
              <div className="flex items-center justify-between text-xs border-b border-slate-200 dark:border-slate-700 pb-2">
                <span className="text-slate-500">Vault Asset References</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verified
                </span>
              </div>
              <div className="flex items-center justify-between text-xs border-b border-slate-200 dark:border-slate-700 pb-2">
                <span className="text-slate-500">Total Sections</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{project.catalog_data?.sections?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Total Asset References</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{totalProducts}</span>
              </div>
            </div>

            {validationIssues.length > 0 && (
              <div className="space-y-2">
                {validationIssues.map((issue, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                      issue.type === 'error'
                        ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300'
                        : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{issue.message}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={hasErrors}
                className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow transition disabled:opacity-50 flex items-center gap-1.5"
              >
                Continue to Access
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Access & Privacy Settings */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Configure Access & Privacy</h3>

            <div className="space-y-3">
              <label
                onClick={() => setVisibility('Organization')}
                className={`p-4 rounded-xl border flex items-start gap-3 cursor-pointer transition ${
                  visibility === 'Organization'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 ring-1 ring-indigo-600'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Users className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Organization Access (Recommended)</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Only authenticated users within your organization can view the published spatial experience.
                  </div>
                </div>
              </label>

              <label
                onClick={() => setVisibility('Public')}
                className={`p-4 rounded-xl border flex items-start gap-3 cursor-pointer transition ${
                  visibility === 'Public'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 ring-1 ring-indigo-600'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Globe className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Public Discovery</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Anyone with the published link or QR code can access the catalog experience via Spatial Hub.
                  </div>
                </div>
              </label>

              <label
                onClick={() => setVisibility('Restricted')}
                className={`p-4 rounded-xl border flex items-start gap-3 cursor-pointer transition ${
                  visibility === 'Restricted'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 ring-1 ring-indigo-600'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Lock className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Restricted / Invite Only</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Requires explicit token or user permission list to access the catalog.
                  </div>
                </div>
              </label>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow transition flex items-center gap-1.5"
              >
                Continue to Version
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Version Tagging & Release Notes */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Version & Publishing Details</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Version Label *
                </label>
                <input
                  type="text"
                  value={versionLabel}
                  onChange={(e) => setVersionLabel(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Release Notes / Change Log
                </label>
                <textarea
                  rows={3}
                  placeholder="Summarize changes published in this release..."
                  value={changeSummary}
                  onChange={(e) => setChangeSummary(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg"
              >
                Back
              </button>
              <button
                onClick={handlePublish}
                disabled={publishing || !versionLabel.trim()}
                className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {publishing ? 'Publishing...' : 'Confirm & Publish Catalog'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Success & Spatial Hub Output Link */}
        {step === 4 && (
          <div className="space-y-5 text-center py-2">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Catalog Successfully Published!</h3>
              <p className="text-xs text-slate-500">
                Your visual experience is now live and published to <span className="font-semibold text-indigo-600 dark:text-indigo-400">I3DION Spatial Hub</span>.
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 text-left">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Published Version</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{versionLabel}</span>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Spatial Hub Target URL:</span>
                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-xs text-indigo-600 dark:text-indigo-400 truncate">
                  {hubTargetUrl}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-900 text-white font-semibold text-xs rounded-xl hover:bg-slate-800 transition"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
