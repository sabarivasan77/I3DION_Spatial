import { NavLink, Outlet } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Bell,
  BookOpen,
  Box,
  Headphones,
  HelpCircle,
  LogOut,
  Menu,
  Plus,
  Settings,
  Users,
  Globe,
  Zap,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { cx } from '../utils/format';
import { GlobalSearch, SearchTrigger } from '../components/GlobalSearch';

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: BarChart3 },
  { label: 'Spatial Hub', path: '/hub', icon: Globe },
  { label: 'Products', path: '/products', icon: Box },
  { label: 'Catalogs', path: '/catalog-builder', icon: BookOpen },
  { label: 'Leads', path: '/leads', icon: Users },
  { label: 'Analytics', path: '/analytics', icon: BarChart3 },
  { label: 'AI Engine', path: '/ai', icon: Zap },
  { label: 'Settings', path: '/settings', icon: Settings },
];

function Sidebar({
  open,
  onClose,
  onLogout,
  onSupport,
}: {
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
  onSupport: () => void;
}) {
  return (
    <aside
      className={cx(
        'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-navy px-4 py-6 text-white transition-transform lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full',
      )}
    >
      <div className="mb-8 flex items-center justify-between px-2">
        <NavLink to="/dashboard" className="flex items-center gap-3" onClick={onClose}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <Box size={22} />
          </div>
          <div>
            <p className="text-lg font-bold leading-tight">I3DION Spatial</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Enterprise AR
            </p>
          </div>
        </NavLink>
        <button className="rounded-lg p-2 text-slate-300 lg:hidden" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <NavLink
        to="/products/upload"
        onClick={onClose}
        className="mb-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-600 active:scale-[0.98]"
      >
        <Plus size={18} />
        New Visualization
      </NavLink>

      <nav className="no-scrollbar flex-1 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                cx(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-white',
                )
              }
            >
              <Icon size={20} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-6 space-y-1 border-t border-slate-800 pt-6">
        <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 hover:bg-slate-800/60 hover:text-white" onClick={onSupport}>
          <Headphones size={20} />
          Support Dashboard
        </button>
        <NavLink 
          to="/support/kb" 
          onClick={onClose}
          className={({ isActive }) => cx("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-slate-800/60 transition", isActive ? "bg-slate-800/60 text-white" : "text-slate-400")}
        >
          <BookOpen size={20} />
          Knowledge Base
        </NavLink>
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-rose-300 hover:bg-rose-500/10"
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

export default function AppShell() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  // Avatar initial
  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-background text-slate-950">
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      <Sidebar open={open} onClose={() => setOpen(false)} onLogout={handleLogout} onSupport={() => navigate('/support')} />
      <div className="lg:pl-64">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-8">
          <div className="flex flex-1 items-center gap-4">
            <button className="rounded-xl p-2 text-slate-600 lg:hidden" onClick={() => setOpen(true)}>
              <Menu size={22} />
            </button>
            <SearchTrigger onClick={() => setSearchOpen(true)} />
            {/* Mobile search icon */}
            <button
              className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 sm:hidden"
              onClick={() => setSearchOpen(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="relative rounded-full p-2 text-slate-600 hover:bg-slate-100"
              onClick={() => navigate('/support')}
              title="Notifications"
            >
              <Bell size={20} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            </button>
            <button
              className="rounded-full p-2 text-slate-600 hover:bg-slate-100"
              onClick={() => navigate('/support')}
              title="Help & Support"
            >
              <HelpCircle size={20} />
            </button>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">{user?.name ?? 'User'}</p>
              <p className="text-[11px] font-medium text-slate-500">{user?.role ?? 'Admin'}</p>
            </div>
            {/* Clickable avatar → /profile */}
            <button
              onClick={() => navigate('/profile')}
              className="relative h-9 w-9 overflow-hidden rounded-full ring-2 ring-slate-100 transition hover:ring-primary hover:ring-offset-1 focus:outline-none focus:ring-primary"
              title="View profile"
            >
              {(user as any)?.avatarUrl ? (
                <img
                  className="h-full w-full object-cover"
                  alt={user?.name ?? 'Profile'}
                  src={(user as any).avatarUrl}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700 text-xs font-bold text-white">
                  {initials}
                </div>
              )}
            </button>
          </div>
        </header>
        <main className="mx-auto min-h-[calc(100vh-64px)] w-full max-w-[1440px] p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
