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

// ─── Validation Helpers ──────────────────────────────────────────────────────

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

// ─── Shared Empty State ───────────────────────────────────────────────────────

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

// ─── Confirmation Dialog ──────────────────────────────────────────────────────

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

// ─── Auth Pages ───────────────────────────────────────────────────────────────

function InputField({ label, type = 'text', value, onChange, placeholder, error, required }: {
  label: string; type?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; error?: string; required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">
        {label}{required ? <span className="ml-1 text-red-500">*</span> : null}
      </span>
      <input
        className={cx(
          'mt-2 h-12 w-full rounded-xl border bg-white px-4 text-sm outline-none transition focus:ring-4 focus:ring-blue-100',
          error ? 'border-red-400 focus:border-red-400' : 'border-slate-200 focus:border-primary',
        )}
        placeholder={placeholder}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error ? <p className="mt-1 text-xs font-medium text-red-500">{error}</p> : null}
    </label>
  );
}

const features = [
  'High-fidelity industrial 3D viewers',
  'QR-ready AR product experiences',
  'Lead capture built into every catalog',
  'Analytics for sales and product teams',
];

function AuthPage({ mode }: { mode: 'login' | 'signup' }) {
  const isSignup = mode === 'signup';
  const navigate = useNavigate();
  const { login, signup, loading, error: authError, clearError } = useAuthStore();
  const { error: showError } = useToast();

  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaToken, setMfaToken] = useState('');
  const [mfaRequired, setMfaRequired] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { loginGoogle } = useAuthStore();

  useEffect(() => { clearError(); }, [mode]);

  function validate() {
    const errs: Record<string, string> = {};
    if (isSignup && !name.trim()) errs.name = 'Name is required';
    if (isSignup && !companyName.trim()) errs.companyName = 'Company name is required';
    if (!email.trim()) errs.email = 'Email is required';
    else if (!validateEmail(email)) errs.email = 'Please enter a valid email address';
    if (!password) errs.password = 'Password is required';
    else if (password.length < 8) errs.password = 'Password must be at least 8 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    try {
      if (isSignup) {
        await signup({ name, companyName, email, password });
        Tracker.trackEvent('user_register', { email, name, companyName });
      } else {
        await login(email, password, mfaToken || undefined);
        Tracker.trackEvent('user_login', { email });
      }
      navigate('/dashboard');
    } catch (err: any) {
      if (err.status === 403 && err.message?.includes('MFA')) {
        setMfaRequired(true);
      } else {
        showError('Authentication failed', authError ?? err.message ?? 'Please check your credentials');
      }
    }
  }

  async function handleGoogleSuccess(credentialResponse: any) {
    try {
      if (credentialResponse.credential) {
        await loginGoogle(credentialResponse.credential);
        navigate('/dashboard');
      }
    } catch (err: any) {
      showError('Google Sign-In failed', err.message);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 pt-16">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl lg:grid-cols-[1fr_0.9fr]">
        <section className="relative min-h-[520px] bg-navy p-8 text-white md:p-12">
          <div className="absolute inset-0 opacity-60 viewer-grid" />
          <div className="relative z-10 flex h-full flex-col justify-between">
            <div>
              <p className="mb-4 inline-flex rounded-full bg-white/10 px-3 py-1 text-sm font-semibold">Enterprise AR Workspace</p>
              <h1 className="max-w-xl text-4xl font-bold leading-tight md:text-5xl">Convert technical products into sales-ready spatial catalogs.</h1>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {features.map((feature) => (
                <div key={feature} className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <Check className="mb-3 text-blue-200" size={20} />
                  <p className="text-sm font-medium text-slate-100">{feature}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="p-8 md:p-12">
          <h2 className="text-3xl font-bold text-slate-950">{isSignup ? 'Create your workspace' : 'Welcome back'}</h2>
          <p className="mt-2 text-slate-500">
            {isSignup ? 'Set up I3DION Spatial for your sales visualization team.' : 'Sign in to manage catalogs, AR sessions, and leads.'}
          </p>
          <form className="mt-8 space-y-5" onSubmit={submit} noValidate>
            {isSignup && (
              <>
                <InputField label="Full Name" value={name} onChange={setName} placeholder="Alex Thorne" error={errors.name} required />
                <InputField label="Company Name" value={companyName} onChange={setCompanyName} placeholder="I3DION Industrial Solutions" error={errors.companyName} required />
              </>
            )}
            
            {!mfaRequired ? (
              <>
                <InputField label="Email" type="email" value={email} onChange={setEmail} placeholder="alex@i3dion.com" error={errors.email} required />
                <InputField label="Password" type="password" value={password} onChange={setPassword} placeholder="Minimum 8 characters" error={errors.password} required />
              </>
            ) : (
              <InputField label="Authenticator Code" type="text" value={mfaToken} onChange={setMfaToken} placeholder="6-digit code" required />
            )}

            {authError && !mfaRequired ? <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">{authError}</p> : null}
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? 'Working...' : mfaRequired ? 'Verify & Sign In' : isSignup ? 'Create Account' : 'Sign In'}
              <ArrowRight size={18} />
            </Button>

            {!mfaRequired && (
              <div className="pt-4 border-t border-slate-100 flex flex-col items-center gap-3">
                <p className="text-sm font-medium text-slate-500">Or continue with</p>
                <div className="w-full flex justify-center mt-2">
                  {useMemo(() => (
                    <GoogleLogin 
                      onSuccess={handleGoogleSuccess}
                      onError={() => showError('Google Sign-In failed', 'Unable to authenticate with Google')}
                      useOneTap
                      shape="pill"
                      text="continue_with"
                      theme="outline"
                    />
                  ), [])}
                </div>
              </div>
            )}
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">
            {isSignup ? 'Already have an account?' : 'New to I3DION Spatial?'}{' '}
            <NavLink className="font-semibold text-primary" to={isSignup ? '/login' : '/signup'}>
              {isSignup ? 'Login' : 'Create account'}
            </NavLink>
          </p>
          {!isSignup && (
            <p className="mt-3 text-center text-sm text-slate-500">
              <NavLink className="font-semibold text-primary" to="/forgot-password">Forgot password?</NavLink>
            </p>
          )}
        </section>
      </div>
    </main>
  );
}

export function LoginPage() { return <AuthPage mode="login" />; }
export function SignupPage() { return <AuthPage mode="signup" />; }

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) { setError('Email is required'); return; }
    if (!validateEmail(email)) { setError('Please enter a valid email address'); return; }
    setError(''); setLoading(true);
    try {
      const result = await api.forgotPassword(email);
      setMessage(result.resetToken ? `${result.message} Dev token: ${result.resetToken}` : result.message);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Unable to request reset');
    } finally { setLoading(false); }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 pt-16">
      <Card className="w-full max-w-lg p-8">
        <h1 className="text-3xl font-bold">Forgot Password</h1>
        <p className="mt-2 text-slate-500">Generate a secure reset token for your workspace account.</p>
        <form className="mt-8 space-y-4" onSubmit={submit}>
          <InputField label="Email" type="email" value={email} onChange={setEmail} placeholder="alex@i3dion.com" error={error} required />
          {message ? <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p> : null}
          <Button className="w-full" type="submit" disabled={loading}>{loading ? 'Sending...' : 'Send Reset Link'}</Button>
        </form>
        <p className="mt-4 text-center text-sm"><NavLink className="font-semibold text-primary" to="/login">Back to Login</NavLink></p>
      </Card>
    </main>
  );
}

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function submit(e: FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!token.trim()) errs.token = 'Reset token is required';
    if (!password) errs.password = 'Password is required';
    else if (password.length < 8) errs.password = 'Must be at least 8 characters';
    if (password !== confirm) errs.confirm = 'Passwords do not match';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({}); setLoading(true);
    try {
      const result = await api.resetPassword(token, password);
      setMessage(result.message);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setErrors({ token: err instanceof ApiClientError ? err.message : 'Unable to reset password' });
    } finally { setLoading(false); }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 pt-16">
      <Card className="w-full max-w-lg p-8">
        <h1 className="text-3xl font-bold">Reset Password</h1>
        <p className="mt-2 text-slate-500">Enter a new password for your account.</p>
        <form className="mt-8 space-y-4" onSubmit={submit}>
          <InputField label="New Password" type="password" value={password} onChange={setPassword} placeholder="Minimum 8 characters" error={errors.password} required />
          <InputField label="Confirm Password" type="password" value={confirm} onChange={setConfirm} placeholder="Repeat your new password" error={errors.confirm} required />
          {message ? <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p> : null}
          <Button className="w-full" type="submit" disabled={loading}>{loading ? 'Resetting...' : 'Reset Password'}</Button>
        </form>
      </Card>
    </main>
  );
}

// ─── Landing Page ─────────────────────────────────────────────────────────────

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

// ─── Dashboard ────────────────────────────────────────────────────────────────

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
  const [summary, setSummary] = useState<{ events: any[]; leads: any[] } | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (!token) return;
    api.getAnalyticsSummary(token).then((d: any) => setSummary(d)).catch(() => null);
    api.listProducts(token).then((rows: any) => setProducts((rows as any[]).map(mapProductRow))).catch(() => null);
  }, [token]);

  const kpis = useMemo(() => {
    const totalLeads = summary ? summary.leads.reduce((a: number, l: any) => a + l.count, 0) : 0;
    const publicProducts = products.filter(p => p.isPublic).length;
    const totalDownloads = products.reduce((a, b) => a + (b.downloads || 0), 0);
    
    return [
      { label: 'Public Hub Products', value: String(publicProducts || 0), change: '—', icon: Box, tone: 'neutral' as const },
      { label: 'Hub Downloads', value: String(totalDownloads || 0), change: '—', icon: Download, tone: 'neutral' as const },
      { label: 'AR Sessions', value: '0', change: '—', icon: Sparkles, tone: 'neutral' as const },
      { label: 'Leads Captured', value: String(totalLeads || 0), change: '—', icon: Users, tone: 'neutral' as const },
    ];
  }, [summary, products]);

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
              <AreaChart data={SAMPLE_ANALYTICS}>
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
          ['QR Metrics', '19.7K scans', 'Top source: trade-show floor'],
          ['AR Metrics', '8,942 sessions', 'Average placement time: 36s'],
          ['Lead Metrics', `${SAMPLE_ANALYTICS.reduce((a, b) => a + b.leads, 0)} new leads`, 'Qualification rate: 41%'],
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

