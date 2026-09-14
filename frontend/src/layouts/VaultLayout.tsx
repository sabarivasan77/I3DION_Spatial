import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Box,
  FolderOpen,
  FileText,
  Share2,
  Cpu,
  Trash2,
  Settings,
  Bell,
  Menu,
  X,
  UploadCloud,
  Search,
  Database,
  ArrowRight,
  Package,
  ListOrdered,
  Inbox
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { AppLauncher } from '../components/AppLauncher';
import { vaultApi, VaultSearchResult } from '../api/vaultApi';

export default function VaultLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<VaultSearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setShowSearchDropdown(false);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await vaultApi.searchGlobal(searchQuery);
        setSearchResults(results);
        setShowSearchDropdown(true);
      } catch (err) {
        console.error('Search error', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside listener for search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] font-sans text-slate-800 overflow-hidden select-none">
      {/* ─── DARK GRAPHITE SIDEBAR ───────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[#1A1F26] px-4 py-6 text-slate-300 transition-transform duration-300 ease-in-out shadow-2xl lg:static lg:translate-x-0 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-8 flex items-center justify-between px-2">
          <div className="flex items-center gap-2 text-white">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white font-bold shadow-md">
              V
            </div>
            <span className="text-lg font-bold tracking-tight">Spatial Vault</span>
          </div>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="lg:hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="no-scrollbar flex-1 space-y-1.5 overflow-y-auto pr-1">
          <NavLink
            to="/vault"
            end
            onClick={() => setMobileSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                isActive ? 'bg-emerald-500/10 text-emerald-400' : 'hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <LayoutDashboard size={18} />
            <span>Overview</span>
          </NavLink>

          <NavLink
            to="/vault/assets"
            onClick={() => setMobileSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                isActive ? 'bg-emerald-500/10 text-emerald-400' : 'hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <Box size={18} />
            <span>Assets</span>
          </NavLink>

          <NavLink
            to="/vault/products"
            onClick={() => setMobileSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                isActive ? 'bg-emerald-500/10 text-emerald-400' : 'hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <Package size={18} />
            <span>Products</span>
          </NavLink>

          <NavLink
            to="/vault/catalogs"
            onClick={() => setMobileSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                isActive ? 'bg-emerald-500/10 text-emerald-400' : 'hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <ListOrdered size={18} />
            <span>Catalogs</span>
          </NavLink>

          <NavLink
            to="/vault/enquiries"
            onClick={() => setMobileSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                isActive ? 'bg-emerald-500/10 text-emerald-400' : 'hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <Inbox size={18} />
            <span>Enquiries</span>
          </NavLink>

          <NavLink
            to="/vault/collections"
            onClick={() => setMobileSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                isActive ? 'bg-emerald-500/10 text-emerald-400' : 'hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <FolderOpen size={18} />
            <span>Collections</span>
          </NavLink>

          <NavLink
            to="/vault/templates"
            onClick={() => setMobileSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                isActive ? 'bg-emerald-500/10 text-emerald-400' : 'hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <FileText size={18} />
            <span>Templates</span>
          </NavLink>

          <NavLink
            to="/vault/shared"
            onClick={() => setMobileSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                isActive ? 'bg-emerald-500/10 text-emerald-400' : 'hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <Share2 size={18} />
            <span>Shared</span>
          </NavLink>

          <NavLink
            to="/vault/processing"
            onClick={() => setMobileSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                isActive ? 'bg-emerald-500/10 text-emerald-400' : 'hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <Cpu size={18} />
            <span>Processing</span>
          </NavLink>

          <NavLink
            to="/vault/trash"
            onClick={() => setMobileSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                isActive ? 'bg-emerald-500/10 text-emerald-400' : 'hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <Trash2 size={18} />
            <span>Trash</span>
          </NavLink>

          <NavLink
            to="/vault/audit"
            onClick={() => setMobileSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                isActive ? 'bg-emerald-500/10 text-emerald-400' : 'hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <Cpu size={18} />
            <span>Audit Trail</span>
          </NavLink>
        </nav>

        <div className="mt-4 space-y-1.5 border-t border-slate-700/50 pt-4">
          <NavLink
            to="/vault/settings"
            onClick={() => setMobileSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                isActive ? 'bg-emerald-500/10 text-emerald-400' : 'hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <Settings size={18} />
            <span>Settings</span>
          </NavLink>
          
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-700 text-xs font-bold text-white shadow-inner">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'JS'}
            </div>
            <div className="text-left">
              <span className="block truncate text-xs font-bold text-white leading-tight">{user?.name || 'John Smith'}</span>
              <span className="block truncate text-[10px] text-slate-400 leading-tight">{user?.email || 'john@company.com'}</span>
            </div>
          </button>
        </div>
      </aside>

      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* ─── MAIN CONTENT ───────── */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <header className="flex h-16 w-full items-center justify-between border-b border-slate-200/60 bg-white px-4 md:px-6 shrink-0 z-30 shadow-2xs">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            >
              <Menu size={18} />
            </button>

            {/* GLOBAL SEARCH INPUT & DROPDOWN */}
            <div ref={searchRef} className="relative w-full">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-xs text-slate-600 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/20 transition">
                <Search size={15} className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search assets, datasets, products, collections..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => { if (searchResults) setShowSearchDropdown(true); }}
                  className="w-full bg-transparent outline-none font-medium text-slate-800 placeholder-slate-400"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600">
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* SEARCH RESULTS DROPDOWN POPOVER */}
              {showSearchDropdown && searchResults && (
                <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl border border-slate-200 bg-white shadow-2xl p-4 max-h-96 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                  {isSearching ? (
                    <div className="p-4 text-center text-xs text-slate-400">Searching Vault...</div>
                  ) : (
                    <div className="space-y-4 text-xs">
                      {/* ASSETS */}
                      {searchResults.assets.length > 0 && (
                        <div>
                          <div className="font-bold text-[10px] uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                            <span>Assets ({searchResults.assets.length})</span>
                          </div>
                          <div className="space-y-1">
                            {searchResults.assets.map(a => (
                              <div
                                key={a.id}
                                onClick={() => { navigate(`/vault/assets/${a.id}`); setShowSearchDropdown(false); }}
                                className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition"
                              >
                                <div className="flex items-center gap-2">
                                  <Box size={14} className="text-emerald-600 shrink-0" />
                                  <span className="font-bold text-slate-800 truncate">{a.name}</span>
                                </div>
                                <span className="text-[10px] text-slate-400 font-semibold">{a.type}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* PRODUCTS / DATASETS */}
                      {searchResults.products.length > 0 && (
                        <div>
                          <div className="font-bold text-[10px] uppercase tracking-wider text-slate-400 mb-1.5">
                            Products ({searchResults.products.length})
                          </div>
                          <div className="space-y-1">
                            {searchResults.products.map(p => (
                              <div
                                key={p.id}
                                onClick={() => { navigate(`/vault/workspace/system_products`); setShowSearchDropdown(false); }}
                                className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition"
                              >
                                <div className="flex items-center gap-2">
                                  <Database size={14} className="text-indigo-600 shrink-0" />
                                  <span className="font-bold text-slate-800 truncate">{p.name}</span>
                                </div>
                                <span className="text-[10px] text-slate-400 font-semibold">{p.category}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* COLLECTIONS */}
                      {searchResults.collections.length > 0 && (
                        <div>
                          <div className="font-bold text-[10px] uppercase tracking-wider text-slate-400 mb-1.5">
                            Collections ({searchResults.collections.length})
                          </div>
                          <div className="space-y-1">
                            {searchResults.collections.map(c => (
                              <div
                                key={c.id}
                                onClick={() => { navigate(`/vault/workspace/${c.id}`); setShowSearchDropdown(false); }}
                                className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition"
                              >
                                <div className="flex items-center gap-2">
                                  <FolderOpen size={14} className="text-amber-600 shrink-0" />
                                  <span className="font-bold text-slate-800 truncate">{c.name}</span>
                                </div>
                                <ArrowRight size={12} className="text-slate-400" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {searchResults.assets.length === 0 && searchResults.products.length === 0 && searchResults.collections.length === 0 && (
                        <div className="p-4 text-center text-xs text-slate-500">
                          No items matching "<span className="font-semibold text-slate-800">{searchQuery}</span>"
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 ml-4">
            <button
              onClick={() => navigate('/vault/upload')}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-xs"
            >
              <UploadCloud size={16} />
              <span className="hidden sm:inline">Upload Asset</span>
            </button>

            <div className="h-6 w-px bg-slate-200 mx-1"></div>

            <AppLauncher />

            <button
              title="Notifications"
              className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-50 transition"
            >
              <Bell size={17} />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
            </button>
          </div>
        </header>

        <main className="no-scrollbar flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

