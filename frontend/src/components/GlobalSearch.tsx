import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, X, Clock, TrendingUp, Box, BookOpen, Users,
  ArrowRight, Loader2, Command,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { cx } from '../utils/format';

// ─── Types ─────────────────────────────────────────────────────────────────

interface SearchResult {
  id: string;
  name: string;
  _type: 'product' | 'catalog' | 'lead';
  category?: string;
  status?: string;
  email?: string;
  company?: string;
  score?: number;
  intent_level?: string;
  product_count?: number;
  image_url?: string;
}

interface SearchResults {
  products: SearchResult[];
  catalogs: SearchResult[];
  leads: SearchResult[];
  total: number;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const POPULAR_SEARCHES = [
  'Hydraulic pumps',
  'Published products',
  'Hot leads',
  'AR experiences',
  'Automation catalog',
];

const SEARCH_HISTORY_KEY = 'i3dion.search_history';
const MAX_HISTORY = 10;

function getSearchHistory(): string[] {
  try {
    return JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function addToSearchHistory(query: string) {
  if (!query.trim()) return;
  const history = getSearchHistory().filter((h) => h !== query);
  history.unshift(query);
  localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
}

function clearSearchHistory() {
  localStorage.setItem(SEARCH_HISTORY_KEY, '[]');
}

// ─── Score badge ────────────────────────────────────────────────────────────

function ScoreBadge({ score, intent }: { score?: number; intent?: string }) {
  const label = intent ?? (
    !score ? 'Cold' :
    score >= 90 ? 'High Priority' :
    score >= 76 ? 'Qualified' :
    score >= 51 ? 'Hot' :
    score >= 26 ? 'Warm' : 'Cold'
  );
  const colorMap: Record<string, string> = {
    'High Priority': 'bg-red-100 text-red-700',
    'Qualified': 'bg-emerald-100 text-emerald-700',
    'Hot': 'bg-orange-100 text-orange-700',
    'Warm': 'bg-amber-100 text-amber-700',
    'Cold': 'bg-slate-100 text-slate-600',
    'SQL': 'bg-emerald-100 text-emerald-700',
    'High Intent': 'bg-red-100 text-red-700',
  };
  return (
    <span className={cx('rounded-full px-2 py-0.5 text-[10px] font-bold', colorMap[label] ?? 'bg-slate-100 text-slate-600')}>
      {label}
    </span>
  );
}

// ─── Result Item ─────────────────────────────────────────────────────────────

function ResultItem({
  result, isSelected, onClick,
}: {
  result: SearchResult; isSelected: boolean; onClick: () => void;
}) {
  const iconMap = { product: Box, catalog: BookOpen, lead: Users };
  const Icon = iconMap[result._type];

  return (
    <button
      className={cx(
        'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors',
        isSelected ? 'bg-blue-50 text-slate-900' : 'hover:bg-slate-50 text-slate-700',
      )}
      onClick={onClick}
    >
      <div className={cx(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
        result._type === 'product' ? 'bg-blue-100 text-blue-600' :
        result._type === 'catalog' ? 'bg-purple-100 text-purple-600' :
        'bg-emerald-100 text-emerald-600',
      )}>
        <Icon size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{result.name}</p>
        <p className="truncate text-xs text-slate-500">
          {result._type === 'product' && result.category}
          {result._type === 'catalog' && `${result.product_count ?? 0} products`}
          {result._type === 'lead' && (result.company ?? result.email)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {result._type === 'lead' && result.score !== undefined && (
          <ScoreBadge score={result.score} intent={result.intent_level} />
        )}
        {result.status && (
          <span className="hidden rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize text-slate-500 sm:inline">
            {result.status}
          </span>
        )}
        <ArrowRight size={14} className="text-slate-300" />
      </div>
    </button>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const token = useAuthStore((s) => s.token);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'products' | 'catalogs' | 'leads'>('all');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [history, setHistory] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load history on open
  useEffect(() => {
    if (open) {
      setHistory(getSearchHistory());
      setQuery('');
      setResults(null);
      setSelectedIdx(-1);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Debounced search
  const doSearch = useCallback(
    async (q: string, tab: typeof activeTab) => {
      if (!q.trim() || q.trim().length < 2) {
        setResults(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await api.searchAll(token!, q.trim(), tab);
        setResults(data as SearchResults);
      } catch {
        setResults({ products: [], catalogs: [], leads: [], total: 0 });
      } finally {
        setLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length >= 2) {
      debounceRef.current = setTimeout(() => doSearch(query, activeTab), 150);
    } else {
      setResults(null);
    }
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, activeTab, doSearch]);

  // Flatten results for keyboard navigation
  const flatResults: SearchResult[] = results
    ? [...results.products, ...results.catalogs, ...results.leads]
    : [];

  function navigateToResult(result: SearchResult) {
    addToSearchHistory(query.trim());
    setHistory(getSearchHistory());
    onClose();
    if (result._type === 'product') navigate(`/product-experience?id=${result.id}`);
    else if (result._type === 'catalog') navigate('/catalog-builder');
    else if (result._type === 'lead') navigate('/leads');
  }

  function handleHistoryClick(h: string) {
    setQuery(h);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { onClose(); return; }
    if (!flatResults.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, flatResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && selectedIdx >= 0) {
      navigateToResult(flatResults[selectedIdx]);
    }
  }

  if (!open) return null;

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'products', label: 'Products' },
    { key: 'catalogs', label: 'Catalogs' },
    { key: 'leads', label: 'Leads' },
  ] as const;

  const showHome = !query.trim() || query.trim().length < 2;
  const hasResults = results && results.total > 0;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[8vh] px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* Search bar */}
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
          <Search size={20} className="shrink-0 text-slate-400" />
          <input
            ref={inputRef}
            className="flex-1 bg-transparent text-base font-medium text-slate-900 outline-none placeholder:text-slate-400"
            placeholder="Search products, catalogs, leads..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIdx(-1); }}
            onKeyDown={handleKeyDown}
            autoComplete="off"
          />
          {loading && <Loader2 size={18} className="shrink-0 animate-spin text-slate-400" />}
          {query && !loading && (
            <button onClick={() => setQuery('')} className="rounded-lg p-1 text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
          )}
          <kbd className="hidden rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-500 sm:inline-flex items-center gap-1">
            <Command size={11} />K
          </kbd>
        </div>

        {/* Filter tabs */}
        {!showHome && (
          <div className="flex gap-1 border-b border-slate-100 px-4 py-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cx(
                  'rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                  activeTab === tab.key
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700',
                )}
              >
                {tab.label}
                {tab.key !== 'all' && results && (
                  <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
                    {tab.key === 'products' ? results.products.length :
                     tab.key === 'catalogs' ? results.catalogs.length :
                     results.leads.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto p-3">
          {/* Home state — history + popular */}
          {showHome && (
            <div className="space-y-5">
              {history.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center justify-between px-1">
                    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                      <Clock size={12} /> Recent Searches
                    </p>
                    <button
                      onClick={() => { clearSearchHistory(); setHistory([]); }}
                      className="text-xs text-slate-400 hover:text-slate-600"
                    >
                      Clear
                    </button>
                  </div>
                  {history.slice(0, 5).map((h) => (
                    <button
                      key={h}
                      onClick={() => handleHistoryClick(h)}
                      className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm text-slate-600 hover:bg-slate-50"
                    >
                      <Clock size={14} className="shrink-0 text-slate-300" />
                      {h}
                    </button>
                  ))}
                </div>
              )}
              <div>
                <p className="mb-2 flex items-center gap-2 px-1 text-xs font-bold uppercase tracking-wide text-slate-400">
                  <TrendingUp size={12} /> Popular Searches
                </p>
                {POPULAR_SEARCHES.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleHistoryClick(s)}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm text-slate-600 hover:bg-slate-50"
                  >
                    <TrendingUp size={14} className="shrink-0 text-slate-300" />
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search results */}
          {!showHome && !loading && !hasResults && (
            <div className="py-10 text-center">
              <Search size={36} className="mx-auto text-slate-200" />
              <p className="mt-3 text-sm font-semibold text-slate-500">No results for "{query}"</p>
              <p className="mt-1 text-xs text-slate-400">Try a different keyword or spelling</p>
            </div>
          )}

          {!showHome && hasResults && results && (
            <div className="space-y-4">
              {(activeTab === 'all' || activeTab === 'products') && results.products.length > 0 && (
                <div>
                  <p className="mb-1 flex items-center gap-2 px-1 text-xs font-bold uppercase tracking-wide text-slate-400">
                    <Box size={12} /> Products ({results.products.length})
                  </p>
                  {results.products.map((r, i) => {
                    const idx = results.products.indexOf(r);
                    const globalIdx = idx;
                    return (
                      <ResultItem
                        key={r.id}
                        result={r}
                        isSelected={selectedIdx === globalIdx}
                        onClick={() => navigateToResult(r)}
                      />
                    );
                  })}
                </div>
              )}
              {(activeTab === 'all' || activeTab === 'catalogs') && results.catalogs.length > 0 && (
                <div>
                  <p className="mb-1 flex items-center gap-2 px-1 text-xs font-bold uppercase tracking-wide text-slate-400">
                    <BookOpen size={12} /> Catalogs ({results.catalogs.length})
                  </p>
                  {results.catalogs.map((r) => {
                    const globalIdx = results.products.length + results.catalogs.indexOf(r);
                    return (
                      <ResultItem
                        key={r.id}
                        result={r}
                        isSelected={selectedIdx === globalIdx}
                        onClick={() => navigateToResult(r)}
                      />
                    );
                  })}
                </div>
              )}
              {(activeTab === 'all' || activeTab === 'leads') && results.leads.length > 0 && (
                <div>
                  <p className="mb-1 flex items-center gap-2 px-1 text-xs font-bold uppercase tracking-wide text-slate-400">
                    <Users size={12} /> Leads ({results.leads.length})
                  </p>
                  {results.leads.map((r) => {
                    const globalIdx = results.products.length + results.catalogs.length + results.leads.indexOf(r);
                    return (
                      <ResultItem
                        key={r.id}
                        result={r}
                        isSelected={selectedIdx === globalIdx}
                        onClick={() => navigateToResult(r)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-2.5">
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span className="flex items-center gap-1"><kbd className="rounded border border-slate-200 bg-white px-1 py-0.5 text-[10px]">↑↓</kbd> Navigate</span>
            <span className="flex items-center gap-1"><kbd className="rounded border border-slate-200 bg-white px-1 py-0.5 text-[10px]">↵</kbd> Open</span>
            <span className="flex items-center gap-1"><kbd className="rounded border border-slate-200 bg-white px-1 py-0.5 text-[10px]">Esc</kbd> Close</span>
          </div>
          <p className="text-[11px] text-slate-400">I3DION Search</p>
        </div>
      </div>
    </div>
  );
}

// ─── Search Trigger Button (used in AppShell) ─────────────────────────────────

export function SearchTrigger({ onClick }: { onClick: () => void }) {
  // Register global keyboard shortcut
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onClick();
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClick]);

  return (
    <button
      onClick={onClick}
      className="relative hidden w-full max-w-md items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-left text-sm text-slate-400 transition hover:bg-slate-100 hover:border-slate-300 sm:flex"
    >
      <Search size={16} />
      <span className="flex-1">Search products, catalogs, leads...</span>
      <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
        <Command size={10} />K
      </div>
    </button>
  );
}
