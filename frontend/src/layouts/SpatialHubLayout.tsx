import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';
import {
  Globe,
  Search,
  Bookmark,
  Heart,
  Building2,
  User,
  Settings,
  HelpCircle,
  LogOut,
  LogIn,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { getUserContext } from '../utils/permissions';
import { GlobalSearch } from '../components/GlobalSearch';
import { ChatbotWidget } from '../components/ChatbotWidget';

export default function SpatialHubLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const { isOrgUser } = getUserContext(user);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans antialiased text-slate-800 flex flex-col select-none">
      {/* Public Spatial Hub Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md shadow-2xs">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left: Brand */}
          <div className="flex items-center gap-6">
            <NavLink to="/hub" className="flex items-center gap-2.5">
              <Logo theme="light" />
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-100 uppercase tracking-wider">
                Spatial Hub
              </span>
            </NavLink>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              <NavLink
                to="/hub"
                end
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition ${
                    isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                <Globe size={16} />
                Explore Feed
              </NavLink>

              <NavLink
                to="/hub/saved"
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition ${
                    isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                <Bookmark size={16} />
                Saved
              </NavLink>

              <NavLink
                to="/hub/liked"
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition ${
                    isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                <Heart size={16} />
                Liked
              </NavLink>

              {/* Organization Tab for Authenticated Org Users */}
              {isOrgUser && (
                <NavLink
                  to="/hub/organization"
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition border ${
                      isActive
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    }`
                  }
                >
                  <Building2 size={16} />
                  Organization
                </NavLink>
              )}
            </nav>
          </div>

          {/* Right: Search, Auth & Profile */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-500 hover:bg-slate-100 transition shadow-2xs"
            >
              <Search size={15} />
              <span>Search Spatial 3D...</span>
              <kbd className="rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 border border-slate-200">⌘K</kbd>
            </button>

            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <NavLink
                  to="/profile"
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200 shadow-2xs hover:bg-blue-100 transition"
                  title="Profile"
                >
                  {user.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
                </NavLink>

                <NavLink
                  to="/settings"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition shadow-2xs"
                  title="Settings"
                >
                  <Settings size={18} />
                </NavLink>

                <NavLink
                  to="/support"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition shadow-2xs"
                  title="Support"
                >
                  <HelpCircle size={18} />
                </NavLink>

                <button
                  onClick={handleLogout}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition shadow-2xs"
                  title="Sign Out"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <NavLink
                  to="/login"
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                >
                  <LogIn size={15} />
                  Sign In
                </NavLink>
                <NavLink
                  to="/signup"
                  className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition shadow-2xs"
                >
                  <Sparkles size={15} />
                  Sign Up
                </NavLink>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-200 bg-white p-4 space-y-2 animate-in fade-in slide-in-from-top-1">
            <NavLink
              to="/hub"
              end
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 rounded-xl p-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
            >
              <Globe size={16} /> Explore Feed
            </NavLink>
            <NavLink
              to="/hub/saved"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 rounded-xl p-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
            >
              <Bookmark size={16} /> Saved
            </NavLink>
            <NavLink
              to="/hub/liked"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 rounded-xl p-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
            >
              <Heart size={16} /> Liked
            </NavLink>
            {isOrgUser && (
              <NavLink
                to="/hub/organization"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded-xl p-2.5 text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100"
              >
                <Building2 size={16} /> Organization
              </NavLink>
            )}
            {user ? (
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">{user.name}</span>
                <button onClick={handleLogout} className="text-xs font-bold text-rose-600">
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="pt-2 border-t border-slate-100 flex gap-2">
                <NavLink to="/login" onClick={() => setMobileMenuOpen(false)} className="flex-1 text-center py-2 text-xs font-bold border border-slate-200 rounded-xl">
                  Sign In
                </NavLink>
                <NavLink to="/signup" onClick={() => setMobileMenuOpen(false)} className="flex-1 text-center py-2 text-xs font-bold bg-blue-600 text-white rounded-xl">
                  Sign Up
                </NavLink>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Main Hub Page Body */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Global Search Modal */}
      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Lightweight Chatbot Enquiry FAB Widget */}
      <ChatbotWidget />
    </div>
  );
}
