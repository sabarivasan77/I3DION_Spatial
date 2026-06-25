import { NavLink, Outlet } from 'react-router-dom';
import { Box, HelpCircle, Search } from 'lucide-react';

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <nav className="fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-surface px-4 md:px-6">
        <NavLink to="/" className="flex items-center gap-3">
          <Box className="text-primary" size={28} />
          <span className="text-xl font-bold text-primary">I3DION Spatial</span>
        </NavLink>
        <div className="hidden items-center gap-6 md:flex">
          <a className="border-b-2 border-primary px-2 py-1 text-sm font-semibold text-slate-700" href="/#features">
            Products
          </a>
          <a className="px-2 py-1 text-sm font-medium text-slate-600" href="/#how-it-works">
            How It Works
          </a>
          <a className="px-2 py-1 text-sm font-medium text-slate-600" href="/#industries">
            Solutions
          </a>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center rounded-full border border-slate-200 bg-surface-container-low px-3 py-1 sm:flex">
            <Search size={17} className="mr-2 text-outline" />
            <input className="w-40 bg-transparent text-sm outline-none" placeholder="Search catalog..." />
          </div>
          <NavLink className="text-sm font-semibold text-slate-600" to="/login">
            Login
          </NavLink>
          <NavLink className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white" to="/signup">
            Sign up
          </NavLink>
          <HelpCircle className="hidden text-primary sm:block" size={21} />
        </div>
      </nav>
      <Outlet />
    </div>
  );
}
