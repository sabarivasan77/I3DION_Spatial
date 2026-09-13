import { useEffect, useState, type FormEvent } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Button, Card } from '../../components/ui';
import { useToast } from '../../components/Toast';
import { Tracker } from '../../services/Tracker';
import { useAuthStore } from '../../store/authStore';
import { cx } from '../../utils/format';
import { api } from '../../services/api';
import { Logo } from '../../components/Logo';
import { useGoogleLogin } from '@react-oauth/google';

// ─── Auth Pages ───

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

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
  const { login, signup, loginGoogle, loading, error: authError, clearError } = useAuthStore();
  const { error: showError } = useToast();

  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

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
        // After signup with Supabase, if email confirmation is enabled, they need to verify
        // For simplicity, we just navigate.
      } else {
        await login(email, password);
        Tracker.trackEvent('user_login', { email });
      }
      navigate('/hub');
    } catch (err: any) {
      showError('Authentication failed', authError ?? err.message ?? 'Please check your credentials');
    }
  }

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        await loginGoogle(tokenResponse.access_token);
        Tracker.trackEvent('user_login', { method: 'google' });
        navigate('/hub');
      } catch (err: any) {
        showError('Google Sign-In failed', err.message);
      }
    },
    onError: () => showError('Google Sign-In failed', 'Could not connect to Google'),
  });

  return (
    <main className="flex min-h-screen items-center justify-center px-4 pt-16">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl lg:grid-cols-[1fr_0.9fr]">
        <section className="relative min-h-[520px] bg-navy p-8 text-white md:p-12">
          <div className="absolute inset-0 opacity-60 viewer-grid" />
          <div className="relative z-10 flex h-full flex-col justify-between">
            <div>
              <div className="mb-6"><Logo theme="dark" /></div>
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
            {isSignup ? 'Set up your workspace for your sales visualization team.' : 'Sign in to manage catalogs, AR sessions, and leads.'}
          </p>
          <form className="mt-8 space-y-5" onSubmit={submit} noValidate>
            {isSignup && (
              <>
                <InputField label="Full Name" value={name} onChange={setName} placeholder="Alex Thorne" error={errors.name} required />
                <InputField label="Company Name" value={companyName} onChange={setCompanyName} placeholder="I3DION Industrial Solutions" error={errors.companyName} required />
              </>
            )}
            
            <InputField label="Email" type="email" value={email} onChange={setEmail} placeholder="alex@i3dion.com" error={errors.email} required />
            <InputField label="Password" type="password" value={password} onChange={setPassword} placeholder="Minimum 8 characters" error={errors.password} required />

            {authError && <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">{authError}</p>}
            
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? 'Working...' : isSignup ? 'Create Account' : 'Sign In'}
              <ArrowRight size={18} />
            </Button>

            <div className="pt-4 border-t border-slate-100 flex flex-col items-center gap-3">
              <p className="text-sm font-medium text-slate-500">Or continue with</p>
              <Button type="button" onClick={() => handleGoogleLogin()} variant="secondary" className="w-full relative flex items-center justify-center gap-2" disabled={loading}>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </Button>
            </div>
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
      await api.forgotPassword(email);
      setMessage('If an account exists, a reset link has been generated.');
    } catch (err: any) {
      setError(err.message || 'Unable to request reset');
    } finally { setLoading(false); }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 pt-16">
      <Card className="w-full max-w-lg p-8">
        <h1 className="text-3xl font-bold">Forgot Password</h1>
        <p className="mt-2 text-slate-500">Generate a secure reset link via Supabase.</p>
        <form className="mt-8 space-y-4" onSubmit={submit}>
          <InputField label="Email" type="email" value={email} onChange={setEmail} placeholder="alex@i3dion.com" error={error} required />
          {message && <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}
          <Button className="w-full" type="submit" disabled={loading}>{loading ? 'Sending...' : 'Send Reset Link'}</Button>
        </form>
        <p className="mt-4 text-center text-sm"><NavLink className="font-semibold text-primary" to="/login">Back to Login</NavLink></p>
      </Card>
    </main>
  );
}

export function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function submit(e: FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!password) errs.password = 'Password is required';
    else if (password.length < 8) errs.password = 'Must be at least 8 characters';
    if (password !== confirm) errs.confirm = 'Passwords do not match';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({}); setLoading(true);
    
    try {
      const token = new URLSearchParams(window.location.search).get('token') || '';
      await api.resetPassword(token, password);
      setMessage('Password reset successfully');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setErrors({ confirm: err.message || 'Unable to reset password' });
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
          {message && <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}
          <Button className="w-full" type="submit" disabled={loading}>{loading ? 'Resetting...' : 'Reset Password'}</Button>
        </form>
      </Card>
    </main>
  );
}

