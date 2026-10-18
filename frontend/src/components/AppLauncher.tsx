import React, { useState, useRef, useEffect } from 'react';

import { Grid, Lock, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useLicenseStore, AppKey } from '../store/licenseStore';
import { canAccessApp } from '../utils/permissions';
import { ProductLogo, ProductKey } from './ProductLogo';

interface AppDefinition {
  key: AppKey;
  name: string;
  subtitle: string;
  path: string;
  badge: string;
  color: string;
  bgLight: string;
}

const APPS: AppDefinition[] = [
  {
    key: 'hub',
    name: 'I3DION Spatial Hub',
    subtitle: 'Public Discovery & Showcases',
    path: '/hub',
    badge: 'Hub',
    color: 'text-blue-500',
    bgLight: 'bg-blue-50/60 hover:bg-blue-100/80 border-blue-200/80',
  },
  {
    key: 'vault',
    name: 'I3DION Spatial Vault',
    subtitle: 'Central Asset & Model Repository',
    path: '/vault',
    badge: 'Vault',
    color: 'text-emerald-500',
    bgLight: 'bg-emerald-50/60 hover:bg-emerald-100/80 border-emerald-200/80',
  },
  {
    key: 'studio',
    name: 'I3DION Omni Studio',
    subtitle: 'Catalog & Visual Content Builder',
    path: '/omni-studio',
    badge: 'OmniStudio',
    color: 'text-purple-500',
    bgLight: 'bg-purple-50/60 hover:bg-purple-100/80 border-purple-200/80',
  },
  {
    key: 'engine',
    name: 'I3DION Spatial Engine',
    subtitle: 'Interactive 3D Logic & Verge3D Puzzles',
    path: '/engine',
    badge: 'Engine',
    color: 'text-rose-500',
    bgLight: 'bg-rose-50/60 hover:bg-rose-100/80 border-rose-200/80',
  },
  {
    key: 'flow',
    name: 'I3DION Flow',
    subtitle: 'Visual Workflow & CRM Automation Engine',
    path: '/flow',
    badge: 'Flow',
    color: 'text-cyan-500',
    bgLight: 'bg-cyan-50/60 hover:bg-cyan-100/80 border-cyan-200/80',
  },
  {
    key: 'lens',
    name: 'I3DION Spatial Lens',
    subtitle: 'Analytics & BI Dashboard Builder',
    path: '/lens',
    badge: 'Lens',
    color: 'text-amber-500',
    bgLight: 'bg-amber-50/60 hover:bg-amber-100/80 border-amber-200/80',
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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const user = useAuthStore((s) => s.user);
  const currentTier = useLicenseStore((s) => s.currentTier);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div 
      className="relative" 
      ref={dropdownRef}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* Launcher Icon Button (Microsoft 365 style 3x3 Grid) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="I3DION Application Launcher"
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition shadow-2xs active:scale-95"
      >
        <Grid size={18} className="text-slate-600" />
      </button>

      {/* App Launcher Modal/Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-11 z-50 w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150 text-slate-900">
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Grid size={16} className="text-blue-600" />
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">I3DION Apps</span>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-100">
              <ShieldCheck size={11} />
              {currentTier} Tier
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {APPS.map((app) => {
              const hasAccess = canAccessApp(user, app.key);
              if (!hasAccess) {
                return (
                  <div
                    key={app.key}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 opacity-60 cursor-not-allowed select-none"
                    title={`Requires ${app.key === 'lens' ? 'Enterprise' : 'Professional'} License Tier`}
                  >
                    <ProductLogo product={app.key} size="sm" badge={false} className="grayscale opacity-50 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 truncate">{app.name}</span>
                        <Lock size={12} className="text-slate-400 shrink-0" />
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">{app.subtitle}</p>
                    </div>
                  </div>
                );
              }

              return (
                <a
                  key={app.key}
                  href={getAppUrl(app.key, app.path)}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 rounded-xl border p-2 transition active:scale-[0.98] ${app.bgLight}`}
                >
                  <ProductLogo product={app.key} size="sm" badge={false} className="shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="block text-xs font-bold text-slate-800 truncate">{app.name}</span>
                    <p className="text-[10px] text-slate-500 truncate">{app.subtitle}</p>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
