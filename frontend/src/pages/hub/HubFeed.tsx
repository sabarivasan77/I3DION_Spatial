import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Box, Sparkles, Filter, CheckCircle2, QrCode, Share2, Layers, ChevronDown } from 'lucide-react';
import { SPATIAL_HUB_MODELS, SpatialHubModel } from '../../data/spatialHubModels';
import ThreeProduct, { RenderMode } from '../../components/ThreeProduct';
import { useToast } from '../../components/Toast';
import { hubApi } from '../../services/hubApi';
import { HubContextMenu } from '../../components/hub/HubContextMenu';

export function HubFeed() {
  const { success, info } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedMode, setSelectedMode] = useState('All');
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'alphabetical'>('popular');
  const [dbModels, setDbModels] = useState<SpatialHubModel[]>([]);
  const [displayLimit, setDisplayLimit] = useState(12);
  
  // Quick Preview State in Grid
  const [previewModes, setPreviewModes] = useState<Record<string, RenderMode>>({});
  const [activeQrModel, setActiveQrModel] = useState<SpatialHubModel | null>(null);

  // Fetch Database Models from Backend API if available
  useEffect(() => {
    hubApi.getFeed().then((items) => {
      if (Array.isArray(items) && items.length > 0) {
        const mapped: SpatialHubModel[] = items.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug || p.id,
          category: p.category || 'Industrial Equipment',
          shortDescription: p.description || 'Uploaded industrial 3D model asset.',
          longDescription: p.description || 'Uploaded industrial 3D model asset.',
          thumbnail: p.imageUrl || '/models/thumbnails/gearbox.webp',
          modelUrl: p.modelUrl || '/models/gearbox_assembly.glb',
          arEnabled: true,
          wireframeEnabled: true,
          xrayEnabled: true,
          solidEnabled: true,
          status: 'Published',
          viewsCount: p.views_count || 120,
          likesCount: p.likes_count || 34,
          downloadsCount: p.downloads_count || 12,
          metadata: {
            objectType: 'Industrial 3D Asset',
            industrialCategory: p.category || 'Machinery',
            visualizationType: 'Solid / Wireframe / X-Ray / AR',
            componentStructure: 'Multi-part CAD Surface Geometry',
            modelCharacteristics: 'Database-backed Model Record'
          },
          features: [
            'Direct database product record',
            'Full Solid, Wireframe, X-Ray mode support',
            'AR Ready spatial anchor placement'
          ],
          tags: p.tags || ['industrial', '3d-model'],
          source: {
            repository: 'I3DION Spatial Database',
            author: p.creator_name || p.company_name || 'Organization Creator',
            license: 'Commercial License',
            attributionRequired: false,
            originalFormat: 'glTF 2.0 Binary',
            optimizedFormat: 'Binary glTF (GLB)'
          }
        }));
        setDbModels(mapped);
      }
    }).catch(() => null);
  }, []);

  // Lock background scroll when QR Modal is open
  useEffect(() => {
    if (activeQrModel) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [activeQrModel]);

  // Combine static master 30 models with dynamically fetched database models (avoiding duplicates)
  const allModels = useMemo(() => {
    const existingSlugs = new Set(SPATIAL_HUB_MODELS.map(m => m.slug));
    const uniqueDbModels = dbModels.filter(m => !existingSlugs.has(m.slug));
    return [...uniqueDbModels, ...SPATIAL_HUB_MODELS];
  }, [dbModels]);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set(allModels.map(m => m.category));
    return ['All', ...Array.from(set)];
  }, [allModels]);

  // Filtered & Sorted Models
  const filteredModels = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let result = allModels.filter(model => {
      const matchesQuery = !q || (
        model.name.toLowerCase().includes(q) ||
        model.category.toLowerCase().includes(q) ||
        model.shortDescription.toLowerCase().includes(q) ||
        model.tags.some(t => t.toLowerCase().includes(q))
      );
      const matchesCategory = !selectedCategory || selectedCategory === 'All' || model.category === selectedCategory;
      let matchesMode = true;
      if (selectedMode && selectedMode !== 'All') {
        if (selectedMode === 'AR') matchesMode = model.arEnabled;
        else if (selectedMode === 'Wireframe') matchesMode = model.wireframeEnabled;
        else if (selectedMode === 'X-Ray') matchesMode = model.xrayEnabled;
        else if (selectedMode === 'Solid') matchesMode = model.solidEnabled;
      }
      return matchesQuery && matchesCategory && matchesMode;
    });
    
    if (sortBy === 'popular') {
      result = [...result].sort((a, b) => b.likesCount - a.likesCount);
    } else if (sortBy === 'alphabetical') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'newest') {
      result = [...result].sort((a, b) => b.id.localeCompare(a.id));
    }
    return result;
  }, [searchQuery, selectedCategory, selectedMode, sortBy, allModels]);

  const handleShare = (model: SpatialHubModel, e: React.MouseEvent) => {
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

  const handleArClick = (model: SpatialHubModel, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveQrModel(model);
  };

  const togglePreviewMode = (modelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setPreviewModes(prev => {
      const current = prev[modelId] || 'solid';
      const next: RenderMode = current === 'solid' ? 'wireframe' : current === 'wireframe' ? 'xray' : 'solid';
      return { ...prev, [modelId]: next };
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] pb-16">
      {/* ─── HEADER BAR ─────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full mb-3 border border-blue-100">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Master 3D Model Library • 30 Curated Industrial Assets</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Spatial Hub
              </h1>
              <p className="mt-1 text-base text-slate-600 max-w-3xl">
                Explore industrial 3D models and visualize them in Solid, Wireframe, X-Ray and AR.
              </p>
            </div>

            {/* Header Search Box */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search 30 industrial models..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
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
              {categories.slice(0, 8).map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
              {categories.length > 8 && (
                <select
                  value={categories.includes(selectedCategory) && !categories.slice(0, 8).includes(selectedCategory) ? selectedCategory : ''}
                  onChange={e => setSelectedCategory(e.target.value || 'All')}
                  className="px-2 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 border-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">More Categories ({categories.length - 8})...</option>
                  {categories.slice(8).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Mode & Sort Controls */}
            <div className="flex items-center space-x-3 self-end lg:self-auto">
              {/* Visualization Mode filter */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                {['All', 'Solid', 'Wireframe', 'X-Ray', 'AR'].map(mode => (
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
                onChange={e => setSortBy(e.target.value as any)}
                className="bg-white border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm"
              >
                <option value="popular">Popularity</option>
                <option value="alphabetical">Name (A–Z)</option>
                <option value="newest">Recently Added</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ─── MODEL GRID ──────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm font-semibold text-slate-500">
            Showing <span className="font-bold text-slate-900">{filteredModels.length}</span> of {SPATIAL_HUB_MODELS.length} curated 3D models
          </p>
          {(selectedCategory !== 'All' || selectedMode !== 'All' || searchQuery) && (
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

        {filteredModels.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm max-w-md mx-auto my-12">
            <Box className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-1">No models found</h3>
            <p className="text-sm text-slate-500 mb-6">No 3D models match "{searchQuery || selectedCategory}". Try adjusting your search query or filters.</p>
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
              {filteredModels.slice(0, displayLimit).map((model) => {
                const currentPreviewMode = previewModes[model.id] || 'solid';
                const isInteractive3d = previewModes[model.id] !== undefined;

                return (
                  <div
                    key={model.id}
                    className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
                  >
                    {/* Thumbnail / 3D Preview Canvas */}
                    <div className="relative aspect-[4/3] bg-slate-50 border-b border-slate-100 overflow-hidden flex items-center justify-center p-6">
                      {isInteractive3d ? (
                        <ThreeProduct
                          modelUrl={model.modelUrl}
                          productName={model.name}
                          renderMode={currentPreviewMode}
                          autoRotate={false}
                        />
                      ) : (
                        <Link to={`/hub/product/${model.slug}`} className="w-full h-full flex items-center justify-center">
                          <img
                            src={model.thumbnail}
                            alt={model.name}
                            className="max-h-full max-w-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/models/thumbnails/thumb_1.svg';
                            }}
                          />
                        </Link>
                      )}

                      {/* Mode Selector / 3D Toggle Overlay */}
                      <div className="absolute top-3 left-3 z-20">
                        <button
                          onClick={(e) => togglePreviewMode(model.id, e)}
                          className="bg-white/90 backdrop-blur text-[11px] font-bold text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-sm hover:bg-white flex items-center gap-1.5 transition-colors"
                          title="Toggle 3D Live View / Mode"
                        >
                          <Layers className="w-3.5 h-3.5 text-blue-600" />
                          <span className="uppercase tracking-wider">{isInteractive3d ? currentPreviewMode : '3D PREVIEW'}</span>
                        </button>
                      </div>

                      {/* Top Right Context Actions */}
                      <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
                        {model.arEnabled && (
                          <div className="bg-blue-600 text-white text-[10px] font-extrabold px-2 py-1 rounded-md shadow-sm uppercase tracking-wider flex items-center gap-1">
                            <Box className="w-3 h-3" /> AR
                          </div>
                        )}
                        <HubContextMenu itemId={model.id} itemTitle={model.name} itemSlug={model.slug} />
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between text-xs font-bold text-blue-600 mb-1.5">
                          <span className="truncate">{model.category}</span>
                          <span className="text-[10px] text-slate-400 font-mono">3D / AR</span>
                        </div>
                        
                        <Link to={`/hub/product/${model.slug}`} className="block group-hover:text-blue-600 transition-colors">
                          <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-1 mb-1.5">
                            {model.name}
                          </h3>
                        </Link>

                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-4">
                          {model.shortDescription}
                        </p>
                      </div>

                      <div>
                        {/* Features Checkmarks */}
                        <div className="space-y-1 mb-4">
                          <div className="flex items-center text-[11px] text-slate-600 font-medium">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500 mr-1.5 flex-shrink-0" />
                            <span className="truncate">Solid • Wireframe • X-Ray</span>
                          </div>
                          <div className="flex items-center text-[11px] text-slate-600 font-medium">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500 mr-1.5 flex-shrink-0" />
                            <span className="truncate">Factual CAD Geometry</span>
                          </div>
                        </div>

                        {/* Card Action Buttons */}
                        <div className="flex items-center space-x-2 pt-3 border-t border-slate-100">
                          <Link
                            to={`/hub/product/${model.slug}`}
                            className="flex-1 bg-slate-900 hover:bg-blue-600 text-white text-center py-2.5 px-3 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <span>Explore 3D</span>
                          </Link>
                          
                          <button
                            onClick={(e) => handleArClick(model, e)}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-600 p-2.5 rounded-xl transition-colors font-bold text-xs"
                            title="View AR QR Code"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>

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

            {/* Progressive Pagination Load More Button */}
            {displayLimit < filteredModels.length && (
              <div className="flex flex-col items-center justify-center pt-4 pb-2">
                <button
                  onClick={() => setDisplayLimit((prev) => prev + 12)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white border border-slate-200 px-6 py-3 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition"
                >
                  <ChevronDown size={16} className="text-blue-600" />
                  Load More Industrial Models ({filteredModels.length - displayLimit} remaining)
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── DESKTOP -> MOBILE AR QR MODAL ──────────────────────────────── */}
      {activeQrModel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 relative text-center">
            <button
              onClick={() => setActiveQrModel(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 text-sm font-bold w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"
            >
              ✕
            </button>

            <div className="inline-flex items-center space-x-2 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full mb-4">
              <Box className="w-3.5 h-3.5" />
              <span>I3DION SPATIAL AR HANDOFF</span>
            </div>

            <h2 className="text-xl font-extrabold text-slate-900 mb-1">{activeQrModel.name}</h2>
            <p className="text-xs text-slate-500 mb-6">Scan with your mobile camera to launch direct Augmented Reality preview.</p>

            {/* Generated QR Image with I3DION branding */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 inline-block mb-6 shadow-inner relative">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                  `${window.location.origin}/hub/product/${activeQrModel.slug}`
                )}`}
                alt="AR QR Code"
                className="w-48 h-48 mx-auto"
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
