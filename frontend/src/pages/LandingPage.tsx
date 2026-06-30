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


// ─── Landing Page ───


export function LandingPage() {

  const [recommendations, setRecommendations] = useState<any[]>([]);

  useEffect(() => {
    // Attempt to fetch AI recommendations if possible (requires auth or anon session tracking in a real app)
    // For demonstration, we'll try to fetch from ai endpoint and fallback to mock if unauth
    fetch('/api/ai/recommendations')
      .then(r => r.json())
      .then(d => {
        if (d.recommendations?.length > 0) {
          setRecommendations(d.recommendations);
        } else {
          // Mock shelves for public landing display
          setRecommendations([
            { id: '1', name: 'Rotary Air Compressor', category: 'Energy', score: 0.95 },
            { id: '2', name: 'Centrifugal Pump X-1', category: 'Manufacturing', score: 0.88 },
            { id: '3', name: 'Industrial Robotic Arm', category: 'Robotics', score: 0.82 },
          ]);
        }
      })
      .catch(() => null);
  }, []);

  return (
    <main className="pt-16">
      <section className="relative overflow-hidden px-4 py-20 md:px-6 md:py-28">
        <div className="absolute inset-0 hero-gradient" />
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2">
          <div className="relative z-10">
            <p className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1 text-sm font-semibold text-white"><Sparkles size={16} />AI Intelligence Engine is Live</p>
            <h1 className="text-4xl font-bold leading-tight text-slate-950 md:text-6xl">Self-Learning <span className="text-primary">Industrial</span> Platform</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">Every interaction builds customer profiles, trains AI models, and predicts conversion intent automatically.</p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link to="/signup" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-600 active:scale-[0.98]">
                Start AI Workspace <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50">
                Sign In
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-blue-200/30 blur-3xl" />
            <Card className="relative overflow-hidden rounded-3xl">
              <div className="flex items-center justify-between border-b border-slate-100 p-4 bg-white z-10 relative">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-primary" />
                  <p className="text-sm font-bold text-slate-900">AI Sales Assistant (Active)</p>
                </div>
                <Badge variant="success">95% Conversion Prob.</Badge>
              </div>
              <div className="h-[420px] bg-slate-100 viewer-grid"><ThreeProduct /></div>
            </Card>
          </div>
        </div>
      </section>

      {/* AI Dynamic Shelves */}
      <section className="bg-slate-50 px-4 py-20 md:px-6 border-y border-slate-200">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-4"><Sparkles className="text-primary" /> Recommended For You</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recommendations.map(r => (
                <Card key={r.id} className="p-6 hover:shadow-lg transition">
                  <div className="h-32 bg-slate-100 rounded-xl mb-4 flex items-center justify-center">
                    <Box className="text-slate-300" size={32} />
                  </div>
                  <h3 className="font-bold text-lg">{r.name}</h3>
                  <p className="text-sm text-slate-500">{r.category}</p>
                  <div className="mt-4 flex justify-between items-center text-xs font-semibold text-primary">
                    <span>Match Score</span>
                    <span>{Math.round(r.score * 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1">
                    <div className="bg-primary h-1.5 rounded-full" style={{ width: `${r.score * 100}%` }} />
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-4"><Layers className="text-emerald-500" /> Trending in Your Industry</h2>
              <div className="space-y-4">
                {[1,2,3].map(i => (
                  <Card key={i} className="p-4 flex gap-4 items-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-lg" />
                    <div>
                      <p className="font-bold text-sm">Industrial Asset {i}</p>
                      <p className="text-xs text-slate-500">Popular among manufacturing users</p>
                    </div>
                    <Badge className="ml-auto" variant="success">Trending</Badge>
                  </Card>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-4"><Users className="text-blue-500" /> People Also Viewed</h2>
              <div className="space-y-4">
                {[4,5,6].map(i => (
                  <Card key={i} className="p-4 flex gap-4 items-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-lg" />
                    <div>
                      <p className="font-bold text-sm">Related Accessory {i}</p>
                      <p className="text-xs text-slate-500">Frequently viewed together</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white px-4 py-8 text-sm text-slate-500 md:px-6">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 md:flex-row">
          <p className="font-semibold text-slate-700">I3DION Spatial</p>
          <p>Industrial AI Intelligence Platform</p>
        </div>
      </footer>
    </main>
  );
}

