import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Box, BookOpen, Sparkles, QrCode, BarChart3, ShieldCheck, ArrowRight, Eye, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { SPATIAL_HUB_MODELS } from '../../data/spatialHubModels';
import ThreeProduct from '../../components/ThreeProduct';

export function HubOrganizationPage() {
  const user = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState<'products' | 'catalogs' | 'experiences' | 'ar' | 'dashboards'>('products');

  const companyName = user?.companyId ? 'I3DION Enterprise Org' : 'Organization Workspace';

  const publishedProducts = SPATIAL_HUB_MODELS.slice(0, 4);

  const publishedDashboards = [
    {
      id: 'dash_exec_summary',
      name: 'Executive Sales & Interaction Intelligence',
      author: 'Spatial Lens BI',
      description: 'Real-time performance analytics of published 3D products, user session durations, and AR interactions.',
      metrics: [
        { label: 'Total Experiences Launched', value: '14,280' },
        { label: 'Avg Interactive Duration', value: '4m 12s' },
        { label: 'Lead Conversion Rate', value: '18.4%' },
      ],
      updatedAt: '2 hours ago',
    },
    {
      id: 'dash_product_engagement',
      name: 'Product Hotspot & Feature Engagement Map',
      author: 'Spatial Lens BI',
      description: 'Heatmap telemetry showing the most clicked 3D model hotspots and interactive features.',
      metrics: [
        { label: 'Top Component', value: 'Inlet Valve (64%)' },
        { label: 'AR Sessions', value: '3,920' },
        { label: 'Enquiry Submissions', value: '412' },
      ],
      updatedAt: '1 day ago',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16 pt-6 px-4 md:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Organization Header */}
        <div className="mb-8 rounded-2xl bg-white p-6 md:p-8 shadow-sm border border-slate-200/80">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md">
                <Building2 size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl md:text-2xl font-bold text-slate-900">{companyName}</h1>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                    <ShieldCheck size={12} />
                    Verified Org
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Published digital twin products, interactive 3D experiences, and Spatial Lens BI dashboards.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <CheckCircle2 size={15} className="text-blue-600" />
              <span>Read-Only Published Consumption Area</span>
            </div>
          </div>

          {/* Context Navigation Tabs */}
          <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === 'products' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Box size={15} />
              Published Products
            </button>
            <button
              onClick={() => setActiveTab('catalogs')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === 'catalogs' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <BookOpen size={15} />
              Published Catalogs
            </button>
            <button
              onClick={() => setActiveTab('experiences')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === 'experiences' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Sparkles size={15} />
              3D Experiences
            </button>
            <button
              onClick={() => setActiveTab('ar')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === 'ar' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <QrCode size={15} />
              AR Experiences
            </button>
            <button
              onClick={() => setActiveTab('dashboards')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === 'dashboards' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <BarChart3 size={15} />
              Published Lens Dashboards
            </button>
          </div>
        </div>

        {/* Tab Contents */}
        {activeTab === 'products' && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {publishedProducts.map((p) => (
              <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs hover:shadow-md transition">
                <div className="h-40 w-full bg-slate-900 rounded-xl overflow-hidden mb-3">
                  <ThreeProduct modelUrl={p.modelUrl} renderMode="solid" autoRotate={true} interactive={false} className="h-full w-full" />
                </div>
                <span className="text-[10px] font-bold text-blue-600 uppercase">{p.category}</span>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">{p.name}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 mt-1">{p.shortDescription}</p>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500">{p.viewsCount} Views</span>
                  <Link to={`/hub/product/${p.id}`} className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                    Explore <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'catalogs' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Industrial Compressor Series 2026 Catalog</h3>
                  <p className="text-xs text-slate-500">Published Omni Studio Interactive Catalog</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 mb-4">
                Interactive digital twin catalog containing technical specifications, exploded assemblies, and AR placement triggers.
              </p>
              <Link
                to="/hub/product/compressor_industrial_v1"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-xs"
              >
                <Eye size={14} />
                View Catalog Experience
              </Link>
            </div>
          </div>
        )}

        {activeTab === 'experiences' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-cyan-50 text-cyan-600 rounded-xl">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Full Compressor Assembly Interactive Tour</h3>
                  <p className="text-xs text-slate-500">Published Spatial Engine Interactive Experience</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 mb-4">
                Guided interactive tour powered by iScript logic nodes. Allows hotspot clicks, state transitions, and real-time telemetry tracking.
              </p>
              <Link
                to="/hub/product/compressor_industrial_v1"
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-700 shadow-xs"
              >
                <Sparkles size={14} />
                Launch Interactive Tour
              </Link>
            </div>
          </div>
        )}

        {activeTab === 'ar' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <QrCode size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">WebXR / Mobile AR Placement Anchor</h3>
                  <p className="text-xs text-slate-500">Published AR Experience</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 mb-4">
                Scan QR code or click from mobile web to project true-to-scale 1:1 industrial machinery in real physical floor environments.
              </p>
              <Link
                to="/hub/product/compressor_industrial_v1"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-xs"
              >
                <QrCode size={14} />
                Open AR Experience
              </Link>
            </div>
          </div>
        )}

        {activeTab === 'dashboards' && (
          <div className="grid grid-cols-1 gap-6">
            {publishedDashboards.map((dash) => (
              <div key={dash.id} className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-2xs">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                      <BarChart3 size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">{dash.name}</h3>
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                          Published from Spatial Lens
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{dash.description}</p>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400">Updated {dash.updatedAt}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
                  {dash.metrics.map((m, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200/80">
                      <span className="block text-[11px] font-semibold text-slate-500">{m.label}</span>
                      <span className="block text-lg font-extrabold text-slate-900 mt-0.5">{m.value}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <span>Author: {dash.author}</span>
                  <span className="font-semibold text-emerald-700">Read-Only BI Consumption View</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
