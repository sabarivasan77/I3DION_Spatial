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


// ─── Auth Pages ───


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

