import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { SpatialHubLogo } from '../components/SpatialHubLogo';
import {
  Compass,
  Search,
  Activity,
  Bookmark,
  Heart,
  Package,
  Building2,
  ChevronDown,
  ChevronRight,
  Settings,
  LogOut,
  Bell,
  ScanLine,
  Menu,
  X,
  ShoppingBag,
  GitCompare,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useHubQuoteStore } from '../store/hubQuoteStore';
import { useHubCompareStore } from '../store/hubCompareStore';
import { getUserContext } from '../utils/permissions';
import { AppLauncher } from '../components/AppLauncher';
import { QrScannerModal } from '../components/hub/QrScannerModal';

export default function SpatialHubLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(location.pathname.startsWith('/hub/organization'));
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scanOpen, setScanOpen] = useState(false);
  const basketItems = useHubQuoteStore((state) => state.items);
  const basketCount = basketItems.reduce((acc, i) => acc + i.quantity, 0);
  const compareModels = useHubCompareStore((state) => state.models);
  const compareCount = compareModels.length;

  useEffect(() => {
    if ('serviceWorker' in navigator && !window.location.hostname.includes('localhost')) {
      navigator.serviceWorker.register('/spatial-hub-sw.js').catch(() => {});
    }
  }, []);

  const { isOrgUser } = getUserContext(user);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/hub/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] font-sans text-slate-800 overflow-hidden select-none">
      {/* ─── 1. DARK NAVY SIDEBAR (#0F172A) MATCHING REFERENCE IMAGES 1 & 3 ───────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[#0F172A] px-4 py-6 text-white transition-transform duration-300 ease-in-out shadow-2xl lg:static lg:translate-x-0 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Brand Header */}
        <div className="mb-6 flex items-center justify-between px-2">
          <NavLink to="/hub" onClick={() => setMobileSidebarOpen(false)}>
            <SpatialHubLogo variant="dark" size="md" />
          </NavLink>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="lg:hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="no-scrollbar flex-1 space-y-1 overflow-y-auto pr-1">
          {/* Primary Navigation */}
          <NavLink
            to="/hub"
            end
            onClick={() => setMobileSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${
                isActive ? 'bg-[#2563EB] text-white shadow-md' : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`
            }
          >
            <Compass size={17} />
            <span>Explore</span>
          </NavLink>

          <NavLink
            to="/hub/search"
            onClick={() => setMobileSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${
                isActive ? 'bg-[#2563EB] text-white shadow-md' : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`
            }
          >
            <Search size={17} />
            <span>Search</span>
          </NavLink>

          <NavLink
            to="/hub/feed"
            onClick={() => setMobileSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${
                isActive ? 'bg-[#2563EB] text-white shadow-md' : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`
            }
          >
            <Activity size={17} />
            <span>My Activity</span>
          </NavLink>

          <NavLink
            to="/hub/saved"
            onClick={() => setMobileSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${
                isActive ? 'bg-[#2563EB] text-white shadow-md' : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`
            }
          >
            <Bookmark size={17} />
            <span>Saved</span>
          </NavLink>

          <NavLink
            to="/hub/liked"
            onClick={() => setMobileSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${
                isActive ? 'bg-[#2563EB] text-white shadow-md' : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`
            }
          >
            <Heart size={17} />
            <span>Liked</span>
          </NavLink>

          <NavLink
            to="/hub/subscriptions"
            onClick={() => setMobileSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${
                isActive ? 'bg-[#2563EB] text-white shadow-md' : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`
            }
          >
            <Package size={17} />
            <span>Subscriptions</span>
          </NavLink>

          <NavLink
            to="/hub/notifications"
            onClick={() => setMobileSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${
                isActive ? 'bg-[#2563EB] text-white shadow-md' : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`
            }
          >
            <Bell size={17} />
            <span>Notifications</span>
          </NavLink>

          <NavLink
            to="/hub/rfq"
            onClick={() => setMobileSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${
                isActive ? 'bg-[#2563EB] text-white shadow-md' : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`
            }
          >
            <div className="flex items-center gap-3">
              <ShoppingBag size={17} />
              <span>Quote Basket</span>
            </div>
            {basketCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-500 px-1 text-[10px] font-black text-white">
                {basketCount}
              </span>
            )}
          </NavLink>

          {/* Organization Navigation Section */}
          {isOrgUser ? (
            <div className="pt-3">
              <button
                onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
                className="flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-800/80 hover:text-white transition"
              >
                <div className="flex items-center gap-3">
                  <Building2 size={17} className="text-blue-400" />
                  <span>Organization</span>
                </div>
                {orgDropdownOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>

              {orgDropdownOpen && (
                <div className="mt-1 space-y-1 pl-9 pr-1 animate-in fade-in slide-in-from-top-1">
                  <NavLink
                    to="/hub/organization"
                    end
                    onClick={() => setMobileSidebarOpen(false)}
                    className={({ isActive }) =>
                      `block rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        isActive ? 'text-blue-400 font-bold bg-slate-800/60' : 'text-slate-400 hover:text-white'
                      }`
                    }
                  >
                    Overview
                  </NavLink>
                  <NavLink
                    to="/hub/organization/products"
                    onClick={() => setMobileSidebarOpen(false)}
                    className={({ isActive }) =>
                      `block rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        isActive ? 'text-blue-400 font-bold bg-slate-800/60' : 'text-slate-400 hover:text-white'
                      }`
                    }
                  >
                    Products
                  </NavLink>
                  <NavLink
                    to="/hub/organization/catalogs"
                    onClick={() => setMobileSidebarOpen(false)}
                    className={({ isActive }) =>
                      `block rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        isActive ? 'text-blue-400 font-bold bg-slate-800/60' : 'text-slate-400 hover:text-white'
                      }`
                    }
                  >
                    Catalogs
                  </NavLink>
                  <NavLink
                    to="/hub/organization/dashboards"
                    onClick={() => setMobileSidebarOpen(false)}
                    className={({ isActive }) =>
                      `block rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        isActive ? 'text-blue-400 font-bold bg-slate-800/60' : 'text-slate-400 hover:text-white'
                      }`
                    }
                  >
                    Dashboards
                  </NavLink>
                </div>
              )}
            </div>
          ) : (
            <div className="pt-2">
              <NavLink
                to="/hub/organization"
                onClick={() => setMobileSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${
                    isActive ? 'bg-[#2563EB] text-white shadow-md' : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`
                }
              >
                <Building2 size={17} />
                <span>Organization</span>
              </NavLink>
            </div>
          )}
        </nav>

        {/* Secondary Navigation & User Profile at Bottom */}
        <div className="mt-4 space-y-1 border-t border-slate-800 pt-4">
          <NavLink
            to="/settings"
            onClick={() => setMobileSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${
                isActive ? 'bg-[#2563EB] text-white' : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`
            }
          >
            <Settings size={17} />
            <span>Settings</span>
          </NavLink>

        </div>

      </aside>

      {/* Mobile Sidebar Backdrop Overlay */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* ─── 2. MAIN CONTENT AREA & TOP HEADER BAR ───────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Top Header */}
        <header className="flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white px-4 md:px-8 shrink-0 z-30 shadow-2xs">
          {/* Mobile Menu Button & Global Search Bar */}
          <div className="flex items-center gap-3 flex-1 max-w-2xl">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            >
              <Menu size={18} />
            </button>

            <form onSubmit={handleSearchSubmit} className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, experiences, or organizations..."
                className="w-full rounded-2xl border border-slate-200/80 bg-[#F8FAFC] py-2 pl-9 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
              />
            </form>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2.5">
            {/* RFQ Quote Basket */}
            <NavLink
              to="/hub/rfq"
              aria-label={`RFQ Basket: ${basketCount} items`}
              title="View RFQ Quote Basket"
              className="relative flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 text-slate-700 hover:bg-slate-50 transition"
            >
              <ShoppingBag size={17} />
              <span className="hidden sm:inline text-xs font-bold">RFQ</span>
              {basketCount > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-black text-white">
                  {basketCount}
                </span>
              )}
            </NavLink>

            {/* QR scanner (mobile-first) */}
            <button
              onClick={() => setScanOpen(true)}
              aria-label="Scan a QR code"
              title="Scan a QR code"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            >
              <ScanLine size={17} />
            </button>
            <QrScannerModal open={scanOpen} onClose={() => setScanOpen(false)} />

            {/* App Launcher */}
            <AppLauncher />

            {/* User Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2.5 rounded-2xl border border-slate-200/80 bg-white p-1.5 pr-3 hover:bg-slate-50 transition"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#0F172A] text-xs font-bold text-white shadow-2xs">
                  {user?.name ? user.name.slice(0, 2).toUpperCase() : 'JS'}
                </div>
                <div className="hidden sm:block text-left text-xs">
                  <p className="font-bold text-slate-900 leading-tight">{user?.name || 'John Smith'}</p>
                  <p className="text-[10px] text-slate-500">{isOrgUser ? 'Organization Member' : 'Individual User'}</p>
                </div>
                <ChevronDown size={14} className="text-slate-400" />
              </button>

              {/* User Dropdown */}
              {userMenuOpen && (
                <div className="absolute right-0 top-12 z-50 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl animate-in fade-in slide-in-from-top-2">
                  <div className="p-2 border-b border-slate-100 mb-1">
                    <p className="text-xs font-bold text-slate-900">{user?.name || 'John Smith'}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user?.email || 'john@example.com'}</p>
                  </div>
                  <NavLink
                    to="/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 rounded-xl p-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    <Settings size={15} />
                    Profile & Settings
                  </NavLink>

                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-xl p-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                  >
                    <LogOut size={15} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main className="no-scrollbar flex-1 overflow-y-auto pb-20 lg:pb-0">
          <Outlet />
        </main>
      </div>

      {/* ─── 3. MOBILE BOTTOM NAVIGATION BAR (FIXED ON MOBILE, HIDDEN ON LG) ─── */}
      <nav 
        aria-label="Mobile Navigation"
        className="fixed bottom-0 inset-x-0 z-40 flex h-16 items-center justify-around border-t border-slate-200/90 bg-white/95 px-2 backdrop-blur-md lg:hidden shadow-lg safe-bottom"
      >
        {/* 1. Explore */}
        <NavLink
          to="/hub"
          end
          aria-label="Explore 3D Models"
          className={({ isActive }) =>
            `flex min-h-[44px] min-w-[44px] flex-col items-center justify-center rounded-xl p-1 text-[10px] font-bold transition ${
              isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
            }`
          }
        >
          <Compass size={20} />
          <span>Explore</span>
        </NavLink>

        {/* 2. Search */}
        <NavLink
          to="/hub/search"
          aria-label="Search Catalog"
          className={({ isActive }) =>
            `flex min-h-[44px] min-w-[44px] flex-col items-center justify-center rounded-xl p-1 text-[10px] font-bold transition ${
              isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
            }`
          }
        >
          <Search size={20} />
          <span>Search</span>
        </NavLink>

        {/* 3. Center Elevated Quick Scanner Button */}
        <button
          type="button"
          onClick={() => setScanOpen(true)}
          aria-label="Scan QR Code"
          className="relative -top-3 flex h-12 w-12 min-h-[48px] min-w-[48px] items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-700 active:scale-95"
        >
          <ScanLine size={22} />
        </button>

        {/* 4. Compare */}
        <NavLink
          to="/hub/compare"
          aria-label={`Compare Models: ${compareCount} selected`}
          className={({ isActive }) =>
            `relative flex min-h-[44px] min-w-[44px] flex-col items-center justify-center rounded-xl p-1 text-[10px] font-bold transition ${
              isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
            }`
          }
        >
          <GitCompare size={20} />
          <span>Compare</span>
          {compareCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[9px] font-black text-white">
              {compareCount}
            </span>
          )}
        </NavLink>

        {/* 5. RFQ Basket */}
        <NavLink
          to="/hub/rfq"
          aria-label={`RFQ Basket: ${basketCount} items`}
          className={({ isActive }) =>
            `relative flex min-h-[44px] min-w-[44px] flex-col items-center justify-center rounded-xl p-1 text-[10px] font-bold transition ${
              isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
            }`
          }
        >
          <ShoppingBag size={20} />
          <span>RFQ</span>
          {basketCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[9px] font-black text-white">
              {basketCount}
            </span>
          )}
        </NavLink>
      </nav>
    </div>
  );
}
