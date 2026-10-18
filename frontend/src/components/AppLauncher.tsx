import React, { useState, useRef, useEffect } from 'react';
import {
  Grid,
  Globe,
  Database,
  Sparkles,
  Cpu,
  BarChart3,
  GitBranch,
  Lock,
  ShieldCheck,
  X,
  ArrowRight,
  LucideIcon,
  Layers,
  Settings,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useLicenseStore, AppKey } from '../store/licenseStore';
import { canAccessApp } from '../utils/permissions';

interface AppDefinition {
  key: AppKey;
  name: string;
  subtitle: string;
  path: string;
  icon: LucideIcon;
  badge: string;
  color: string;
  badgeBg: string;
  bgLight: string;
}

const APPS: AppDefinition[] = [
  {
    key: 'hub',
    name: 'I3DION Spatial Hub',
    subtitle: 'Public Discovery & Showcases',
    path: '/hub',
    icon: Globe,
    badge: 'Hub',
    color: 'text-blue-600',
    badgeBg: 'bg-blue-100 text-blue-700',
    bgLight: 'bg-blue-50/70 hover:bg-blue-100/80 border-blue-200/80',
  },
  {
    key: 'vault',
    name: 'I3DION Spatial Vault',
    subtitle: 'Central Asset & Model Repository',
    path: '/vault',
    icon: Database,
    badge: 'Vault',
    color: 'text-emerald-600',
    badgeBg: 'bg-emerald-100 text-emerald-700',
    bgLight: 'bg-emerald-50/70 hover:bg-emerald-100/80 border-emerald-200/80',
  },
  {
    key: 'studio',
    name: 'I3DION Omni Studio',
    subtitle: 'Catalog & Visual Content Builder',
    path: '/omni-studio',
    icon: Sparkles,
    badge: 'OmniStudio',
    color: 'text-indigo-600',
    badgeBg: 'bg-indigo-100 text-indigo-700',
    bgLight: 'bg-indigo-50/70 hover:bg-indigo-100/80 border-indigo-200/80',
  },
  {
    key: 'engine',
    name: 'I3DION Spatial Engine',
    subtitle: 'Spatial Logic & Omni Circuits',
    path: '/engine',
    icon: Cpu,
    badge: 'Engine',
    color: 'text-rose-600',
    badgeBg: 'bg-rose-100 text-rose-700',
    bgLight: 'bg-rose-50/70 hover:bg-rose-100/80 border-rose-200/80',
  },
  {
    key: 'flow',
    name: 'I3DION Flow',
    subtitle: 'Autonomous Workflows & Event Pipelines',
    path: '/flows',
    icon: GitBranch,
    badge: 'Flow',
    color: 'text-cyan-600',
    badgeBg: 'bg-cyan-100 text-cyan-700',
    bgLight: 'bg-cyan-50/70 hover:bg-cyan-100/80 border-cyan-200/80',
  },
  {
    key: 'lens',
    name: 'I3DION Spatial Lens',
    subtitle: 'Analytics & BI Dashboard Builder',
    path: '/lens',
    icon: BarChart3,
    badge: 'Lens',
    color: 'text-amber-600',
    badgeBg: 'bg-amber-100 text-amber-700',
    bgLight: 'bg-amber-50/70 hover:bg-amber-100/80 border-amber-200/80',
  },
];

const getAppUrl = (appKey: AppKey, fallbackPath: string): string => {
  const origin = window.location.origin;
  switch (appKey) {
    case 'hub':
      return import.meta.env.VITE_HUB_URL || `${origin}${fallbackPath}`;
    case 'vault':
      return import.meta.env.VITE_VAULT_URL || `${origin}${fallbackPath}`;
    case 'studio':
      return import.meta.env.VITE_OMNI_STUDIO_URL || `${origin}${fallbackPath}`;
    case 'engine':
      return import.meta.env.VITE_ENGINE_URL || `${origin}${fallbackPath}`;
    case 'flow':
      return import.meta.env.VITE_FLOW_URL || `${origin}${fallbackPath}`;
    case 'lens':
      return import.meta.env.VITE_LENS_URL || `${origin}${fallbackPath}`;
    default:
      return `${origin}${fallbackPath}`;
  }
};

export const AppLauncher: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const currentTier = useLicenseStore((s) => s.currentTier);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      {/* 1. Header Launcher Button (9-Dots Grid) */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        title="I3DION Application Launcher"
        aria-label="Open I3DION Apps"
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition shadow-2xs active:scale-95 cursor-pointer"
      >
        <Grid size={18} className="text-slate-600" />
      </button>

      {/* 2. Backdrop Overlay (Dismiss on Click) */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-40 transition-opacity animate-in fade-in duration-200"
        />
      )}

      {/* 3. Slide-Over Panel (Right-to-Left Drawer) */}
      <aside
        className={`fixed top-0 right-0 z-50 h-full w-[410px] max-w-[92vw] bg-white shadow-2xl border-l border-slate-200 transition-transform duration-300 ease-out flex flex-col text-slate-900 ${
          isOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
              <Grid size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">I3DION Ecosystem</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                  <ShieldCheck size={11} />
                  {currentTier}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Unified 3D Spatial Cloud Suite</p>
            </div>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200/80 hover:text-slate-700 transition"
            title="Close Drawer (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Product Cards List (Arranged in requested order with Green Vault & Flow) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          <div className="px-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Applications & Workspaces
          </div>

          {APPS.map((app) => {
            const hasAccess = canAccessApp(user, app.key);
            const Icon = app.icon;

            if (!hasAccess) {
              return (
                <div
                  key={app.key}
                  className="flex items-center gap-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-3 opacity-60 cursor-not-allowed select-none"
                  title={`Requires ${app.key === 'lens' ? 'Enterprise' : 'Professional'} License Tier`}
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-400 shadow-2xs">
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500 truncate">{app.name}</span>
                      <Lock size={13} className="text-slate-400 shrink-0" />
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">{app.subtitle}</p>
                  </div>
                </div>
              );
            }

            return (
              <a
                key={app.key}
                href={getAppUrl(app.key, app.path)}
                onClick={() => setIsOpen(false)}
                className={`group flex items-center gap-3.5 rounded-2xl border p-3 transition-all duration-150 hover:shadow-md hover:scale-[1.01] active:scale-[0.99] ${app.bgLight}`}
              >
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-xs border border-white/60 ${app.color} transition-transform group-hover:scale-105`}>
                  <Icon size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition truncate">
                      {app.name}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${app.badgeBg}`}>
                      {app.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 truncate mt-0.5">{app.subtitle}</p>
                </div>
                <ArrowRight size={14} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity group-hover:translate-x-0.5 duration-150 shrink-0" />
              </a>
            );
          })}
        </div>

        {/* Drawer Footer */}
        <div className="border-t border-slate-200 p-4 bg-slate-50/70 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-medium text-slate-700">All Services Online</span>
          </div>

          <a
            href="/settings/company"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700 hover:underline"
          >
            <Settings size={13} />
            <span>Settings</span>
          </a>
        </div>
      </aside>
    </>
  );
};
