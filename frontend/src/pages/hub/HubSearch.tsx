import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Heart, Filter, ArrowUpRight, Box, ChevronDown } from 'lucide-react';
import { SPATIAL_HUB_MODELS } from '../../data/spatialHubModels';
import ThreeProduct from '../../components/ThreeProduct';
import { HubContextMenu } from '../../components/hub/HubContextMenu';
import { hubIntelligenceApi } from '../../services/hubIntelligenceApi';

export function HubSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [rawQuery, setRawQuery] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery);
  const [displayLimit, setDisplayLimit] = useState(12);

  const [selectedContentTypes, setSelectedContentTypes] = useState<string[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'relevant' | 'newest'>('relevant');
  const [activePreviewId, setActivePreviewId] = useState<string | null>(null);

  const [likedIds, setLikedIds] = useState<string[]>(() => {
    return JSON.parse(localStorage.getItem('i3dion_liked_items') || '[]');
  });

  // Debounce search input to keep UI fast and avoid continuous re-filtering
  useEffect(() => {
    const handler = setTimeout(() => {
      setQuery(rawQuery);
      if (rawQuery.trim()) {
        hubIntelligenceApi.trackEvent({
          event_type: 'search_performed',
          metadata: { query: rawQuery.trim() }
        });
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [rawQuery]);

  const toggleLike = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    let updated: string[];
    if (likedIds.includes(id)) {
      updated = likedIds.filter((item) => item !== id);
    } else {
      updated = [...likedIds, id];
    }
    setLikedIds(updated);
    localStorage.setItem('i3dion_liked_items', JSON.stringify(updated));
  };

  const handleContentTypeToggle = (type: string) => {
    setSelectedContentTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleIndustryToggle = (ind: string) => {
    setSelectedIndustries((prev) =>
      prev.includes(ind) ? prev.filter((i) => i !== ind) : [...prev, ind]
    );
  };

  const filteredResults = useMemo(() => {
    return SPATIAL_HUB_MODELS.filter((item) => {
      const q = query.toLowerCase().trim();
      const matchesQuery =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.shortDescription.toLowerCase().includes(q);

      const matchesIndustry =
        selectedIndustries.length === 0 || selectedIndustries.includes(item.category);

      return matchesQuery && matchesIndustry;
    });
  }, [query, selectedIndustries]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16 pt-6 px-4 md:px-8 select-none">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Search Header Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl bg-white p-6 shadow-2xs border border-slate-200/80">
          <div className="relative flex-1 w-full">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={rawQuery}
              onChange={(e) => setRawQuery(e.target.value)}
              placeholder="Search products, experiences, or organizations..."
              className="w-full rounded-2xl border border-slate-200 bg-[#F8FAFC] py-3 pl-11 pr-4 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-slate-500">Sort by</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700"
            >
              <option value="relevant">Most Relevant</option>
              <option value="newest">Newest</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
          {/* LEFT FILTER SIDEBAR */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-5 space-y-6 h-fit shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Filter size={15} /> Filters
              </span>
              {(selectedContentTypes.length > 0 || selectedIndustries.length > 0) && (
                <button
                  onClick={() => {
                    setSelectedContentTypes([]);
                    setSelectedIndustries([]);
                  }}
                  className="text-[10px] font-bold text-blue-600 hover:underline"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Content Type Filter */}
            <div className="space-y-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Content Type</span>
              <div className="space-y-1.5 text-xs font-medium text-slate-700">
                <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900">
                  <input type="checkbox" checked={selectedContentTypes.includes('3D Products')} onChange={() => handleContentTypeToggle('3D Products')} className="rounded text-blue-600" />
                  <span>3D Products ({filteredResults.length})</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900">
                  <input type="checkbox" checked={selectedContentTypes.includes('Experiences')} onChange={() => handleContentTypeToggle('Experiences')} className="rounded text-blue-600" />
                  <span>Experiences (6)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900">
                  <input type="checkbox" checked={selectedContentTypes.includes('AR Experiences')} onChange={() => handleContentTypeToggle('AR Experiences')} className="rounded text-blue-600" />
                  <span>AR Experiences (4)</span>
                </label>
              </div>
            </div>

            {/* Industry Filter */}
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Industry</span>
              <div className="space-y-1.5 text-xs font-medium text-slate-700">
                {['Industrial Equipment', 'Machinery', 'Manufacturing', 'Automotive', 'Architecture', 'Consumer Products'].map((ind) => (
                  <label key={ind} className="flex items-center gap-2 cursor-pointer hover:text-slate-900">
                    <input
                      type="checkbox"
                      checked={selectedIndustries.includes(ind)}
                      onChange={() => handleIndustryToggle(ind)}
                      className="rounded text-blue-600"
                    />
                    <span>{ind}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* File Type Filter */}
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">File Type</span>
              <div className="space-y-1.5 text-xs font-medium text-slate-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                  <span>3D Model (glTF / GLB)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                  <span>Interactive 3D</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                  <span>AR WebXR Anchor</span>
                </label>
              </div>
            </div>
          </div>

          {/* MAIN SEARCH RESULTS GRID */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800">
                Search Results ({filteredResults.length})
              </h2>
            </div>

            {filteredResults.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
                <Search size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-bold text-slate-800">No results found</p>
                <p className="text-xs text-slate-500 mt-1">Try adjusting your search query or filters.</p>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredResults.slice(0, displayLimit).map((item) => {
                    const isLiked = likedIds.includes(item.id);
                    const isPreviewing3d = activePreviewId === item.id;

                    return (
                      <div
                        key={item.id}
                        className="group flex flex-col rounded-2xl border border-slate-200/80 bg-white shadow-2xs hover:shadow-md transition overflow-hidden"
                      >
                        <div className="relative h-44 w-full bg-[#0F172A] overflow-hidden flex items-center justify-center p-4">
                          {isPreviewing3d ? (
                            <ThreeProduct modelUrl={item.modelUrl} renderMode="solid" autoRotate={true} className="h-full w-full" />
                          ) : (
                            <Link to={`/hub/product/${item.slug}`} className="w-full h-full flex items-center justify-center">
                              <img
                                src={item.thumbnail}
                                alt={item.name}
                                className="max-h-full max-w-full object-contain filter drop-shadow-md group-hover:scale-105 transition duration-300"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/models/thumbnails/thumb_1.svg';
                                }}
                              />
                            </Link>
                          )}
                          
                          {/* Like Button */}
                          <button
                            onClick={(e) => toggleLike(e, item.id)}
                            className={`absolute top-3 left-3 z-20 flex h-7 w-7 items-center justify-center rounded-full backdrop-blur-md transition ${
                              isLiked ? 'bg-rose-500 text-white' : 'bg-slate-900/60 text-slate-300 hover:bg-slate-900 hover:text-white'
                            }`}
                          >
                            <Heart size={13} fill={isLiked ? 'currentColor' : 'none'} />
                          </button>

                          {/* Context Menu Overlay */}
                          <div className="absolute top-3 right-3 z-20">
                            <HubContextMenu itemId={item.id} itemTitle={item.name} itemSlug={item.slug} />
                          </div>
                        </div>

                        <div className="flex flex-1 flex-col p-4">
                          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">
                            {item.category}
                          </span>
                          <Link to={`/hub/product/${item.slug}`} className="group-hover:text-blue-600 transition">
                            <h3 className="text-sm font-bold text-slate-900">{item.name}</h3>
                          </Link>
                          <p className="text-xs text-slate-500 line-clamp-2 mt-1">{item.shortDescription}</p>

                          <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100">
                            <span className="text-[11px] font-medium text-slate-500">{item.viewsCount} views</span>
                            <Link
                              to={`/hub/product/${item.slug}`}
                              className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
                            >
                              Explore <ArrowUpRight size={14} />
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Progressive Pagination Load More Button */}
                {displayLimit < filteredResults.length && (
                  <div className="flex flex-col items-center justify-center pt-2">
                    <button
                      onClick={() => setDisplayLimit((prev) => prev + 12)}
                      className="inline-flex items-center gap-2 rounded-2xl bg-white border border-slate-200 px-6 py-3 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition"
                    >
                      <ChevronDown size={16} className="text-blue-600" />
                      Load More Search Results ({filteredResults.length - displayLimit} remaining)
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
