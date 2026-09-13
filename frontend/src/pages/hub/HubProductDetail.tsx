import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart, Bookmark, Share2, MessageSquare, ChevronRight, Box, ShieldCheck, QrCode, Sparkles, UserPlus } from 'lucide-react';
import ThreeProduct, { RenderMode } from '../../components/ThreeProduct';
import { SPATIAL_HUB_MODELS } from '../../data/spatialHubModels';
import { ViewInARButton } from '../../components/ViewInARButton';

export function HubProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [renderMode, setRenderMode] = useState<RenderMode>('solid');
  const [activeTab, setActiveTab] = useState<'Overview' | 'Specifications' | 'Media' | 'Related'>('Overview');
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  const product = SPATIAL_HUB_MODELS.find((m) => m.id === id) || SPATIAL_HUB_MODELS[0];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16 pt-6 px-4 md:px-8 select-none">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link to="/hub" className="hover:text-blue-600">Explore</Link>
          <ChevronRight size={14} />
          <span className="text-slate-900 font-bold">{product.name}</span>
        </div>

        {/* ─── MAIN HERO 3D SHOWCASE & PRODUCT INFO (60/40 SPLIT) ───────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6 items-start">
          {/* Left: 3D Interactive Canvas & Thumbnails (Screen 3) */}
          <div className="space-y-4">
            <div className="relative h-[420px] md:h-[500px] w-full rounded-3xl bg-[#0F172A] border border-slate-200 overflow-hidden shadow-xl">
              <ThreeProduct
                modelUrl={product.modelUrl}
                productName={product.name}
                renderMode={renderMode}
                autoRotate={true}
                interactive={true}
                className="h-full w-full"
              />

              {/* Render Mode Switcher Overlay */}
              <div className="absolute top-4 left-4 z-20 flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl backdrop-blur-md border border-slate-700/80">
                <button
                  onClick={() => setRenderMode('solid')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    renderMode === 'solid' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Solid
                </button>
                <button
                  onClick={() => setRenderMode('wireframe')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    renderMode === 'wireframe' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Wireframe
                </button>
                <button
                  onClick={() => setRenderMode('xray')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    renderMode === 'xray' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  X-Ray
                </button>
              </div>

              {/* AR Launch Overlay Button */}
              {product.arEnabled && (
                <div className="absolute top-4 right-4 z-20">
                  <ViewInARButton modelUrl={product.modelUrl} title={product.name} />
                </div>
              )}
            </div>

            {/* Thumbnail Gallery Row */}
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 w-20 rounded-xl bg-slate-900 border border-slate-200 overflow-hidden cursor-pointer shrink-0">
                  <ThreeProduct modelUrl={product.modelUrl} renderMode="solid" autoRotate={false} interactive={false} className="h-full w-full" />
                </div>
              ))}
            </div>
          </div>

          {/* Right: Product Info & Primary Social Actions (Screen 3) */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 md:p-8 space-y-6 shadow-2xs">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 border border-blue-100">
                  3D Product
                </span>
                <span className="text-xs font-semibold text-slate-400">• Published</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900">{product.name}</h1>
              <p className="text-xs text-slate-500 mt-1">{product.shortDescription}</p>
            </div>

            {/* Organization Affiliation Card */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0F172A] text-xs font-bold text-white shadow-2xs">
                  I3
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">I3DION Industrial</h4>
                  <p className="text-[10px] text-slate-500">Verified Equipment Manufacturer</p>
                </div>
              </div>
              <button
                onClick={() => setIsFollowing(!isFollowing)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                  isFollowing ? 'bg-slate-200 text-slate-700' : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            </div>

            {/* Social Action Buttons Matching Reference Image 2 Screen 3 */}
            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsLiked(!isLiked)}
                className={`flex flex-col items-center justify-center rounded-2xl p-2.5 transition border ${
                  isLiked ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
                <span className="text-[10px] font-bold mt-1">Like</span>
              </button>

              <button
                onClick={() => setIsSaved(!isSaved)}
                className={`flex flex-col items-center justify-center rounded-2xl p-2.5 transition border ${
                  isSaved ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Bookmark size={18} fill={isSaved ? 'currentColor' : 'none'} />
                <span className="text-[10px] font-bold mt-1">Save</span>
              </button>

              <button
                onClick={() => navigator.clipboard.writeText(window.location.href)}
                className="flex flex-col items-center justify-center rounded-2xl bg-slate-50 border border-slate-200 p-2.5 text-slate-700 hover:bg-slate-100 transition"
              >
                <Share2 size={18} />
                <span className="text-[10px] font-bold mt-1">Share</span>
              </button>

              <Link
                to="/hub/enquiries"
                className="flex flex-col items-center justify-center rounded-2xl bg-blue-600 border border-blue-600 p-2.5 text-white hover:bg-blue-700 transition"
              >
                <MessageSquare size={18} />
                <span className="text-[10px] font-bold mt-1">Enquire</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ─── TABBED DETAIL SECTIONS (Screen 3) ────────────────────────────── */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 md:p-8 shadow-2xs space-y-6">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
            {(['Overview', 'Specifications', 'Media', 'Related'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-xs font-bold pb-2 transition border-b-2 ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'Overview' && (
            <div className="space-y-4 text-xs leading-relaxed text-slate-600">
              <p>{product.longDescription}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Model Format</span>
                  <span className="font-bold text-slate-800">glTF 2.0 GLB</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Geometry</span>
                  <span className="font-bold text-slate-800">Solid / Wireframe</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">WebXR AR</span>
                  <span className="font-bold text-emerald-600">1:1 Scale Ready</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Views</span>
                  <span className="font-bold text-slate-800">{product.viewsCount}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Specifications' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block font-semibold">Material Grade</span>
                <span className="text-slate-900 font-bold">Cast Industrial Alloy Steel</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block font-semibold">Max Pressure Rating</span>
                <span className="text-slate-900 font-bold">10 bar / 145 PSI</span>
              </div>
            </div>
          )}

          {activeTab === 'Media' && (
            <div className="text-xs text-slate-500">
              High-resolution 4K render documentation available upon request.
            </div>
          )}

          {activeTab === 'Related' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {SPATIAL_HUB_MODELS.slice(0, 3).map((r) => (
                <Link key={r.id} to={`/hub/product/${r.id}`} className="p-3 rounded-xl border border-slate-200 hover:border-blue-400 transition bg-slate-50">
                  <span className="text-xs font-bold text-slate-900 block">{r.name}</span>
                  <span className="text-[10px] text-blue-600 font-semibold">{r.category}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