// ─── Product Management ───────────────────────────────────────────────────────

export function mapProductRow(row: Record<string, unknown>): Product {
  return {
    id: String(row.id),
    name: String(row.name),
    category: String(row.category),
    status: row.status as Product['status'],
    views: Number(row.views ?? 0),
    leads: Number(row.leads ?? 0),
    downloads: Number(row.downloads_count ?? 0),
    isPublic: Boolean(row.is_public),
    updated: String(row.updated_at ?? row.updated ?? ''),
    image: String(row.image_url ?? row.image ?? ''),
    specs: (row.specs as Product['specs']) ?? {},
  };
}

export function ProductManagementPage() {
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | Product['status']>('All');
  const [liveProducts, setLiveProducts] = useState<Product[]>([]);
  const [loadError, setLoadError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const token = useAuthStore((s) => s.token);
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const loadProducts = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const rows = await api.listProducts(token) as any[];
      setLiveProducts(rows.map(mapProductRow));
    } catch (err) {
      setLoadError(err instanceof ApiClientError ? err.message : 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const visible = liveProducts.filter((p) => {
    const q = filter.toLowerCase();
    return (!q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)) &&
      (statusFilter === 'All' || p.status === statusFilter);
  });

  async function saveProduct(payload: ProductPayload) {
    setIsSaving(true);
    try {
      if (editingProduct) {
        const saved = await api.updateProduct(token!, editingProduct.id, payload);
        const mapped = mapProductRow(saved as unknown as Record<string, unknown>);
        setLiveProducts((c) => c.map((p) => p.id === editingProduct.id ? mapped : p));
        success('Product updated', `"${payload.name}" has been saved.`);
      } else {
        const saved = await api.createProduct(token!, payload);
        const mapped = mapProductRow(saved as unknown as Record<string, unknown>);
        setLiveProducts((c) => [mapped, ...c]);
        success('Product created', `"${payload.name}" is ready.`);
      }
      setIsFormOpen(false);
      setEditingProduct(null);
    } catch (err) {
      showError('Save failed', err instanceof ApiClientError ? err.message : 'Unable to save product');
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setIsSaving(true);
    try {
      await api.deleteProduct(token!, deleteTarget.id);
      setLiveProducts((c) => c.filter((p) => p.id !== deleteTarget.id));
      success('Product deleted', `"${deleteTarget.name}" has been removed.`);
      setDeleteTarget(null);
    } catch (err) {
      showError('Delete failed', err instanceof ApiClientError ? err.message : 'Unable to delete product');
    } finally {
      setIsSaving(false);
    }
  }

  async function quickStatus(product: Product, status: Product['status']) {
    setIsSaving(true);
    try {
      const saved = await api.patchProductStatus(token!, product.id, status);
      const mapped = mapProductRow(saved as unknown as Record<string, unknown>);
      setLiveProducts((c) => c.map((p) => p.id === product.id ? mapped : p));
      success(status === 'Published' ? 'Product published' : 'Product archived');
    } catch (err) {
      showError('Update failed', err instanceof ApiClientError ? err.message : 'Could not update status');
    } finally {
      setIsSaving(false);
    }
  }

  const columns = useMemo<ColumnDef<Product>[]>(() => [
    { accessorKey: 'name', header: 'Product' },
    { accessorKey: 'category', header: 'Category' },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <Badge>{row.original.status}</Badge> },
    { accessorKey: 'views', header: 'Views', cell: ({ row }) => row.original.views.toLocaleString() },
    { accessorKey: 'leads', header: 'Leads' },
    { accessorKey: 'updated', header: 'Updated', cell: ({ row }) => row.original.updated ? new Date(row.original.updated).toLocaleDateString() : '—' },
  ], []);

  const table = useReactTable({ data: visible, columns, state: { globalFilter: filter }, onGlobalFilterChange: setFilter, getCoreRowModel: getCoreRowModel(), getFilteredRowModel: getFilteredRowModel() });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Product Management"
        eyebrow="Manage and publish industrial 3D assets for AR visualization."
        action={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={loadProducts} disabled={isLoading}><RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />Refresh</Button>
            <Button onClick={() => navigate('/products/upload')} variant="secondary"><Upload size={18} />Upload Wizard</Button>
            <Button onClick={() => { setEditingProduct(null); setIsFormOpen(true); }} disabled={isSaving}><Plus size={18} />Add Product</Button>
          </div>
        }
      />
      {loadError ? <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm font-medium text-amber-800">{loadError}</div> : null}
      <Card className="p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:border-primary" placeholder="Search products..." value={filter} onChange={(e) => setFilter(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2">
            {(['All', 'Published', 'Draft', 'Archived'] as const).map((s) => (
              <button key={s} className={cx('rounded-xl px-4 py-2 text-sm font-semibold transition hover:bg-primary hover:text-white', statusFilter === s ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600')} onClick={() => setStatusFilter(s)}>{s}</button>
            ))}
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-slate-400"><RefreshCw className="animate-spin mr-3" size={24} />Loading products...</div>
      ) : visible.length === 0 ? (
        <EmptyState icon={Box} title="No products found" description={filter ? 'No products match your search.' : 'Get started by adding your first industrial product.'} action={<Button onClick={() => { setEditingProduct(null); setIsFormOpen(true); }}><Plus size={18} />Add Product</Button>} />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id}>{hg.headers.map((h) => <th key={h.id} className="px-6 py-4">{flexRender(h.column.columnDef.header, h.getContext())}</th>)}<th className="px-6 py-4">Actions</th></tr>
                ))}
              </thead>
              <tbody className="divide-y divide-slate-100">
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition">
                    {row.getVisibleCells().map((cell) => <td key={cell.id} className="px-6 py-4">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Button className="h-8 px-3 text-xs" variant="secondary" onClick={() => { setEditingProduct(row.original); setIsFormOpen(true); }}><Edit2 size={14} />Edit</Button>
                        <Button className="h-8 px-3 text-xs" variant="secondary" onClick={() => navigate(`/product-experience?id=${row.original.id}`)}>Preview</Button>
                        {row.original.status !== 'Published'
                          ? <Button className="h-8 px-3 text-xs" variant="secondary" onClick={() => void quickStatus(row.original, 'Published')} disabled={isSaving}>Publish</Button>
                          : <Button className="h-8 px-3 text-xs" variant="secondary" onClick={() => void quickStatus(row.original, 'Archived')} disabled={isSaving}>Archive</Button>}
                        <Button className="h-8 px-3" variant="ghost" onClick={() => setDeleteTarget(row.original)} disabled={isSaving}><Trash2 size={14} /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {isFormOpen && (
        <ProductFormModal product={editingProduct} isSaving={isSaving} token={token!}
          onClose={() => { setIsFormOpen(false); setEditingProduct(null); }}
          onSave={(p) => void saveProduct(p)} />
      )}
      {deleteTarget && (
        <ConfirmDialog title="Delete Product" message={`Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone.`}
          onConfirm={() => void confirmDelete()} onCancel={() => setDeleteTarget(null)} loading={isSaving} />
      )}
    </div>
  );
}

function ProductFormModal({ product, isSaving, token, onClose, onSave }: {
  product: Product | null; isSaving: boolean; token: string;
  onClose: () => void; onSave: (p: ProductPayload) => void;
}) {
  const [name, setName] = useState(product?.name ?? '');
  const [category, setCategory] = useState(product?.category ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [status, setStatus] = useState<Product['status']>(product?.status ?? 'Draft');
  const [specs, setSpecs] = useState<Record<string, string>>(product?.specs ?? {});
  const [imageUrl, setImageUrl] = useState(product?.image ?? '');
  const [modelUrl, setModelUrl] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<Record<string, number>>({});
  const { success: showSuccess, error: showError } = useToast();

  function validate() {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Product name is required';
    if (!category.trim()) errs.category = 'Category is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSave({ name: name.trim(), category: category.trim(), description: description.trim(), status, specs, imageUrl: imageUrl || undefined, modelUrl: modelUrl || undefined });
  }

  async function handleImageUpload(file: File) {
    const maxMb = 15;
    if (file.size > maxMb * 1024 * 1024) { showError('File too large', `Image must be under ${maxMb}MB`); return; }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { showError('Invalid file type', 'Please upload a JPG, PNG, or WebP image'); return; }
    setUploading((u) => ({ ...u, image: 1 }));
    try {
      const uploaded = await uploadFileWithProgress({ token, file, onProgress: (p) => setUploading((u) => ({ ...u, image: p })) });
      setImageUrl(uploaded.url);
      showSuccess('Image uploaded');
    } catch (err) {
      showError('Upload failed', err instanceof ApiClientError ? err.message : 'Could not upload image');
    } finally {
      setUploading((u) => ({ ...u, image: 0 }));
    }
  }

  async function handleModelUpload(file: File) {
    if (!file.name.match(/\.(glb|gltf)$/i)) { showError('Invalid file type', 'Please upload a .glb or .gltf file'); return; }
    if (file.size > 150 * 1024 * 1024) { showError('File too large', 'Model must be under 150MB'); return; }
    setUploading((u) => ({ ...u, model: 1 }));
    try {
      const uploaded = await uploadFileWithProgress({ token, file, onProgress: (p) => setUploading((u) => ({ ...u, model: p })) });
      setModelUrl(uploaded.url);
      setSpecs((s) => ({ ...s, modelUrl: uploaded.url }));
      showSuccess('3D model uploaded');
    } catch (err) {
      showError('Upload failed', err instanceof ApiClientError ? err.message : 'Could not upload model');
    } finally {
      setUploading((u) => ({ ...u, model: 0 }));
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white p-6">
          <div>
            <h2 className="text-2xl font-bold">{product ? 'Edit Product' : 'Create Product'}</h2>
            <p className="mt-1 text-sm text-slate-500">Fill in the product details below</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 transition"><X size={20} /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Product Name <span className="text-red-500">*</span></label>
              <input className={cx('h-12 w-full rounded-xl border px-4 text-sm outline-none transition focus:ring-4 focus:ring-blue-100', errors.name ? 'border-red-400 focus:border-red-400' : 'border-slate-200 focus:border-primary')} placeholder="e.g. Pump X-1" value={name} onChange={(e) => setName(e.target.value)} />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Category <span className="text-red-500">*</span></label>
              <input className={cx('h-12 w-full rounded-xl border px-4 text-sm outline-none transition focus:ring-4 focus:ring-blue-100', errors.category ? 'border-red-400 focus:border-red-400' : 'border-slate-200 focus:border-primary')} placeholder="e.g. Industrial Pump" value={category} onChange={(e) => setCategory(e.target.value)} />
              {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
              <select className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-blue-100" value={status} onChange={(e) => setStatus(e.target.value as Product['status'])}>
                <option>Draft</option><option>Published</option><option>Archived</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
              <textarea className="min-h-24 w-full rounded-xl border border-slate-200 p-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-blue-100" placeholder="Product description..." value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-700 mb-3">Specifications</p>
            <div className="grid gap-3 md:grid-cols-2">
              {['Flow Rate', 'Pressure', 'Material', 'Power', 'Voltage', 'Weight'].map((key) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">{key}</label>
                  <input className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-primary" placeholder={`e.g. 240 L/min`} value={specs[key] ?? ''} onChange={(e) => setSpecs((s) => ({ ...s, [key]: e.target.value }))} />
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Product Image</label>
              <label className={cx('flex flex-col items-center justify-center cursor-pointer rounded-2xl border-2 border-dashed p-4 text-center transition hover:border-primary hover:bg-blue-50', uploading.image ? 'border-primary' : 'border-slate-200')}>
                <input type="file" className="sr-only" accept="image/jpeg,image/png,image/webp" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); e.target.value = ''; }} />
                {imageUrl ? <img src={imageUrl} alt="Preview" className="h-24 w-full object-cover rounded-xl mb-2" /> : <><Image className="text-slate-400 mb-2" size={24} /><p className="text-xs text-slate-500">Click to upload JPG/PNG/WebP (max 15MB)</p></>}
                {uploading.image && uploading.image < 100 ? <div className="mt-2 w-full h-1.5 rounded-full bg-slate-200"><div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${uploading.image}%` }} /></div> : null}
              </label>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">3D Model (GLB/GLTF)</label>
              <label className={cx('flex flex-col items-center justify-center cursor-pointer rounded-2xl border-2 border-dashed p-4 text-center transition hover:border-primary hover:bg-blue-50', uploading.model ? 'border-primary' : 'border-slate-200')}>
                <input type="file" className="sr-only" accept=".glb,.gltf" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleModelUpload(f); e.target.value = ''; }} />
                <Box className="text-slate-400 mb-2" size={24} />
                <p className="text-xs text-slate-500">{modelUrl || specs.modelUrl ? '✓ Model uploaded' : 'Click to upload GLB/GLTF (max 150MB)'}</p>
                {uploading.model && uploading.model < 100 ? <div className="mt-2 w-full h-1.5 rounded-full bg-slate-200"><div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${uploading.model}%` }} /></div> : null}
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <Button variant="secondary" onClick={onClose} type="button" disabled={isSaving}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : product ? 'Update Product' : 'Create Product'}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

// ─── Product Upload Wizard ────────────────────────────────────────────────────

const WIZARD_STEPS = ['Basic Information', 'Specifications', 'Media Upload', 'Animations', 'Publish'];

export function ProductUploadWizardPage() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [specs, setSpecs] = useState<Record<string, string>>({});
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, UploadedFile>>({});
  const [uploadError, setUploadError] = useState('');
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const token = useAuthStore((s) => s.token);
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  async function handleUpload(slot: string, file: File) {
    if (!token) return;
    setUploadError('');
    setUploadProgress((p) => ({ ...p, [slot]: 1 }));
    try {
      const uploaded = await uploadFileWithProgress({ token, file, onProgress: (pct) => setUploadProgress((p) => ({ ...p, [slot]: pct })) });
      setUploadedFiles((f) => ({ ...f, [slot]: uploaded }));
    } catch (err) {
      setUploadError(err instanceof ApiClientError ? err.message : 'Upload failed');
      setUploadProgress((p) => ({ ...p, [slot]: 0 }));
    }
  }

  function validateStep() {
    const errs: Record<string, string> = {};
    if (step === 0) {
      if (!name.trim()) errs.name = 'Product name is required';
      if (!category.trim()) errs.category = 'Category is required';
    }
    setStepErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function nextStep() {
    if (!validateStep()) return;
    setStep((s) => Math.min(4, s + 1));
  }

  async function publish() {
    if (!token) return;
    setSaving(true);
    try {
      await api.createProduct(token, {
        name: name.trim(), category: category.trim(), description: description.trim(),
        status: 'Published', specs: { ...specs, modelUrl: uploadedFiles['CAD / GLB model']?.url ?? '' },
        imageUrl: uploadedFiles['Product imagery']?.url,
        modelUrl: uploadedFiles['CAD / GLB model']?.url,
        documentUrl: uploadedFiles['Datasheets']?.url,
      });
      setSaved(true);
      success('Product published', `"${name}" is now live in your catalog.`);
    } catch (err) {
      showError('Publish failed', err instanceof ApiClientError ? err.message : 'Could not publish product');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Product Upload Wizard" eyebrow="Create a complete AR-ready industrial product record." />
      <Card className="p-6">
        <div className="grid gap-4 md:grid-cols-5">
          {WIZARD_STEPS.map((s, i) => (
            <button type="button" key={s} className={cx('rounded-2xl border p-4 text-left transition cursor-pointer', i === step ? 'border-primary bg-blue-50 text-primary' : i < step ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-500')} onClick={() => { if (i < step || validateStep()) setStep(i); }}>
              <span className="text-xs font-bold">Step {i + 1}</span>
              <p className="mt-1 text-sm font-semibold">{s}</p>
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <SectionTitle title={WIZARD_STEPS[step]} meta={`${step + 1} of 5`} />
        {step === 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Product Name <span className="text-red-500">*</span></label>
              <input className={cx('h-12 w-full rounded-xl border px-4 text-sm outline-none', stepErrors.name ? 'border-red-400' : 'border-slate-200 focus:border-primary')} placeholder="e.g. Pump X-1" value={name} onChange={(e) => setName(e.target.value)} />
              {stepErrors.name && <p className="mt-1 text-xs text-red-500">{stepErrors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Category <span className="text-red-500">*</span></label>
              <input className={cx('h-12 w-full rounded-xl border px-4 text-sm outline-none', stepErrors.category ? 'border-red-400' : 'border-slate-200 focus:border-primary')} placeholder="e.g. Industrial Pump" value={category} onChange={(e) => setCategory(e.target.value)} />
              {stepErrors.category && <p className="mt-1 text-xs text-red-500">{stepErrors.category}</p>}
            </div>
            <textarea className="min-h-36 rounded-xl border border-slate-200 p-4 sm:col-span-2 text-sm outline-none focus:border-primary" placeholder="Product description..." value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        )}
        {step === 1 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {['Flow Rate', 'Pressure', 'Material', 'Certifications', 'Power', 'Weight'].map((k) => (
              <div key={k}>
                <label className="block text-xs font-semibold text-slate-500 mb-1">{k}</label>
                <input className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-primary" placeholder={k} value={specs[k] ?? ''} onChange={(e) => setSpecs((s) => ({ ...s, [k]: e.target.value }))} />
              </div>
            ))}
          </div>
        )}
        {step === 2 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {['CAD / GLB model', 'Product imagery', 'Datasheets', 'Installation manual'].map((slot) => {
              const accept = slot.includes('model') ? '.glb,.gltf' : slot.includes('imagery') ? 'image/png,image/jpeg,image/webp' : 'application/pdf';
              const pct = uploadProgress[slot] ?? 0;
              const done = uploadedFiles[slot];
              return (
                <label key={slot} className={cx('flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-4 text-center text-sm font-semibold text-slate-500 transition hover:border-primary hover:bg-blue-50', done ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200')}>
                  <input className="sr-only" type="file" accept={accept} onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleUpload(slot, f); e.target.value = ''; }} />
                  <Upload className="mb-2" size={18} />
                  <span>{done?.original_name ?? slot}</span>
                  {pct > 0 && pct < 100 && <div className="mt-3 h-2 w-full rounded-full bg-slate-200"><span className="block h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} /></div>}
                  {done && <span className="mt-2 text-xs text-emerald-600">✓ Uploaded</span>}
                </label>
              );
            })}
            {uploadError && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700 sm:col-span-2">{uploadError}</p>}
          </div>
        )}
        {step === 3 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {['Exploded view', 'Flow simulation', 'Maintenance mode', 'Safety sequence'].map((anim) => (
              <label key={anim} className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 cursor-pointer hover:bg-slate-50">
                <input type="checkbox" className="accent-primary w-4 h-4" defaultChecked={anim !== 'Safety sequence'} />
                <span className="font-semibold text-sm">{anim}</span>
              </label>
            ))}
          </div>
        )}
        {step === 4 && (
          <div className="space-y-4">
            {saved ? (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-8 text-center">
                <Check className="mx-auto text-emerald-500 mb-3" size={40} />
                <p className="text-xl font-bold text-emerald-800">Product Published!</p>
                <p className="mt-2 text-sm text-emerald-600">"{name}" is now live in your catalog.</p>
                <Button className="mt-6" type="button" onClick={() => navigate('/products')}>View All Products</Button>
              </div>
            ) : (
              <>
                <div className="rounded-2xl bg-slate-50 p-6">
                  <h3 className="font-semibold">Publish Checklist</h3>
                  {WIZARD_STEPS.slice(0, 4).map((s, i) => (
                    <div key={s} className="mt-4 flex items-center gap-3 text-sm">
                      <span className={cx('flex h-6 w-6 items-center justify-center rounded-full', i <= step ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500')}><Check size={14} /></span>
                      {s}
                    </div>
                  ))}
                </div>
                <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
                  <strong>Name:</strong> {name || '—'} &nbsp;|&nbsp; <strong>Category:</strong> {category || '—'} &nbsp;|&nbsp; <strong>Files:</strong> {Object.keys(uploadedFiles).length} uploaded
                </div>
                <Button onClick={() => void publish()} disabled={saving} className="w-full">
                  {saving ? 'Publishing...' : 'Publish Product'}
                </Button>
              </>
            )}
          </div>
        )}
        {step < 4 && (
          <div className="mt-8 flex justify-between">
            <Button variant="secondary" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>Back</Button>
            <Button onClick={nextStep}>Continue <ChevronRight size={18} /></Button>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Catalog Builder ──────────────────────────────────────────────────────────

export function CatalogBuilderPage() {
  const token = useAuthStore((s) => s.token);
  const navigate = useNavigate();
  const [liveProducts, setLiveProducts] = useState<Product[]>([]);
  const [catalogs, setCatalogs] = useState<any[]>([]);
  const [activeCatalogId, setActiveCatalogId] = useState('');
  const [catalogName, setCatalogName] = useState('');
  const [catalogDesc, setCatalogDesc] = useState('');
  const [catalogStatus, setCatalogStatus] = useState<'Draft' | 'Published' | 'Archived'>('Draft');
  const [catalogProductIds, setCatalogProductIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const { success, error: showError } = useToast();

  useEffect(() => {
    if (!token || token === 'offline-dev-token') return;
    setLoading(true);
    Promise.all([
      api.listProducts(token).then((r: any) => setLiveProducts(r.map(mapProductRow))).catch(() => null),
      api.listCatalogs(token).then((r: any) => { setCatalogs(r); if (r[0]?.id) selectCatalog(r[0].id, r[0]); }).catch(() => null),
    ]).finally(() => setLoading(false));
  }, [token]);

  function selectCatalog(id: string, cat?: any) {
    setActiveCatalogId(id);
    if (cat) {
      setCatalogName(cat.name ?? '');
      setCatalogDesc(cat.description ?? '');
      setCatalogStatus(cat.status ?? 'Draft');
    }
    if (token && id) {
      api.getCatalog(token, id).then((c: any) => {
        setCatalogProductIds(Array.isArray(c.productIds) ? c.productIds : []);
        setCatalogName(c.name ?? '');
        setCatalogDesc(c.description ?? '');
        setCatalogStatus(c.status ?? 'Draft');
      }).catch(() => null);
    }
  }

  function newCatalog() {
    setActiveCatalogId('');
    setCatalogName('New Catalog');
    setCatalogDesc('');
    setCatalogStatus('Draft');
    setCatalogProductIds([]);
  }

  async function saveCatalog(status?: typeof catalogStatus) {
    if (!catalogName.trim()) { showError('Validation', 'Catalog name is required'); return; }
    setSaving(true);
    const payload = { name: catalogName.trim(), description: catalogDesc.trim(), status: status ?? catalogStatus, productIds: catalogProductIds };
    try {
      const saved: any = activeCatalogId
        ? await api.updateCatalog(token!, activeCatalogId, payload)
        : await api.createCatalog(token!, payload);
      setActiveCatalogId(saved.id);
      const refreshed: any = await api.listCatalogs(token!);
      setCatalogs(refreshed);
      success(activeCatalogId ? 'Catalog saved' : 'Catalog created', payload.name);
    } catch (err) {
      showError('Save failed', err instanceof ApiClientError ? err.message : 'Could not save catalog');
    } finally { setSaving(false); }
  }

  async function deleteCatalog() {
    if (!activeCatalogId || !window.confirm('Delete this catalog?')) return;
    setSaving(true);
    try {
      await api.deleteCatalog(token!, activeCatalogId);
      setCatalogs((c) => c.filter((cat) => cat.id !== activeCatalogId));
      newCatalog();
      success('Catalog deleted');
    } catch (err) {
      showError('Delete failed', err instanceof ApiClientError ? err.message : 'Could not delete catalog');
    } finally { setSaving(false); }
  }

  function toggleProduct(id: string) {
    setCatalogProductIds((c) => c.includes(id) ? c.filter((p) => p !== id) : [...c, id]);
  }

  function moveProduct(id: string, dir: -1 | 1) {
    setCatalogProductIds((c) => {
      const i = c.indexOf(id); const ni = i + dir;
      if (i < 0 || ni < 0 || ni >= c.length) return c;
      const n = [...c]; [n[i], n[ni]] = [n[ni], n[i]]; return n;
    });
  }

  const filteredProducts = liveProducts.filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()));
  const selected = liveProducts.filter((p) => catalogProductIds.includes(p.id)).sort((a, b) => catalogProductIds.indexOf(a.id) - catalogProductIds.indexOf(b.id));

  return (
    <div className="space-y-8">
      <PageHeader title="Catalog Builder" eyebrow="Build branded interactive sales catalogs from your product library."
        action={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => void saveCatalog()} disabled={saving}><Save size={18} />Save Draft</Button>
            <Button onClick={() => void saveCatalog('Published')} disabled={saving}><Sparkles size={18} />Publish</Button>
          </div>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[300px_1fr_1fr]">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <SectionTitle title="My Catalogs" />
            <Button className="h-8 px-3 text-xs" onClick={newCatalog}><Plus size={14} />New</Button>
          </div>
          {loading ? <p className="text-sm text-slate-400">Loading...</p> : null}
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {catalogs.map((cat) => (
              <button key={cat.id} className={cx('flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition', activeCatalogId === cat.id ? 'border-primary bg-blue-50' : 'border-slate-200 hover:border-primary/50')} onClick={() => selectCatalog(cat.id, cat)}>
                <span><span className="block text-sm font-semibold text-slate-900">{cat.name}</span><span className="text-xs text-slate-500">{cat.status}</span></span>
              </button>
            ))}
            {!catalogs.length && !loading && <p className="text-sm text-slate-400">No catalogs yet. Click New to start.</p>}
          </div>
          <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Name <span className="text-red-500">*</span></label>
              <input className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-primary" value={catalogName} onChange={(e) => setCatalogName(e.target.value)} placeholder="Catalog name" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Description</label>
              <textarea className="min-h-20 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-primary" value={catalogDesc} onChange={(e) => setCatalogDesc(e.target.value)} placeholder="Catalog description" />
            </div>
            <select className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-primary" value={catalogStatus} onChange={(e) => setCatalogStatus(e.target.value as any)}>
              <option>Draft</option><option>Published</option><option>Archived</option>
            </select>
            <div className="flex gap-2">
              <Button className="flex-1 h-10" onClick={() => void saveCatalog()} disabled={saving}>Save</Button>
              {activeCatalogId && <Button className="h-10 px-3" variant="danger" onClick={() => void deleteCatalog()} disabled={saving}><Trash2 size={14} /></Button>}
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <SectionTitle title="Product Library" meta={`${catalogProductIds.length} selected`} />
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:border-primary" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {filteredProducts.map((p) => (
              <button key={p.id} onClick={() => toggleProduct(p.id)} className={cx('flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition', catalogProductIds.includes(p.id) ? 'border-primary bg-blue-50' : 'border-slate-200 hover:border-primary')}>
                <div className="h-14 w-14 shrink-0 rounded-xl overflow-hidden bg-slate-100">{p.image ? <img src={p.image} alt={p.name} className="h-full w-full object-cover" /> : <Box className="m-auto mt-4 text-slate-300" size={20} />}</div>
                <div className="flex-1 min-w-0"><p className="font-semibold truncate">{p.name}</p><p className="text-sm text-slate-500">{p.category}</p></div>
                {catalogProductIds.includes(p.id) && <Check className="text-primary shrink-0" size={18} />}
              </button>
            ))}
            {!filteredProducts.length && <EmptyState icon={Box} title="No products" description="Add products from the Product Management page." />}
          </div>
        </Card>

        <Card className="p-5">
          <SectionTitle title="Catalog Preview" meta={`${selected.length} products`} />
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Industrial Catalog</p>
            <h2 className="text-2xl font-bold mt-1">{catalogName || 'Untitled Catalog'}</h2>
            {catalogDesc && <p className="mt-1 text-sm text-slate-500">{catalogDesc}</p>}
          </div>
          <div className="mt-4 space-y-3 max-h-[400px] overflow-y-auto">
            {selected.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                <span className="text-xs font-bold text-slate-400 w-6">{i + 1}</span>
                <div className="h-10 w-10 shrink-0 rounded-lg overflow-hidden bg-slate-100">{p.image ? <img src={p.image} alt="" className="h-full w-full object-cover" /> : null}</div>
                <div className="flex-1 min-w-0"><p className="text-sm font-semibold truncate">{p.name}</p><p className="text-xs text-slate-500">{p.category}</p></div>
                <div className="flex gap-1">
                  <Button className="h-7 px-2 text-xs" variant="secondary" onClick={() => moveProduct(p.id, -1)} disabled={i === 0}>↑</Button>
                  <Button className="h-7 px-2 text-xs" variant="secondary" onClick={() => moveProduct(p.id, 1)} disabled={i === selected.length - 1}>↓</Button>
                  <Button className="h-7 px-2" variant="ghost" onClick={() => toggleProduct(p.id)}><X size={12} /></Button>
                </div>
              </div>
            ))}
            {!selected.length && <p className="text-sm text-slate-400 text-center py-6">Select products from the library to build your catalog.</p>}
          </div>
          {activeCatalogId && (
            <Button variant="secondary" className="mt-4 w-full" onClick={() => navigate(`/catalog-preview?id=${activeCatalogId}`)}>Preview Full Catalog</Button>
          )}
        </Card>
      </div>
    </div>
  );
}

// ─── Catalog Preview ──────────────────────────────────────────────────────────

export function CatalogPreviewPage() {
  const token = useAuthStore((s) => s.token);
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const [catalog, setCatalog] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [qrUrl, setQrUrl] = useState('');
  const { success, error: showError } = useToast();

  useEffect(() => {
    if (!token || token === 'offline-dev-token' || !id) return;
    setLoading(true);
    api.getCatalog(token, id).then((c: any) => {
      setCatalog(c);
      if (Array.isArray(c.productIds) && c.productIds.length) {
        api.listProducts(token).then((rows: any) => {
          const mapped = rows.map(mapProductRow);
          setProducts(mapped.filter((p: Product) => c.productIds.includes(p.id)));
        }).catch(() => null);
      }
    }).catch(() => null).finally(() => setLoading(false));
  }, [token, id]);

  async function generateQr() {
    if (!token || !id) return;
    try {
      const res: any = await api.createQr(token, 'catalog', id);
      setQrUrl(res.qr_data_url);
      success('QR Code generated');
    } catch (err) {
      showError('QR failed', err instanceof ApiClientError ? err.message : 'Could not generate QR');
    }
  }

  if (loading) return <div className="flex h-64 items-center justify-center text-slate-400"><RefreshCw className="animate-spin mr-3" size={24} />Loading catalog...</div>;

  return (
    <div className="space-y-8">
      <PageHeader title="Catalog Preview" eyebrow="Review the published buyer-facing catalog before sharing."
        action={<Button onClick={() => void generateQr()}><QrCode size={18} />Generate QR</Button>}
      />
      {qrUrl && (
        <Card className="p-6 flex items-center gap-6">
          <img src={qrUrl} alt="QR Code" className="h-40 w-40 rounded-xl" />
          <div>
            <h3 className="text-lg font-bold">QR Code Ready</h3>
            <p className="mt-1 text-sm text-slate-500">Share this QR code to give buyers instant access to this catalog.</p>
            <a href={qrUrl} download="catalog-qr.png" className="mt-3 inline-flex"><Button variant="secondary"><Download size={18} />Download QR</Button></a>
          </div>
        </Card>
      )}
      <Card className="overflow-hidden">
        <div className="bg-navy p-8 text-white">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-200">I3DION Spatial Catalog</p>
          <h1 className="mt-2 text-4xl font-bold">{catalog?.name ?? 'Catalog Preview'}</h1>
          {catalog?.description && <p className="mt-3 max-w-2xl text-slate-300">{catalog.description}</p>}
        </div>
        {products.length ? (
          <div className="grid gap-6 p-6 md:grid-cols-3">
            {products.map((p) => (
              <Card key={p.id} className="overflow-hidden">
                <div className="relative h-48 overflow-hidden bg-slate-100">
                  {p.image ? <img src={p.image} alt={p.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><Box className="text-slate-300" size={40} /></div>}
                  <div className="absolute left-3 top-3"><Badge>{p.status}</Badge></div>
                </div>
                <div className="p-4">
                  <p className="text-xs font-semibold text-primary">{p.category}</p>
                  <h3 className="mt-1 font-bold">{p.name}</h3>
                  <div className="mt-3 flex justify-between text-xs text-slate-500">
                    <span>{p.views.toLocaleString()} views</span><span>{p.leads} leads</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="p-12"><EmptyState icon={Layers} title="No products in catalog" description="Add products from the Catalog Builder." /></div>
        )}
      </Card>
    </div>
  );
}

// ─── Product Experience ───────────────────────────────────────────────────────

export function ProductExperiencePage() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const token = useAuthStore((s) => s.token);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const { success, error: showError } = useToast();

  useEffect(() => {
    if (!token || !id) return;
    setLoading(true);
    api.getProduct(token, id).then((r: any) => setProduct(mapProductRow(r))).catch(() => null).finally(() => setLoading(false));
  }, [token, id]);

  async function generateQr() {
    if (!token || !id) return;
    try {
      const res: any = await api.createQr(token, 'product', id);
      const a = document.createElement('a');
      a.href = res.qr_data_url;
      a.download = `qr-${product?.name || 'product'}.png`;
      a.click();
      success('QR Code downloaded');
    } catch (err) {
      showError('QR failed', err instanceof ApiClientError ? err.message : 'Could not generate QR');
    }
  }

  if (loading) return <div className="flex h-64 items-center justify-center text-slate-400"><RefreshCw className="animate-spin mr-3" size={24} />Loading product...</div>;
  if (!product) return (
    <div className="space-y-8">
      <PageHeader title="Product Experience" eyebrow="Buyer-facing product visualization page." />
      <EmptyState icon={Box} title="No product selected" description="Select a product from the Products page to preview it here." action={<Link to="/products" className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-600 active:scale-[0.98]">Browse Products</Link>} />
    </div>
  );

  return (
    <div className="space-y-8">
      <PageHeader title="Product Experience" eyebrow="Buyer-facing visualization page with technical content and lead capture."
        action={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => void generateQr()}><QrCode size={18} />QR Code</Button>
            <Link to="/products" className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50">← Back</Link>
          </div>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <Card className="overflow-hidden">
          <div className="h-[520px] bg-slate-100 viewer-grid">
            <ThreeProduct modelUrl={product.specs?.modelUrl as string} />
          </div>
        </Card>
        <Card className="p-6">
          <Badge>{product.status}</Badge>
          <h1 className="mt-4 text-3xl font-bold">{product.name}</h1>
          <p className="mt-2 text-sm text-slate-500">{product.category}</p>
          {Object.keys(product.specs).filter((k) => k !== 'modelUrl' && product.specs[k]).length > 0 && (
            <div className="mt-6 grid gap-3">
              {Object.entries(product.specs).filter(([k, v]) => k !== 'modelUrl' && v).map(([k, v]) => (
                <div key={k} className="flex justify-between rounded-xl bg-slate-50 p-4">
                  <span className="font-semibold text-slate-500">{k}</span>
                  <span className="font-bold">{v}</span>
                </div>
              ))}
            </div>
          )}
          <div className="mt-6 space-y-2">
            <p className="text-sm text-slate-500"><span className="font-semibold">{product.views.toLocaleString()}</span> views &nbsp;·&nbsp; <span className="font-semibold">{product.leads}</span> leads</p>
          </div>
          <div className="mt-6 flex flex-col gap-3">
            <Button onClick={() => void generateQr()}><QrCode size={18} />Generate QR</Button>
            <Button variant="secondary"><FileText size={18} />Download Datasheet</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── Leads Dashboard ──────────────────────────────────────────────────────────

type LeadFull = Lead & { email: string; phone?: string; notes?: string; catalogId?: string; productId?: string; };

function mapLeadRow(r: any): LeadFull {
  return {
    id: String(r.id), name: r.name, company: r.company || '—', email: r.email, phone: r.phone || '',
    product: r.product_id || '—', status: r.status, score: r.score ?? 0,
    source: r.source || 'Catalog', lastSeen: r.updated_at ? new Date(r.updated_at).toLocaleDateString() : '—',
    notes: r.notes || '', productId: r.product_id, catalogId: r.catalog_id,
  };
}

function LeadModal({ lead, onClose, onSave, isSaving }: {
  lead: LeadFull | null; onClose: () => void; onSave: (data: any) => void; isSaving: boolean;
}) {
  const [name, setName] = useState(lead?.name ?? '');
  const [email, setEmail] = useState(lead?.email ?? '');
  const [phone, setPhone] = useState(lead?.phone ?? '');
  const [company, setCompany] = useState(lead?.company ?? '');
  const [status, setStatus] = useState(lead?.status ?? 'New');
  const [score, setScore] = useState(String(lead?.score ?? 0));
  const [source, setSource] = useState(lead?.source ?? 'Catalog');
  const [notes, setNotes] = useState(lead?.notes ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Name is required';
    if (!email.trim()) errs.email = 'Email is required';
    else if (!validateEmail(email)) errs.email = 'Invalid email address';
    if (!validatePhone(phone)) errs.phone = 'Invalid phone number';
    const scoreNum = Number(score);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) errs.score = 'Score must be 0–100';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSave({ name: name.trim(), email: email.trim(), phone: phone.trim() || null, company: company.trim() || null, status, score: Number(score), source, notes: notes.trim() || null });
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white p-6">
          <h2 className="text-2xl font-bold">{lead ? 'Edit Lead' : 'Create Lead'}</h2>
          <button onClick={onClose} className="rounded-xl p-2 hover:bg-slate-100"><X size={20} /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name <span className="text-red-500">*</span></label>
              <input className={cx('h-12 w-full rounded-xl border px-4 text-sm outline-none', errors.name ? 'border-red-400' : 'border-slate-200 focus:border-primary')} value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Smith" />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Email <span className="text-red-500">*</span></label>
              <input className={cx('h-12 w-full rounded-xl border px-4 text-sm outline-none', errors.email ? 'border-red-400' : 'border-slate-200 focus:border-primary')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@company.com" />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Phone</label>
              <input className={cx('h-12 w-full rounded-xl border px-4 text-sm outline-none', errors.phone ? 'border-red-400' : 'border-slate-200 focus:border-primary')} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 000 0000" />
              {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Company</label>
              <input className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-primary" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Industrial Corp." />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
              <select className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-primary" value={status} onChange={(e) => setStatus(e.target.value as any)}>
                <option>New</option><option>Contacted</option><option>Qualified</option><option>Proposal Sent</option><option>Closed</option><option>Lost</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Intent Score (0–100)</label>
              <input className={cx('h-12 w-full rounded-xl border px-4 text-sm outline-none', errors.score ? 'border-red-400' : 'border-slate-200 focus:border-primary')} type="number" min="0" max="100" value={score} onChange={(e) => setScore(e.target.value)} />
              {errors.score && <p className="mt-1 text-xs text-red-500">{errors.score}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Source</label>
              <select className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-primary" value={source} onChange={(e) => setSource(e.target.value)}>
                <option>Catalog</option><option>QR Scan</option><option>AR Session</option><option>Trade Show</option><option>Website</option><option>Referral</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Notes</label>
              <textarea className="min-h-24 w-full rounded-xl border border-slate-200 p-4 text-sm outline-none focus:border-primary" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal notes about this lead..." />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <Button variant="secondary" onClick={onClose} type="button" disabled={isSaving}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : lead ? 'Update Lead' : 'Create Lead'}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export function LeadsDashboardPage() {
  const [leads, setLeads] = useState<LeadFull[]>([]);
  const [selected, setSelected] = useState<LeadFull | null>(null);
  const [editLead, setEditLead] = useState<LeadFull | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LeadFull | null>(null);
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const token = useAuthStore((s) => s.token);
  const { success, error: showError } = useToast();

  const loadLeads = useCallback(async () => {
    if (!token || token === 'offline-dev-token') return;
    setIsLoading(true);
    try {
      const rows: any = await api.listLeads(token);
      const mapped = rows.map(mapLeadRow);
      setLeads(mapped);
      if (mapped.length && !selected) setSelected(mapped[0]);
    } catch { } finally { setIsLoading(false); }
  }, [token]);

  useEffect(() => { loadLeads(); }, [loadLeads]);

  const visible = leads.filter((l) => {
    const q = filter.toLowerCase();
    return (!q || l.name.toLowerCase().includes(q) || l.company.toLowerCase().includes(q) || l.email.toLowerCase().includes(q)) &&
      (statusFilter === 'All' || l.status === statusFilter);
  });

  async function saveLead(data: any) {
    setIsSaving(true);
    try {
      if (editLead) {
        const saved: any = await api.updateLead(token!, editLead.id, data);
        const mapped = mapLeadRow(saved);
        setLeads((c) => c.map((l) => l.id === editLead.id ? mapped : l));
        if (selected?.id === editLead.id) setSelected(mapped);
        success('Lead updated');
      } else {
        const saved: any = await api.createLead(token!, data);
        const mapped = mapLeadRow(saved);
        setLeads((c) => [mapped, ...c]);
        success('Lead created');
      }
      setEditLead(null);
      setIsCreateOpen(false);
    } catch (err) {
      showError('Save failed', err instanceof ApiClientError ? err.message : 'Could not save lead');
    } finally { setIsSaving(false); }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setIsSaving(true);
    try {
      await api.deleteLead(token!, deleteTarget.id);
      setLeads((c) => c.filter((l) => l.id !== deleteTarget.id));
      if (selected?.id === deleteTarget.id) setSelected(null);
      success('Lead deleted');
      setDeleteTarget(null);
    } catch (err) {
      showError('Delete failed', err instanceof ApiClientError ? err.message : 'Could not delete lead');
    } finally { setIsSaving(false); }
  }

  const columns = useMemo<ColumnDef<LeadFull>[]>(() => [
    { accessorKey: 'name', header: 'Lead' },
    { accessorKey: 'company', header: 'Company' },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <Badge>{row.original.status}</Badge> },
    { accessorKey: 'score', header: 'Score', cell: ({ row }) => <span className="font-bold text-primary">{row.original.score}/100</span> },
    { accessorKey: 'lastSeen', header: 'Last Seen' },
  ], []);

  const table = useReactTable({ data: visible, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <div className="space-y-8">
      <PageHeader title="Lead Management" eyebrow="Track buyer intent from QR scans, AR interactions, and catalog CTAs."
        action={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={loadLeads} disabled={isLoading}><RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />Refresh</Button>
            <Button onClick={() => { setEditLead(null); setIsCreateOpen(true); }}><Plus size={18} />Create Lead</Button>
          </div>
        }
      />
      <Card className="p-4">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:border-primary" placeholder="Search leads..." value={filter} onChange={(e) => setFilter(e.target.value)} />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['All', 'New', 'Contacted', 'Qualified', 'Proposal Sent', 'Closed', 'Lost'].map((s) => (
              <button key={s} className={cx('rounded-xl px-3 py-2 text-xs font-semibold transition', statusFilter === s ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 hover:bg-primary hover:text-white')} onClick={() => setStatusFilter(s)}>{s}</button>
            ))}
          </div>
        </div>
      </Card>
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center text-slate-400"><RefreshCw className="animate-spin mr-3" size={20} />Loading leads...</div>
          ) : visible.length === 0 ? (
            <div className="p-8"><EmptyState icon={Users} title="No leads found" description={filter ? 'No leads match your search.' : 'Create your first lead to get started.'} action={<Button onClick={() => { setEditLead(null); setIsCreateOpen(true); }}><Plus size={18} />Create Lead</Button>} /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  {table.getHeaderGroups().map((g) => <tr key={g.id}>{g.headers.map((h) => <th key={h.id} className="px-6 py-4">{flexRender(h.column.columnDef.header, h.getContext())}</th>)}<th className="px-6 py-4">Actions</th></tr>)}
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className={cx('cursor-pointer transition', selected?.id === row.original.id ? 'bg-blue-50' : 'hover:bg-slate-50')} onClick={() => setSelected(row.original)}>
                      {row.getVisibleCells().map((cell) => <td key={cell.id} className="px-6 py-4">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Button className="h-8 px-2" variant="secondary" onClick={(e) => { e.stopPropagation(); setEditLead(row.original); setIsCreateOpen(true); }}><Edit2 size={14} /></Button>
                          <Button className="h-8 px-2" variant="ghost" onClick={(e) => { e.stopPropagation(); setDeleteTarget(row.original); }}><Trash2 size={14} /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
        <Card className="p-6">
          <SectionTitle title="Lead Details" />
          {selected ? (
            <>
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-2xl font-bold">{selected.name}</p>
                <p className="mt-1 text-slate-500">{selected.company}</p>
                <p className="mt-1 text-sm text-slate-500">{selected.email}</p>
                {selected.phone && <p className="mt-1 text-sm text-slate-500">{selected.phone}</p>}
                <div className="mt-3"><Badge>{selected.status}</Badge></div>
              </div>
              {[['Intent Score', `${selected.score}/100`], ['Source', selected.source], ['Last Activity', selected.lastSeen]].map(([l, v]) => (
                <div key={l} className="mt-4 flex justify-between border-b border-slate-100 pb-3">
                  <span className="text-sm text-slate-500">{l}</span><span className="text-sm font-semibold">{v}</span>
                </div>
              ))}
              {selected.notes && <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600"><p className="text-xs font-semibold text-slate-400 mb-1">Notes</p>{selected.notes}</div>}
              <div className="mt-6 space-y-2">
                <Button className="w-full" onClick={() => { setEditLead(selected); setIsCreateOpen(true); }}><Edit2 size={18} />Edit Lead</Button>
                <a href={`mailto:${selected.email}`} className="block"><Button variant="secondary" className="w-full"><Mail size={18} />Send Email</Button></a>
                {selected.phone && <a href={`tel:${selected.phone}`} className="block"><Button variant="secondary" className="w-full"><Phone size={18} />Call Lead</Button></a>}
                <Button variant="ghost" className="w-full text-red-500 hover:bg-red-50" onClick={() => setDeleteTarget(selected)}><Trash2 size={18} />Delete Lead</Button>
              </div>
            </>
          ) : <p className="text-slate-500 text-sm">Select a lead to view details.</p>}
        </Card>
      </div>
      {isCreateOpen && (
        <LeadModal lead={editLead} onClose={() => { setIsCreateOpen(false); setEditLead(null); }} onSave={(d) => void saveLead(d)} isSaving={isSaving} />
      )}
      {deleteTarget && (
        <ConfirmDialog title="Delete Lead" message={`Delete "${deleteTarget.name}"? This action cannot be undone.`} onConfirm={() => void confirmDelete()} onCancel={() => setDeleteTarget(null)} loading={isSaving} />
      )}
    </div>
  );
}

// ─── Analytics ────────────────────────────────────────────────────────────────

const ANALYTICS_COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
const MONTHLY_DATA = [
  { name: 'Jan', views: 2100, ar: 280, leads: 42, qr: 390 },
  { name: 'Feb', views: 2800, ar: 340, leads: 58, qr: 470 },
  { name: 'Mar', views: 3200, ar: 410, leads: 71, qr: 520 },
  { name: 'Apr', views: 2600, ar: 330, leads: 55, qr: 430 },
  { name: 'May', views: 3900, ar: 490, leads: 88, qr: 640 },
  { name: 'Jun', views: 4200, ar: 560, leads: 102, qr: 710 },
  { name: 'Jul', views: 3700, ar: 480, leads: 91, qr: 650 },
];
const PIE_DATA = [
  { name: 'Pump X-1', value: 38 }, { name: 'Valve A7', value: 24 },
  { name: 'Motor M3', value: 21 }, { name: 'Sensor S4', value: 12 }, { name: 'Other', value: 5 },
];

export function AnalyticsDashboardPage() {
  const token = useAuthStore((s) => s.token);
  const [summary, setSummary] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token || token === 'offline-dev-token') return;
    api.getAnalyticsSummary(token).then((d: any) => setSummary(d)).catch(() => null);
  }, [token]);

  const totalViews = MONTHLY_DATA.reduce((a, b) => a + b.views, 0);
  const totalAr = MONTHLY_DATA.reduce((a, b) => a + b.ar, 0);
  const totalLeads = summary ? summary.leads.reduce((a: number, l: any) => a + l.count, 0) : MONTHLY_DATA.reduce((a, b) => a + b.leads, 0);
  const totalQr = MONTHLY_DATA.reduce((a, b) => a + b.qr, 0);

  const kpis = [
    { label: 'Total Views', value: totalViews.toLocaleString(), change: '+18%', icon: Eye, tone: 'positive' as const },
    { label: 'AR Sessions', value: totalAr.toLocaleString(), change: '+12%', icon: Sparkles, tone: 'positive' as const },
    { label: 'Leads Captured', value: String(totalLeads), change: '+24%', icon: Users, tone: 'positive' as const },
    { label: 'QR Scans', value: totalQr.toLocaleString(), change: '+9%', icon: QrCode, tone: 'positive' as const },
  ];

  return (
    <div className="space-y-8">
      <PageHeader title="Analytics Dashboard" eyebrow="Product engagement, lead quality, QR performance, and catalog velocity."
        action={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => navigate('/leads')}><Users size={18} />View Leads</Button>
            <Button variant="secondary"><Download size={18} />Export Report</Button>
          </div>
        }
      />
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item) => <KpiCard key={item.label} item={item} />)}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.8fr]">
        <Card className="p-6">
          <SectionTitle title="Monthly Engagement" meta="Views, AR sessions, leads" />
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MONTHLY_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="views" fill="#2563EB" radius={[4, 4, 0, 0]} name="Views" />
                <Bar dataKey="ar" fill="#10B981" radius={[4, 4, 0, 0]} name="AR Sessions" />
                <Bar dataKey="leads" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Leads" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-6">
          <SectionTitle title="Top Products by Engagement" />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={PIE_DATA} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={3}>
                  {PIE_DATA.map((_, i) => <Cell key={i} fill={ANALYTICS_COLORS[i % ANALYTICS_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => `${v}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-2">
            {PIE_DATA.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: ANALYTICS_COLORS[i] }} />{d.name}</div>
                <span className="font-bold">{d.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-6">
          <SectionTitle title="QR Scan Trend" />
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MONTHLY_DATA}>
                <defs>
                  <linearGradient id="qrGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Area dataKey="qr" stroke="#8B5CF6" fill="url(#qrGrad)" strokeWidth={2} name="QR Scans" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-6">
          <SectionTitle title="Top Performing Catalogs" />
          {[['Factory Automation Lineup', '96%', 2400], ['Energy Systems Demo Kit', '82%', 1870], ['Hydraulics Showcase', '71%', 1340], ['Robotics Line 2026', '58%', 980]].map(([name, pct, scans]) => (
            <div key={name as string} className="mb-3">
              <div className="flex justify-between text-sm mb-1"><span className="font-semibold">{name}</span><span className="text-slate-500">{scans} scans</span></div>
              <div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-primary" style={{ width: pct as string }} /></div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export function CompanySettingsPage() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<'profile' | 'company' | 'security' | 'notifications' | 'appearance'>('profile');
  const { success, error: showError } = useToast();

  const tabs = [
    { key: 'profile', label: 'Profile', icon: Settings },
    { key: 'company', label: 'Company', icon: Building2 },
    { key: 'security', label: 'Security', icon: Lock },
    { key: 'notifications', label: 'Notifications', icon: Bell },
    { key: 'appearance', label: 'Appearance', icon: Sparkles },
  ] as const;

  // Profile state
  const [profile, setProfile] = useState({ name: user?.name ?? '', email: user?.email ?? '', phone: '', avatarUrl: '' });
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [profileSaving, setProfileSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Company state
  const [company, setCompany] = useState({ name: '', website: '', logoUrl: '', primaryColor: '#2563EB', profile: '' });
  const [companyErrors, setCompanyErrors] = useState<Record<string, string>>({});
  const [companySaving, setCompanySaving] = useState(false);

  // Security
  const [security, setSecurity] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [securityErrors, setSecurityErrors] = useState<Record<string, string>>({});
  const [securitySaving, setSecuritySaving] = useState(false);

  // Preferences
  const [prefs, setPrefs] = useState({ onboardingEnabled: true, defaultBrandColor: '#2563EB', defaultCatalogVisibility: 'private', emailNotifications: true, inAppNotifications: true, theme: 'light', density: 'comfortable' });
  const [prefsSaving, setPrefsSaving] = useState(false);

  useEffect(() => {
    if (!token || token === 'offline-dev-token') {
      setProfile((p) => ({ ...p, name: user?.name ?? '', email: user?.email ?? '' }));
      return;
    }
    api.getMe(token).then((r: any) => setProfile({ name: r.user.name ?? '', email: r.user.email ?? '', phone: r.user.phone ?? '', avatarUrl: r.user.avatarUrl ?? '' })).catch(() => null);
    // Fix: load company data so company tab is pre-filled
    api.getCompany(token).then((r: any) => {
      if (!r) return;
      setCompany({
        name: r.name ?? '',
        website: r.website ?? '',
        logoUrl: r.logo_url ?? '',
        primaryColor: r.primary_color ?? '#2563EB',
        profile: r.profile ?? '',
      });
    }).catch(() => null);
    api.getPreferences(token).then((r: any) => {
      if (!r) return;
      setPrefs((p) => ({
        ...p,
        onboardingEnabled: r.onboarding_enabled ?? true,
        defaultBrandColor: r.default_brand_color ?? '#2563EB',
        defaultCatalogVisibility: r.default_catalog_visibility ?? 'private',
        emailNotifications: r.notification_preferences?.email ?? true,
        inAppNotifications: r.notification_preferences?.inApp ?? true,
        theme: r.appearance_preferences?.theme ?? 'light',
        density: r.appearance_preferences?.density ?? 'comfortable',
      }));
    }).catch(() => null);
  }, [token, user]);


  async function handleAvatarUpload(file: File) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { showError('Invalid file', 'Please upload a JPG, PNG, or WebP image'); return; }
    if (file.size > 5 * 1024 * 1024) { showError('File too large', 'Avatar must be under 5MB'); return; }
    setAvatarUploading(true);
    try {
      const uploaded = await uploadFileWithProgress({ token: token!, file, onProgress: () => {} });
      setProfile((p) => ({ ...p, avatarUrl: uploaded.url }));
      success('Avatar uploaded');
    } catch (err) {
      showError('Upload failed', err instanceof ApiClientError ? err.message : 'Could not upload avatar');
    } finally { setAvatarUploading(false); }
  }

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!profile.name.trim()) errs.name = 'Name is required';
    if (!profile.email.trim()) errs.email = 'Email is required';
    else if (!validateEmail(profile.email)) errs.email = 'Invalid email address';
    if (profile.phone && !validatePhone(profile.phone)) errs.phone = 'Invalid phone number';
    if (Object.keys(errs).length) { setProfileErrors(errs); return; }
    setProfileErrors({}); setProfileSaving(true);
    try {
      if (token && token !== 'offline-dev-token') await api.updateMe(token, { name: profile.name, email: profile.email, phone: profile.phone, avatarUrl: profile.avatarUrl });
      success('Profile saved', 'Your profile has been updated.');
    } catch (err) {
      showError('Save failed', err instanceof ApiClientError ? err.message : 'Could not save profile');
    } finally { setProfileSaving(false); }
  }

  async function saveCompany(e: FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!company.name.trim()) errs.name = 'Company name is required';
    if (company.website && !validateUrl(company.website)) errs.website = 'Invalid URL — include https://';
    if (Object.keys(errs).length) { setCompanyErrors(errs); return; }
    setCompanyErrors({}); setCompanySaving(true);
    try {
      if (token && token !== 'offline-dev-token') await api.updateCompany(token, company);
      success('Company settings saved');
    } catch (err) {
      showError('Save failed', err instanceof ApiClientError ? err.message : 'Could not save company settings');
    } finally { setCompanySaving(false); }
  }

  async function savePassword(e: FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!security.currentPassword) errs.currentPassword = 'Current password is required';
    if (!security.newPassword) errs.newPassword = 'New password is required';
    else if (security.newPassword.length < 8) errs.newPassword = 'Must be at least 8 characters';
    if (security.newPassword !== security.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (Object.keys(errs).length) { setSecurityErrors(errs); return; }
    setSecurityErrors({}); setSecuritySaving(true);
    try {
      if (token && token !== 'offline-dev-token') await api.updateMe(token, { currentPassword: security.currentPassword, newPassword: security.newPassword });
      setSecurity({ currentPassword: '', newPassword: '', confirmPassword: '' });
      success('Password changed successfully');
    } catch (err) {
      showError('Failed', err instanceof ApiClientError ? err.message : 'Could not change password');
    } finally { setSecuritySaving(false); }
  }

  async function savePreferences() {
    setPrefsSaving(true);
    try {
      if (token && token !== 'offline-dev-token') {
        await api.updatePreferences(token, {
          onboardingEnabled: prefs.onboardingEnabled,
          defaultBrandColor: prefs.defaultBrandColor,
          defaultCatalogVisibility: prefs.defaultCatalogVisibility,
          notificationPreferences: { email: prefs.emailNotifications, inApp: prefs.inAppNotifications },
          appearancePreferences: { theme: prefs.theme, density: prefs.density },
        });
      }
      success('Preferences saved');
    } catch (err) {
      showError('Save failed', err instanceof ApiClientError ? err.message : 'Could not save preferences');
    } finally { setPrefsSaving(false); }
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Settings" eyebrow="Manage workspace branding, profile, security, and preferences." />
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <Card className="p-3 h-fit">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key as any)} className={cx('mb-1 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition', tab === key ? 'bg-blue-50 text-primary' : 'text-slate-600 hover:bg-slate-50')}>
              <Icon size={18} />{label}
            </button>
          ))}
        </Card>
        <Card className="p-6">
          {tab === 'profile' && (
            <form onSubmit={saveProfile} className="space-y-6">
              <SectionTitle title="Profile" />
              <div className="flex items-center gap-6">
                <label className="relative cursor-pointer">
                  <div className="h-20 w-20 rounded-2xl overflow-hidden bg-slate-100">
                    {profile.avatarUrl
                      ? <img src={profile.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                      : <div className="flex h-full items-center justify-center text-2xl font-bold text-slate-400">{(profile.name || 'A')[0].toUpperCase()}</div>}
                  </div>
                  <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white shadow">
                    {avatarUploading ? <RefreshCw size={12} className="animate-spin" /> : <Upload size={12} />}
                  </div>
                  <input type="file" className="sr-only" accept="image/jpeg,image/png,image/webp" onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleAvatarUpload(f); e.target.value = ''; }} />
                </label>
                <div>
                  <p className="font-semibold text-slate-900">{profile.name || 'Your Name'}</p>
                  <p className="text-sm text-slate-500">{user?.role ?? 'Admin'}</p>
                  <p className="mt-1 text-xs text-slate-400">Click avatar to upload new photo (JPG/PNG, max 5MB)</p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                  <input className={cx('h-12 w-full rounded-xl border px-4 text-sm outline-none', profileErrors.name ? 'border-red-400' : 'border-slate-200 focus:border-primary')} value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} placeholder="Alex Thorne" />
                  {profileErrors.name && <p className="mt-1 text-xs text-red-500">{profileErrors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Email <span className="text-red-500">*</span></label>
                  <input className={cx('h-12 w-full rounded-xl border px-4 text-sm outline-none', profileErrors.email ? 'border-red-400' : 'border-slate-200 focus:border-primary')} type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} placeholder="alex@i3dion.com" />
                  {profileErrors.email && <p className="mt-1 text-xs text-red-500">{profileErrors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Phone</label>
                  <input className={cx('h-12 w-full rounded-xl border px-4 text-sm outline-none', profileErrors.phone ? 'border-red-400' : 'border-slate-200 focus:border-primary')} value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="+1 555 000 0000" />
                  {profileErrors.phone && <p className="mt-1 text-xs text-red-500">{profileErrors.phone}</p>}
                </div>
              </div>
              <Button type="submit" disabled={profileSaving}><Save size={18} />{profileSaving ? 'Saving...' : 'Save Profile'}</Button>
            </form>
          )}
          {tab === 'company' && (
            <form onSubmit={saveCompany} className="space-y-6">
              <SectionTitle title="Company Settings" />
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Company Name <span className="text-red-500">*</span></label>
                  <input className={cx('h-12 w-full rounded-xl border px-4 text-sm outline-none', companyErrors.name ? 'border-red-400' : 'border-slate-200 focus:border-primary')} value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })} placeholder="I3DION Industrial" />
                  {companyErrors.name && <p className="mt-1 text-xs text-red-500">{companyErrors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Website</label>
                  <input className={cx('h-12 w-full rounded-xl border px-4 text-sm outline-none', companyErrors.website ? 'border-red-400' : 'border-slate-200 focus:border-primary')} value={company.website} onChange={(e) => setCompany({ ...company, website: e.target.value })} placeholder="https://company.com" />
                  {companyErrors.website && <p className="mt-1 text-xs text-red-500">{companyErrors.website}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Logo URL</label>
                  <input className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-primary" value={company.logoUrl} onChange={(e) => setCompany({ ...company, logoUrl: e.target.value })} placeholder="https://..." />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Primary Brand Color</label>
                  <div className="flex items-center gap-3">
                    <input type="color" className="h-12 w-16 rounded-xl border border-slate-200 cursor-pointer p-1" value={company.primaryColor} onChange={(e) => setCompany({ ...company, primaryColor: e.target.value })} />
                    <input className="h-12 flex-1 rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-primary" value={company.primaryColor} onChange={(e) => setCompany({ ...company, primaryColor: e.target.value })} placeholder="#2563EB" />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Company Profile</label>
                  <textarea className="min-h-28 w-full rounded-xl border border-slate-200 p-4 text-sm outline-none focus:border-primary" value={company.profile} onChange={(e) => setCompany({ ...company, profile: e.target.value })} placeholder="Describe your company..." />
                </div>
              </div>
              <Button type="submit" disabled={companySaving}><Save size={18} />{companySaving ? 'Saving...' : 'Save Company Settings'}</Button>
            </form>
          )}
          {tab === 'security' && (
            <form onSubmit={savePassword} className="space-y-6">
              <SectionTitle title="Change Password" />
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Current Password <span className="text-red-500">*</span></label>
                  <input className={cx('h-12 w-full rounded-xl border px-4 text-sm outline-none', securityErrors.currentPassword ? 'border-red-400' : 'border-slate-200 focus:border-primary')} type="password" value={security.currentPassword} onChange={(e) => setSecurity({ ...security, currentPassword: e.target.value })} placeholder="Your current password" />
                  {securityErrors.currentPassword && <p className="mt-1 text-xs text-red-500">{securityErrors.currentPassword}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">New Password <span className="text-red-500">*</span></label>
                  <input className={cx('h-12 w-full rounded-xl border px-4 text-sm outline-none', securityErrors.newPassword ? 'border-red-400' : 'border-slate-200 focus:border-primary')} type="password" value={security.newPassword} onChange={(e) => setSecurity({ ...security, newPassword: e.target.value })} placeholder="Minimum 8 characters" />
                  {securityErrors.newPassword && <p className="mt-1 text-xs text-red-500">{securityErrors.newPassword}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Confirm New Password <span className="text-red-500">*</span></label>
                  <input className={cx('h-12 w-full rounded-xl border px-4 text-sm outline-none', securityErrors.confirmPassword ? 'border-red-400' : 'border-slate-200 focus:border-primary')} type="password" value={security.confirmPassword} onChange={(e) => setSecurity({ ...security, confirmPassword: e.target.value })} placeholder="Repeat your new password" />
                  {securityErrors.confirmPassword && <p className="mt-1 text-xs text-red-500">{securityErrors.confirmPassword}</p>}
                </div>
              </div>
              <Button type="submit" disabled={securitySaving}><Lock size={18} />{securitySaving ? 'Changing...' : 'Change Password'}</Button>
            </form>
          )}
          {tab === 'notifications' && (
            <div className="space-y-6">
              <SectionTitle title="Notification Preferences" />
              <div className="space-y-4">
                {[
                  { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive updates about leads, AR sessions, and catalog activity via email.' },
                  { key: 'inAppNotifications', label: 'In-App Notifications', desc: 'Show real-time notifications inside the application.' },
                  { key: 'onboardingEnabled', label: 'Guided Onboarding', desc: 'Show onboarding tips and walkthroughs for new team members.' },
                ].map(({ key, label, desc }) => (
                  <label key={key} className="flex items-start gap-4 rounded-2xl border border-slate-200 p-4 cursor-pointer hover:bg-slate-50 transition">
                    <div className="relative mt-0.5">
                      <input type="checkbox" className="sr-only peer" checked={Boolean((prefs as any)[key])} onChange={(e) => setPrefs({ ...prefs, [key]: e.target.checked })} />
                      <div className="h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-primary transition" />
                      <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
                    </div>
                    <div><p className="font-semibold">{label}</p><p className="text-sm text-slate-500">{desc}</p></div>
                  </label>
                ))}
              </div>
              <Button onClick={() => void savePreferences()} disabled={prefsSaving}><Save size={18} />{prefsSaving ? 'Saving...' : 'Save Notifications'}</Button>
            </div>
          )}
          {tab === 'appearance' && (
            <div className="space-y-6">
              <SectionTitle title="Appearance & Catalog Defaults" />
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Default Brand Color</label>
                  <div className="flex items-center gap-3">
                    <input type="color" className="h-12 w-16 rounded-xl border border-slate-200 cursor-pointer p-1" value={prefs.defaultBrandColor} onChange={(e) => setPrefs({ ...prefs, defaultBrandColor: e.target.value })} />
                    <input className="h-12 flex-1 rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-primary" value={prefs.defaultBrandColor} onChange={(e) => setPrefs({ ...prefs, defaultBrandColor: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Default Catalog Visibility</label>
                  <select className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-primary" value={prefs.defaultCatalogVisibility} onChange={(e) => setPrefs({ ...prefs, defaultCatalogVisibility: e.target.value })}>
                    <option value="private">Private</option><option value="public">Public</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Interface Theme</label>
                  <select className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-primary" value={prefs.theme} onChange={(e) => setPrefs({ ...prefs, theme: e.target.value })}>
                    <option value="light">Light</option><option value="dark">Dark</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Layout Density</label>
                  <select className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-primary" value={prefs.density} onChange={(e) => setPrefs({ ...prefs, density: e.target.value })}>
                    <option value="comfortable">Comfortable</option><option value="compact">Compact</option>
                  </select>
                </div>
              </div>
              <Button onClick={() => void savePreferences()} disabled={prefsSaving}><Save size={18} />{prefsSaving ? 'Saving...' : 'Save Appearance'}</Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ─── Support ──────────────────────────────────────────────────────────────────

export function SupportPage() {
  const token = useAuthStore((s) => s.token);
  const [category, setCategory] = useState<'FAQ' | 'Contact Support' | 'Report Issue' | 'Feature Request' | 'Documentation'>('Contact Support');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [tickets, setTickets] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const { success, error: showError } = useToast();

  useEffect(() => {
    if (!token || token === 'offline-dev-token') return;
    api.listSupportTickets(token).then((rows: any) => setTickets(rows)).catch(() => null);
  }, [token]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!subject.trim()) errs.subject = 'Subject is required';
    if (!message.trim()) errs.message = 'Message is required';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({}); setSubmitting(true);
    try {
      const ticket = token && token !== 'offline-dev-token'
        ? await api.createSupportTicket(token, { category, subject: subject.trim(), message: message.trim() })
        : { id: Date.now(), category, subject, message, status: 'Open', created_at: new Date().toISOString() };
      setTickets((c) => [ticket, ...c]);
      setSubject(''); setMessage('');
      success('Support ticket submitted', 'Our team will respond within 24 hours.');
    } catch (err) {
      showError('Submission failed', err instanceof ApiClientError ? err.message : 'Could not submit ticket');
    } finally { setSubmitting(false); }
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Help &amp; Support" eyebrow="Submit tickets, browse FAQ, and report issues or feature requests." />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Card className="p-6">
          <SectionTitle title="Submit a Support Request" />
          <form className="space-y-4" onSubmit={submit}>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Category</label>
              <select className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-primary" value={category} onChange={(e) => setCategory(e.target.value as any)}>
                <option>Contact Support</option><option>Report Issue</option><option>Feature Request</option><option>FAQ</option><option>Documentation</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Subject <span className="text-red-500">*</span></label>
              <input className={cx('h-12 w-full rounded-xl border px-4 text-sm outline-none', errors.subject ? 'border-red-400' : 'border-slate-200 focus:border-primary')} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Briefly describe your request" />
              {errors.subject && <p className="mt-1 text-xs text-red-500">{errors.subject}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Message <span className="text-red-500">*</span></label>
              <textarea className={cx('min-h-40 w-full rounded-xl border p-4 text-sm outline-none', errors.message ? 'border-red-400' : 'border-slate-200 focus:border-primary')} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Describe your request in detail..." />
              {errors.message && <p className="mt-1 text-xs text-red-500">{errors.message}</p>}
            </div>
            <Button type="submit" disabled={submitting}><Mail size={18} />{submitting ? 'Submitting...' : 'Submit Ticket'}</Button>
          </form>
        </Card>
        <Card className="p-6">
          <SectionTitle title="Recent Tickets" />
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {tickets.map((t) => (
              <div key={t.id} className="rounded-xl bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-sm">{t.subject}</p>
                  <span className={cx('shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold', t.status === 'Open' ? 'bg-blue-50 text-blue-700' : t.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600')}>{t.status}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{t.category}</p>
              </div>
            ))}
            {!tickets.length && <EmptyState icon={FileText} title="No tickets yet" description="Submit your first support request above." />}
          </div>
        </Card>
      </div>
    </div>
  );
}
