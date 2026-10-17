import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Grid, 
  Search, 
  Bell, 
  ChevronDown, 
  User, 
  LogOut, 
  Building2, 
  ShieldCheck, 
  HelpCircle,
  Check
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { AppLauncherModal } from './AppLauncherModal';
import { CommandPalette } from './CommandPalette';

interface EcosystemHeaderProps {
  productName?: string;
  productBadgeColor?: string;
}

export const EcosystemHeader: React.FC<EcosystemHeaderProps> = ({
  productName = 'Ecosystem',
  productBadgeColor = 'text-blue-600 bg-blue-50 border-blue-200',
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const [isLauncherOpen, setIsLauncherOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isOrgMenuOpen, setIsOrgMenuOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch unread notifications count
  useEffect(() => {
    const token = localStorage.getItem('i3dion.token');
    if (!token) return;
    fetch('/api/notifications', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.unreadCount !== undefined) {
          setUnreadNotifications(data.unreadCount);
        }
      })
      .catch(() => {});
  }, [location.pathname]);

  const activeAppId = location.pathname.startsWith('/vault') 
    ? 'vault' 
    : location.pathname.startsWith('/studio') 
      ? 'studio' 
      : location.pathname.startsWith('/engine') 
        ? 'engine' 
        : location.pathname.startsWith('/hub') 
          ? 'hub' 
          : location.pathname.startsWith('/sales') 
            ? 'lens' 
            : 'home';

  return (
    <>
      <header className="sticky top-0 z-40 h-16 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between">
        {/* Left: App Launcher + Brand Wordmark + Org Switcher */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* App Launcher Trigger (Microsoft 9-dots style) */}
          <button
            type="button"
            onClick={() => setIsLauncherOpen(true)}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            title="I3DION App Launcher"
          >
            <Grid className="h-5 w-5" />
          </button>

          {/* I3DION Brand + Product Pill */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/home')}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-xs tracking-wider shadow-sm">
              I3
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-slate-900 tracking-tight">I3DION</span>
              <span className="text-slate-300">/</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${productBadgeColor}`}>
                {productName}
              </span>
            </div>
          </div>

          <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block" />

          {/* Organization Context Switcher */}
          <div className="relative hidden sm:block">
            <button
              type="button"
              onClick={() => setIsOrgMenuOpen(!isOrgMenuOpen)}
              className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Building2 className="h-3.5 w-3.5 text-slate-400" />
              <span className="max-w-[130px] truncate">{user?.organizationName || 'Default Workspace'}</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {isOrgMenuOpen && (
              <div className="absolute left-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg z-50">
                <div className="px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Active Organization
                </div>
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-blue-50 text-blue-900 text-xs font-medium">
                  <span className="truncate">{user?.organizationName || 'Default Workspace'}</span>
                  <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                </div>
                <div className="my-1 border-t border-slate-100" />
                <button
                  type="button"
                  onClick={() => {
                    setIsOrgMenuOpen(false);
                    navigate('/settings/company');
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 rounded-lg"
                >
                  Manage Organizations
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Center: Command Palette Trigger Button */}
        <div className="hidden md:flex items-center flex-1 max-w-sm mx-6">
          <button
            type="button"
            onClick={() => setIsCommandOpen(true)}
            className="w-full h-9 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/70 px-3 text-xs text-slate-400 hover:bg-slate-100/70 hover:border-slate-300 transition-all shadow-none"
          >
            <div className="flex items-center gap-2">
              <Search className="h-3.5 w-3.5 text-slate-400" />
              <span>Search assets, catalogs, commands...</span>
            </div>
            <kbd className="inline-flex items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 shadow-sm">
              <span className="text-[9px]">⌘</span>K
            </kbd>
          </button>
        </div>

        {/* Right: Actions, Notifications & Profile */}
        <div className="flex items-center gap-2">
          {/* Notifications Bell */}
          <button
            type="button"
            onClick={() => navigate('/notifications')}
            className="relative p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Notifications Center"
          >
            <Bell className="h-4 w-4" />
            {unreadNotifications > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white" />
            )}
          </button>

          {/* User Profile Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-white text-xs font-semibold">
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-semibold text-slate-900 leading-tight max-w-[120px] truncate">
                  {user?.name || 'Account'}
                </p>
                <p className="text-[10px] text-slate-500 leading-none">
                  {user?.role || 'Member'}
                </p>
              </div>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl z-50 animate-in fade-in duration-100">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-900 truncate">{user?.name || 'User'}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                  <div className="mt-1 inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700">
                    <ShieldCheck className="h-3 w-3 text-blue-600" />
                    Role: {user?.role || 'Viewer'}
                  </div>
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      navigate('/profile');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg text-left"
                  >
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    Account Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      navigate('/settings/company');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg text-left"
                  >
                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                    Company Settings
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      navigate('/help');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg text-left"
                  >
                    <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
                    Help & Docs
                  </button>
                </div>

                <div className="pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                      navigate('/login');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg text-left"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* App Launcher Modal */}
      <AppLauncherModal
        isOpen={isLauncherOpen}
        onClose={() => setIsLauncherOpen(false)}
        activeAppId={activeAppId}
      />

      {/* Command Palette Modal */}
      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
      />
    </>
  );
};
