import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  Box,
  Camera,
  FileText,
  Info,
  Mail,
  Maximize2,
  Minimize2,
  RefreshCw,
  Share2,
  Sparkles,
  X,
  Phone,
  Building2,
  CheckCircle2,
  Layers,
  PlayCircle
} from 'lucide-react';
import ThreeProduct from '../components/ThreeProduct';
import { ViewInARButton } from '../components/ViewInARButton';
import { SmartLeadCapture } from '../components/SmartLeadCapture';
import { ExitIntentSurvey } from '../components/ExitIntentSurvey';
import { useVisitorSession } from '../hooks/useVisitorSession';
import { motion, AnimatePresence } from 'framer-motion';

export function PublicProductPage() {
  const { slug = '' } = useParams();
  const [searchParams] = useSearchParams();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoOpen, setInfoOpen] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [leadIntent, setLeadIntent] = useState<'quote' | 'demo' | 'brochure' | 'contact'>('quote');
  const [activeHotspot, setActiveHotspot] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const { visitorId, returningVisitor, visitorInfo, trackEvent } = useVisitorSession(slug, product?.organization_id);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setErrorMsg(null);

    fetch(`/api/public/products/${slug}`)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'Product unavailable or draft mode.');
        }
        return res.json();
      })
      .then((data) => {
        setProduct(data);
        if (data.name) {
          document.title = `${data.name} — ${data.organization?.name || 'I3DION Spatial'}`;
        }
      })
      .catch((err) => {
        setErrorMsg(err.message || 'Could not load product experience.');
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product?.name || '3D Product',
        url: window.location.href,
      }).catch(() => null);
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => null);
      setFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => null);
      setFullscreen(false);
    }
  };

  const handleLeadTrigger = (intent: 'quote' | 'demo' | 'brochure' | 'contact') => {
    setLeadIntent(intent);
    setLeadModalOpen(true);
    trackEvent('lead_modal_opened', { intent });
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#050a15] text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent shadow-lg shadow-blue-500/30" />
          <p className="text-sm font-medium tracking-widest text-slate-400 uppercase animate-pulse">
            Loading Spatial Experience...
          </p>
        </div>
      </div>
    );
  }

  if (errorMsg || !product) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#050a15] p-4 text-white">
        <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/90 p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Box size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white">Product Unavailable</h1>
          <p className="mt-2 text-sm text-slate-400 leading-relaxed">
            {errorMsg || 'This 3D product experience is not available or has been unpublished.'}
          </p>
          <div className="mt-6">
            <a
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white transition hover:bg-blue-500 shadow-lg shadow-blue-600/30"
            >
              Return Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  const galleryImages = (product.assets ?? []).filter(
    (a: any) => a.asset_type === 'image' || a.asset_type === 'thumbnail'
  );

  return (
    <main
      ref={containerRef}
      className="relative h-[100dvh] w-screen overflow-hidden bg-[#030712] font-sans text-slate-100 select-none"
    >
      {/* Background 3D Viewer */}
      <div className="absolute inset-0 z-0">
        <ThreeProduct
          modelUrl={product.model_url || ''}
          productName={product.name}
          autoRotate={autoRotate}
        />
      </div>

      {/* Subtle Ambient Vignette & Gradient */}
      <div className="pointer-events-none absolute inset-0 z-5 bg-gradient-to-t from-[#030712] via-transparent to-[#030712]/60" />

      {/* Returning Visitor Greeting Bar */}
      {returningVisitor && visitorInfo?.name && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-full border border-blue-500/30 bg-slate-900/80 px-4 py-1.5 backdrop-blur-xl shadow-lg"
        >
          <Sparkles size={14} className="text-blue-400 animate-pulse" />
          <span className="text-xs font-medium text-slate-200">
            Welcome back, <strong className="text-blue-300 font-semibold">{visitorInfo.name}</strong>
          </span>
        </motion.div>
      )}

      {/* Floating Header UI */}
      <header className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-3">
          {/* Org Logo / Name */}
          {product.organization?.logo_url ? (
            <img
              src={product.organization.logo_url}
              alt={product.organization.name}
              className="h-11 w-11 rounded-2xl border border-white/10 bg-slate-900/80 p-1 object-contain backdrop-blur-xl shadow-xl"
            />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-slate-900/80 text-blue-400 backdrop-blur-xl shadow-xl">
              <Building2 size={20} />
            </div>
          )}
          <div>
            <h1 className="text-lg md:text-xl font-bold tracking-tight text-white drop-shadow-md">
              {product.name}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="rounded-md bg-blue-500/20 px-2 py-0.5 text-[10px] uppercase font-bold tracking-widest text-blue-300 border border-blue-500/30 backdrop-blur-md">
                {product.category || 'Spatial Asset'}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {product.organization?.name || 'I3DION'}
              </span>
            </div>
          </div>
        </div>

        {/* Desktop Controls Header */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            title="Toggle Auto Rotate"
            className={`flex h-10 w-10 items-center justify-center rounded-xl border backdrop-blur-xl transition active:scale-95 ${
              autoRotate
                ? 'border-blue-500/40 bg-blue-600/20 text-blue-300'
                : 'border-white/10 bg-slate-900/60 text-slate-400 hover:text-white'
            }`}
          >
            <RefreshCw size={18} className={autoRotate ? 'animate-spin' : ''} style={{ animationDuration: '8s' }} />
          </button>

          <button
            onClick={handleShare}
            title="Share Experience"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-slate-900/60 text-slate-300 backdrop-blur-xl transition hover:bg-slate-800 active:scale-95"
          >
            {copied ? <CheckCircle2 size={18} className="text-emerald-400" /> : <Share2 size={18} />}
          </button>

          <button
            onClick={toggleFullscreen}
            title="Toggle Fullscreen"
            className="hidden md:flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-slate-900/60 text-slate-300 backdrop-blur-xl transition hover:bg-slate-800 active:scale-95"
          >
            {fullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>

          <button
            onClick={() => setInfoOpen(!infoOpen)}
            title="Product Info"
            className={`flex h-10 w-10 items-center justify-center rounded-xl border backdrop-blur-xl transition active:scale-95 ${
              infoOpen
                ? 'border-blue-500/40 bg-blue-600/20 text-blue-300'
                : 'border-white/10 bg-slate-900/60 text-slate-400 hover:text-white'
            }`}
          >
            <Info size={18} />
          </button>
        </div>
      </header>

      {/* Floating Bottom CTA Bar */}
      <div className="absolute bottom-6 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-auto max-w-4xl mx-auto">
        <div className="flex items-center gap-2">
          {/* Device Aware AR Launch Button */}
          <ViewInARButton
            modelUrl={product.model_url}
            usdzUrl={product.usdz_url}
            title={product.name}
            className="h-12 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-xl shadow-blue-600/30 transition-all border border-blue-400/30"
          />

          <button
            onClick={() => handleLeadTrigger('quote')}
            className="h-12 px-5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-white font-semibold text-sm backdrop-blur-xl shadow-lg transition active:scale-95 flex items-center gap-2"
          >
            <Mail size={16} className="text-blue-400" />
            Request Quote
          </button>
        </div>

        {product.document_url && (
          <a
            href={product.document_url}
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex h-12 px-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-medium text-xs backdrop-blur-xl shadow-lg transition items-center gap-2"
          >
            <FileText size={16} className="text-slate-400" />
            Download Spec Sheet
          </a>
        )}
      </div>

      {/* Slide-over Info & Specifications Drawer */}
      <AnimatePresence>
        {infoOpen && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="pointer-events-auto absolute top-20 right-4 bottom-24 z-20 w-[calc(100%-2rem)] max-w-sm rounded-3xl border border-slate-800 bg-slate-950/85 backdrop-blur-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-slate-800 p-4">
              <h2 className="text-sm font-bold tracking-wider text-slate-300 uppercase flex items-center gap-2">
                <Layers size={16} className="text-blue-400" />
                Product Details
              </h2>
              <button
                onClick={() => setInfoOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
              {/* Description */}
              {product.description && (
                <div>
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Overview
                  </h3>
                  <p className="text-xs leading-relaxed text-slate-300">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Specifications */}
              {product.specs && Object.keys(product.specs).length > 0 && (
                <div>
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-3">
                    Technical Specifications
                  </h3>
                  <div className="space-y-2.5">
                    {Object.entries(product.specs).map(([key, val]) => (
                      <div
                        key={key}
                        className="flex justify-between items-center rounded-xl bg-slate-900/60 border border-slate-800/80 p-2.5 text-xs"
                      >
                        <span className="text-slate-400 font-medium">{key}</span>
                        <span className="font-semibold text-white text-right max-w-[60%] truncate">
                          {String(val)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Gallery Images */}
              {galleryImages.length > 0 && (
                <div>
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-3">
                    Gallery
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {galleryImages.map((img: any) => (
                      <div
                        key={img.id}
                        className="group relative h-24 overflow-hidden rounded-xl border border-slate-800 bg-slate-900"
                      >
                        <img
                          src={img.public_url}
                          alt={img.original_name}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions Footer inside Drawer */}
            <div className="border-t border-slate-800 p-4 bg-slate-900/60 space-y-2">
              <button
                onClick={() => handleLeadTrigger('quote')}
                className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-md shadow-blue-600/20"
              >
                <Mail size={15} />
                Contact Enterprise Sales
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Smart Progressive Lead Capture Modal */}
      <SmartLeadCapture
        isOpen={leadModalOpen}
        onClose={() => setLeadModalOpen(false)}
        productSlug={slug}
        intent={leadIntent}
      />

      {/* Exit Intent Survey */}
      <ExitIntentSurvey />
    </main>
  );
}
