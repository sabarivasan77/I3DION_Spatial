import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Home, 
  Layers, 
  BookOpen, 
  Globe, 
  Database, 
  Users, 
  Plus, 
  Sparkles, 
  FileText, 
  GitBranch, 
  Trash2, 
  Settings, 
  HelpCircle, 
  User, 
  Search, 
  Bell, 
  Box
} from 'lucide-react';
import { AppLauncher } from '../components/AppLauncher';
import { useAuthStore } from '../store/authStore';

export const StudioLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const [searchQuery, setSearchQuery] = useState('');

  const isCurrent = (path: string) => {
    if (path === '/omni-studio' && (location.pathname === '/omni-studio' || location.pathname === '/omni-studio/')) {
      return true;
    }
    return location.pathname.startsWith(path) && path !== '/omni-studio';
  };

  const navItemClass = (path: string) => `
    flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150
    ${isCurrent(path) 
      ? 'bg-indigo-600/90 text-white font-semibold shadow-md shadow-indigo-600/20' 
      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}
  `;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Application Bar */}
      <header className="h-16 bg-[#0D111D] border-b border-slate-800/80 px-6 flex items-center justify-between shrink-0 z-30 sticky top-0">
        {/* Left Branding / Mobile menu */}
        <div className="flex items-center gap-4">
          <Link to="/omni-studio" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white block leading-none">I3DION</span>
              <span className="text-[11px] font-bold text-indigo-400 tracking-wider uppercase block mt-0.5">Omni Studio</span>
            </div>
          </Link>
        </div>

        {/* Center Search Input with ⌘K Shortcut */}
        <div className="hidden md:flex items-center relative w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search projects, catalogs, templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-12 py-2 text-xs bg-[#141A29] border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
          />
          <kbd className="absolute right-3 top-2 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-800/80 border border-slate-700 rounded">
            ⌘K
          </kbd>
        </div>

        {/* Right Top Actions */}
        <div className="flex items-center gap-4">
          <AppLauncher />

          <button 
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-xl relative transition"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full ring-2 ring-[#0D111D]" />
          </button>

          <button 
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-xl transition"
            title="Help & Support"
            onClick={() => navigate('/omni-studio/support')}
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <div className="h-5 w-[1px] bg-slate-800" />

          {/* User Profile */}
          <div className="flex items-center gap-3 cursor-pointer p-1.5 rounded-xl hover:bg-slate-800/50 transition">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
              {user?.name?.slice(0, 2).toUpperCase() || 'JD'}
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-bold text-slate-200 leading-tight">{user?.name || 'John Doe'}</div>
              <div className="text-[10px] text-slate-400 line-clamp-1">{(user as any)?.organization || user?.companyId || 'Acme Industries'}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Sidebar + Content Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Sidebar */}
        <aside className="w-64 bg-[#0D111D] border-r border-slate-800/80 flex flex-col justify-between shrink-0 p-4 overflow-y-auto">
          <div className="space-y-6">
            {/* Primary Section */}
            <div className="space-y-1">
              <Link to="/omni-studio" className={navItemClass('/omni-studio')}>
                <Home className="w-4 h-4" />
                Home
              </Link>
              <Link to="/omni-studio/projects" className={navItemClass('/omni-studio/projects')}>
                <Layers className="w-4 h-4" />
                Projects
              </Link>
              <Link to="/omni-studio/projects?filter=catalog" className={navItemClass('/omni-studio/catalogs')}>
                <Box className="w-4 h-4" />
                Catalogs
              </Link>
              <Link to="/omni-studio/templates" className={navItemClass('/omni-studio/templates')}>
                <BookOpen className="w-4 h-4" />
                Templates
              </Link>
              <a href="/vault" className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition">
                <Database className="w-4 h-4 text-emerald-400" />
                Assets (from Vault)
              </a>
              <Link to="/omni-studio/published" className={navItemClass('/omni-studio/published')}>
                <Globe className="w-4 h-4 text-cyan-400" />
                Published
              </Link>
              <Link to="/omni-studio/shared" className={navItemClass('/omni-studio/shared')}>
                <Users className="w-4 h-4" />
                Shared with Me
              </Link>
            </div>

            {/* Section: Create */}
            <div className="space-y-1 pt-2 border-t border-slate-800/60">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Create
              </div>
              <button
                onClick={() => navigate('/omni-studio/projects')}
                className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition text-left"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-400" />
                New Catalog
              </button>
              <button
                onClick={() => navigate('/omni-studio/projects')}
                className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition text-left"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-400" />
                New Product Showcase
              </button>
              <button
                onClick={() => navigate('/omni-studio/projects')}
                className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition text-left"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-400" />
                New Experience
              </button>
              <Link to="/omni-studio/templates" className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition">
                <Plus className="w-3.5 h-3.5 text-indigo-400" />
                From Template
              </Link>
            </div>

            {/* Section: Manage */}
            <div className="space-y-1 pt-2 border-t border-slate-800/60">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Manage
              </div>
              <Link to="/omni-studio/drafts" className={navItemClass('/omni-studio/drafts')}>
                <FileText className="w-4 h-4" />
                Drafts
              </Link>
              <Link to="/omni-studio/versions" className={navItemClass('/omni-studio/versions')}>
                <GitBranch className="w-4 h-4" />
                Versions
              </Link>
              <Link to="/omni-studio/trash" className={navItemClass('/omni-studio/trash')}>
                <Trash2 className="w-4 h-4" />
                Trash
              </Link>
            </div>
          </div>

          {/* Bottom Sidebar Controls & Promo Box */}
          <div className="space-y-4 pt-4 border-t border-slate-800/60">
            <div className="space-y-1">
              <Link to="/omni-studio/settings" className={navItemClass('/omni-studio/settings')}>
                <Settings className="w-4 h-4" />
                Settings
              </Link>
              <Link to="/omni-studio/support" className={navItemClass('/omni-studio/support')}>
                <HelpCircle className="w-4 h-4" />
                Help & Support
              </Link>
              <Link to="/profile" className={navItemClass('/profile')}>
                <User className="w-4 h-4" />
                Account
              </Link>
            </div>

            {/* Promo Card */}
            <div className="p-3.5 bg-gradient-to-br from-indigo-950/40 to-slate-900 rounded-xl border border-indigo-900/40 space-y-1">
              <div className="text-[11px] font-bold text-white">Create. Present. Share.</div>
              <p className="text-[10px] text-slate-400 leading-normal">
                Turn your products into powerful visual experiences.
              </p>
            </div>
          </div>
        </aside>

        {/* Main Content Router Body */}
        <main className="flex-1 overflow-y-auto bg-[#0B0F19]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default StudioLayout;
