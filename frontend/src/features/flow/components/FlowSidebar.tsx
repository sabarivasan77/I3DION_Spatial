import React from 'react';
import {
  Home,
  Workflow,
  LayoutTemplate,
  Network,
  Clock,
  ShieldCheck,
  Sparkles,
  Settings,
  ChevronRight,
  ExternalLink,
  Layers,
  ChevronLeft
} from 'lucide-react';

export type FlowNavTab =
  | 'home'
  | 'workflows'
  | 'templates'
  | 'connections'
  | 'runs'
  | 'approvals'
  | 'ai-suggestions'
  | 'settings'
  | 'analytics';

interface FlowSidebarProps {
  activeTab: FlowNavTab;
  onSelectTab: (tab: FlowNavTab) => void;
  pendingApprovalsCount?: number;
  activeWorkflowsCount?: number;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const FlowSidebar: React.FC<FlowSidebarProps> = ({
  activeTab,
  onSelectTab,
  pendingApprovalsCount = 3,
  activeWorkflowsCount = 24,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const navItems: Array<{
    id: FlowNavTab;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    badge?: string | number;
    badgeColor?: string;
  }> = [
    { id: 'home', label: 'Home', icon: Home },
    {
      id: 'workflows',
      label: 'My Workflows',
      icon: Workflow,
      badge: activeWorkflowsCount,
      badgeColor: 'bg-blue-100 text-blue-700 font-bold'
    },
    { id: 'templates', label: 'Templates', icon: LayoutTemplate },
    { id: 'connections', label: 'Connections', icon: Network },
    { id: 'runs', label: 'Run History', icon: Clock },
    {
      id: 'approvals',
      label: 'Approvals',
      icon: ShieldCheck,
      badge: pendingApprovalsCount,
      badgeColor: 'bg-amber-100 text-amber-800 font-bold animate-pulse'
    },
    {
      id: 'ai-suggestions',
      label: 'AI Suggestions',
      icon: Sparkles,
      badge: 'New',
      badgeColor: 'bg-purple-100 text-purple-700 font-bold'
    },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <aside
      className={`${
        isCollapsed ? 'w-16' : 'w-64'
      } bg-white border-r border-slate-200 flex flex-col shrink-0 select-none transition-all duration-200 z-20`}
    >
      {/* 1. App Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-3 overflow-hidden">
          {/* I3DION Flow Brand Logo */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0 font-black text-sm tracking-wide">
            <Workflow size={20} className="stroke-[2.5]" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col text-left truncate leading-tight">
              <span className="font-black text-slate-900 text-base tracking-tight flex items-center gap-1">
                <span>I3DION</span>
                <span className="text-blue-600 font-bold">Flow</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">
                Enterprise Automation
              </span>
            </div>
          )}
        </div>

        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}
      </div>

      {/* 2. Navigation Items */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto font-sans">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                isActive
                  ? 'bg-blue-50 text-blue-600 shadow-xs font-bold border-l-4 border-blue-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
            >
              <Icon size={18} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
              {!isCollapsed && (
                <div className="flex-1 flex items-center justify-between text-left">
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full ${
                        item.badgeColor || 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* 3. Bottom Ecosystem Link */}
      {!isCollapsed && (
        <div className="p-3 border-t border-slate-100 bg-slate-50/60 m-2 rounded-xl">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
            <span className="flex items-center gap-1.5 text-slate-700 font-bold">
              <Layers size={13} className="text-blue-600" />
              <span>Spatial Ecosystem</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
              v2.4
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 leading-tight">
            Integrated with Omni Studio, Spatial Engine &amp; Spatial Vault.
          </p>
        </div>
      )}
    </aside>
  );
};
