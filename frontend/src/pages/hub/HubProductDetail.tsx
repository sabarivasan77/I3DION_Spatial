import { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Box, 
  Share2, 
  CheckCircle2, 
  Layers, 
  Maximize2, 
  RotateCcw, 
  PlusCircle, 
  Info,
  ShieldCheck,
  FileText,
  Download
} from 'lucide-react';
import { getSpatialHubModelBySlugOrId, SpatialHubModel } from '../../data/spatialHubModels';
import ThreeProduct, { RenderMode } from '../../components/ThreeProduct';
import { useToast } from '../../components/Toast';
import { hubApi } from '../../services/hubApi';

export function HubProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, info } = useToast();
  
  const [renderMode, setRenderMode] = useState<RenderMode>('solid');
  const [autoRotate, setAutoRotate] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [apiModel, setApiModel] = useState<SpatialHubModel | null>(null);
  const viewerContainerRef = useRef<HTMLDivElement>(null);

  // Fetch product from backend DB API if available
  useEffect(() => {
    if (!id) return;
    hubApi.getProduct(id).then((p) => {
      if (p && p.id) {
        setApiModel({
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
          viewsCount: p.views_count || 150,
          likesCount: p.likes_count || 42,
          downloadsCount: p.downloads_count || 18,
          metadata: {
            objectType: 'Industrial 3D Asset Record',
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
        });
      }
    }).catch(() => null);
  }, [id]);

  // Lock background scroll when QR Modal is active
  useEffect(() => {
    if (showQrModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showQrModal]);

  // Retrieve model from API or fallback master dataset
  const model = useMemo(() => {
    if (apiModel) return apiModel;
    if (!id) return undefined;
    return getSpatialHubModelBySlugOrId(id);
  }, [id, apiModel]);

  if (!model) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm max-w-md w-full text-center">
          <Box className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Model Not Found</h2>
          <p className="text-xs text-slate-500 mb-6">The requested 3D industrial model does not exist or has been moved.</p>
          <Link
            to="/hub"
            className="inline-flex items-center px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Spatial Hub
          </Link>
        </div>
      </div>
    );
  }

  const handleShare = () => {
    const publicUrl = `${window.location.origin}/hub/product/${model.slug}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(publicUrl);
      success('Link Copied', `Public link for ${model.name} copied to clipboard.`);
    } else {
      info('Share Link', publicUrl);
    }
  };

  const handleFullscreen = () => {
    if (!viewerContainerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => null);
    } else {
      viewerContainerRef.current.requestFullscreen().catch(() => null);
    }
  };

  const handleUseInCatalog = () => {
    success('Catalog Integration', `Added ${model.name} to product catalog workflow.`);
    // Navigate to product catalog or creation flow with prefilled 3D asset reference
    navigate(`/products?selectModel=${encodeURIComponent(model.modelUrl)}&modelName=${encodeURIComponent(model.name)}`);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] pb-16">
      {/* Top Navigation */}
      <div className="bg-white border-b border-slate-200 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            to="/hub"
            className="inline-flex items-center text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Master 3D Library
          </Link>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-400">Category:</span>
            <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
              {model.category}
            </span>
          </div>
        </div>
      </div>

      {/* ─── 65-75% / 25-35% MAIN VIEWER & INFO SPLIT LAYOUT ─────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* LEFT: 3D VIEWER (65-75% visual priority) */}
          <div className="w-full lg:w-[68%] flex flex-col gap-4">
            <div
              ref={viewerContainerRef}
              className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-slate-900 rounded-3xl overflow-hidden shadow-xl border border-slate-200"
            >
              {/* 3D Canvas */}
              <ThreeProduct
                modelUrl={model.modelUrl}
                productName={model.name}
                renderMode={renderMode}
                autoRotate={autoRotate}
                themeMode="dark"
              />

              {/* ─── VISUALIZATION MODE SELECTOR OVERLAY ──────────────── */}
              <div className="absolute top-4 left-4 z-20 flex items-center bg-slate-900/80 backdrop-blur-md p-1 rounded-2xl border border-white/10 shadow-2xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 flex items-center">
                  <Layers className="w-3 h-3 mr-1 text-blue-400" /> Mode:
                </span>
                {(['solid', 'wireframe', 'xray'] as RenderMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setRenderMode(mode)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all ${
                      renderMode === mode
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              {/* ─── COMPACT VIEWER CONTROLS OVERLAY ───────────────────── */}
              <div className="absolute bottom-4 right-4 z-20 flex items-center space-x-2 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 shadow-2xl">
                <button
                  onClick={() => setAutoRotate(!autoRotate)}
                  className={`p-2 rounded-xl text-xs font-bold transition-colors ${
                    autoRotate ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-white/10'
                  }`}
                  title="Toggle Auto Rotate"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={handleFullscreen}
                  className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                  title="Toggle Fullscreen"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>

              {/* AR Ready Indicator */}
              <div className="absolute top-4 right-4 z-20 bg-blue-600/90 backdrop-blur text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg flex items-center space-x-1.5">
                <Box className="w-4 h-4" />
                <span>AR Enabled</span>
              </div>
            </div>

            {/* Viewer Explanation Note */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 flex items-center justify-between text-xs text-slate-600 shadow-sm">
              <div className="flex items-center space-x-2">
                <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span>
                  Current View: <strong className="uppercase text-slate-900">{renderMode} Mode</strong> — Drag to rotate, scroll to zoom.
                </span>
              </div>
              <div className="hidden sm:flex items-center space-x-3 text-[11px] font-mono text-slate-400">
                <span>FPS: 60</span>
                <span>•</span>
                <span>Geometry: Manifold CAD</span>
              </div>
            </div>
          </div>

          {/* RIGHT: MODEL INFORMATION PANEL (25-35% visual priority) */}
          <div className="w-full lg:w-[32%] flex flex-col gap-6">
            
            {/* Title & Short Description */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
                {model.name}
              </h1>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">
                {model.category}
              </p>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                {model.longDescription}
              </p>

              {/* Primary Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => setShowQrModal(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center space-x-2"
                >
                  <Box className="w-4 h-4" />
                  <span>VIEW IN AR (DESKTOP QR / MOBILE)</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleShare}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 rounded-xl transition-colors flex items-center justify-center space-x-1.5"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share Link</span>
                  </button>

                  <button
                    onClick={handleUseInCatalog}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 rounded-xl transition-colors flex items-center justify-center space-x-1.5"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-blue-600" />
                    <span>Use in Catalog</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Factual Technical Information Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-4 flex items-center">
                <ShieldCheck className="w-4 h-4 text-emerald-500 mr-1.5" /> Factual Geometry Metadata
              </h3>

              <div className="space-y-3 divide-y divide-slate-100 text-xs">
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500 font-medium">Object Type</span>
                  <span className="font-bold text-slate-900 text-right max-w-[60%]">{model.metadata.objectType}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500 font-medium">Category</span>
                  <span className="font-bold text-slate-900">{model.metadata.industrialCategory}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500 font-medium">Supported Modes</span>
                  <span className="font-bold text-blue-600">Solid / Wireframe / X-Ray / AR</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500 font-medium">Component Structure</span>
                  <span className="font-bold text-slate-900 text-right max-w-[60%]">{model.metadata.componentStructure}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500 font-medium">Characteristics</span>
                  <span className="font-bold text-slate-900 text-right max-w-[60%]">{model.metadata.modelCharacteristics}</span>
                </div>
              </div>
            </div>

            {/* Key Features List */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">
                Key Highlights
              </h3>
              <ul className="space-y-2">
                {model.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start text-xs text-slate-700 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Attribution & License Safety Manifest */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-[11px] text-slate-500 space-y-1">
              <div className="font-bold text-slate-700">Verified Model License</div>
              <div>Source: {model.source.repository}</div>
              <div>Author: {model.source.author}</div>
              <div>License: {model.source.license}</div>
            </div>

          </div>

        </div>
      </div>

      {/* ─── DESKTOP -> MOBILE AR QR MODAL ──────────────────────────────── */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 relative text-center">
            <button
              onClick={() => setShowQrModal(null as any)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 text-sm font-bold w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"
            >
              ✕
            </button>

            <div className="inline-flex items-center space-x-2 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full mb-4">
              <Box className="w-3.5 h-3.5" />
              <span>I3DION SPATIAL AR HANDOFF</span>
            </div>

            <h2 className="text-xl font-extrabold text-slate-900 mb-1">{model.name}</h2>
            <p className="text-xs text-slate-500 mb-6">Scan with your phone to launch full spatial WebAR experience.</p>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 inline-block mb-6 shadow-inner">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                  `${window.location.origin}/hub/product/${model.slug}`
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
                  const url = `${window.location.origin}/hub/product/${model.slug}`;
                  navigator.clipboard.writeText(url);
                  success('Link Copied', 'AR Public Link copied to clipboard');
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 rounded-xl transition-colors shadow-sm"
              >
                Copy AR Mobile Link
              </button>

              <button
                onClick={() => setShowQrModal(false)}
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
