import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { apiRequest } from '../../services/api';
import {
  CheckCircle2,
  Circle,
  ArrowRight,
  Sparkles,
  X,
  Compass,
  Box,
  Layers,
  QrCode,
  LineChart
} from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  product: string;
  isCompleted: boolean;
  href: string;
}

interface OnboardingStatusResponse {
  completedCount: number;
  totalCount: number;
  progressPercentage: number;
  isDismissed: boolean;
  isAllCompleted: boolean;
  steps: OnboardingStep[];
}

const PRODUCT_ICONS: Record<string, React.ReactNode> = {
  'Spatial Vault': <Box size={14} className="text-blue-500" />,
  'Omni Studio': <Layers size={14} className="text-purple-500" />,
  'Spatial Engine': <Compass size={14} className="text-amber-500" />,
  'Spatial Hub': <QrCode size={14} className="text-emerald-500" />,
  'Spatial Lens': <LineChart size={14} className="text-rose-500" />
};

export const CustomerOnboardingChecklist: React.FC = () => {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [data, setData] = useState<OnboardingStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadStatus() {
      if (!token) return;
      try {
        setLoading(true);
        const res = await apiRequest<OnboardingStatusResponse>('/onboarding/status', { token });
        if (isMounted) {
          setData(res);
          setDismissed(res.isDismissed);
        }
      } catch (err) {
        // Non-blocking fallback for graceful degradation
        console.warn('Could not load onboarding status:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadStatus();
    return () => { isMounted = false; };
  }, [token]);

  const handleDismiss = async () => {
    setDismissed(true);
    if (!token) return;
    try {
      await apiRequest('/onboarding/dismiss', { method: 'POST', token });
    } catch (err) {
      console.warn('Error dismissing onboarding:', err);
    }
  };

  if (dismissed || loading || !data) {
    return null;
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-white shadow-xl relative overflow-hidden mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 bg-blue-500/10 text-blue-400 font-mono text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-blue-500/20">
              <Sparkles size={11} /> Flagship Onboarding Journey
            </span>
            <span className="text-xs text-slate-400 font-mono font-medium">
              {data.completedCount} of {data.totalCount} completed ({data.progressPercentage}%)
            </span>
          </div>
          <h3 className="text-base font-semibold text-white tracking-tight">
            Deploy Your First 3D Spatial Digital Twin & Catalog
          </h3>
          <p className="text-xs text-slate-400 max-w-2xl mt-0.5">
            Follow the 5-step canonical journey: upload CAD geometry, compose a catalog, author interactive 3D hotspots, publish to the public hub, and track live engagement.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="w-32 bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${data.progressPercentage}%` }}
            />
          </div>
          <button
            onClick={handleDismiss}
            aria-label="Dismiss checklist"
            className="text-slate-400 hover:text-slate-200 p-1 rounded-md hover:bg-slate-800 transition"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-4">
        {data.steps.map((step, idx) => {
          return (
            <div
              key={step.id}
              onClick={() => navigate(step.href)}
              className={`p-3 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                step.isCompleted
                  ? 'bg-slate-800/50 border-emerald-500/30 hover:border-emerald-500/60'
                  : 'bg-slate-800/20 border-slate-700/60 hover:bg-slate-800/40 hover:border-slate-600'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-medium">
                    {PRODUCT_ICONS[step.product]}
                    {step.product}
                  </span>
                  {step.isCompleted ? (
                    <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                  ) : (
                    <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-700/50 px-1.5 py-0.5 rounded">
                      Step {idx + 1}
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-semibold text-slate-200 mb-1 leading-snug">
                  {step.title}
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                  {step.description}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-700/40 flex items-center justify-between text-[11px] font-medium font-mono">
                <span className={step.isCompleted ? 'text-emerald-400' : 'text-blue-400'}>
                  {step.isCompleted ? 'Completed' : 'Get Started'}
                </span>
                <ArrowRight size={12} className={step.isCompleted ? 'text-emerald-400' : 'text-blue-400'} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
