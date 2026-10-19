import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Search, 
  Heart, 
  Filter, 
  ChevronDown, 
  Bookmark, 
  GitCompare, 
  ShoppingBag, 
  ShieldCheck, 
  Eye, 
  Sparkles, 
  X,
  Loader2
} from 'lucide-react';
import { SPATIAL_HUB_MODELS, SpatialHubModel } from '../../data/spatialHubModels';
import { hubApi, HubProduct } from '../../services/hubApi';
import { ModelCardPreview } from '../../components/hub/ModelCardPreview';
import { useHubPersonalStore } from '../../store/hubPersonalStore';
import { useHubCompareStore } from '../../store/hubCompareStore';
import { useHubQuoteStore } from '../../store/hubQuoteStore';
import { useToast } from '../../components/Toast';
import { updateSeoMeta } from '../../utils/seoMeta';

interface SearchDisplayModel {
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
}

export function HubSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || searchParams.get('query') || '';
  
  const [rawQuery, setRawQuery] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedLicense, setSelectedLicense] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'relevant' | 'newest' | 'popular' | 'alphabetical'>('relevant');
  const [results, setResults] = useState<SearchDisplayModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(12);

  const { isSaved, toggleSaved } = useHubPersonalStore();
  const { models: compareModels, addModel, removeModel, isInCompare } = useHubCompareStore();
  const { addItem, isInBasket, removeItem: removeBasketItem } = useHubQuoteStore();
  const { success, info } = useToast();

  // Search Debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setQuery(rawQuery.trim());
      if (rawQuery.trim()) {
        setSearchParams({ q: rawQuery.trim() });
      } else {
        setSearchParams({});
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [rawQuery, setSearchParams]);

  // Synchronize dynamic search SEO metadata (HUB-13)
  useEffect(() => {
    updateSeoMeta({
      title: query ? `Search: "${query}"` : 'Discovery & Catalog Search',
      description: query
        ? `Search results for "${query}" across verified industrial 3D equipment models and CAD specifications.`
        : 'Search and filter industrial 3D equipment models, CAD assets, and verified demonstration showcases on I3DION Spatial Hub.',
      type: 'website'
    });
  }, [query]);

  // Map API product to display model
  const mapProductToDisplay = useCallback((p: HubProduct): SearchDisplayModel => {
    const poster = p.poster_url || p.imageUrl || p.image_url || `/models/posters/${p.slug}.svg`;
    const preview = p.preview_model_url || p.modelUrl || p.model_url || `/models/preview/${p.slug}.glb`;
    return {
      id: p.id,
      name: p.name,
      slug: p.slug || p.id,
      category: p.category || 'Demonstration model',
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
      licenseArtist: p.license_artist,
      attributionRequired: Boolean(p.attribution_required)
    };
  }, []);

  // Fetch results from backend search API
  useEffect(() => {
    setLoading(true);

    hubApi.search(query, {
      category: selectedCategory !== 'All' ? selectedCategory : undefined,
      license: selectedLicense !== 'All' ? selectedLicense : undefined,
      sort: sortBy
    })
      .then((data: any) => {
        const items = Array.isArray(data) ? data : data.items || [];
        if (items.length > 0) {
          setResults(items.map(mapProductToDisplay));
        } else {
          // Fallback search over static models
          const filtered = SPATIAL_HUB_MODELS.filter((m) => {
            const matchesQ = !query || 
              m.name.toLowerCase().includes(query.toLowerCase()) || 
              m.category.toLowerCase().includes(query.toLowerCase()) || 
              m.shortDescription.toLowerCase().includes(query.toLowerCase());
            const matchesCat = selectedCategory === 'All' || m.category === selectedCategory;
            const matchesLic = selectedLicense === 'All' || m.source?.license?.includes(selectedLicense);
            return matchesQ && matchesCat && matchesLic;
          }).map((m) => ({
            id: m.id,
            name: m.name,
            slug: m.slug,
            category: m.category,
            description: m.shortDescription,
            thumbnail: m.thumbnail,
            modelUrl: m.modelUrl,
            previewUrl: m.previewUrl || m.modelUrl,
            viewsCount: 0,
            likesCount: 0,
            companyName: 'I3DION Showcase',
            companyVerified: true,
            isDemoModel: true,
            licenseSpdx: ['CC0-1.0'],
            attributionRequired: false
          }));
          setResults(filtered);
        }
      })
      .catch(() => {
        // Safe offline / fallback
        const fallback = SPATIAL_HUB_MODELS.map((m) => ({
          id: m.id,
          name: m.name,
          slug: m.slug,
          category: m.category,
          description: m.shortDescription,
          thumbnail: m.thumbnail,
          modelUrl: m.modelUrl,
          previewUrl: m.previewUrl || m.modelUrl,
          viewsCount: 0,
          likesCount: 0,
          companyName: 'I3DION Showcase',
          companyVerified: true,
          isDemoModel: true,
          licenseSpdx: ['CC0-1.0'],
          attributionRequired: false
        }));
        setResults(fallback);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [query, selectedCategory, selectedLicense, sortBy, mapProductToDisplay]);

  // Unique categories for facet
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    SPATIAL_HUB_MODELS.forEach((m) => set.add(m.category));
    return Array.from(set);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 pt-6 px-4 md:px-8 font-sans text-slate-800">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Search Header Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl bg-white p-6 shadow-xs border border-slate-200/80">
          <div className="relative flex-1 w-full">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={rawQuery}
              onChange={(e) => setRawQuery(e.target.value)}
              placeholder="Search 3D models, equipment, manufacturers, or keywords..."
              className="w-full rounded-2xl border border-slate-200 bg-[#F8FAFC] py-3 pl-11 pr-4 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-slate-500">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="relevant">Relevance</option>
              <option value="newest">Newest</option>
              <option value="popular">Popularity</option>
              <option value="alphabetical">Alphabetical</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
          {/* LEFT FACET SIDEBAR */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-5 space-y-6 h-fit shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Filter size={15} /> Facets
              </span>
              {(selectedCategory !== 'All' || selectedLicense !== 'All' || query) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('All');
                    setSelectedLicense('All');
                    setRawQuery('');
                    setQuery('');
                  }}
                  className="text-[10px] font-bold text-blue-600 hover:underline"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Category Facet */}
            <div className="space-y-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Category</span>
              <div className="space-y-1 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('All')}
                  className={`w-full text-left px-2.5 py-1.5 rounded-xl font-bold transition flex items-center justify-between ${
                    selectedCategory === 'All' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>All Categories</span>
                </button>
                {availableCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl text-[11px] font-medium transition flex items-center justify-between ${
                      selectedCategory === cat ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate">{cat}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* License Facet */}
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">License</span>
              <div className="space-y-1 text-xs">
                {['All', 'CC0-1.0', 'CC-BY-4.0', 'MIT'].map((lic) => (
                  <button
                    key={lic}
                    type="button"
                    onClick={() => setSelectedLicense(lic)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl text-[11px] transition flex items-center justify-between ${
                      selectedLicense === lic ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{lic === 'All' ? 'All Verified Licenses' : lic}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* MAIN SEARCH RESULTS GRID */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-500">
                Found <span className="text-slate-900 font-black">{results.length}</span> matching models
                {query && <span> for &ldquo;{query}&rdquo;</span>}
              </h2>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Loader2 size={28} className="animate-spin text-blue-600 mb-2" />
                <p className="text-xs font-bold text-slate-600">Searching 3D catalog...</p>
              </div>
            ) : results.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
                <Search size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-bold text-slate-800">No matching models found</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Try searching with a broader keyword (e.g. &ldquo;gear&rdquo;, &ldquo;helmet&rdquo;, &ldquo;camera&rdquo;) or reset your filters.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('All');
                    setSelectedLicense('All');
                    setRawQuery('');
                    setQuery('');
                  }}
                  className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition"
                >
                  View All Models
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {results.slice(0, displayLimit).map((model) => {
                    const saved = isSaved(model.id);
                    const isComparing = isInCompare(model.id);
                    const inBasket = isInBasket(model.id);

                    return (
                      <div
                        key={model.id}
                        className="group flex flex-col rounded-3xl border border-slate-200/80 bg-white shadow-xs hover:shadow-md transition overflow-hidden"
                      >
                        {/* 3D Model Card Preview */}
                        <div className="relative h-52 w-full bg-slate-900 overflow-hidden">
                          <ModelCardPreview
                            modelUrl={model.previewUrl || model.modelUrl}
                            posterUrl={model.thumbnail}
                            title={model.name}
                            mode="solid"
                          />

                          {/* Demonstration Label */}
                          {model.isDemoModel && (
                            <div className="absolute bottom-2.5 left-2.5 z-20 bg-amber-500/90 text-white text-[9px] font-extrabold px-2 py-0.5 rounded shadow-xs uppercase tracking-wider backdrop-blur-xs flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5" /> Demonstration
                            </div>
                          )}

                          {/* License Tag */}
                          <div className="absolute top-2.5 right-2.5 z-20 bg-slate-900/80 text-white text-[9px] font-extrabold px-2 py-0.5 rounded shadow-xs uppercase tracking-wider backdrop-blur-xs border border-white/10">
                            {model.licenseSpdx[0]}
                          </div>
                        </div>

                        {/* Card Info */}
                        <div className="flex flex-1 flex-col p-4">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider truncate max-w-[180px]">
                              {model.category}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {model.viewsCount} views
                            </span>
                          </div>

                          <Link to={`/hub/product/${model.slug}`} className="group-hover:text-blue-600 transition">
                            <h3 className="text-xs font-bold text-slate-900 leading-tight line-clamp-1">{model.name}</h3>
                          </Link>
                          <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-snug">{model.description}</p>

                          {/* Action Buttons */}
                          <div className="mt-auto pt-3 flex items-center gap-1.5 border-t border-slate-100">
                            <Link
                              to={`/hub/product/${model.slug}`}
                              className="flex-1 bg-slate-900 hover:bg-blue-600 text-white text-center py-2 px-2.5 rounded-xl font-bold text-xs transition"
                            >
                              Inspect 3D
                            </Link>

                            {/* Bookmark / Save */}
                            <button
                              type="button"
                              onClick={() => toggleSaved(model.id, 'product')}
                              title={saved ? 'Remove from saved' : 'Save model'}
                              className={`p-2 rounded-xl transition ${
                                saved ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                              }`}
                            >
                              <Bookmark className={`w-3.5 h-3.5 ${saved ? 'fill-blue-600' : ''}`} />
                            </button>

                            {/* Compare Toggle */}
                            <button
                              type="button"
                              onClick={() => {
                                if (isComparing) {
                                  removeModel(model.id);
                                  info(`Removed ${model.name} from comparison`);
                                } else {
                                  const added = addModel({
                                    id: model.id,
                                    name: model.name,
                                    slug: model.slug,
                                    category: model.category,
                                    description: model.description,
                                    thumbnail: model.thumbnail,
                                    modelUrl: model.modelUrl,
                                    previewUrl: model.previewUrl,
                                    companyName: model.companyName,
                                    companyVerified: model.companyVerified,
                                    licenseSpdx: model.licenseSpdx,
                                    attributionRequired: model.attributionRequired,
                                    viewsCount: model.viewsCount,
                                    likesCount: model.likesCount
                                  });
                                  if (added) {
                                    success(`Added ${model.name} to compare matrix`);
                                  } else {
                                    info('Comparison matrix holds a maximum of 4 models.');
                                  }
                                }
                              }}
                              title={isComparing ? 'Remove from compare' : 'Add to compare'}
                              className={`p-2 rounded-xl transition ${
                                isComparing ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                              }`}
                            >
                              <GitCompare className="w-3.5 h-3.5" />
                            </button>

                            {/* RFQ Quote Basket */}
                            <button
                              type="button"
                              onClick={() => {
                                if (inBasket) {
                                  removeBasketItem(model.id);
                                  info(`Removed from Quote Basket`);
                                } else {
                                  addItem({
                                    productId: model.id,
                                    name: model.name,
                                    modelUrl: model.modelUrl,
                                    posterUrl: model.thumbnail,
                                    companyName: model.companyName,
                                    quantity: 1
                                  });
                                  success(`Added to RFQ Basket`);
                                }
                              }}
                              title={inBasket ? 'In RFQ Basket (Click to remove)' : 'Add to RFQ Basket'}
                              className={`p-2 rounded-xl transition ${
                                inBasket ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                              }`}
                            >
                              <ShoppingBag className={`w-3.5 h-3.5 ${inBasket ? 'fill-emerald-600' : ''}`} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Progressive Load More */}
                {displayLimit < results.length && (
                  <div className="flex flex-col items-center justify-center pt-4">
                    <button
                      type="button"
                      onClick={() => setDisplayLimit((prev) => prev + 12)}
                      className="inline-flex items-center gap-2 rounded-2xl bg-white border border-slate-200 px-6 py-2.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition"
                    >
                      <ChevronDown size={15} className="text-blue-600" />
                      Load More Results ({results.length - displayLimit} remaining)
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Compare Tray Notification (Active across discovery views) */}
      {compareModels.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-2xl border border-indigo-200 bg-white/95 backdrop-blur-md px-5 py-3 shadow-xl animate-in slide-in-from-bottom-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <GitCompare size={16} className="text-indigo-600" />
            <span>Comparing {compareModels.length} / 4 models</span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/hub/compare"
              className="rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition"
            >
              Open Comparison Matrix
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
