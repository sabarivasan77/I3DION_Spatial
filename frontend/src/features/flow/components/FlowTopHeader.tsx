import React, { useState } from 'react';
import {
  Search,
  Bell,
  HelpCircle,
  Grid,
  ChevronDown,
  User,
  LogOut,
  Building2,
  ExternalLink,
  ShieldCheck,
  Check
} from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { AppLauncherModal } from '../../../design-system/navigation/AppLauncherModal';

interface FlowTopHeaderProps {
  onSearchChange?: (query: string) => void;
  searchQuery?: string;
  onOpenHelp?: () => void;
}

export const FlowTopHeader: React.FC<FlowTopHeaderProps> = ({
  onSearchChange,
  searchQuery = '',
  onOpenHelp
}) => {
  const { user, logout } = useAuthStore();
  const [isLauncherOpen, setIsLauncherOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: '1', title: 'New VIP Lead Qualified', time: '10m ago', unread: true },
    { id: '2', title: 'Quote PDF Generated for Compressor', time: '1h ago', unread: true },
    { id: '3', title: 'Webhook Outbox Delivered (HTTP 200)', time: '3h ago', unread: false }
  ]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const displayName = user?.name || 'Ravi Kumar';
  const displayOrg = user?.organizationName || user?.companyName || 'ACME Manufacturing';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between select-none z-10 shrink-0">
      {/* 1. Global Search Bar */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Search workflows, templates, runs..."
            className="w-full pl-10 pr-12 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition shadow-2xs"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-[10px] font-mono font-bold text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-2xs">
            <span>⌘K</span>
          </div>
        </div>
      </div>

      {/* 2. Right Actions: 9-Dots Launcher, Notifications, Help, User Profile */}
      <div className="flex items-center gap-3">
        {/* 9-Dots Ecosystem App Launcher */}
        <button
          onClick={() => setIsLauncherOpen(true)}
          className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
          title="I3DION Ecosystem Launcher"
        >
          <Grid size={18} />
        </button>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition relative"
            title="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
            )}
          </button>

          {isNotificationOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl p-3 z-50 divide-y divide-slate-100">
              <div className="flex items-center justify-between pb-2 px-1">
                <span className="font-bold text-slate-900 text-xs">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[10px] text-blue-600 hover:underline font-semibold"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="py-2 space-y-1.5">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-2 rounded-lg text-xs flex items-start gap-2.5 transition ${
                      n.unread ? 'bg-blue-50/60' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                        n.unread ? 'bg-blue-600' : 'bg-slate-300'
                      }`}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-slate-800">{n.title}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{n.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Help Circle */}
        <button
          onClick={onOpenHelp}
          className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
          title="Help &amp; Documentation"
        >
          <HelpCircle size={18} />
        </button>

        <div className="h-5 w-px bg-slate-200" />

        {/* User Profile Badge */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 transition group"
          >
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {initials}
            </div>
            <div className="hidden md:flex flex-col text-left leading-tight">
              <span className="font-bold text-slate-900 text-xs">{displayName}</span>
              <span className="text-[10px] text-slate-400">{displayOrg}</span>
            </div>
            <ChevronDown size={14} className="text-slate-400 group-hover:text-slate-700" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 z-50 divide-y divide-slate-100 text-xs">
              <div className="p-2">
                <div className="font-bold text-slate-900">{displayName}</div>
                <div className="text-[11px] text-slate-500 truncate">{user?.email || 'ravi@acme.com'}</div>
                <div className="text-[10px] text-blue-600 font-bold mt-1 uppercase">{displayOrg}</div>
              </div>
              <div className="py-1">
                <a
                  href="/profile"
                  className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-lg transition"
                >
                  <User size={14} className="text-slate-400" />
                  <span>Profile Settings</span>
                </a>
                <a
                  href="/hub/feed"
                  className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-lg transition"
                >
                  <Building2 size={14} className="text-slate-400" />
                  <span>Switch to Hub</span>
                </a>
              </div>
              <div className="pt-1">
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-lg transition font-medium"
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ecosystem App Launcher Modal */}
      <AppLauncherModal
        isOpen={isLauncherOpen}
        onClose={() => setIsLauncherOpen(false)}
        activeAppId="flow"
      />
    </header>
  );
};
