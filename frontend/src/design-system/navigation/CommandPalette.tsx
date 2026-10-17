import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Database, 
  LayoutTemplate, 
  Box, 
  BarChart3, 
  Globe, 
  Upload, 
  Plus, 
  ShieldCheck, 
  Settings, 
  ArrowRight,
  FileSpreadsheet,
  type LucideIcon
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PaletteAction {
  id: string;
  category: 'Applications' | 'Quick Actions' | 'Settings';
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  badge?: string;
  path?: string;
  action?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const actions: PaletteAction[] = [
    // Applications
    {
      id: 'app-home',
      category: 'Applications',
      title: 'I3DION Home',
      subtitle: 'Central ecosystem hub & organization overview',
      icon: Globe,
      path: '/home',
    },
    {
      id: 'app-vault',
      category: 'Applications',
      title: 'Spatial Vault',
      subtitle: 'Authoritative CAD models, specs & collections',
      icon: Database,
      badge: 'Data Truth',
      path: '/vault/workspace',
    },
    {
      id: 'app-studio',
      category: 'Applications',
      title: 'Omni Studio',
      subtitle: 'Interactive B2B catalog composer',
      icon: LayoutTemplate,
      badge: 'Catalogs',
      path: '/studio/projects',
    },
    {
      id: 'app-engine',
      category: 'Applications',
      title: 'Spatial Engine',
      subtitle: '3D/AR interaction, hotspots & assemblies',
      icon: Box,
      badge: '3D/AR',
      path: '/engine/workspace',
    },
    {
      id: 'app-lens',
      category: 'Applications',
      title: 'Spatial Lens',
      subtitle: 'Buyer telemetry, dwell time & intent scoring',
      icon: BarChart3,
      badge: 'Telemetry',
      path: '/sales-intelligence',
    },
    // Quick Actions
    {
      id: 'action-upload-cad',
      category: 'Quick Actions',
      title: 'Upload CAD Model to Vault',
      subtitle: 'Validate and store GLB/GLTF model into Vault',
      icon: Upload,
      path: '/vault/upload',
    },
    {
      id: 'action-new-catalog',
      category: 'Quick Actions',
      title: 'Create New Catalog in Omni Studio',
      subtitle: 'Compose a new branded industrial product catalog',
      icon: Plus,
      path: '/studio/builder/new',
    },
    {
      id: 'action-view-leads',
      category: 'Quick Actions',
      title: 'View Active Leads & Quotes',
      subtitle: 'Inspect prospect requests and conversion telemetry',
      icon: FileSpreadsheet,
      path: '/leads',
    },
    // Settings
    {
      id: 'settings-company',
      category: 'Settings',
      title: 'Company & Team Settings',
      subtitle: 'Manage members, roles and organization profile',
      icon: Settings,
      path: '/settings/company',
    },
    {
      id: 'settings-security',
      category: 'Settings',
      title: 'Access & Security Dashboard',
      subtitle: 'Active sessions, audits, and RBAC logs',
      icon: ShieldCheck,
      path: '/security/dashboard',
    },
  ];

  const filteredActions = actions.filter((item) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
      item.category.toLowerCase().includes(q)
    );
  });

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filteredActions.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredActions.length) % (filteredActions.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = filteredActions[selectedIndex];
        if (selected) {
          executeAction(selected);
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredActions, selectedIndex]);

  const executeAction = (action: PaletteAction) => {
    onClose();
    if (action.action) {
      action.action();
    } else if (action.path) {
      navigate(action.path);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-100">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-xl rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden z-10">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 border-b border-slate-200 bg-slate-50/50">
          <Search className="h-5 w-5 text-slate-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command, product, or search assets... (Esc to close)"
            className="w-full h-14 bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center rounded border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-500 shadow-sm">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-slate-100">
          {filteredActions.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">
              No matching commands or products found for "{query}".
            </div>
          ) : (
            filteredActions.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => executeAction(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-colors ${
                    isSelected ? 'bg-blue-50 text-blue-900' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg border ${
                      isSelected 
                        ? 'bg-blue-600 text-white border-blue-600' 
                        : 'bg-white text-slate-500 border-slate-200'
                    }`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{item.title}</span>
                        {item.badge && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      {item.subtitle && (
                        <p className={`text-xs ${isSelected ? 'text-blue-700' : 'text-slate-400'}`}>
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <ArrowRight className="h-4 w-4 text-blue-600 animate-in slide-in-from-left-1" />
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
          </div>
          <span>I3DION Ecosystem Command</span>
        </div>
      </div>
    </div>
  );
};
