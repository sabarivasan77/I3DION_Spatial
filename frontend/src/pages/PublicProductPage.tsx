import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  Box,
  FileText,
  Info,
  Mail,
  Maximize2,
  Minimize2,
  RefreshCw,
  Share2,
  Sparkles,
  X,
  CheckCircle2,
  Layers,
  Download,
  RotateCw,
  ZoomIn,
  ZoomOut,
  ExternalLink,
  ChevronDown,
  Check,
  ShieldCheck,
  Cpu,
  Smartphone
} from 'lucide-react';
import ThreeProduct from '../components/ThreeProduct';
import { ViewInARButton } from '../components/ViewInARButton';
import { SmartLeadCapture } from '../components/SmartLeadCapture';
import { ExitIntentSurvey } from '../components/ExitIntentSurvey';
import { useVisitorSession } from '../hooks/useVisitorSession';
import { motion, AnimatePresence } from 'framer-motion';
import { BrandLogo } from '../components/BrandLogo';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import { detectPlatform } from '../utils/deviceDetection';
import { launchSceneViewer } from '../services/sceneViewer';
import { launchQuickLook } from '../services/quickLook';

export function PublicProductPage() {
  const { slug = '' } = useParams();
  const [searchParams] = useSearchParams();
  const { success, error: showError } = useToast();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active section tab ('overview' | 'specs' | 'media' | 'documents')
  const [activeTab, setActiveTab] = useState<'overview' | 'specs' | 'media' | 'documents'>('overview');

  // Mobile accordion state
  const [expandedAccordions, setExpandedAccordions] = useState<Record<string, boolean>>({
    overview: true,
    specs: true,
    media: false,
    documents: true,
  });

  const [fullscreen, setFullscreen] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [leadIntent, setLeadIntent] = useState<'quote' | 'demo' | 'brochure' | 'contact'>('quote');
  const [copied, setCopied] = useState(false);
  const [arIntentModal, setArIntentModal] = useState(false);

  const { returningVisitor, visitorInfo, trackEvent } = useVisitorSession(slug, product?.organization_id);

  const viewerContainerRef = useRef<HTMLDivElement>(null);

  // Fetch product data
  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setErrorMsg(null);

    api.getPublicProduct(slug)
      .then((data) => {
        if (!data) {
          throw new Error('Product unavailable or draft mode.');
        }
        setProduct(data);
        if (data.name) {
          document.title = `${data.name} — ${data.organization?.name || 'I3DION Spatial'}`;
        }

        // Check if opened via AR handoff link (?ar=1)
        const isArHandoff = searchParams.get('ar') === '1' || searchParams.get('ar') === 'true';
        if (isArHandoff) {
          const platform = detectPlatform();
          if (platform === 'ANDROID' && data.model_url) {
            launchSceneViewer(data.model_url, data.name);
          } else if (platform === 'IOS' && (data.usdz_url || data.model_url)) {
            if (data.usdz_url) launchQuickLook(data.usdz_url);
            else launchSceneViewer(data.model_url, data.name);
          } else {
            setArIntentModal(true);
          }
        }
      })
      .catch((err) => {
        setErrorMsg(err.message || 'Could not load product experience.');
      })
      .finally(() => setLoading(false));
  }, [slug, searchParams]);

  const handleShare = () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: product?.name || 'Industrial 3D Product',
        url: shareUrl,
      }).catch(() => null);
    } else {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareUrl);
      } else {
        const ta = document.createElement('textarea');
        ta.value = shareUrl;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      success('Copied link', 'Product URL copied to clipboard.');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      viewerContainerRef.current?.requestFullscreen().catch(() => null);
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

  const toggleAccordion = (key: string) => {
    setExpandedAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 text-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent shadow-lg shadow-blue-500/20" />
          <p className="text-sm font-semibold tracking-widest text-slate-600 uppercase animate-pulse">
            Loading Industrial 3D Experience...
          </p>
        </div>
      </div>
    );
  }

  if (errorMsg || !product || product.status === 'Draft' || product.restrictedReason) {
    const isRestricted = product?.restrictedReason === 'ORGANIZATION_ONLY' || product?.restrictedReason === 'RESTRICTED_ACCESS';
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 p-4 text-slate-900">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl">
          <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border ${
            isRestricted ? 'bg-amber-50 text-amber-500 border-amber-200' : 'bg-rose-50 text-rose-500 border-rose-200'
          }`}>
            <Box size={32} />
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            {isRestricted ? 'Organization Access Required' : 'Product Unavailable'}
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            {product?.message || errorMsg || 'This industrial product experience is not available or is currently in draft mode.'}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <a
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-6 text-xs font-semibold text-white transition hover:bg-blue-500 shadow-md shadow-blue-600/20"
            >
              Return Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  const galleryImages = (product.assets ?? []).filter(
    (a: any) => a.asset_type === 'image' || a.asset_type === 'thumbnail' || a.file_category === 'image'
  );

  const documentAssets = (product.assets ?? []).filter(
    (a: any) => a.asset_type === 'document' || a.file_category === 'document' || a.original_name?.endsWith('.pdf')
  );
  if (product.document_url && !documentAssets.some((d: any) => d.public_url === product.document_url)) {
    documentAssets.push({
      id: 'main-spec-doc',
      original_name: 'Technical Datasheet.pdf',
      public_url: product.document_url,
      size_bytes: 1048576,
    });
  }

  const specsList = product.specs ? Object.entries(product.specs) : [];

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900 pb-24 lg:pb-12">
      {/* ─── 2. CLEAN PUBLIC HEADER (64–72px) ────────────────────────────────── */}
      <header className="sticky top-0 z-40 flex h-16 md:h-18 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 md:px-8 backdrop-blur-md shadow-xs">
        {/* LEFT: Organization Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-1">
            {product.organization?.logo_url ? (
              <img
                src={product.organization.logo_url}
                alt={product.organization.name}
                className="h-full w-full object-contain rounded-lg"
              />
            ) : (
              <BrandLogo variant="icon" className="h-full w-full object-contain" />
            )}
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 truncate max-w-[160px] sm:max-w-xs md:max-w-md">
              {product.name}
            </h1>
            <p className="text-[11px] font-medium text-slate-500">
              {product.organization?.name || 'I3DION Spatial Enterprise'}
            </p>
          </div>
        </div>

        {/* CENTER / NAV: Compact Section Tabs (Desktop) */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600">
          <button
            onClick={() => scrollToSection('section-hero')}
            className="px-3.5 py-1.5 rounded-lg hover:bg-white hover:text-blue-600 transition"
          >
            Product
          </button>
          {specsList.length > 0 && (
            <button
              onClick={() => scrollToSection('section-specs')}
              className="px-3.5 py-1.5 rounded-lg hover:bg-white hover:text-blue-600 transition"
            >
              Specifications
            </button>
          )}
          {galleryImages.length > 0 && (
            <button
              onClick={() => scrollToSection('section-media')}
              className="px-3.5 py-1.5 rounded-lg hover:bg-white hover:text-blue-600 transition"
            >
              Media
            </button>
          )}
          {documentAssets.length > 0 && (
            <button
              onClick={() => scrollToSection('section-documents')}
              className="px-3.5 py-1.5 rounded-lg hover:bg-white hover:text-blue-600 transition"
            >
              Documents
            </button>
          )}
        </nav>

        {/* RIGHT: Share & AR CTA */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            title="Share Product"
            aria-label="Share Product"
            className="flex h-10 min-w-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition active:scale-95 text-xs font-semibold px-3 gap-1.5"
          >
            {copied ? <Check size={16} className="text-emerald-600" /> : <Share2 size={16} />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Share'}</span>
          </button>

          <ViewInARButton
            modelUrl={product.model_url}
            usdzUrl={product.usdz_url}
            productSlug={slug}
            title={product.name}
            logoUrl={product.organization?.logo_url}
            className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-600/20"
          />
        </div>
      </header>

      {/* Returning Visitor Greeting Bar */}
      {returningVisitor && visitorInfo?.name && (
        <div className="bg-blue-50 border-b border-blue-100 px-4 py-2 text-center text-xs font-medium text-blue-700">
          <span className="inline-flex items-center gap-1.5">
            <Sparkles size={14} className="text-blue-600 animate-pulse" />
            Welcome back, <strong>{visitorInfo.name}</strong> — Instant technical support & quote requests are enabled.
          </span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6 space-y-8">
        {/* ─── 3. HERO SECTION (2-COLUMN DESKTOP: 60% 3D Viewer / 40% Product Info) ──── */}
        <section id="section-hero" className="grid gap-6 lg:grid-cols-[1.4fr_1fr] items-start">
          {/* ─── LEFT: 3D VIEWER CONTAINER ───────────────────────────────────── */}
          <div
            ref={viewerContainerRef}
            className="relative h-[380px] sm:h-[480px] lg:h-[540px] w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm flex flex-col"
          >
            {/* 3D Canvas */}
            <div className="relative flex-1 w-full h-full">
              <ThreeProduct
                modelUrl={product.model_url || ''}
                productName={product.name}
                autoRotate={autoRotate}
              />
            </div>

            {/* Viewer Control Bar Overlay (Touch Targets >= 44px) */}
            <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-auto">
              <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white/90 p-1.5 backdrop-blur-xl shadow-md">
                <button
                  onClick={() => setAutoRotate(!autoRotate)}
                  title={autoRotate ? 'Pause Rotation' : 'Auto Rotate'}
                  aria-label="Toggle Auto Rotation"
                  className={`flex h-11 w-11 items-center justify-center rounded-xl transition ${
                    autoRotate ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <RotateCw size={18} className={autoRotate ? 'animate-spin' : ''} style={{ animationDuration: '10s' }} />
                </button>

                <button
                  onClick={toggleFullscreen}
                  title="Fullscreen"
                  aria-label="Toggle Fullscreen"
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 transition"
                >
                  {fullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </button>
              </div>

              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/90 px-3 py-1.5 backdrop-blur-xl shadow-md text-xs font-semibold text-slate-600">
                <Box size={14} className="text-blue-600" />
                <span>3D Interactive Studio</span>
              </div>
            </div>
          </div>

          {/* ─── RIGHT: PRODUCT INFORMATION PANEL ────────────────────────────── */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm space-y-6 flex flex-col justify-between h-full">
            <div className="space-y-4">
              {/* Category & Status Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-700 border border-blue-100">
                  {product.category || 'Industrial Equipment'}
                </span>
                <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-100 flex items-center gap-1">
                  <ShieldCheck size={14} /> Published & Verified
                </span>
              </div>

              {/* Product Title */}
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
                {product.name}
              </h1>

              {/* Short Description */}
              {product.description && (
                <p className="text-xs md:text-sm leading-relaxed text-slate-600">
                  {product.description}
                </p>
              )}

              {/* Key Highlights (Extracted from real specs/attributes) */}
              {specsList.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Key Highlights</p>
                  <div className="grid grid-cols-2 gap-2">
                    {specsList.slice(0, 4).map(([k, v]) => (
                      <div key={k} className="rounded-xl bg-slate-50 border border-slate-100 p-2.5 text-xs">
                        <span className="block text-[10px] font-semibold text-slate-400 uppercase">{k}</span>
                        <span className="font-bold text-slate-900 truncate block mt-0.5">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Primary & Secondary Action CTAs */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <ViewInARButton
                modelUrl={product.model_url}
                usdzUrl={product.usdz_url}
                productSlug={slug}
                title={product.name}
                logoUrl={product.organization?.logo_url}
                className="w-full h-13 text-sm rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-blue-600/25 border border-blue-500"
              />

              <button
                onClick={() => handleLeadTrigger('quote')}
                className="w-full h-12 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-bold text-xs transition flex items-center justify-center gap-2 active:scale-95"
              >
                <Mail size={16} className="text-blue-600" />
                Request Commercial Quote
              </button>
            </div>
          </div>
        </section>

        {/* ─── 4. COMPACT KEY SPECIFICATIONS GRID ───────────────────────────── */}
        {specsList.length > 0 && (
          <section id="section-specs-grid" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-bold tracking-wider text-slate-900 uppercase mb-4 flex items-center gap-2">
              <Cpu size={16} className="text-blue-600" />
              Key Specifications Summary
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {specsList.map(([key, val]) => (
                <div key={key} className="rounded-2xl bg-slate-50 border border-slate-100 p-4 text-xs">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{key}</p>
                  <p className="mt-1 text-sm font-bold text-slate-900 truncate">{String(val)}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ─── 5. PRODUCT TABS / ACCORDIONS (Overview, Specs, Media, Documents) ─── */}
        <section id="section-tabs" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          {/* Desktop Tabs Header */}
          <div className="hidden lg:flex items-center border-b border-slate-200 gap-8 mb-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
                activeTab === 'overview'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              Overview
            </button>
            {specsList.length > 0 && (
              <button
                onClick={() => setActiveTab('specs')}
                className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
                  activeTab === 'specs'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                Full Specifications
              </button>
            )}
            {galleryImages.length > 0 && (
              <button
                onClick={() => setActiveTab('media')}
                className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
                  activeTab === 'media'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                Media Gallery ({galleryImages.length})
              </button>
            )}
            {documentAssets.length > 0 && (
              <button
                onClick={() => setActiveTab('documents')}
                className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
                  activeTab === 'documents'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                Technical Documents ({documentAssets.length})
              </button>
            )}
          </div>

          {/* Desktop Content Views */}
          <div className="hidden lg:block">
            {activeTab === 'overview' && (
              <div className="space-y-4 max-w-3xl">
                <h3 className="text-base font-bold text-slate-900">Product Overview</h3>
                <p className="text-xs md:text-sm leading-relaxed text-slate-600">
                  {product.description || 'No detailed overview provided for this industrial product.'}
                </p>
              </div>
            )}

            {activeTab === 'specs' && specsList.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Specification Parameter</th>
                      <th className="py-3 px-4">Technical Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {specsList.map(([param, val]) => (
                      <tr key={param} className="hover:bg-slate-50/50 transition">
                        <td className="py-3 px-4 text-slate-600 font-semibold">{param}</td>
                        <td className="py-3 px-4 text-slate-900">{String(val)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'media' && galleryImages.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {galleryImages.map((img: any) => (
                  <div key={img.id} className="group relative h-40 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                    <img
                      src={img.public_url}
                      alt={img.original_name}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'documents' && documentAssets.length > 0 && (
              <div className="grid gap-3 md:grid-cols-2">
                {documentAssets.map((doc: any) => (
                  <div key={doc.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <FileText size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 truncate max-w-xs">{doc.original_name || 'Document'}</p>
                        <p className="text-[10px] text-slate-400">PDF Technical Document</p>
                      </div>
                    </div>
                    <a
                      href={doc.public_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-9 items-center justify-center rounded-xl bg-white border border-slate-200 px-3 text-xs font-bold text-blue-600 hover:bg-blue-50 transition gap-1.5 shadow-2xs"
                    >
                      <Download size={14} /> Download
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mobile Accordion Views */}
          <div className="block lg:hidden space-y-3">
            {/* Overview Accordion */}
            <div className="rounded-2xl border border-slate-200 overflow-hidden">
              <button
                onClick={() => toggleAccordion('overview')}
                className="w-full flex items-center justify-between p-4 bg-slate-50 text-xs font-bold text-slate-900"
              >
                <span>Product Overview</span>
                <ChevronDown size={16} className={`transition transform ${expandedAccordions.overview ? 'rotate-180' : ''}`} />
              </button>
              {expandedAccordions.overview && (
                <div className="p-4 text-xs text-slate-600 border-t border-slate-100">
                  {product.description || 'No detailed overview provided.'}
                </div>
              )}
            </div>

            {/* Specifications Accordion */}
            {specsList.length > 0 && (
              <div id="section-specs" className="rounded-2xl border border-slate-200 overflow-hidden">
                <button
                  onClick={() => toggleAccordion('specs')}
                  className="w-full flex items-center justify-between p-4 bg-slate-50 text-xs font-bold text-slate-900"
                >
                  <span>Technical Specifications</span>
                  <ChevronDown size={16} className={`transition transform ${expandedAccordions.specs ? 'rotate-180' : ''}`} />
                </button>
                {expandedAccordions.specs && (
                  <div className="p-4 border-t border-slate-100 space-y-2">
                    {specsList.map(([p, v]) => (
                      <div key={p} className="flex justify-between text-xs py-1.5 border-b border-slate-50">
                        <span className="text-slate-500 font-semibold">{p}</span>
                        <span className="text-slate-900 font-bold">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Media Accordion */}
            {galleryImages.length > 0 && (
              <div id="section-media" className="rounded-2xl border border-slate-200 overflow-hidden">
                <button
                  onClick={() => toggleAccordion('media')}
                  className="w-full flex items-center justify-between p-4 bg-slate-50 text-xs font-bold text-slate-900"
                >
                  <span>Media Gallery ({galleryImages.length})</span>
                  <ChevronDown size={16} className={`transition transform ${expandedAccordions.media ? 'rotate-180' : ''}`} />
                </button>
                {expandedAccordions.media && (
                  <div className="p-4 border-t border-slate-100 grid grid-cols-2 gap-2">
                    {galleryImages.map((img: any) => (
                      <img key={img.id} src={img.public_url} alt="Gallery" className="h-24 w-full object-cover rounded-xl border border-slate-200" />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Documents Accordion */}
            {documentAssets.length > 0 && (
              <div id="section-documents" className="rounded-2xl border border-slate-200 overflow-hidden">
                <button
                  onClick={() => toggleAccordion('documents')}
                  className="w-full flex items-center justify-between p-4 bg-slate-50 text-xs font-bold text-slate-900"
                >
                  <span>Documents ({documentAssets.length})</span>
                  <ChevronDown size={16} className={`transition transform ${expandedAccordions.documents ? 'rotate-180' : ''}`} />
                </button>
                {expandedAccordions.documents && (
                  <div className="p-4 border-t border-slate-100 space-y-2">
                    {documentAssets.map((doc: any) => (
                      <a
                        key={doc.id}
                        href={doc.public_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs font-semibold text-slate-800 border border-slate-100"
                      >
                        <span className="truncate">{doc.original_name || 'Document'}</span>
                        <Download size={14} className="text-blue-600" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ─── 6. MINIMAL ENTERPRISE FOOTER ─────────────────────────────────── */}
        <footer className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-xs text-slate-500 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <BrandLogo variant="icon" className="h-8 w-8 object-contain" />
              <span className="font-bold text-slate-900">{product.organization?.name || 'I3DION Spatial Enterprise'}</span>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
              <button onClick={() => handleLeadTrigger('quote')} className="hover:text-blue-600 transition">Request Quote</button>
              <button onClick={handleShare} className="hover:text-blue-600 transition">Share Experience</button>
            </div>
          </div>
          <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400">
            Powered by <strong className="text-slate-600 font-semibold">I3DION Spatial Platform</strong> — Enterprise 3D & Spatial Telemetry
          </div>
        </footer>
      </div>

      {/* ─── 7. MOBILE STICKY BOTTOM ACTION BAR ──────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center gap-2 bg-white/95 border-t border-slate-200 p-3 backdrop-blur-lg shadow-lg lg:hidden">
        <ViewInARButton
          modelUrl={product.model_url}
          usdzUrl={product.usdz_url}
          productSlug={slug}
          title={product.name}
          logoUrl={product.organization?.logo_url}
          className="flex-1 h-11 text-xs rounded-xl bg-blue-600 text-white font-bold"
        />

        <button
          onClick={() => handleLeadTrigger('quote')}
          className="flex-1 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs transition border border-slate-200 flex items-center justify-center gap-1.5"
        >
          <Mail size={15} className="text-blue-600" />
          Request Quote
        </button>
      </div>

      {/* ─── 8. AR INTENT MODAL FOR MOBILE SCAN ───────────────────────────────── */}
      <AnimatePresence>
        {arIntentModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl border border-slate-100 space-y-4"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Smartphone size={28} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">View Product in AR</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Ready to place <strong>{product.name}</strong> into your environment.
              </p>
              <div className="space-y-2 pt-2">
                <ViewInARButton
                  modelUrl={product.model_url}
                  usdzUrl={product.usdz_url}
                  productSlug={slug}
                  title={product.name}
                  logoUrl={product.organization?.logo_url}
                  className="w-full h-11 text-xs rounded-xl bg-blue-600 text-white font-bold"
                />
                <button
                  onClick={() => setArIntentModal(false)}
                  className="w-full h-10 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200 transition"
                >
                  Explore in 3D First
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Lead Capture Modal */}
      <SmartLeadCapture
        isOpen={leadModalOpen}
        onClose={() => setLeadModalOpen(false)}
        productSlug={slug}
        intent={leadIntent}
      />

      {/* Exit Intent Survey */}
      <ExitIntentSurvey />
    </div>
  );
}
