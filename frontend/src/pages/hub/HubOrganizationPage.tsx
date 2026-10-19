import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Box, BookOpen, Layers, ShieldCheck, ArrowRight, Eye, CheckCircle2, 
  Building2, Check, Plus, ExternalLink, Globe, Mail, Sparkles 
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { ModelCardPreview } from '../../components/hub/ModelCardPreview';
import { useToast } from '../../components/Toast';
import { updateSeoMeta } from '../../utils/seoMeta';

interface ShowcaseData {
  organization: {
    id: string;
    name: string;
    slug: string;
    profile?: string;
    logo_url?: string;
    website?: string;
    primary_color?: string;
    is_verified: boolean;
  };
  catalogs: Array<{
    id: string;
    name: string;
    slug: string;
    description: string;
  }>;
  experiences: Array<{
    id: string;
    name: string;
    slug: string;
    description: string;
  }>;
  collections: Array<{
    id: string;
    name: string;
    description: string;
  }>;
  products: Array<{
    id: string;
    name: string;
    slug: string;
    category: string;
    description: string;
    image_url?: string;
    poster_url?: string;
    model_url?: string;
    preview_model_url?: string;
    views_count: number;
    likes_count: number;
    license_spdx?: string[];
  }>;
  meta: {
    totalCatalogs: number;
    totalExperiences: number;
    totalCollections: number;
    totalProducts: number;
  };
}

