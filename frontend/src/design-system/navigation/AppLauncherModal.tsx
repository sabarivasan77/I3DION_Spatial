import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Globe, 
  Database, 
  LayoutTemplate, 
  Box, 
  BarChart3, 
  X, 
  ExternalLink,
  ShieldCheck,
  Building2,
  type LucideIcon
} from 'lucide-react';

interface AppLauncherProps {
  isOpen: boolean;
  onClose: () => void;
  activeAppId?: string;
}

interface EcosystemApp {
  id: string;
  name: string;
  tagline: string;
  path: string;
  icon: LucideIcon;
  badgeColor: string;
  iconColor: string;
  roleRequired?: string;
}

export const ECOSYSTEM_APPS: EcosystemApp[] = [
  {
    id: 'hub',
    name: 'Spatial Hub',
    tagline: 'Public discovery, showcases, and QR entry',
    path: '/hub/feed',
    icon: Globe,
    badgeColor: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    iconColor: 'text-indigo-600',
  },
  {
    id: 'vault',
    name: 'Spatial Vault',
    tagline: 'Authoritative CAD models, specs & collections',
    path: '/vault/workspace',
    icon: Database,
    badgeColor: 'bg-amber-50 border-amber-200 text-amber-700',
    iconColor: 'text-amber-600',
  },
  {
    id: 'studio',
    name: 'Omni Studio',
    tagline: 'Interactive B2B catalog & layout builder',
    path: '/studio/projects',
    icon: LayoutTemplate,
    badgeColor: 'bg-blue-50 border-blue-200 text-blue-700',
    iconColor: 'text-blue-600',
  },
  {
    id: 'engine',
    name: 'Spatial Engine',
    tagline: '3D/AR interaction, hotspots & assemblies',
    path: '/engine/workspace',
    icon: Box,
    badgeColor: 'bg-cyan-50 border-cyan-200 text-cyan-700',
    iconColor: 'text-cyan-600',
  },
  {
    id: 'lens',
    name: 'Spatial Lens',
    tagline: 'Buyer telemetry, dwell time & intent scoring',
    path: '/sales-intelligence',
    icon: BarChart3,
    badgeColor: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    iconColor: 'text-emerald-600',
  },
];

export const AppLauncherModal: React.FC<AppLauncherProps> = ({
  isOpen,
  onClose,
  activeAppId,
}) => {
  const navigate = useNavigate();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-24 px-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
        aria-hidden="true" 
      />

      <div className="relative w-full max-w-2xl rounded-2xl bg-white border border-slate-200 p-6 shadow-2xl z-10 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm tracking-wider">
              I3
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">I3DION Platform Launcher</h2>
              <p className="text-xs text-slate-500">Switch seamlessly between ecosystem workspaces</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 5 Core Product Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {ECOSYSTEM_APPS.map((app) => {
            const Icon = app.icon;
            const isActive = activeAppId === app.id;

            return (
              <button
                key={app.id}
                type="button"
                onClick={() => {
                  onClose();
                  navigate(app.path);
                }}
                className={`group relative flex flex-col p-4 rounded-xl border text-left transition-all ${
                  isActive 
                    ? 'border-blue-500 bg-blue-50/50 shadow-sm ring-1 ring-blue-500' 
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div className={`p-2 rounded-lg border ${app.badgeColor}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  {isActive ? (
                    <span className="text-[10px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded bg-blue-600 text-white">
                      Active
                    </span>
                  ) : (
                    <ExternalLink className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                  )}
                </div>

                <h3 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {app.name}
                </h3>
                <p className="mt-1 text-xs text-slate-500 leading-snug">
                  {app.tagline}
                </p>
              </button>
            );
          })}
        </div>

        {/* Bottom Platform Utilities */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate('/home');
              }}
              className="font-medium text-slate-700 hover:text-blue-600 transition-colors flex items-center gap-1.5"
            >
              <Building2 className="h-3.5 w-3.5" />
              I3DION Home
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate('/settings/company');
              }}
              className="hover:text-slate-900 transition-colors"
            >
              Organization Settings
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate('/security/dashboard');
              }}
              className="hover:text-slate-900 transition-colors flex items-center gap-1"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
              Access & Audits
            </button>
          </div>
          <span className="text-[11px] text-slate-400">Esc to close</span>
        </div>
      </div>
    </div>
  );
};
