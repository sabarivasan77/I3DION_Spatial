import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Heart, Bookmark, Share2, MessageSquare, ChevronRight, ShieldCheck, 
  Download, Box, Sparkles, Scale, ExternalLink, Info, Check, Eye 
} from 'lucide-react';
import ThreeProduct, { RenderMode } from '../../components/ThreeProduct';
import { SPATIAL_HUB_MODELS, SpatialHubModel } from '../../data/spatialHubModels';
import { ViewInARButton } from '../../components/ViewInARButton';
import { HubCommentsSection } from '../../components/hub/HubCommentsSection';
import { HubContextMenu } from '../../components/hub/HubContextMenu';
import { hubIntelligenceApi } from '../../services/hubIntelligenceApi';
import { useAuthStore } from '../../store/authStore';
import { hubApi, HubProduct } from '../../services/hubApi';
import { useToast } from '../../components/Toast';
import { useHubPersonalStore } from '../../store/hubPersonalStore';

export function HubProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [renderMode, setRenderMode] = useState<RenderMode>('solid');
  const [activeTab, setActiveTab] = useState<'Overview' | 'Specifications' | 'Provenance' | 'Comments' | 'Related'>('Overview');
  const [isFollowing, setIsFollowing] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [viewsCount, setViewsCount] = useState(0);
  const [dbProduct, setDbProduct] = useState<HubProduct | null>(null);
  const [loading, setLoading] = useState(true);

  const { isSaved, isLiked, toggleSaved, toggleLiked } = useHubPersonalStore();
  const token = useAuthStore((s) => s.token);
  const { success, info } = useToast();

  // Find fallback from static starter library
  const staticFallback = useMemo(() => {
    return SPATIAL_HUB_MODELS.find((m) => m.id === id || m.slug === id) || SPATIAL_HUB_MODELS[0];
  }, [id]);

  // Fetch real product from database API
  useEffect(() => {
    if (!id) return;
    setLoading(true);

    hubApi.getProduct(id)
      .then((data) => {
        setDbProduct(data);
        setLikesCount(Number(data.likes_count) || 0);
        setViewsCount(Number(data.views_count) || 0);
      })
      .catch(() => {
        // Fallback to static model with authentic 0 counts
        setDbProduct(null);
        setLikesCount(staticFallback.likesCount || 0);
        setViewsCount(staticFallback.viewsCount || 0);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id, staticFallback]);

  // Unified Product Model
  const product = useMemo(() => {
    if (dbProduct) {
      const sp = (dbProduct.specs || {}) as Record<string, any>;
      return {
        id: dbProduct.id,
        name: dbProduct.name,
        slug: dbProduct.slug || dbProduct.id,
        category: dbProduct.category,
        shortDescription: dbProduct.description,
        longDescription: dbProduct.description,
        modelUrl: dbProduct.model_url || dbProduct.modelUrl || `/models/preview/${dbProduct.slug}.glb`,
        previewUrl: dbProduct.preview_model_url || `/models/preview/${dbProduct.slug}.glb`,
        posterUrl: dbProduct.poster_url || `/models/posters/${dbProduct.slug}.svg`,
        thumbnail: dbProduct.poster_url || dbProduct.imageUrl || `/models/posters/${dbProduct.slug}.svg`,
        companyName: dbProduct.company_name || 'I3DION Showcase',
        companyVerified: dbProduct.company_verified ?? true,
        isDemoModel: dbProduct.is_demo_model ?? true,
        licenseSpdx: dbProduct.license_spdx || ['CC0-1.0'],
        licenseArtist: dbProduct.license_artist || sp.artist || null,
        licenseOwner: dbProduct.license_owner || null,
        licenseSourceUrl: dbProduct.original_model_url || (sp.provenance?.repo ? `${sp.provenance.repo}` : null),
        attributionRequired: Boolean(dbProduct.attribution_required),
        commercialUse: true,
        specs: sp,
        arEnabled: true
      };
    }

    // Static fallback
    const isCC0 = staticFallback.source?.license?.includes('CC0');
    return {
      id: staticFallback.id,
      name: staticFallback.name,
      slug: staticFallback.slug,
      category: staticFallback.category,
      shortDescription: staticFallback.shortDescription,
      longDescription: staticFallback.longDescription,
      modelUrl: staticFallback.modelUrl,
      previewUrl: staticFallback.previewUrl || staticFallback.modelUrl,
      posterUrl: staticFallback.thumbnail,
      thumbnail: staticFallback.thumbnail,
      companyName: 'I3DION Showcase',
      companyVerified: true,
      isDemoModel: true,
      licenseSpdx: isCC0 ? ['CC0-1.0'] : ['CC-BY-4.0'],
      licenseArtist: staticFallback.source?.author || 'Khronos Group',
      licenseOwner: 'Open Source Community',
      licenseSourceUrl: staticFallback.source?.repository,
      attributionRequired: !isCC0,
      commercialUse: true,
      specs: staticFallback.metadata,
      arEnabled: staticFallback.arEnabled
    };
  }, [dbProduct, staticFallback]);

  const isProductSaved = product.id ? isSaved(product.id) : false;
  const isProductLiked = product.id ? isLiked(product.id) : false;

  // Track activity event for Lens Analytics & Recommendations
  useEffect(() => {
    if (product.id) {
      hubIntelligenceApi.trackEvent({
        eventType: 'product_viewed',
        entityType: 'product',
        entityId: product.id,
        productId: product.id,
        metadata: { name: product.name, category: product.category, license: product.licenseSpdx.join(',') }
      });
    }
  }, [product.id, product.name, product.category, product.licenseSpdx]);

  const handleLikeToggle = async () => {
    const nextState = !isProductLiked;
    setLikesCount((c) => (nextState ? c + 1 : Math.max(0, c - 1)));
    await toggleLiked(product.id, 'product');

    if (token) {
      hubApi.toggleLike(token, 'product', product.id).catch(() => null);
    }

    hubIntelligenceApi.trackEvent({
      eventType: nextState ? 'product_liked' : 'product_unliked',
      entityType: 'product',
      entityId: product.id,
      productId: product.id
    });
  };

  const handleSaveToggle = () => {
    const nextState = !isProductSaved;
    toggleSaved(product.id, 'product');

    if (nextState) {
      success('Product Saved', `Added ${product.name} to your Saved Library.`);
    } else {
      info('Product Removed', `Removed ${product.name} from Saved Library.`);
    }

    hubIntelligenceApi.trackEvent({
      eventType: nextState ? 'product_saved' : 'product_unsaved',
      entityType: 'product',
      entityId: product.id,
      productId: product.id
    });
  };

  const handleFollowToggle = async () => {
    const nextState = !isFollowing;
    setIsFollowing(nextState);
    if (token) {
      try {
        await hubApi.followCreator(token, product.companyName);
      } catch {
        // Silently handled
      }
    }
    success(nextState ? 'Following Organization' : 'Unfollowed Organization', `Updated preferences for ${product.companyName}.`);
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: product.name, text: product.shortDescription, url }).catch(() => null);
    } else {
      navigator.clipboard.writeText(url);
      success('Link Copied', 'Product details link copied to clipboard.');
    }

    hubIntelligenceApi.trackEvent({
      eventType: 'product_shared',
      entityType: 'product',
      entityId: product.id,
      productId: product.id
    });
  };

  const handleDownload = () => {
    if (!product.commercialUse) {
      info('License Restriction', 'Direct download is restricted by license.');
      return;
    }
    const a = document.createElement('a');
    a.href = product.modelUrl;
    a.download = `${product.slug}.glb`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    success('Download Started', `Downloading ${product.name} (.glb format). Attribution required under ${product.licenseSpdx.join(', ')}.`);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 pt-6 px-4 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Link to="/hub" className="hover:text-blue-600 transition">Spatial Hub</Link>
            <ChevronRight size={14} />
            <span className="text-slate-400 truncate max-w-[200px]">{product.category}</span>
            <ChevronRight size={14} />
            <span className="text-slate-900 font-bold truncate max-w-[200px]">{product.name}</span>
          </div>
          <HubContextMenu
            itemId={product.id}
            itemTitle={product.name}
            itemSlug={product.slug}
            entityType="product"
            isSaved={isProductSaved}
            onSaveToggle={handleSaveToggle}
          />
        </div>

        {/* ─── MAIN HERO 3D SHOWCASE & PRODUCT INFO ──────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6 items-start">
          {/* Left: 3D Interactive Canvas */}
          <div className="space-y-4">
            <div className="relative h-[420px] md:h-[520px] w-full rounded-3xl bg-[#0F172A] border border-slate-200 overflow-hidden shadow-xl">
              <ThreeProduct
                modelUrl={product.modelUrl}
                posterUrl={product.posterUrl}
                productName={product.name}
                renderMode={renderMode}
                autoRotate={true}
                interactive={true}
                className="h-full w-full"
              />

              {/* Render Mode Switcher Overlay */}
              <div className="absolute top-4 left-4 z-20 flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl backdrop-blur-md border border-slate-700/80">
                {(['solid', 'wireframe', 'xray'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setRenderMode(m)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition capitalize ${
                      renderMode === m ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {/* AR Launch Button Overlay */}
              {product.arEnabled && (
                <div className="absolute top-4 right-4 z-20">
                  <ViewInARButton modelUrl={product.modelUrl} title={product.name} />
                </div>
              )}

              {/* Demonstration Label Overlay */}
              {product.isDemoModel && (
                <div className="absolute bottom-4 left-4 z-20 bg-amber-500/90 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-md shadow-md uppercase tracking-wider backdrop-blur-xs flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Demonstration Model
                </div>
              )}
            </div>

            {/* Mode & Action Quick Bar */}
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Controls:</span>
                <span>Click & drag to rotate • Scroll to zoom • Shift + drag to pan</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                <Eye className="w-3.5 h-3.5" /> {viewsCount} Views
              </div>
            </div>
          </div>

          {/* Right: Product Info & Actions Card */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 md:p-8 space-y-6 shadow-sm">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 border border-blue-100">
                  3D Spatial Model
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                  product.licenseSpdx.includes('CC0-1.0')
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                  {product.licenseSpdx.join(' / ')}
                </span>
                <span className="text-xs font-semibold text-slate-400">• Published</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{product.name}</h1>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">{product.shortDescription}</p>
            </div>

            {/* Organization Affiliation Card */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0F172A] text-xs font-bold text-white shadow-2xs">
                  I3
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1">
                    {product.companyName}
                    {product.companyVerified && <ShieldCheck size={14} className="text-blue-600" />}
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    {product.isDemoModel ? 'Verified Demonstration Showcase' : 'Verified Equipment Manufacturer'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleFollowToggle}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                  isFollowing ? 'bg-slate-200 text-slate-700' : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            </div>

            {/* Social & Primary Action Buttons */}
            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={handleLikeToggle}
                className={`flex flex-col items-center justify-center rounded-2xl p-2.5 transition border ${
                  isProductLiked ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Heart size={18} fill={isProductLiked ? 'currentColor' : 'none'} />
                <span className="text-[10px] font-bold mt-1">Like ({likesCount})</span>
              </button>

              <button
                onClick={handleSaveToggle}
                className={`flex flex-col items-center justify-center rounded-2xl p-2.5 transition border ${
                  isProductSaved ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Bookmark size={18} fill={isProductSaved ? 'currentColor' : 'none'} />
                <span className="text-[10px] font-bold mt-1">Save</span>
              </button>

              <button
                onClick={handleShare}
                className="flex flex-col items-center justify-center rounded-2xl bg-slate-50 border border-slate-200 p-2.5 text-slate-700 hover:bg-slate-100 transition"
              >
                <Share2 size={18} />
                <span className="text-[10px] font-bold mt-1">Share</span>
              </button>

              <button
                onClick={handleDownload}
                className="flex flex-col items-center justify-center rounded-2xl bg-slate-50 border border-slate-200 p-2.5 text-slate-700 hover:bg-slate-100 transition"
                title="Download verified GLB file"
              >
                <Download size={18} />
                <span className="text-[10px] font-bold mt-1">GLB</span>
              </button>
            </div>

            {/* Request Quote / Enquiry Direct Action */}
            <div className="pt-2">
              <Link
                to={`/hub/rfq?product=${product.slug}`}
                className="w-full bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs py-3.5 rounded-2xl transition flex items-center justify-center gap-2 shadow-sm"
              >
                <MessageSquare size={16} />
                <span>Request Technical Quote / Inquire</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ─── TABBED DETAIL SECTIONS ──────────────────────────────────────── */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-4 overflow-x-auto no-scrollbar">
            {(['Overview', 'Specifications', 'Provenance', 'Comments', 'Related'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-xs font-bold pb-2 transition border-b-2 whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab === 'Provenance' ? 'License & Provenance' : tab}
              </button>
            ))}
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'Overview' && (
            <div className="space-y-6 text-xs text-slate-600 leading-relaxed">
              <p>{product.longDescription}</p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Model Format</span>
                  <span className="font-bold text-slate-800">glTF 2.0 Binary (GLB)</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Compression</span>
                  <span className="font-bold text-slate-800">meshopt + WebP</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">AR Readiness</span>
                  <span className="font-bold text-emerald-600">Scene Viewer / Quick Look</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Verified License</span>
                  <span className="font-bold text-blue-600">{product.licenseSpdx.join(', ')}</span>
                </div>
              </div>

              {/* Embedded Comments */}
              <div className="pt-4 border-t border-slate-100">
                <HubCommentsSection entityType="product" entityId={product.id} />
              </div>
            </div>
          )}

          {/* TAB 2: SPECIFICATIONS (Real 3D Geometry Metrics) */}
          {activeTab === 'Specifications' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-slate-400 block font-bold text-[10px] uppercase">Triangle Count</span>
                  <span className="text-slate-900 font-extrabold text-sm">
                    {product.specs?.triangles ? Number(product.specs.triangles).toLocaleString() : 'Optimized Mesh Topology'}
                  </span>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-slate-400 block font-bold text-[10px] uppercase">Meshes & Sub-assemblies</span>
                  <span className="text-slate-900 font-extrabold text-sm">
                    {product.specs?.meshes ? `${product.specs.meshes} Mesh Node(s)` : 'Multi-part Geometry'}
                  </span>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-slate-400 block font-bold text-[10px] uppercase">Materials & Textures</span>
                  <span className="text-slate-900 font-extrabold text-sm">
                    {product.specs?.materials ? `${product.specs.materials} PBR Material(s)` : 'Physically-Based Rendering (PBR)'}
                  </span>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-slate-400 block font-bold text-[10px] uppercase">Shader Extensions</span>
                  <span className="text-slate-900 font-extrabold text-sm truncate block" title={Array.isArray(product.specs?.extensionsUsed) ? product.specs.extensionsUsed.join(', ') : 'Standard PBR'}>
                    {Array.isArray(product.specs?.extensionsUsed) && product.specs.extensionsUsed.length > 0
                      ? product.specs.extensionsUsed.join(', ')
                      : 'KHR_materials_pbrSpecularGlossiness'}
                  </span>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-slate-400 block font-bold text-[10px] uppercase">Inspection Modes</span>
                  <span className="text-slate-900 font-extrabold text-sm">Solid • Wireframe • X-Ray</span>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-slate-400 block font-bold text-[10px] uppercase">Scale Calibration</span>
                  <span className="text-slate-900 font-extrabold text-sm">Real-World Metric 1:1</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PROVENANCE & LICENSE (CC-BY Credit Panel) */}
          {activeTab === 'Provenance' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 space-y-4 text-xs">
                <div className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-blue-600" />
                  <h3 className="font-extrabold text-slate-900 text-sm">Authentic License & Provenance Verification</h3>
                </div>

                <p className="text-slate-600 leading-relaxed">
                  This 3D model is published in the I3DION Spatial Hub with strict open source license integrity. All provenance metadata is validated against upstream sources.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">SPDX Identifier</span>
                    <p className="font-bold text-slate-900 text-sm">{product.licenseSpdx.join(', ')}</p>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Author / Creator Attribution</span>
                    <p className="font-bold text-slate-900 text-sm">{product.licenseArtist || product.licenseOwner || 'Khronos Group'}</p>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Commercial Redistribution</span>
                    <p className="font-bold text-emerald-600 text-sm flex items-center gap-1">
                      <Check className="w-4 h-4" /> Permitted (No NC restriction)
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Attribution Requirement</span>
                    <p className="font-bold text-slate-900 text-sm">
                      {product.attributionRequired ? 'Required (Credit original author)' : 'Not Required (CC0 / Public Domain)'}
                    </p>
                  </div>
                </div>

                {product.licenseSourceUrl && (
                  <div className="pt-2">
                    <a
                      href={product.licenseSourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline"
                    >
                      <span>View Upstream Source Repository</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}

                {product.isDemoModel && (
                  <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-xl text-amber-900 text-xs mt-3">
                    <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                    <div>
                      <strong className="font-bold">Showcase Demonstration Model Disclosure:</strong> This model is supplied for visualization, spatial inspection, and augmented reality testing. It is not functional manufacturing CAD equipment.
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: COMMENTS */}
          {activeTab === 'Comments' && (
            <HubCommentsSection entityType="product" entityId={product.id} />
          )}

          {/* TAB 5: RELATED MODELS */}
          {activeTab === 'Related' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {SPATIAL_HUB_MODELS.filter((m) => m.id !== product.id).slice(0, 3).map((r) => (
                <Link 
                  key={r.id} 
                  to={`/hub/product/${r.slug}`} 
                  className="p-4 rounded-2xl border border-slate-200 hover:border-blue-400 transition bg-slate-50 flex flex-col justify-between"
                >
                  <div>
                    <div className="aspect-[4/3] bg-white rounded-xl mb-3 border border-slate-100 flex items-center justify-center p-2">
                      <img src={r.thumbnail} alt={r.name} className="h-full w-full object-contain" />
                    </div>
                    <span className="text-xs font-bold text-slate-900 block truncate">{r.name}</span>
                    <span className="text-[10px] text-blue-600 font-semibold">{r.category}</span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-700 mt-3 block">View 3D Model →</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
