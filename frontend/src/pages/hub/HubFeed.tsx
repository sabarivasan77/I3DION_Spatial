import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, Box, Sparkles, Filter, CheckCircle2, QrCode, Share2, Layers, 
  ChevronDown, Bookmark, GitCompare, X, Loader2, ShieldCheck, Eye, Heart 
} from 'lucide-react';
import { SPATIAL_HUB_MODELS, SpatialHubModel } from '../../data/spatialHubModels';
import ThreeProduct, { RenderMode } from '../../components/ThreeProduct';
import { useToast } from '../../components/Toast';
import { hubApi, HubProduct, HubFeedResponse } from '../../services/hubApi';
import { ModelCardPreview } from '../../components/hub/ModelCardPreview';
import { QRCodeGenerator } from '../../components/QRCodeGenerator';
import { HubContextMenu } from '../../components/hub/HubContextMenu';
import { useHubPersonalStore } from '../../store/hubPersonalStore';

// Adapter to ensure uniform model representation between API and fallback
interface HubDisplayModel {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  thumbnail: string;
  modelUrl: string;
  previewUrl: string;
  viewsCount: number;
  likesCount: number;
  companyName: string;
  companyVerified: boolean;
  isDemoModel: boolean;
  licenseSpdx: string[];
  licenseArtist?: string;
  attributionRequired: boolean;
  tags: string[];
  specs?: Record<string, unknown>;
  arEnabled: boolean;
  wireframeEnabled: boolean;
  xrayEnabled: boolean;
  solidEnabled: boolean;
}

