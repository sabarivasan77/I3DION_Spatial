import { NavLink, Outlet, useLocation } from 'react-router-dom';
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
  QrCode,
  Search,
  Settings,
  Users,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { cx } from '../utils/format';

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: BarChart3 },
  { label: 'Products', path: '/products', icon: Box },
  { label: 'Upload Wizard', path: '/products/upload', icon: Plus },
  { label: 'Catalogs', path: '/catalog-builder', icon: BookOpen },
  { label: 'Leads', path: '/leads', icon: Users },
  { label: 'Analytics', path: '/analytics', icon: BarChart3 },
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
          Support
        </button>
        <NavLink
          to="/login"
          onClick={onLogout}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-rose-300 hover:bg-rose-500/10"
        >
          <LogOut size={20} />
          Sign Out
        </NavLink>
      </div>
    </aside>
  );
}

export default function AppShell() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const title = navItems.find((item) => pathname.startsWith(item.path))?.label ?? 'Workspace';

  return (
    <div className="min-h-screen bg-background text-slate-950">
      <Sidebar open={open} onClose={() => setOpen(false)} onLogout={() => void logout()} onSupport={() => navigate('/support')} />
      <div className="lg:pl-64">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-8">
          <div className="flex flex-1 items-center gap-4">
            <button className="rounded-xl p-2 text-slate-600 lg:hidden" onClick={() => setOpen(true)}>
              <Menu size={22} />
            </button>
            <div className="relative hidden w-full max-w-md sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
              <input
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-blue-100"
                placeholder={`Search ${title.toLowerCase()}...`}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative rounded-full p-2 text-slate-600 hover:bg-slate-100" onClick={() => navigate('/support')}>
              <Bell size={20} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-error ring-2 ring-white" />
            </button>
            <button className="rounded-full p-2 text-slate-600 hover:bg-slate-100" onClick={() => navigate('/support')}>
              <HelpCircle size={20} />
            </button>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">{user?.name ?? 'Alex Thorne'}</p>
              <p className="text-[11px] font-medium text-slate-500">{user?.role ?? 'Admin'} - Level 4</p>
            </div>
            <img
              className="h-9 w-9 rounded-full object-cover ring-2 ring-slate-100"
              alt="Alex Thorne"
              src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=160&q=80"
            />
          </div>
        </header>
        <main className="mx-auto min-h-[calc(100vh-64px)] w-full max-w-[1440px] p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
