import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Database, 
  LayoutTemplate, 
  Box, 
  BarChart3, 
  Globe, 
  ArrowRight, 
  Plus, 
  Upload, 
  Sparkles,
  Clock,
  FileSpreadsheet,
  Layers,
  ChevronRight
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { EcosystemHeader } from '../../design-system/navigation/EcosystemHeader';
import { SkeletonLoader } from '../../design-system/states/SkeletonLoader';
import { ProductLogo, ProductKey } from '../../components/ProductLogo';

interface HomeMetrics {
  assetsCount: number;
  catalogsCount: number;
  leadsCount: number;
  recentItems: {
    id: string;
    title: string;
    type: 'Asset' | 'Catalog' | 'Experience' | 'Lead';
    updatedAt: string;
    status: string;
    path: string;
  }[];
}

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [metrics, setMetrics] = useState<HomeMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('i3dion.token');
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

    Promise.all([
      fetch('/api/vault/datasets/summary', { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/studio/projects', { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/leads', { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
    ])
      .then(([vaultSummary, studioProjects, leadsData]) => {
        const assetsCount = vaultSummary?.assetsCount || 0;
        const catalogsCount = Array.isArray(studioProjects) ? studioProjects.length : 0;
        const leadsCount = Array.isArray(leadsData?.leads) ? leadsData.leads.length : (Array.isArray(leadsData) ? leadsData.length : 0);

        const recentItems = [
          {
            id: 'rec-1',
            title: 'Reciprocating Air Compressor Model 400',
            type: 'Asset' as const,
            updatedAt: '2 hours ago',
            status: 'Verified GLB',
            path: '/vault/workspace',
          },
          {
            id: 'rec-2',
            title: 'Industrial Heavy Equipment Catalog 2026',
            type: 'Catalog' as const,
            updatedAt: '5 hours ago',
            status: 'Published v1.0',
            path: '/studio/projects',
          },
          {
            id: 'rec-3',
            title: 'Centrifugal Water Pump 3D Experience',
            type: 'Experience' as const,
            updatedAt: '1 day ago',
            status: 'Active AR',
            path: '/engine/workspace',
          },
          {
            id: 'rec-4',
            title: 'Quote Request: Apex Engineering Ltd.',
            type: 'Lead' as const,
            updatedAt: 'Just now',
            status: 'New Inquiry',
            path: '/leads',
          },
        ];

        setMetrics({
          assetsCount,
          catalogsCount,
          leadsCount,
          recentItems,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const productCards: Array<{
    id: ProductKey;
    name: string;
    subtitle: string;
    description: string;
    path: string;
    badge: string;
    hoverBorder: string;
    bgBorder: string;
  }> = [
    {
      id: 'hub',
      name: 'I3DION Spatial Hub',
      subtitle: 'Public Discovery & Delivery',
      description: 'Mobile-first public showcase and QR destination for customers exploring technical machinery.',
      path: '/hub/feed',
      badge: 'Public Showcase',
      hoverBorder: 'hover:border-blue-400',
      bgBorder: 'bg-blue-50/60 border-blue-200/80',
    },
    {
      id: 'vault',
      name: 'I3DION Spatial Vault',
      subtitle: 'Authoritative CAD Assets & Records',
      description: 'Single source of truth for 3D geometries, specs, documents and custom product collections.',
      path: '/vault',
      badge: `${metrics?.assetsCount ?? 0} Assets`,
      hoverBorder: 'hover:border-emerald-400',
      bgBorder: 'bg-emerald-50/60 border-emerald-200/80',
    },
    {
      id: 'engine',
      name: 'I3DION Spatial Engine',
      subtitle: '3D/AR Experience & Hotspots',
      description: 'Author interactive assemblies, technical callout hotspots, animations, and WebXR AR handoffs.',
      path: '/engine',
      badge: 'Interactive 3D/AR',
      hoverBorder: 'hover:border-rose-400',
      bgBorder: 'bg-rose-50/60 border-rose-200/80',
    },
    {
      id: 'lens',
      name: 'I3DION Spatial Lens',
      subtitle: 'Telemetry & Buyer Intent',
      description: 'Real-time telemetry, 3D dwell time, QR attribution, and lead intent conversion dashboards.',
      path: '/lens',
      badge: `${metrics?.leadsCount ?? 0} Leads`,
      hoverBorder: 'hover:border-amber-400',
      bgBorder: 'bg-amber-50/60 border-amber-200/80',
    },
    {
      id: 'studio',
      name: 'I3DION Omni Studio',
      subtitle: 'Interactive Catalog Composer',
      description: 'Design and publish structured industrial catalogs bound directly to Vault product versions.',
      path: '/omni-studio',
      badge: `${metrics?.catalogsCount ?? 0} Catalogs`,
      hoverBorder: 'hover:border-purple-400',
      bgBorder: 'bg-purple-50/60 border-purple-200/80',
    },
    {
      id: 'flow',
      name: 'I3DION Flow',
      subtitle: 'Workflow & Integration Automation',
      description: 'Connect enterprise tools, CRM leads, quote approvals, and event-driven automation pipelines.',
      path: '/flow',
      badge: 'Automate & Connect',
      hoverBorder: 'hover:border-cyan-400',
      bgBorder: 'bg-cyan-50/60 border-cyan-200/80',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <EcosystemHeader productName="Home" productBadgeColor="text-blue-600 bg-blue-50 border-blue-200" />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        
        {/* Welcome Banner with Spatial Isometric Grid Motif */}
        <section className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-8 shadow-sm">
          {/* Subtle Isometric Grid Texture */}
          <div 
            className="absolute inset-0 opacity-[0.035] pointer-events-none" 
            style={{
              backgroundImage: 'radial-gradient(#0F172A 1.5px, transparent 1.5px)',
              backgroundSize: '24px 24px'
            }} 
          />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
                <Sparkles className="h-3.5 w-3.5" />
                <span>I3DION Spatial Ecosystem</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Welcome back, {user?.name || 'Engineer'}
              </h1>
              <p className="text-sm text-slate-500 max-w-2xl">
                Upload industrial CAD equipment once into Vault, publish interactive catalogs & AR experiences, capture buyer quotes, and track dwell time telemetry.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => navigate('/vault/upload')}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-medium text-white shadow-sm hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <Upload className="h-4 w-4" />
                Upload CAD Model
              </button>
              <button
                type="button"
                onClick={() => navigate('/studio/projects')}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Compose Catalog
              </button>
            </div>
          </div>
        </section>

        {/* 5 Ecosystem Product Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Layers className="h-4 w-4 text-slate-400" />
              Ecosystem Applications
            </h2>
            <span className="text-xs text-slate-400">Single Source of Truth Platform</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {productCards.map((product) => {
              return (
                <div
                  key={product.id}
                  onClick={() => navigate(product.path)}
                  className={`group relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm cursor-pointer transition-all ${product.hoverBorder} hover:shadow-md flex flex-col justify-between`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-xl border ${product.bgBorder}`}>
                        <ProductLogo product={product.id} size="md" badge={false} />
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                        {product.badge}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-xs font-medium text-slate-500">
                        {product.subtitle}
                      </p>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-700 group-hover:text-blue-600">
                    <span>Open Application</span>
                    <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* "Continue Where You Left Off" & Recent Telemetry */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400" />
              Continue Where You Left Off
            </h2>
            <span className="text-xs text-slate-400">Recent Workspace Activity</span>
          </div>

          {loading ? (
            <SkeletonLoader variant="table" count={4} />
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <div className="divide-y divide-slate-100">
                {metrics?.recentItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => navigate(item.path)}
                    className="p-4 sm:px-6 flex items-center justify-between hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-4 truncate mr-4">
                      <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                        {item.type === 'Asset' && <Database className="h-4 w-4 text-amber-600" />}
                        {item.type === 'Catalog' && <LayoutTemplate className="h-4 w-4 text-blue-600" />}
                        {item.type === 'Experience' && <Box className="h-4 w-4 text-cyan-600" />}
                        {item.type === 'Lead' && <FileSpreadsheet className="h-4 w-4 text-emerald-600" />}
                      </div>

                      <div className="truncate">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {item.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span className="font-medium text-slate-500">{item.type}</span>
                          <span>•</span>
                          <span>{item.updatedAt}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                        {item.status}
                      </span>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

      </main>
    </div>
  );
};
