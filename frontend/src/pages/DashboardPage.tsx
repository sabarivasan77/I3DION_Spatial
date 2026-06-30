import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  ArrowRight, Calendar, Check, ChevronRight, Box, Bell, Eye,
  Download, FileText, Layers, Mail, Plus,
  QrCode, Save, Search, Settings, Sparkles, Trash2, Upload,
  Users, Edit2, X, RefreshCw, AlertCircle, Phone,
  Building2, Lock, Image,
} from 'lucide-react';
import { Link, NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import ThreeProduct from '../components/ThreeProduct';
import { Badge, Button, Card, KpiCard, PageHeader, SectionTitle } from '../components/ui';
import { useToast } from '../components/Toast';
import {
  api, ApiClientError, uploadFileWithProgress,
  type ProductPayload, type UploadedFile,
} from '../services/api';
import { Tracker } from '../services/Tracker';
import { useAuthStore } from '../store/authStore';
import type { Lead, Product } from '../types';
import { cx } from '../utils/format';


// ─── Validation Helpers ───


function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function validatePhone(phone: string) {
  return !phone || /^\+?[\d\s\-().]{7,20}$/.test(phone);
}
function validateUrl(url: string) {
  if (!url) return true;
  try { new URL(url); return true; } catch { return false; }
}


// ─── Shared Empty State ───


function EmptyState({ icon: Icon, title, description, action }: {
  icon: typeof Box; title: string; description: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-16 text-center">
      <div className="rounded-2xl bg-slate-100 p-4 text-slate-400">
        <Icon size={32} />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-slate-700">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-slate-500">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}


// ─── Confirmation Dialog ───


function ConfirmDialog({ title, message, onConfirm, onCancel, loading }: {
  title: string; message: string; onConfirm: () => void; onCancel: () => void; loading?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/50 p-4">
      <Card className="w-full max-w-md p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-red-50 p-2 text-red-500"><AlertCircle size={22} /></div>
          <div>
            <h3 className="text-lg font-bold text-slate-950">{title}</h3>
            <p className="mt-2 text-sm text-slate-500">{message}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </Card>
    </div>
  );
}


// ─── Dashboard ───


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
    api.getAnalyticsTrends(token).then((t: any[]) => {
      setTrends(t.map(item => ({
        name: new Date(item.date).toLocaleDateString(undefined, { weekday: 'short' }),
        views: item.visitors,
        ar: item.sessions,
        leads: Math.floor(item.visitors * 0.05) // Mock leads for chart as API trends doesn't return leads
      })));
    }).catch(() => null);
    api.listProducts(token).then((rows: any) => setProducts((rows as any[]).map(mapProductRow))).catch(() => null);
  }, [token]);

  const kpis = useMemo(() => {
    const totalLeads = dashboard ? dashboard.total_leads : 0;
    const publicProducts = products.filter(p => p.isPublic).length;
    const totalDownloads = products.reduce((a, b) => a + (b.downloads || 0), 0);
    
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
        eyebrow="Here's what's happening with your AR catalog."
        action={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => navigate('/analytics')}><Calendar size={18} />View Analytics</Button>
            <Button onClick={() => navigate('/products/upload')}><Plus size={18} />New Product</Button>
          </div>
        }
      />
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
            {products.slice(0, 4).map((p) => (
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