export function HubOrganizationPage() {
  const user = useAuthStore((s) => s.user);
  const { tab, id } = useParams<{ tab?: string; id?: string }>();
  const navigate = useNavigate();
  const { success } = useToast();

  const activeTab = tab || 'products';
  const orgSlug = id || user?.companyId || 'i3dion-showcase';

  const [data, setData] = useState<ShowcaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/hub/org/${orgSlug}`)
      .then((res) => {
        if (!res.ok) throw new Error('Showcase not found');
        return res.json();
      })
      .then((json: ShowcaseData) => {
        setData(json);
      })
      .catch(() => {
        // Fallback for default showcase
        setData({
          organization: {
            id: 'e0000000-0000-0000-0000-000000000001',
            name: 'I3DION Showcase',
            slug: 'i3dion-showcase',
            profile: 'Official reference and demonstration showcase for the I3DION Spatial ecosystem.',
            website: 'https://i3dion.com',
            is_verified: true
          },
          catalogs: [],
          experiences: [],
          collections: [
            { id: 'c1', name: 'Verified Demonstration Library', description: 'Curated 3D assets with authentic CC0 and CC-BY provenance.' }
          ],
          products: [],
          meta: {
            totalCatalogs: 0,
            totalExperiences: 0,
            totalCollections: 1,
            totalProducts: 0
          }
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [orgSlug]);

  // Synchronize dynamic SEO metadata
  useEffect(() => {
    if (!data?.organization) return;
    updateSeoMeta({
      title: `${data.organization.name} — Spatial Showroom`,
      description: data.organization.profile || `Explore interactive 3D equipment models and spatial catalogs by ${data.organization.name}.`,
      image: data.organization.logo_url,
      type: 'profile'
    });
  }, [data?.organization]);

  const org = data?.organization;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 pt-6 px-4 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Organization Banner */}
        <div className="rounded-3xl bg-white p-6 md:p-8 shadow-sm border border-slate-200/80">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0F172A] text-xl font-extrabold text-white shadow-md">
                {org?.name ? org.name.slice(0, 2).toUpperCase() : 'I3'}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">{org?.name || 'Organization Showcase'}</h1>
                  {org?.is_verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-0.5 text-xs font-bold text-blue-700 border border-blue-100">
                      <ShieldCheck size={14} className="text-blue-600" />
                      Verified Organization
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                  {org?.profile || 'Official published 3D products, interactive catalogs, and curated collections.'}
                </p>
                {org?.website && (
                  <div className="flex items-center gap-4 mt-2 text-xs font-semibold text-slate-500">
                    <a href={org.website} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 inline-flex items-center gap-1">
                      <Globe size={13} /> {org.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setIsFollowing(!isFollowing);
                  success(isFollowing ? 'Unfollowed Organization' : 'Following Organization', `Updated feed preferences for ${org?.name}.`);
                }}
                className={`rounded-2xl px-5 py-2.5 text-xs font-bold transition shadow-sm ${
                  isFollowing ? 'bg-slate-200 text-slate-700' : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isFollowing ? 'Following' : 'Follow Storefront'}
              </button>
            </div>
          </div>

          {/* Tab Bar */}
          <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
            <button
              onClick={() => navigate(`/hub/company/${orgSlug}`)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === 'products' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Box size={14} />
              Products ({data?.meta.totalProducts || 0})
            </button>
            <button
              onClick={() => navigate(`/hub/organization/collections`)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === 'collections' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Layers size={14} />
              Collections ({data?.meta.totalCollections || 0})
            </button>
            <button
              onClick={() => navigate(`/hub/organization/catalogs`)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === 'catalogs' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <BookOpen size={14} />
              Catalogs ({data?.meta.totalCatalogs || 0})
            </button>
          </div>
        </div>

        {/* ─── PRODUCTS TAB ─────────────────────────────────────────────── */}
        {activeTab === 'products' && (
          <div>
            {data?.products && data.products.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {data.products.map((p) => (
                  <div key={p.id} className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-lg transition flex flex-col justify-between">
                    <div className="aspect-[4/3] bg-slate-50 border-b border-slate-100 relative">
                      <ModelCardPreview
                        id={p.id}
                        slug={p.slug}
                        name={p.name}
                        modelUrl={p.model_url || `/models/preview/${p.slug}.glb`}
                        previewUrl={p.preview_model_url}
                        thumbnail={p.poster_url || p.image_url || `/models/posters/${p.slug}.svg`}
                      />
                    </div>
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-blue-600">
                        <span className="truncate">{p.category}</span>
                        <span className="text-slate-400 font-mono">{p.views_count} views</span>
                      </div>
                      <Link to={`/hub/product/${p.slug}`} className="font-bold text-sm text-slate-900 hover:text-blue-600 transition block truncate">
                        {p.name}
                      </Link>
                      <Link
                        to={`/hub/product/${p.slug}`}
                        className="mt-2 block text-center bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold py-2 rounded-xl transition"
                      >
                        Inspect 3D Model
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm max-w-md mx-auto">
                <Box className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900">No published products yet</h3>
                <p className="text-xs text-slate-500 mt-1">This organization has not published public models yet.</p>
              </div>
            )}
          </div>
        )}

        {/* ─── COLLECTIONS TAB ──────────────────────────────────────────── */}
        {activeTab === 'collections' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data?.collections && data.collections.length > 0 ? (
              data.collections.map((c) => (
                <div key={c.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider">
                    <Layers size={14} /> Curated Collection
                  </div>
                  <h3 className="text-lg font-black text-slate-900">{c.name}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{c.description || 'Curated equipment group.'}</p>
                  <div className="pt-2">
                    <span className="text-xs font-bold text-slate-700">Verified Equipment Dataset</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm max-w-md mx-auto">
                <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900">No collections published</h3>
                <p className="text-xs text-slate-500 mt-1">Curated collections will appear here once published.</p>
              </div>
            )}
          </div>
        )}

        {/* ─── CATALOGS TAB ─────────────────────────────────────────────── */}
        {activeTab === 'catalogs' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data?.catalogs && data.catalogs.length > 0 ? (
              data.catalogs.map((cat) => (
                <div key={cat.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider">
                    <BookOpen size={14} /> Interactive Catalog
                  </div>
                  <h3 className="text-lg font-black text-slate-900">{cat.name}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{cat.description || 'Omni Studio digital twin catalog.'}</p>
                  <Link
                    to={`/player/${cat.slug}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline pt-2"
                  >
                    Open Catalog Player <ArrowRight size={14} />
                  </Link>
                </div>
              ))
            ) : (
              <div className="col-span-2 bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm max-w-md mx-auto">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900">No published catalogs</h3>
                <p className="text-xs text-slate-500 mt-1">Digital twin catalogs will appear here when published in Omni Studio.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
