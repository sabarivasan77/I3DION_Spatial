import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Box, BookOpen, BarChart3, ShieldCheck, ArrowRight, Eye, CheckCircle2, Building2, Check, Plus } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { SPATIAL_HUB_MODELS } from '../../data/spatialHubModels';
import ThreeProduct from '../../components/ThreeProduct';

export function HubOrganizationPage() {
  const user = useAuthStore((s) => s.user);
  const { tab, id } = useParams<{ tab?: string; id?: string }>();
  const navigate = useNavigate();

  const activeTab = tab || 'products';
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'professional' | 'enterprise'>('professional');
  const [orgFormName, setOrgFormName] = useState('');
  const [createdSuccess, setCreatedSuccess] = useState(false);

  // If companyId is passed via URL or user belongs to company, show organization workspace
  const hasOrg = !!(id || user?.companyId || createdSuccess);
  const companyName = hasOrg ? (id ? (id.replace(/_/g, ' ').toUpperCase()) : (orgFormName || 'Vertex Spatial Industrial')) : 'Organization Workspace';

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

  const handleCreateOrganizationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgFormName.trim()) return;
    setCreatedSuccess(true);
  };

  if (!hasOrg) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] pb-16 pt-6 px-4 md:px-8 select-none">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="rounded-3xl bg-white p-8 md:p-12 shadow-xl border border-slate-200 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-blue-600 shadow-inner">
              <Building2 size={32} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Create your own Organization</h1>
            <p className="text-sm text-slate-500 max-w-xl mx-auto font-medium leading-relaxed">
              Transform your 3D CAD assets into interactive spatial products, create brand catalogs, and collaborate securely with team members.
            </p>

            {/* Plan Tier Selection Cards (Requirement 24) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left pt-6">
              <div
                onClick={() => setSelectedPlan('basic')}
                className={`cursor-pointer rounded-2xl p-5 border-2 transition ${
                  selectedPlan === 'basic' ? 'border-blue-600 bg-blue-50/40 shadow-md' : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Entry Tier</span>
                <h3 className="text-base font-bold text-slate-900 mt-1">Spatial Basic</h3>
                <p className="text-xs text-slate-500 mt-1">$49 / mo</p>
                <ul className="mt-4 space-y-2 text-xs text-slate-600 font-medium">
                  <li className="flex items-center gap-1.5"><Check size={14} className="text-blue-600" /> Up to 10 3D Models</li>
                  <li className="flex items-center gap-1.5"><Check size={14} className="text-blue-600" /> Standard AR Viewing</li>
                  <li className="flex items-center gap-1.5"><Check size={14} className="text-blue-600" /> 2 Team Members</li>
                </ul>
              </div>

              <div
                onClick={() => setSelectedPlan('professional')}
                className={`cursor-pointer rounded-2xl p-5 border-2 relative transition ${
                  selectedPlan === 'professional' ? 'border-blue-600 bg-blue-50/40 shadow-md' : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <span className="absolute -top-3 right-4 rounded-full bg-blue-600 px-3 py-0.5 text-[10px] font-extrabold uppercase text-white shadow-xs">
                  Most Popular
                </span>
                <span className="text-[10px] font-extrabold uppercase text-blue-600 tracking-wider">Growth Tier</span>
                <h3 className="text-base font-bold text-slate-900 mt-1">Spatial Professional</h3>
                <p className="text-xs text-slate-500 mt-1">$199 / mo</p>
                <ul className="mt-4 space-y-2 text-xs text-slate-600 font-medium">
                  <li className="flex items-center gap-1.5"><Check size={14} className="text-blue-600" /> Unlimited 3D Models</li>
                  <li className="flex items-center gap-1.5"><Check size={14} className="text-blue-600" /> Interactive Hotspots</li>
                  <li className="flex items-center gap-1.5"><Check size={14} className="text-blue-600" /> 10 Team Members</li>
                </ul>
              </div>

              <div
                onClick={() => setSelectedPlan('enterprise')}
                className={`cursor-pointer rounded-2xl p-5 border-2 transition ${
                  selectedPlan === 'enterprise' ? 'border-blue-600 bg-blue-50/40 shadow-md' : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Custom Enterprise</span>
                <h3 className="text-base font-bold text-slate-900 mt-1">Spatial Enterprise</h3>
                <p className="text-xs text-slate-500 mt-1">Custom Pricing</p>
                <ul className="mt-4 space-y-2 text-xs text-slate-600 font-medium">
                  <li className="flex items-center gap-1.5"><Check size={14} className="text-blue-600" /> Spatial Lens BI Access</li>
                  <li className="flex items-center gap-1.5"><Check size={14} className="text-blue-600" /> Private RBAC Controls</li>
                  <li className="flex items-center gap-1.5"><Check size={14} className="text-blue-600" /> Dedicated SLA Support</li>
                </ul>
              </div>
            </div>

            {/* Setup Form */}
            <form onSubmit={handleCreateOrganizationSubmit} className="pt-6 max-w-md mx-auto space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Organization / Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Industrial Robotics"
                  value={orgFormName}
                  onChange={(e) => setOrgFormName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition"
              >
                <Plus size={16} /> Create Organization & Setup Billing
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16 pt-6 px-4 md:px-8 select-none">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Organization Banner Matching Screen 7 */}
        <div className="rounded-3xl bg-white p-6 md:p-8 shadow-2xs border border-slate-200/80">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0F172A] text-lg font-extrabold text-white shadow-md">
                V
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl md:text-2xl font-bold text-slate-900">{companyName}</h1>
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-0.5 text-xs font-bold text-blue-700 border border-blue-100">
                    <ShieldCheck size={13} />
                    Enterprise Plan
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Published digital twin products, interactive 3D experiences, and Spatial Lens BI dashboards.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
              <CheckCircle2 size={15} className="text-blue-600" />
              <span>Read-Only Organization Consumption View</span>
            </div>
          </div>

          {/* Tab Bar Matching Screen 7 */}
          <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
            <button
              onClick={() => navigate('/hub/organization/products')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === 'products' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Box size={15} />
              Products (12)
            </button>
            <button
              onClick={() => navigate('/hub/organization/catalogs')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === 'catalogs' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <BookOpen size={15} />
              Catalogs (4)
            </button>
            <button
              onClick={() => navigate('/hub/organization/dashboards')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === 'dashboards' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <BarChart3 size={15} />
              Dashboards (2)
            </button>
          </div>
        </div>

        {/* Tab Contents */}
        {activeTab === 'products' && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {publishedProducts.map((p) => (
              <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs hover:shadow-md transition">
                <div className="h-40 w-full bg-[#0F172A] rounded-xl overflow-hidden mb-3">
                  <ThreeProduct modelUrl={p.modelUrl} renderMode="solid" autoRotate={true} className="h-full w-full" />
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
