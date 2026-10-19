import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  GitCompare, 
  Trash2, 
  Plus, 
  ArrowLeft, 
  Share2, 
  ShoppingBag, 
  Eye, 
  ShieldCheck, 
  Layers, 
  Box, 
  Sparkles, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { useHubCompareStore, CompareModelItem } from '../../store/hubCompareStore';
import { useHubQuoteStore } from '../../store/hubQuoteStore';
import { hubApi } from '../../services/hubApi';
import { useToast } from '../../components/Toast';
import { ModelCardPreview } from '../../components/hub/ModelCardPreview';
import { SPATIAL_HUB_MODELS } from '../../data/spatialHubModels';
import { updateSeoMeta } from '../../utils/seoMeta';

export default function HubComparePage() {
  const [searchParams] = useSearchParams();
  const urlIds = searchParams.get('ids')?.split(',').filter(Boolean) || [];
  
  const { models, removeModel, clearCompare, addModel, setModels } = useHubCompareStore();
  const { addItem, isInBasket } = useHubQuoteStore();
  const { success, info } = useToast();

  const [loadingInitial, setLoadingInitial] = useState(false);

  // If URL has ?ids=..., fetch and populate if not loaded
  useEffect(() => {
    if (urlIds.length > 0 && models.length === 0) {
      setLoadingInitial(true);
      Promise.all(
        urlIds.slice(0, 4).map(async (id) => {
          try {
            const p = await hubApi.getProduct(id);
            return {
              id: p.id,
              name: p.name,
              slug: p.slug || p.id,
              category: p.category,
              description: p.description,
              thumbnail: p.poster_url || p.imageUrl || `/models/posters/${p.slug}.svg`,
              modelUrl: p.model_url || p.modelUrl || `/models/preview/${p.slug}.glb`,
              previewUrl: p.preview_model_url || `/models/preview/${p.slug}.glb`,
              companyName: p.company_name || 'I3DION Showcase',
              companyVerified: p.company_verified ?? true,
              licenseSpdx: p.license_spdx || ['CC0-1.0'],
              licenseArtist: p.license_artist,
              attributionRequired: Boolean(p.attribution_required),
              viewsCount: Number(p.views_count) || 0,
              likesCount: Number(p.likes_count) || 0,
              specs: p.specs
            } as CompareModelItem;
          } catch {
            const fallback = SPATIAL_HUB_MODELS.find((m) => m.id === id || m.slug === id);
            if (fallback) {
              return {
                id: fallback.id,
                name: fallback.name,
                slug: fallback.slug,
                category: fallback.category,
                description: fallback.shortDescription,
                thumbnail: fallback.thumbnail,
                modelUrl: fallback.modelUrl,
                previewUrl: fallback.previewUrl,
                companyName: 'I3DION Showcase',
                companyVerified: true,
                licenseSpdx: ['CC0-1.0'],
                attributionRequired: false,
                viewsCount: 0,
                likesCount: 0
              } as CompareModelItem;
            }
            return null;
          }
        })
      )
        .then((resolved) => {
          const valid = resolved.filter(Boolean) as CompareModelItem[];
          if (valid.length > 0) setModels(valid);
        })
        .finally(() => setLoadingInitial(false));
    }
  }, [searchParams]);

  // Synchronize dynamic comparison SEO metadata (HUB-13)
  useEffect(() => {
    const names = models.map((m) => m.name).join(' vs ');
    updateSeoMeta({
      title: models.length > 0 ? `Compare: ${names}` : 'Technical 3D Specification Matrix',
      description: models.length > 0 
        ? `Side-by-side technical CAD and geometry comparison of ${names} on I3DION Spatial Hub.`
        : 'Compare industrial 3D equipment models side by side with CAD metrics, polygon counts, license verification, and RFQ basket actions.',
      type: 'website'
    });
  }, [models]);

  const handleShareComparison = () => {
    if (models.length === 0) return;
    const url = `${window.location.origin}/hub/compare?ids=${models.map((m) => m.id).join(',')}`;
    navigator.clipboard.writeText(url).then(() => {
      success('Comparison link copied to clipboard!');
    }).catch(() => {
      info(url);
    });
  };

  const starterSuggestions = SPATIAL_HUB_MODELS.slice(0, 4);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans text-slate-800">
      {/* Top Header Bar */}
      <div className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link
                to="/hub/feed"
                className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
              >
                <ArrowLeft size={16} />
                Back to Feed
              </Link>
              <span className="text-slate-300">/</span>
              <div className="flex items-center gap-2">
                <GitCompare size={17} className="text-indigo-600" />
                <h1 className="text-sm font-bold text-slate-900">Technical Comparison Matrix</h1>
                <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
                  {models.length} / 4 Selected
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {models.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={handleShareComparison}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                  >
                    <Share2 size={14} />
                    Share Comparison
                  </button>
                  <button
                    type="button"
                    onClick={clearCompare}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
                  >
                    <Trash2 size={14} />
                    Clear Matrix
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {loadingInitial ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent mb-3" />
            <p className="text-xs font-bold text-slate-600">Loading model specifications...</p>
          </div>
        ) : models.length === 0 ? (
          <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xs">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <GitCompare size={32} />
            </div>
            <h2 className="text-xl font-black text-slate-900">Comparison Matrix Empty</h2>
            <p className="mt-2 text-xs text-slate-500 max-w-md mx-auto">
              Select up to 4 models from the Hub catalog to compare geometric complexity, file sizes, licenses, and technical attributes side-by-side.
            </p>

            <div className="mt-8 text-left">
              <h3 className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wider">
                Quick-Add Starter Models for Comparison:
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {starterSuggestions.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-3 rounded-2xl border border-slate-200/80 hover:border-indigo-300 transition bg-slate-50/50"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={s.thumbnail}
                        alt={s.name}
                        className="h-10 w-10 rounded-xl object-cover bg-white border border-slate-200"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-900">{s.name}</p>
                        <p className="text-[10px] text-slate-400">CC0-1.0 • Demonstration</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        addModel({
                          id: s.id,
                          name: s.name,
                          slug: s.slug,
                          category: s.category,
                          description: s.shortDescription,
                          thumbnail: s.thumbnail,
                          modelUrl: s.modelUrl,
                          previewUrl: s.previewUrl,
                          companyName: 'I3DION Showcase',
                          companyVerified: true,
                          licenseSpdx: ['CC0-1.0'],
                          attributionRequired: false,
                          viewsCount: 0,
                          likesCount: 0
                        })
                      }
                      className="rounded-xl bg-indigo-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-indigo-700 transition flex items-center gap-1"
                    >
                      <Plus size={12} /> Add
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 border-t border-slate-100 pt-6">
              <Link
                to="/hub/feed"
                className="inline-flex items-center gap-2 rounded-2xl bg-[#0F172A] px-6 py-3 text-xs font-bold text-white hover:bg-slate-800 transition"
              >
                Browse Full Catalog
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {models.length < 2 && (
              <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-medium text-amber-800">
                <AlertCircle size={16} className="shrink-0 text-amber-600" />
                <span>
                  Select at least 2 models for a complete side-by-side comparison. You can add up to {4 - models.length} more models from the catalog feed.
                </span>
              </div>
            )}

            {/* Comparison Matrix Table */}
            <div className="overflow-x-auto rounded-3xl border border-slate-200/80 bg-white shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70">
                    <th className="p-4 w-44 font-bold text-slate-500 uppercase tracking-wider text-[11px]">
                      Specification
                    </th>
                    {models.map((model) => (
                      <th key={model.id} className="p-4 min-w-[240px] align-top">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-extrabold text-sm text-slate-900 leading-tight">
                              {model.name}
                            </h3>
                            <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                              {model.companyName}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeModel(model.id)}
                            title="Remove from comparison"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </th>
                    ))}
                    {Array.from({ length: 4 - models.length }).map((_, idx) => (
                      <th key={`empty-slot-${idx}`} className="p-4 min-w-[240px] text-center border-l border-dashed border-slate-200">
                        <Link
                          to="/hub/feed"
                          className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-indigo-400 hover:text-indigo-600 transition"
                        >
                          <Plus size={20} className="mb-1" />
                          <span className="text-[11px] font-bold">Add Model to Compare</span>
                        </Link>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {/* Row 1: Live 3D / Poster Preview */}
                  <tr>
                    <td className="p-4 font-bold text-slate-600 bg-slate-50/40">3D Preview</td>
                    {models.map((model) => (
                      <td key={`preview-${model.id}`} className="p-4">
                        <div className="h-44 w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-inner">
                          <ModelCardPreview
                            modelUrl={model.previewUrl || model.modelUrl}
                            posterUrl={model.thumbnail}
                            title={model.name}
                            mode="solid"
                          />
                        </div>
                      </td>
                    ))}
                    {Array.from({ length: 4 - models.length }).map((_, idx) => (
                      <td key={`empty-preview-${idx}`} className="p-4 bg-slate-50/20" />
                    ))}
                  </tr>

                  {/* Row 2: Category & Classification */}
                  <tr>
                    <td className="p-4 font-bold text-slate-600 bg-slate-50/40">Category</td>
                    {models.map((model) => (
                      <td key={`cat-${model.id}`} className="p-4 text-slate-800 font-medium">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700">
                          {model.category}
                        </span>
                      </td>
                    ))}
                    {Array.from({ length: 4 - models.length }).map((_, idx) => (
                      <td key={`empty-cat-${idx}`} className="p-4 bg-slate-50/20" />
                    ))}
                  </tr>

                  {/* Row 3: License & Provenance */}
                  <tr>
                    <td className="p-4 font-bold text-slate-600 bg-slate-50/40">License / Terms</td>
                    {models.map((model) => (
                      <td key={`lic-${model.id}`} className="p-4 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 border border-emerald-200">
                            {model.licenseSpdx.join(' / ')}
                          </span>
                          <span className="text-[10px] text-slate-500 font-semibold">Commercial Permitted</span>
                        </div>
                        {model.licenseArtist && (
                          <p className="text-[10px] text-slate-400">
                            Credit: {model.licenseArtist}
                          </p>
                        )}
                      </td>
                    ))}
                    {Array.from({ length: 4 - models.length }).map((_, idx) => (
                      <td key={`empty-lic-${idx}`} className="p-4 bg-slate-50/20" />
                    ))}
                  </tr>

                  {/* Row 4: AR Compatibility */}
                  <tr>
                    <td className="p-4 font-bold text-slate-600 bg-slate-50/40">AR Support</td>
                    {models.map((model) => (
                      <td key={`ar-${model.id}`} className="p-4 text-emerald-700 font-bold flex items-center gap-1.5">
                        <Check size={16} className="text-emerald-600" />
                        <span>WebXR & Quick Look Ready</span>
                      </td>
                    ))}
                    {Array.from({ length: 4 - models.length }).map((_, idx) => (
                      <td key={`empty-ar-${idx}`} className="p-4 bg-slate-50/20" />
                    ))}
                  </tr>

                  {/* Row 5: Geometric Detail & Mesh Specs */}
                  <tr>
                    <td className="p-4 font-bold text-slate-600 bg-slate-50/40">Geometry Specs</td>
                    {models.map((model) => (
                      <td key={`geom-${model.id}`} className="p-4 text-slate-700 space-y-1 font-mono text-[11px]">
                        <p>Mesh: GLB Binary (Standard)</p>
                        <p>Materials: PBR Metalness/Roughness</p>
                        <p>Render Modes: Solid / Wireframe / X-Ray</p>
                      </td>
                    ))}
                    {Array.from({ length: 4 - models.length }).map((_, idx) => (
                      <td key={`empty-geom-${idx}`} className="p-4 bg-slate-50/20" />
                    ))}
                  </tr>

                  {/* Row 6: Procurement Actions */}
                  <tr>
                    <td className="p-4 font-bold text-slate-600 bg-slate-50/40">Actions</td>
                    {models.map((model) => (
                      <td key={`actions-${model.id}`} className="p-4 space-y-2">
                        <button
                          type="button"
                          onClick={() => {
                            addItem({
                              productId: model.id,
                              name: model.name,
                              modelUrl: model.modelUrl,
                              posterUrl: model.thumbnail,
                              companyName: model.companyName,
                              quantity: 1
                            });
                            success(`Added ${model.name} to RFQ Basket`);
                          }}
                          className={`w-full flex items-center justify-center gap-2 rounded-xl py-2 px-3 text-xs font-bold transition border ${
                            isInBasket(model.id)
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                              : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
                          }`}
                        >
                          <ShoppingBag size={14} />
                          <span>{isInBasket(model.id) ? 'In RFQ Basket' : 'Add to RFQ'}</span>
                        </button>

                        <Link
                          to={`/hub/product/${model.slug}`}
                          className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-[#0F172A] py-2 px-3 text-xs font-bold text-white hover:bg-slate-800 transition"
                        >
                          <Eye size={14} />
                          <span>Inspect 3D</span>
                        </Link>
                      </td>
                    ))}
                    {Array.from({ length: 4 - models.length }).map((_, idx) => (
                      <td key={`empty-act-${idx}`} className="p-4 bg-slate-50/20" />
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