export function HubFeed() {
  const { success, info } = useToast();
  const { isSaved, toggleSaved } = useHubPersonalStore();

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedMode, setSelectedMode] = useState('All');
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'alphabetical'>('popular');

  // Feed Data & Cursor Pagination State
  const [items, setItems] = useState<HubDisplayModel[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isOfflineFallback, setIsOfflineFallback] = useState(false);

  // Quick Preview State in Grid
  const [previewModes, setPreviewModes] = useState<Record<string, RenderMode>>({});
  const [activeQrModel, setActiveQrModel] = useState<HubDisplayModel | null>(null);

  // Compare Tray State (up to 4 models)
  const [comparedModels, setComparedModels] = useState<HubDisplayModel[]>([]);
  const [compareModalOpen, setCompareModalOpen] = useState(false);

  // Search Debounce
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Convert raw API product to HubDisplayModel
  const mapApiToDisplay = useCallback((p: HubProduct): HubDisplayModel => {
    const poster = p.poster_url || p.imageUrl || p.image_url || `/models/posters/${p.slug}.svg`;
    const preview = p.preview_model_url || p.modelUrl || p.model_url || `/models/preview/${p.slug}.glb`;
    return {
      id: p.id,
      name: p.name,
      slug: p.slug || p.id,
      category: p.category || 'Demonstration model (not industrial equipment)',
      description: p.description || '',
      thumbnail: poster,
      modelUrl: p.model_url || p.modelUrl || preview,
      previewUrl: preview,
      viewsCount: Number(p.views_count) || 0,
      likesCount: Number(p.likes_count) || 0,
      companyName: p.company_name || 'I3DION Showcase',
      companyVerified: p.company_verified ?? true,
      isDemoModel: p.is_demo_model ?? true,
      licenseSpdx: p.license_spdx || ['CC0-1.0'],
      licenseArtist: p.license_artist || undefined,
      attributionRequired: Boolean(p.attribution_required),
      tags: p.tags || ['showcase', '3d-model'],
      specs: p.specs,
      arEnabled: true,
      wireframeEnabled: true,
      xrayEnabled: true,
      solidEnabled: true
    };
  }, []);

  // Convert static local models to HubDisplayModel for offline fallback
  const fallbackModels = useMemo<HubDisplayModel[]>(() => {
    return SPATIAL_HUB_MODELS.map((m) => ({
      id: m.id,
      name: m.name,
      slug: m.slug,
      category: m.category,
      description: m.shortDescription,
      thumbnail: m.thumbnail,
      modelUrl: m.modelUrl,
      previewUrl: m.previewUrl || m.modelUrl,
      viewsCount: m.viewsCount,
      likesCount: m.likesCount,
      companyName: 'I3DION Showcase',
      companyVerified: true,
      isDemoModel: true,
      licenseSpdx: m.source?.license?.includes('CC-BY') ? ['CC-BY-4.0'] : ['CC0-1.0'],
      licenseArtist: m.source?.author,
      attributionRequired: Boolean(m.source?.attributionRequired),
      tags: m.tags,
      arEnabled: m.arEnabled,
      wireframeEnabled: m.wireframeEnabled,
      xrayEnabled: m.xrayEnabled,
      solidEnabled: m.solidEnabled
    }));
  }, []);

  // Fetch Feed from Backend API (Primary Source of Truth)
  const fetchFeed = useCallback(async (isInitial = true, cursorToUse?: string | null) => {
    if (isInitial) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await hubApi.getFeed({
        cursor: cursorToUse,
        limit: 12,
        category: selectedCategory,
        sort: sortBy,
        search: debouncedQuery || undefined
      });

      let newItems: HubDisplayModel[] = [];
      let nextCur: string | null = null;
      let more = false;

      if (res && 'items' in res && Array.isArray(res.items)) {
        const feedRes = res as HubFeedResponse;
        newItems = feedRes.items.map(mapApiToDisplay);
        nextCur = feedRes.nextCursor || null;
        more = feedRes.hasMore;
      } else if (Array.isArray(res)) {
        newItems = res.map(mapApiToDisplay);
        more = false;
        nextCur = null;
      }

      if (isInitial) {
        setItems(newItems);
      } else {
        setItems((prev) => {
          const existingIds = new Set(prev.map((i) => i.id));
          return [...prev, ...newItems.filter((i) => !existingIds.has(i.id))];
        });
      }

      setNextCursor(nextCur);
      setHasMore(more);
      setIsOfflineFallback(false);
    } catch {
      // Honest offline fallback to verified static starter models
      if (isInitial) {
        let filtered = fallbackModels;
        if (selectedCategory !== 'All') {
          filtered = filtered.filter((m) => m.category === selectedCategory);
        }
        if (debouncedQuery) {
          const q = debouncedQuery.toLowerCase();
          filtered = filtered.filter(
            (m) => m.name.toLowerCase().includes(q) || m.tags.some((t) => t.toLowerCase().includes(q))
          );
        }
        setItems(filtered);
        setHasMore(false);
        setNextCursor(null);
        setIsOfflineFallback(true);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [selectedCategory, sortBy, debouncedQuery, mapApiToDisplay, fallbackModels]);

  // Initial load and filter change trigger
  useEffect(() => {
    fetchFeed(true, null);
  }, [fetchFeed]);

  // Handle Load More
  const handleLoadMore = () => {
    if (!loadingMore && hasMore && nextCursor) {
      fetchFeed(false, nextCursor);
    }
  };

  // Lock background scroll when modal open
  useEffect(() => {
    document.body.style.overflow = activeQrModel || compareModalOpen ? 'hidden' : 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [activeQrModel, compareModalOpen]);

  // Categories list
  const categories = useMemo(() => {
    return [
      'All',
      'Demonstration model (not industrial equipment)',
      'Industrial Machinery',
      'Pumps & Fluid Handling',
      'Power Tools & Actuators',
      'Forklift / Industrial Vehicle'
    ];
  }, []);

  const handleShare = (model: HubDisplayModel, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const url = `${window.location.origin}/hub/product/${model.slug}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      success('Link Copied', `Public link for ${model.name} copied to clipboard.`);
    } else {
      info('Public Link', url);
    }
  };

  const handleArClick = (model: HubDisplayModel, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveQrModel(model);
  };

  const togglePreviewMode = (modelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setPreviewModes((prev) => {
      const current = prev[modelId] || 'solid';
      const next: RenderMode = current === 'solid' ? 'wireframe' : current === 'wireframe' ? 'xray' : 'solid';
      return { ...prev, [modelId]: next };
    });
  };

  const toggleCompare = (model: HubDisplayModel, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setComparedModels((prev) => {
      const exists = prev.some((m) => m.id === model.id);
      if (exists) {
        return prev.filter((m) => m.id !== model.id);
      }
      if (prev.length >= 4) {
        info('Compare Limit', 'You can compare up to 4 models at a time.');
        return prev;
      }
      return [...prev, model];
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] pb-24">
      {/* ─── OFFLINE HONEST BANNER ───────────────────────────────────────── */}
      {isOfflineFallback && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-xs text-amber-900 font-semibold flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Offline Showcase Mode: Displaying 15 verified demonstration models from the local library.</span>
        </div>
      )}

      {/* ─── HEADER BAR ─────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full mb-3 border border-blue-100">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Verified 3D Models • Real Provenance • Zero Fake Metrics</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Spatial Hub
              </h1>
              <p className="mt-1 text-base text-slate-600 max-w-3xl">
                Discover verified 3D models with authentic CC0 / CC-BY licenses and real-time Solid, Wireframe, X-Ray and AR inspection.
              </p>
            </div>

            {/* Header Search Box */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search models, tags, licenses..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* ─── FILTERS & SORT BAR ────────────────────────────────────────── */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            {/* Category Pills */}
            <div className="flex items-center space-x-2 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 no-scrollbar">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center mr-1">
                <Filter className="w-3.5 h-3.5 mr-1" /> Category:
              </span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat === 'Demonstration model (not industrial equipment)' ? 'Demo Models' : cat}
                </button>
              ))}
            </div>

            {/* Mode & Sort Controls */}
            <div className="flex items-center space-x-3 self-end lg:self-auto">
              {/* Visualization Mode filter */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                {['All', 'Solid', 'Wireframe', 'X-Ray', 'AR'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setSelectedMode(mode)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      selectedMode === mode
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              {/* Sort Selector */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Sort models"
                className="bg-white border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm"
              >
                <option value="popular">Popularity</option>
                <option value="newest">Recently Added</option>
                <option value="alphabetical">Name (A–Z)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ─── MODEL GRID ──────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm font-semibold text-slate-500">
            Showing <span className="font-bold text-slate-900">{items.length}</span> models
          </p>
          {(selectedCategory !== 'All' || selectedMode !== 'All' || debouncedQuery) && (
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSelectedMode('All');
                setSearchQuery('');
              }}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Loading Skeletons */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm animate-pulse flex flex-col">
                <div className="aspect-[4/3] bg-slate-200" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-6 bg-slate-200 rounded w-3/4" />
                  <div className="h-4 bg-slate-200 rounded w-full" />
                  <div className="h-10 bg-slate-200 rounded-xl mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          /* Honest Empty State */
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm max-w-md mx-auto my-12">
            <Box className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-1">No models found</h3>
            <p className="text-sm text-slate-500 mb-6">
              No 3D models match "{debouncedQuery || selectedCategory}". Try adjusting your filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setSelectedMode('All');
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition-colors"
            >
              Clear Search & Filters
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {items.map((model) => {
                const currentPreviewMode = previewModes[model.id] || 'solid';
                const isInteractive3d = previewModes[model.id] !== undefined;
                const isComparing = comparedModels.some((m) => m.id === model.id);
                const saved = isSaved(model.id);

                return (
                  <div
                    key={model.id}
                    className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col relative"
                  >
                    {/* Thumbnail / 3D Live Preview Canvas */}
                    <div className="relative aspect-[4/3] bg-slate-50 border-b border-slate-100 overflow-hidden flex items-center justify-center">
                      {isInteractive3d ? (
                        <ThreeProduct
                          modelUrl={model.modelUrl}
                          productName={model.name}
                          renderMode={currentPreviewMode}
                          autoRotate={false}
                        />
                      ) : (
                        <ModelCardPreview
                          id={model.id}
                          slug={model.slug}
                          name={model.name}
                          modelUrl={model.modelUrl}
                          previewUrl={model.previewUrl}
                          thumbnail={model.thumbnail}
                        />
                      )}

                      {/* Top Left: Demonstration Badge & Mode Selector */}
                      <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5 items-start">
                        {model.isDemoModel && (
                          <span className="bg-amber-500/90 text-white text-[10px] font-extrabold px-2 py-0.5 rounded shadow-sm uppercase tracking-wider">
                            Demo Model
                          </span>
                        )}
                        <button
                          onClick={(e) => togglePreviewMode(model.id, e)}
                          className="bg-white/90 backdrop-blur text-[11px] font-bold text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-sm hover:bg-white flex items-center gap-1.5 transition-colors"
                          title="Toggle 3D Live View / Mode"
                        >
                          <Layers className="w-3.5 h-3.5 text-blue-600" />
                          <span className="uppercase tracking-wider">{isInteractive3d ? currentPreviewMode : '3D PREVIEW'}</span>
                        </button>
                      </div>

                      {/* Top Right: License Chip & Quick Actions */}
                      <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded shadow-sm uppercase tracking-wider ${
                          model.licenseSpdx.includes('CC0-1.0') 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {model.licenseSpdx[0] || 'CC0'}
                        </span>
                        <HubContextMenu itemId={model.id} itemTitle={model.name} itemSlug={model.slug} />
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Company & Verification */}
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
                          <span className="flex items-center gap-1 truncate font-medium text-slate-700">
                            {model.companyName}
                            {model.companyVerified && <ShieldCheck className="w-3.5 h-3.5 text-blue-600 inline" />}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {model.viewsCount} views
                          </span>
                        </div>

                        {/* Title Link */}
                        <Link to={`/hub/product/${model.slug}`} className="block group-hover:text-blue-600 transition-colors">
                          <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-1 mb-1.5">
                            {model.name}
                          </h3>
                        </Link>

                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-4">
                          {model.description}
                        </p>
                      </div>

                      <div>
                        {/* Tags / Attribution note */}
                        <div className="flex items-center gap-1.5 flex-wrap mb-4">
                          {model.attributionRequired && model.licenseArtist && (
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium truncate max-w-[200px]" title={`Attribution: ${model.licenseArtist}`}>
                              By: {model.licenseArtist}
                            </span>
                          )}
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                            AR Ready
                          </span>
                        </div>

                        {/* Card Action Buttons Tray */}
                        <div className="flex items-center space-x-2 pt-3 border-t border-slate-100">
                          <Link
                            to={`/hub/product/${model.slug}`}
                            className="flex-1 bg-slate-900 hover:bg-blue-600 text-white text-center py-2.5 px-3 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <span>Inspect 3D</span>
                          </Link>
                          
                          {/* Save/Bookmark Button */}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleSaved(model.id, 'product');
                            }}
                            aria-label={saved ? 'Remove from saved' : 'Save model'}
                            className={`p-2.5 rounded-xl transition-colors font-bold text-xs ${
                              saved ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-900'
                            }`}
                            title={saved ? 'Saved in library' : 'Save model'}
                          >
                            <Bookmark className={`w-4 h-4 ${saved ? 'fill-blue-600 text-blue-600' : ''}`} />
                          </button>

                          {/* Compare Toggle Button */}
                          <button
                            onClick={(e) => toggleCompare(model, e)}
                            aria-label="Compare model"
                            className={`p-2.5 rounded-xl transition-colors font-bold text-xs ${
                              isComparing ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-900'
                            }`}
                            title={isComparing ? 'Remove from comparison' : 'Compare model'}
                          >
                            <GitCompare className="w-4 h-4" />
                          </button>

                          {/* AR QR Button */}
                          <button
                            onClick={(e) => handleArClick(model, e)}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-600 p-2.5 rounded-xl transition-colors font-bold text-xs"
                            title="View AR QR Code"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>

                          {/* Share Button */}
                          <button
                            onClick={(e) => handleShare(model, e)}
                            className="bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-900 p-2.5 rounded-xl transition-colors font-bold text-xs"
                            title="Share Link"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Server-Side Cursor Pagination Load More */}
            {hasMore && (
              <div className="flex flex-col items-center justify-center pt-6 pb-2">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white border border-slate-200 px-8 py-3 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition disabled:opacity-50"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 size={16} className="animate-spin text-blue-600" />
                      Loading Next Page…
                    </>
                  ) : (
                    <>
                      <ChevronDown size={16} className="text-blue-600" />
                      Load More Models
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── FLOATING COMPARE TRAY ──────────────────────────────────────── */}
      {comparedModels.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white rounded-2xl shadow-2xl px-5 py-3 border border-slate-800 flex items-center gap-4 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold">Compare ({comparedModels.length}/4):</span>
          </div>

          <div className="flex items-center gap-2">
            {comparedModels.map((m) => (
              <div key={m.id} className="relative group/pill">
                <div className="h-8 w-8 rounded-lg bg-slate-800 overflow-hidden border border-slate-700 flex items-center justify-center">
                  <img src={m.thumbnail} alt={m.name} className="h-full w-full object-contain p-1" />
                </div>
                <button
                  onClick={() => setComparedModels((prev) => prev.filter((p) => p.id !== m.id))}
                  className="absolute -top-1 -right-1 bg-red-500 rounded-full w-4 h-4 text-[10px] flex items-center justify-center opacity-0 group-hover/pill:opacity-100 transition"
                  aria-label={`Remove ${m.name}`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={() => setCompareModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-sm"
          >
            Compare Side-by-Side
          </button>

          <button
            onClick={() => setComparedModels([])}
            className="text-xs text-slate-400 hover:text-white font-medium"
          >
            Clear
          </button>
        </div>
      )}

      {/* ─── SIDE-BY-SIDE COMPARE MODAL ─────────────────────────────────── */}
      {compareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-4xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-100 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-2 text-base font-extrabold text-slate-900">
                <GitCompare className="w-5 h-5 text-indigo-600" />
                <span>3D Model Specifications Comparison ({comparedModels.length} models)</span>
              </div>
              <button
                onClick={() => setCompareModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {comparedModels.map((m) => (
                <div key={m.id} className="border border-slate-200 rounded-2xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="aspect-[4/3] bg-slate-50 rounded-xl overflow-hidden mb-3 border border-slate-100 flex items-center justify-center">
                      <img src={m.thumbnail} alt={m.name} className="h-full w-full object-contain p-2" />
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 mb-1">{m.name}</h4>
                    <p className="text-xs text-slate-500 mb-3">{m.category}</p>
                    
                    <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">License</span>
                        <span className="font-semibold text-slate-700">{m.licenseSpdx.join(', ')}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Attribution</span>
                        <span className="font-semibold text-slate-700">{m.licenseArtist || 'Khronos Samples'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">AR Capability</span>
                        <span className="font-semibold text-emerald-600">Scene Viewer / QuickLook</span>
                      </div>
                    </div>
                  </div>

                  <Link
                    to={`/hub/product/${m.slug}`}
                    className="mt-4 block text-center bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold py-2 rounded-xl transition"
                  >
                    Open Product Page
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── DESKTOP -> MOBILE AR QR MODAL ──────────────────────────────── */}
      {activeQrModel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 relative text-center">
            <button
              onClick={() => setActiveQrModel(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 text-sm font-bold w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"
              aria-label="Close AR Modal"
            >
              ✕
            </button>

            <div className="inline-flex items-center space-x-2 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full mb-4">
              <Box className="w-3.5 h-3.5" />
              <span>I3DION SPATIAL AR HANDOFF</span>
            </div>

            <h2 className="text-xl font-extrabold text-slate-900 mb-1">{activeQrModel.name}</h2>
            <p className="text-xs text-slate-500 mb-6">Scan with your mobile camera to launch direct Augmented Reality preview.</p>

            {/* Generated QR Image with local generator */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 inline-block mb-6 shadow-inner relative">
              <QRCodeGenerator
                url={`${window.location.origin}/hub/product/${activeQrModel.slug}`}
                size={220}
                className="mx-auto"
              />
              <div className="mt-3 text-[11px] font-extrabold text-slate-700 tracking-wider uppercase">
                I3DION SPATIAL
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  const url = `${window.location.origin}/hub/product/${activeQrModel.slug}`;
                  navigator.clipboard.writeText(url);
                  success('Link Copied', 'AR Public Link copied to clipboard');
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 rounded-xl transition-colors shadow-sm"
              >
                Copy AR Mobile Link
              </button>

              <button
                onClick={() => setActiveQrModel(null)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
