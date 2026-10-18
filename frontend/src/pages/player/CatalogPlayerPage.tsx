import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  ShoppingBag,
  Search,
  Eye,
  Box,
  Share2,
  Lock,
  WifiOff,
  CheckCircle,
  AlertCircle,
  X,
  Plus,
  Minus,
  MessageSquare,
  Globe,
  Layers
} from 'lucide-react';

interface CatalogProduct {
  id: string;
  name: string;
  list_price?: number;
  public_specs?: Record<string, string | number>;
  photo?: string;
  image?: string;
  badge?: string;
  description?: string;
  model3d?: string;
}

interface CatalogPageData {
  id: string;
  title: string;
  items?: CatalogProduct[];
  products?: CatalogProduct[];
}

interface CatalogPayload {
  schema: string;
  meta: {
    name: string;
    slug?: string;
    languages?: string[];
  };
  theme?: {
    preset?: string;
    primary?: string;
  };
  pages: CatalogPageData[];
}

interface BasketItem {
  id: string;
  name: string;
  list_price?: number;
  quantity: number;
}

interface OfflineRfqSubmission {
  idempotencyKey: string;
  shortCode: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  message: string;
  items: Array<{ id: string; quantity: number }>;
  queuedAt: string;
}

export function CatalogPlayerPage() {
  const { shortCode } = useParams<{ shortCode: string }>();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [catalog, setCatalog] = useState<CatalogPayload | null>(null);
  const [campaign, setCampaign] = useState<string>('Direct');
  const [catalogLabel, setCatalogLabel] = useState<string>('Product Catalog');
  const [activePageId, setActivePageId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLang, setSelectedLang] = useState('en');

  // Interactive 3D & AR Viewer State
  const [activeViewerProduct, setActiveViewerProduct] = useState<CatalogProduct | null>(null);
  const [isARSupported, setIsARSupported] = useState(false);

  // Quote Basket & RFQ State
  const [basket, setBasket] = useState<Record<string, BasketItem>>({});
  const [isBasketOpen, setIsBasketOpen] = useState(false);
  const [rfqName, setRfqName] = useState('');
  const [rfqEmail, setRfqEmail] = useState('');
  const [rfqPhone, setRfqPhone] = useState('');
  const [rfqCompany, setRfqCompany] = useState('');
  const [rfqMessage, setRfqMessage] = useState('');
  const [rfqConsent, setRfqConsent] = useState(true);
  const [rfqHoneypot, setRfqHoneypot] = useState(''); // Anti-bot honeypot
  const [rfqSubmitting, setRfqSubmitting] = useState(false);
  const [rfqSuccessMsg, setRfqSuccessMsg] = useState<string | null>(null);

  // Offline PWA State
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [queuedRfqsCount, setQueuedRfqsCount] = useState(0);

  // 1. Service Worker Registration & Online/Offline Listeners
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/catalog-player-sw.js').catch(() => {
        // SW registration is non-blocking
      });
    }

    const updateOnlineStatus = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      if (online) {
        syncQueuedRfqs();
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Capability detection for WebXR / AR
    if ('xr' in navigator && (navigator as unknown as { xr: { isSessionSupported?: (mode: string) => Promise<boolean> } }).xr?.isSessionSupported) {
      (navigator as unknown as { xr: { isSessionSupported: (mode: string) => Promise<boolean> } }).xr
        .isSessionSupported('immersive-ar')
        .then((supported: boolean) => setIsARSupported(supported))
        .catch(() => setIsARSupported(false));
    }

    // Check queued offline RFQs count
    const existingQueue = getOfflineQueue();
    setQueuedRfqsCount(existingQueue.length);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // 2. Fetch Catalog Payload from Server
  const fetchCatalog = useCallback(
    async (pw?: string) => {
      if (!shortCode) return;
      setLoading(true);
      setError(null);
      setPasswordError(null);

      try {
        const url = new URL(`/api/player/public/q/${encodeURIComponent(shortCode)}`, window.location.origin);
        if (pw) url.searchParams.set('password', pw);
        const visitorId = searchParams.get('vid') || `v-${Math.random().toString(36).slice(2, 9)}`;
        url.searchParams.set('visitorId', visitorId);

        const res = await fetch(url.toString());
        if (res.status === 404) {
          throw new Error('This catalog link does not exist or has been removed.');
        }
        if (res.status === 410) {
          throw new Error('This catalog link has expired.');
        }

        const data = await res.json();
        if (data.requiresPassword) {
          setRequiresPassword(true);
          setCatalogLabel(data.label || 'Protected Catalog');
          setCampaign(data.campaign || 'Direct');
          setLoading(false);
          return;
        }

        if (data.catalog) {
          setCatalog(data.catalog);
          setRequiresPassword(false);
          setCampaign(data.campaign || 'Direct');
          setCatalogLabel(data.label || data.catalog.meta?.name || 'Product Catalog');

          if (data.catalog.pages && data.catalog.pages.length > 0) {
            setActivePageId(data.catalog.pages[0].id);
          }
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Unable to load catalog. Please check your connection.';
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [shortCode, searchParams]
  );

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  // 3. Handle Password Verification
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim() || !shortCode) return;

    try {
      const res = await fetch(`/api/player/public/q/${encodeURIComponent(shortCode)}/verify-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput.trim() })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Incorrect password.');
      }

      const data = await res.json();
      setCatalog(data.catalog);
      setRequiresPassword(false);
      if (data.catalog.pages && data.catalog.pages.length > 0) {
        setActivePageId(data.catalog.pages[0].id);
      }
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : 'Invalid password');
    }
  };

  // 4. Products Filtering
  const allProducts = useMemo(() => {
    if (!catalog?.pages) return [];
    const activePage = catalog.pages.find((p) => p.id === activePageId) || catalog.pages[0];
    const rawList = activePage?.items || activePage?.products || [];

    if (!searchQuery.trim()) return rawList;
    const q = searchQuery.toLowerCase();
    return rawList.filter(
      (item) =>
        item.name?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.badge?.toLowerCase().includes(q)
    );
  }, [catalog, activePageId, searchQuery]);

  // 5. Quote Basket Handlers
  const addToBasket = (product: CatalogProduct) => {
    setBasket((prev) => {
      const existing = prev[product.id];
      const qty = existing ? existing.quantity + 1 : 1;
      return {
        ...prev,
        [product.id]: {
          id: product.id,
          name: product.name,
          list_price: product.list_price,
          quantity: qty
        }
      };
    });
  };

  const updateBasketQuantity = (id: string, delta: number) => {
    setBasket((prev) => {
      const existing = prev[id];
      if (!existing) return prev;
      const newQty = existing.quantity + delta;
      if (newQty <= 0) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return {
        ...prev,
        [id]: { ...existing, quantity: newQty }
      };
    });
  };

  const basketCount = useMemo(() => {
    return Object.values(basket).reduce((acc, item) => acc + item.quantity, 0);
  }, [basket]);

  // 6. Offline Queue Helpers
  const getOfflineQueue = (): OfflineRfqSubmission[] => {
    try {
      const raw = localStorage.getItem('i3dion_offline_rfqs');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const saveOfflineQueue = (items: OfflineRfqSubmission[]) => {
    try {
      localStorage.setItem('i3dion_offline_rfqs', JSON.stringify(items));
      setQueuedRfqsCount(items.length);
    } catch {
      // LocalStorage error tolerance
    }
  };

  const syncQueuedRfqs = async () => {
    const queue = getOfflineQueue();
    if (queue.length === 0) return;

    const remaining: OfflineRfqSubmission[] = [];

    for (const item of queue) {
      try {
        await fetch('/api/player/public/rfq', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        });
      } catch {
        remaining.push(item);
      }
    }

    saveOfflineQueue(remaining);
  };

  // 7. RFQ Submission
  const handleRfqSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rfqHoneypot) return; // Silent discard of spam bot
    if (!rfqName.trim() || !rfqEmail.trim()) return;

    setRfqSubmitting(true);
    setRfqSuccessMsg(null);

    const idempotencyKey = `rfq-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const items = Object.values(basket).map((b) => ({ id: b.id, quantity: b.quantity }));

    const rfqPayload = {
      shortCode,
      name: rfqName.trim(),
      email: rfqEmail.trim(),
      phone: rfqPhone.trim(),
      company: rfqCompany.trim(),
      message: rfqMessage.trim(),
      items,
      idempotencyKey,
      botCheck: rfqHoneypot,
      consent: {
        consentGiven: rfqConsent,
        consentText: 'I agree to be contacted regarding this quotation.'
      }
    };

    if (!isOnline) {
      // Offline mode: Enqueue in LocalStorage
      const queue = getOfflineQueue();
      queue.push({
        ...rfqPayload,
        queuedAt: new Date().toISOString()
      });
      saveOfflineQueue(queue);

      setRfqSubmitting(false);
      setRfqSuccessMsg('Offline Mode: Your RFQ is queued securely and will sync automatically once connected.');
      setBasket({});
      return;
    }

    try {
      const res = await fetch('/api/player/public/rfq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rfqPayload)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Submission failed');
      }

      setRfqSuccessMsg('Thank you! Your quotation request has been received. Our engineering team will review.');
      setBasket({});
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to submit RFQ');
    } finally {
      setRfqSubmitting(false);
    }
  };

  // 8. WhatsApp Direct Contact
  const getWhatsAppLink = () => {
    const text = encodeURIComponent(
      `Hello, I am inquiring about items in catalog "${catalogLabel}" (Campaign: ${campaign}). Link: ${window.location.href}`
    );
    return `https://wa.me/?text=${text}`;
  };

  // --------------------------------------------------------------------------
  // Loading & Error States
  // --------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 text-sm font-medium tracking-wide">Loading 3D Catalog Experience...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-16 h-16 text-rose-500 mb-4" />
        <h1 className="text-xl font-bold text-slate-100 mb-2">Catalog Unavailable</h1>
        <p className="text-slate-400 text-sm max-w-md mb-6">{error}</p>
        <button
          onClick={() => fetchCatalog()}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Password Protected Gate
  // --------------------------------------------------------------------------
  if (requiresPassword) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl text-center">
          <div className="w-14 h-14 bg-blue-950/60 border border-blue-800/40 rounded-full flex items-center justify-center mx-auto mb-5 text-blue-400">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-semibold text-slate-100 mb-1">{catalogLabel}</h2>
          <p className="text-xs text-slate-400 mb-6">Campaign: {campaign} • Password Protected</p>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                placeholder="Enter catalog password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            {passwordError && <p className="text-rose-400 text-xs text-left">{passwordError}</p>}
            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition"
            >
              Unlock Catalog
            </button>
          </form>
        </div>
      </div>
    );
  }

  const primaryColor = catalog?.theme?.primary || '#2563EB';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Offline Banner Indicator */}
      {!isOnline && (
        <div className="bg-amber-600 text-slate-950 px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4" />
          <span>Offline Mode Active — RFQs will be queued locally and auto-synced upon reconnection.</span>
          {queuedRfqsCount > 0 && <span className="bg-slate-950 text-amber-400 px-2 py-0.5 rounded-full text-[10px]">{queuedRfqsCount} queued</span>}
        </div>
      )}

      {/* Main Header */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center font-bold text-white shadow-md">
            <Box className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight tracking-tight line-clamp-1">
              {catalog?.meta?.name || catalogLabel}
            </h1>
            <p className="text-[11px] text-slate-400 line-clamp-1">Campaign: {campaign}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* WhatsApp Action */}
          <a
            href={getWhatsAppLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 hover:bg-emerald-900/50 transition flex items-center gap-1.5 text-xs font-medium"
            title="Chat via WhatsApp"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Ask Engineer</span>
          </a>

          {/* Quote Basket Trigger */}
          <button
            onClick={() => setIsBasketOpen(true)}
            className="relative p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
            aria-label="Quote Basket"
          >
            <ShoppingBag className="w-5 h-5" />
            {basketCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                {basketCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Search & Navigation Bar */}
      <div className="bg-slate-900 border-b border-slate-800/80 px-4 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Page Switcher */}
        {catalog?.pages && catalog.pages.length > 1 && (
          <div className="flex items-center gap-1 overflow-x-auto py-1">
            {catalog.pages.map((p) => (
              <button
                key={p.id}
                onClick={() => setActivePageId(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                  activePageId === p.id
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {p.title}
              </button>
            ))}
          </div>
        )}

        {/* Search Field */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search specs, models, series..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Main Content: Product Showcase Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8">
        {allProducts.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <Layers className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No products found matching your search filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {allProducts.map((product) => {
              const inBasket = basket[product.id];
              return (
                <div
                  key={product.id}
                  className="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden hover:border-slate-700 transition flex flex-col group shadow-lg"
                >
                  {/* Product Visual Area */}
                  <div className="relative h-56 bg-slate-950 flex items-center justify-center p-4 border-b border-slate-800/60 overflow-hidden">
                    {product.photo || product.image ? (
                      <img
                        src={product.photo || product.image}
                        alt={product.name}
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-600">
                        <Box className="w-12 h-12 mb-2 text-slate-700" />
                        <span className="text-[11px] font-mono">3D Spatial Asset</span>
                      </div>
                    )}

                    {product.badge && (
                      <span className="absolute top-3 left-3 bg-blue-900/80 text-blue-200 border border-blue-700/50 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider backdrop-blur-sm">
                        {product.badge}
                      </span>
                    )}

                    {/* Quick 3D View Button */}
                    <button
                      onClick={() => setActiveViewerProduct(product)}
                      className="absolute bottom-3 right-3 bg-slate-900/90 hover:bg-slate-800 text-blue-400 border border-slate-700/60 text-xs font-medium px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 backdrop-blur-sm shadow-md transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>3D & AR</span>
                    </button>
                  </div>

                  {/* Product Info */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-100 group-hover:text-blue-400 transition leading-snug">
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {product.description}
                        </p>
                      )}

                      {/* Public Specifications (Server-filtered) */}
                      {product.public_specs && (
                        <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px]">
                          {Object.entries(product.public_specs).map(([k, v]) => (
                            <div key={k} className="text-slate-400">
                              <span className="text-slate-500 font-mono capitalize">{k.replace(/_/g, ' ')}:</span>{' '}
                              <span className="font-semibold text-slate-200">{String(v)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
                      <div>
                        {product.list_price ? (
                          <>
                            <span className="text-[10px] text-slate-500 block uppercase font-mono">List Price</span>
                            <span className="text-sm font-bold text-emerald-400">
                              ${Number(product.list_price).toLocaleString()}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">Quote on Request</span>
                        )}
                      </div>

                      {inBasket ? (
                        <div className="flex items-center gap-2 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
                          <button
                            onClick={() => updateBasketQuantity(product.id, -1)}
                            className="p-1 text-slate-400 hover:text-white"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-bold text-white px-1.5">{inBasket.quantity}</span>
                          <button
                            onClick={() => updateBasketQuantity(product.id, 1)}
                            className="p-1 text-slate-400 hover:text-white"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToBasket(product)}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white transition flex items-center gap-1.5 shadow"
                          style={{ backgroundColor: primaryColor }}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add to Quote</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 3D & AR Viewer Modal */}
      {activeViewerProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">{activeViewerProduct.name}</h3>
                <p className="text-xs text-slate-400">Spatial Interactive Inspection</p>
              </div>
              <button
                onClick={() => setActiveViewerProduct(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 3D Viewport Simulated Frame */}
            <div className="relative h-80 bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
              <Box className="w-20 h-20 text-blue-500 animate-pulse mb-3" />
              <p className="text-sm font-semibold text-slate-200">Interactive 3D Spatial Canvas</p>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Rotate 360°, inspect assembly tolerances, and verify mounting specs in real-time.
              </p>

              {/* AR Capability Badge / Fallback */}
              <div className="mt-6 flex flex-col items-center">
                {isARSupported ? (
                  <button className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold tracking-wide flex items-center gap-2 shadow-lg transition">
                    <Box className="w-4 h-4" />
                    <span>LAUNCH AR (1:1 SCALE FIT-CHECK)</span>
                  </button>
                ) : (
                  <div className="px-4 py-2 bg-slate-800/80 border border-slate-700/60 rounded-xl text-[11px] text-slate-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    <span>AR 1:1 view is available on compatible iOS Safari / Android Chrome devices.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Spec table */}
            {activeViewerProduct.public_specs && (
              <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">
                  Engineering Specifications
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(activeViewerProduct.public_specs).map(([k, v]) => (
                    <div key={k} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                      <div className="text-slate-500 capitalize text-[10px] font-mono">{k.replace(/_/g, ' ')}</div>
                      <div className="font-bold text-slate-200 mt-0.5">{String(v)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quote Basket & RFQ Drawer Modal */}
      {isBasketOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end">
          <div className="bg-slate-900 border-l border-slate-800 w-full max-w-md h-full flex flex-col shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Quotation Basket ({basketCount})</h3>
              </div>
              <button
                onClick={() => setIsBasketOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {rfqSuccessMsg ? (
                <div className="p-6 text-center space-y-3 bg-emerald-950/40 border border-emerald-800/60 rounded-2xl">
                  <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
                  <h4 className="text-base font-bold text-emerald-200">Quotation Submitted</h4>
                  <p className="text-xs text-emerald-300 leading-relaxed">{rfqSuccessMsg}</p>
                  <button
                    onClick={() => {
                      setRfqSuccessMsg(null);
                      setIsBasketOpen(false);
                    }}
                    className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold"
                  >
                    Close Basket
                  </button>
                </div>
              ) : Object.keys(basket).length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-40" />
                  <p className="text-xs">Your quote basket is empty.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {Object.values(basket).map((item) => (
                      <div
                        key={item.id}
                        className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-200 line-clamp-1">{item.name}</p>
                          {item.list_price && (
                            <p className="text-[11px] text-slate-400 font-mono">
                              ${Number(item.list_price).toLocaleString()}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                          <button
                            onClick={() => updateBasketQuantity(item.id, -1)}
                            className="text-slate-400 hover:text-white p-0.5"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold text-white px-1">{item.quantity}</span>
                          <button
                            onClick={() => updateBasketQuantity(item.id, 1)}
                            className="text-slate-400 hover:text-white p-0.5"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* RFQ Buyer Details Form */}
                  <form onSubmit={handleRfqSubmit} className="mt-6 pt-4 border-t border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                      Request for Quote (RFQ)
                    </h4>

                    {/* Anti-bot Honeypot field (hidden from legitimate users) */}
                    <div style={{ display: 'none' }} aria-hidden="true">
                      <input
                        type="text"
                        name="bot_field_honey"
                        value={rfqHoneypot}
                        onChange={(e) => setRfqHoneypot(e.target.value)}
                        tabIndex={-1}
                        autoComplete="off"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Your Full Name *</label>
                      <input
                        type="text"
                        required
                        value={rfqName}
                        onChange={(e) => setRfqName(e.target.value)}
                        placeholder="e.g. Ramesh V"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Work Email *</label>
                      <input
                        type="email"
                        required
                        value={rfqEmail}
                        onChange={(e) => setRfqEmail(e.target.value)}
                        placeholder="e.g. ramesh@company.com"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Phone</label>
                        <input
                          type="tel"
                          value={rfqPhone}
                          onChange={(e) => setRfqPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Company</label>
                        <input
                          type="text"
                          value={rfqCompany}
                          onChange={(e) => setRfqCompany(e.target.value)}
                          placeholder="Organization"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Application Notes / Custom Specs</label>
                      <textarea
                        rows={3}
                        value={rfqMessage}
                        onChange={(e) => setRfqMessage(e.target.value)}
                        placeholder="Required delivery timeline, technical certifications, quantities..."
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 resize-none"
                      />
                    </div>

                    <label className="flex items-start gap-2 pt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rfqConsent}
                        onChange={(e) => setRfqConsent(e.target.checked)}
                        className="mt-0.5 rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0"
                        required
                      />
                      <span className="text-[10px] text-slate-400 leading-tight">
                        I agree to receive quotation responses and technical datasheets for the requested products.
                      </span>
                    </label>

                    <button
                      type="submit"
                      disabled={rfqSubmitting}
                      className="w-full py-2.5 mt-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold tracking-wide transition shadow-lg"
                    >
                      {rfqSubmitting ? 'Submitting Quote Request...' : isOnline ? 'Submit Formal RFQ' : 'Queue RFQ Offline'}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 px-4 py-4 text-center text-[11px] text-slate-500">
        Powered by I3DION Spatial Omni Studio • Non-Enumerable QR Attributed Catalog • Privacy & Fail-Closed Audience Protected
      </footer>
    </div>
  );
}

export default CatalogPlayerPage;
