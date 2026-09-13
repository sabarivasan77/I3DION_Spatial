import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Box, Calendar, Download, Plus, Sparkles, Users } from 'lucide-react';
import { Badge, Button, Card, KpiCard, PageHeader, SectionTitle } from '../components/ui';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import type { Product } from '../types';

function mapProductRow(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    category: row.category ?? '',
    status: row.status ?? 'Draft',
    image: row.thumbnail_url ?? row.image ?? null,
    isPublic: row.is_public ?? false,
    downloads: row.download_count ?? 0,
    modelUrl: row.model_url ?? null,
    description: row.description ?? '',
    specs: row.specs ?? {},
    hotspots: row.hotspots ?? [],
    animations: row.animations ?? [],
    catalogIds: row.catalog_ids ?? [],
    createdAt: row.created_at ?? '',
    updatedAt: row.updated_at ?? '',
  } as any;
}

const SAMPLE_ANALYTICS = [
  { name: 'Mon', views: 340, ar: 42, leads: 8 },
  { name: 'Tue', views: 520, ar: 67, leads: 14 },
  { name: 'Wed', views: 410, ar: 55, leads: 11 },
  { name: 'Thu', views: 680, ar: 89, leads: 19 },
  { name: 'Fri', views: 750, ar: 102, leads: 24 },
  { name: 'Sat', views: 290, ar: 38, leads: 6 },
  { name: 'Sun', views: 190, ar: 21, leads: 3 },
];

export function DashboardPage() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (!token) return;
    api.getAnalyticsDashboard(token).then((d: any) => setDashboard(d)).catch(() => null);
    api.getAnalyticsTrends(token).then((t: any) => {
      const rows: any[] = Array.isArray(t) ? t : [];
      setTrends(rows.map(item => ({
        name: new Date(item.date).toLocaleDateString(undefined, { weekday: 'short' }),
        views: item.visitors ?? 0,
        ar: item.sessions ?? 0,
        leads: Math.floor((item.visitors ?? 0) * 0.05),
      })));
    }).catch(() => null);
    api.listProducts(token).then((rows: any) => setProducts((rows as any[]).map(mapProductRow))).catch(() => null);
  }, [token]);

  const kpis = useMemo(() => {
    const totalLeads = dashboard ? dashboard.total_leads : 0;
    const publicProducts = products.filter(p => (p as any).isPublic).length;
    const totalDownloads = products.reduce((a, b: any) => a + (b.downloads || 0), 0);
    return [
      { label: 'Public Hub Products', value: String(publicProducts || 0), change: '—', icon: Box, tone: 'neutral' as const },
      { label: 'Hub Downloads', value: String(totalDownloads || 0), change: '—', icon: Download, tone: 'neutral' as const },
      { label: 'AR Sessions', value: String(dashboard?.ar_launches || 0), change: '—', icon: Sparkles, tone: 'neutral' as const },
      { label: 'Leads Captured', value: String(totalLeads || 0), change: '—', icon: Users, tone: 'neutral' as const },
    ];
  }, [dashboard, products]);

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0] ?? 'Alex'}`}
        eyebrow="Here's what's happening with your spatial product experiences."
        action={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => navigate('/analytics')}><Calendar size={18} />View Analytics</Button>
            <Button onClick={() => navigate('/products/upload')}><Plus size={18} />New Product</Button>
          </div>
        }
      />

      {/* Phase 16 Customer Onboarding Banner */}
      <Card className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-indigo-900/50 p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-indigo-500/20 text-indigo-300 font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-indigo-500/30">
                Core Customer Onboarding Journey
              </span>
            </div>
            <h3 className="text-base font-bold text-white">Get Started with Your First 3D Spatial Experience</h3>
            <p className="text-xs text-slate-300 max-w-2xl mt-0.5">
              Create a product, design interactive 3D spatial experiences in OmniStudio, publish to web/AR, and capture customer leads.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              onClick={() => navigate('/products/upload')}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold font-mono transition flex items-center gap-1 shadow-sm"
            >
              <span>1. Add Product</span>
            </button>
            <button
              onClick={() => navigate('/studio')}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold font-mono transition flex items-center gap-1 shadow-sm"
            >
              <Sparkles size={13} />
              <span>2. Open OmniStudio</span>
            </button>
            <button
              onClick={() => navigate('/leads')}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold font-mono transition flex items-center gap-1 shadow-sm"
            >
              <Users size={13} />
              <span>3. View Leads</span>
            </button>
          </div>
        </div>
      </Card>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item) => <KpiCard key={item.label} item={item} />)}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
        <Card className="p-6">
          <SectionTitle title="Analytics Overview" meta="Views, AR sessions, and leads" />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends.length ? trends : SAMPLE_ANALYTICS}>
                <defs>
                  <linearGradient id="gViews" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.34} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={12} />
                <YAxis stroke="#64748B" fontSize={12} />
                <Tooltip />
                <Area dataKey="views" stroke="#2563EB" fill="url(#gViews)" strokeWidth={3} name="Views" />
                <Area dataKey="ar" stroke="#10B981" fill="#10B98122" strokeWidth={2} name="AR Sessions" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-6">
          <SectionTitle title="Recent Products" />
          <div className="space-y-3">
            {products.slice(0, 4).map((p: any) => (
              <button key={p.id} onClick={() => navigate(`/product-experience?id=${p.id}`)} className="flex w-full items-center gap-3 rounded-xl hover:bg-slate-50 p-2 text-left transition">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-100 overflow-hidden">
                  {p.image ? <img src={p.image} alt={p.name} className="h-full w-full object-cover" /> : <Box className="m-auto mt-2 text-slate-400" size={20} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{p.name}</p>
                  <p className="text-xs text-slate-500">{p.category}</p>
                </div>
                <Badge>{p.status}</Badge>
              </button>
            ))}
            {!products.length && <p className="text-sm text-slate-500">No products yet. <button onClick={() => navigate('/products/upload')} className="text-primary font-semibold hover:underline">Create one</button></p>}
          </div>
        </Card>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {[
          ['QR Metrics', `${dashboard?.qr_scans || '0'} scans`, 'Top source: trade-show floor'],
          ['AR Metrics', `${dashboard?.ar_launches || '0'} sessions`, 'Average placement time: 36s'],
          ['Lead Metrics', `${dashboard?.total_leads || '0'} new leads`, 'Qualification rate: 41%'],
        ].map(([title, value, note]) => (
          <Card key={title as string} className="p-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">{title}</p>
            <p className="mt-3 text-3xl font-bold text-slate-950">{value}</p>
            <p className="mt-2 text-sm text-slate-500">{note}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
