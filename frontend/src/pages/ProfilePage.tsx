import { useEffect, useState, type FormEvent } from 'react';
import {
  User, Camera, Check, Mail, Phone, Building2, Globe, MapPin,
  Shield, Clock, Calendar, Link2, Twitter, Linkedin, Github,
  Save, RefreshCw, Edit2, CheckCircle2, AlertCircle, Lock,
  Monitor, Smartphone, LogOut,
} from 'lucide-react';
import { Button, Card, PageHeader, SectionTitle } from '../components/ui';
import { api, ApiClientError, uploadFileWithProgress } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../components/Toast';
import { cx } from '../utils/format';

// ─── Types ─────────────────────────────────────────────────────────────────

interface ExtendedUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  avatarUrl?: string;
  bannerUrl?: string;
  designation?: string;
  department?: string;
  bio?: string;
  website?: string;
  location?: string;
  socialLinks?: Record<string, string>;
  emailVerified?: boolean;
  lastLoginAt?: string;
  createdAt?: string;
}

// ─── Profile Completion ─────────────────────────────────────────────────────

const COMPLETION_FIELDS: Array<{ key: keyof ExtendedUser; label: string; weight: number }> = [
  { key: 'name', label: 'Full Name', weight: 10 },
  { key: 'email', label: 'Email', weight: 10 },
  { key: 'phone', label: 'Phone', weight: 10 },
  { key: 'designation', label: 'Designation', weight: 10 },
  { key: 'department', label: 'Department', weight: 8 },
  { key: 'bio', label: 'Bio', weight: 15 },
  { key: 'website', label: 'Website', weight: 7 },
  { key: 'location', label: 'Location', weight: 10 },
  { key: 'avatarUrl', label: 'Profile Photo', weight: 10 },
  { key: 'bannerUrl', label: 'Banner', weight: 5 },
  { key: 'socialLinks', label: 'Social Links', weight: 5 },
];

function calcCompletion(user: Partial<ExtendedUser>) {
  let total = 0;
  let max = 0;
  for (const f of COMPLETION_FIELDS) {
    max += f.weight;
    const val = user[f.key];
    const filled = val && (typeof val === 'string' ? val.trim() !== '' : Object.keys(val as any).length > 0);
    if (filled) total += f.weight;
  }
  return Math.round((total / max) * 100);
}

// ─── Completion Ring ─────────────────────────────────────────────────────────

function CompletionRing({ pct }: { pct: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const color = pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#3b82f6';
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="-rotate-90" width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} fill="none" stroke="#e2e8f0" strokeWidth="6" />
        <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.8s ease' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-slate-800">{pct}%</span>
      </div>
    </div>
  );
}

// ─── Password Strength ────────────────────────────────────────────────────────

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const strength = checks.filter(Boolean).length;
  const labels = ['', 'Weak', 'Fair', 'Strong', 'Very Strong'];
  const colors = ['', 'bg-red-400', 'bg-amber-400', 'bg-blue-500', 'bg-emerald-500'];
  if (!password) return null;
  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cx(
              'h-1.5 flex-1 rounded-full transition-colors',
              i <= strength ? colors[strength] : 'bg-slate-200',
            )}
          />
        ))}
      </div>
      <p className={cx('mt-1 text-xs font-semibold', strength <= 1 ? 'text-red-500' : strength === 2 ? 'text-amber-500' : strength === 3 ? 'text-blue-600' : 'text-emerald-600')}>
        {labels[strength]}
      </p>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export function ProfilePage() {
  const token = useAuthStore((s) => s.token);
  const authUser = useAuthStore((s) => s.user);
  const [activeSection, setActiveSection] = useState<'profile' | 'security' | 'sessions'>('profile');
  const { success, error: showError } = useToast();

  // Profile state
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [profileForm, setProfileForm] = useState({
    name: '', email: '', phone: '', designation: '', department: '', bio: '',
    website: '', location: '',
    socialLinks: { linkedin: '', twitter: '', github: '' },
  });
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [profileSaving, setProfileSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Security state
  const [security, setSecurity] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [securityErrors, setSecurityErrors] = useState<Record<string, string>>({});
  const [securitySaving, setSecuritySaving] = useState(false);

  // Sessions state
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [revoking, setRevoking] = useState(false);

  // Load profile
  useEffect(() => {
    if (!token || token === 'offline-dev-token') {
      setUser({
        id: 'offline', name: authUser?.name ?? 'User', email: authUser?.email ?? '',
        role: authUser?.role ?? 'Admin', emailVerified: false,
      });
      setProfileForm((p) => ({
        ...p, name: authUser?.name ?? '', email: authUser?.email ?? '',
      }));
      return;
    }
    api.getMe(token).then((r: any) => {
      const u = r.user as ExtendedUser;
      setUser(u);
      setProfileForm({
        name: u.name ?? '',
        email: u.email ?? '',
        phone: u.phone ?? '',
        designation: u.designation ?? '',
        department: u.department ?? '',
        bio: u.bio ?? '',
        website: u.website ?? '',
        location: u.location ?? '',
        socialLinks: {
          linkedin: u.socialLinks?.linkedin ?? '',
          twitter: u.socialLinks?.twitter ?? '',
          github: u.socialLinks?.github ?? '',
        },
      });
    }).catch(() => null);
  }, [token, authUser]);

  // Load sessions when sessions tab active
  useEffect(() => {
    if (activeSection !== 'sessions' || !token || token === 'offline-dev-token') return;
    setSessionsLoading(true);
    api.getSessions(token).then((s: any) => setSessions(s ?? [])).catch(() => null).finally(() => setSessionsLoading(false));
  }, [activeSection, token]);

  const completion = calcCompletion({
    ...profileForm,
    avatarUrl: user?.avatarUrl,
    bannerUrl: user?.bannerUrl,
    socialLinks: Object.values(profileForm.socialLinks).some(Boolean) ? profileForm.socialLinks : undefined,
  });

  async function uploadAvatar(file: File) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showError('Invalid file', 'Please upload a JPG, PNG, or WebP image');
      return;
    }
    if (file.size > 5 * 1024 * 1024) { showError('File too large', 'Avatar must be under 5MB'); return; }
    setAvatarUploading(true);
    try {
      const uploaded = await uploadFileWithProgress({ token: token!, file, onProgress: () => {} });
      setUser((u) => u ? { ...u, avatarUrl: uploaded.url } : u);
      if (token && token !== 'offline-dev-token') {
        await api.updateMe(token, { avatarUrl: uploaded.url });
      }
      success('Profile photo updated');
    } catch {
      showError('Upload failed', 'Could not upload photo');
    } finally { setAvatarUploading(false); }
  }

  async function uploadBanner(file: File) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showError('Invalid file', 'Please upload a JPG, PNG, or WebP image');
      return;
    }
    if (file.size > 10 * 1024 * 1024) { showError('File too large', 'Banner must be under 10MB'); return; }
    setBannerUploading(true);
    try {
      const uploaded = await uploadFileWithProgress({ token: token!, file, onProgress: () => {} });
      setUser((u) => u ? { ...u, bannerUrl: uploaded.url } : u);
      if (token && token !== 'offline-dev-token') {
        await api.updateMe(token, { bannerUrl: uploaded.url } as any);
      }
      success('Banner updated');
    } catch {
      showError('Upload failed', 'Could not upload banner');
    } finally { setBannerUploading(false); }
  }

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!profileForm.name.trim()) errs.name = 'Name is required';
    if (!profileForm.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileForm.email)) errs.email = 'Invalid email';
    if (profileForm.phone && !/^\+?[\d\s\-().]{7,20}$/.test(profileForm.phone)) errs.phone = 'Invalid phone';
    if (profileForm.website && !/^https?:\/\/.+/.test(profileForm.website)) errs.website = 'Include https://';
    if (Object.keys(errs).length) { setProfileErrors(errs); return; }
    setProfileErrors({});
    setProfileSaving(true);
    try {
      if (token && token !== 'offline-dev-token') {
        const r = await api.updateMe(token, {
          name: profileForm.name, email: profileForm.email, phone: profileForm.phone || undefined,
          designation: profileForm.designation || undefined, department: profileForm.department || undefined,
          bio: profileForm.bio || undefined, website: profileForm.website || undefined,
          location: profileForm.location || undefined,
          socialLinks: Object.values(profileForm.socialLinks).some(Boolean) ? profileForm.socialLinks : undefined,
        }) as any;
        setUser((u) => u ? { ...u, ...r.user } : r.user);
      } else {
        setUser((u) => u ? { ...u, ...profileForm } : null);
      }
      success('Profile saved', 'Your profile has been updated successfully.');
      setEditMode(false);
    } catch (err) {
      showError('Save failed', err instanceof ApiClientError ? err.message : 'Could not save profile');
    } finally { setProfileSaving(false); }
  }

  async function savePassword(e: FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!security.currentPassword) errs.currentPassword = 'Current password is required';
    if (!security.newPassword) errs.newPassword = 'New password is required';
    else if (security.newPassword.length < 8) errs.newPassword = 'Must be at least 8 characters';
    if (security.newPassword !== security.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (Object.keys(errs).length) { setSecurityErrors(errs); return; }
    setSecurityErrors({});
    setSecuritySaving(true);
    try {
      if (token && token !== 'offline-dev-token') {
        await api.updateMe(token, { currentPassword: security.currentPassword, newPassword: security.newPassword });
      }
      setSecurity({ currentPassword: '', newPassword: '', confirmPassword: '' });
      success('Password changed', 'Your password has been updated successfully.');
    } catch (err) {
      showError('Failed', err instanceof ApiClientError ? err.message : 'Could not change password');
    } finally { setSecuritySaving(false); }
  }

  async function revokeAllSessions() {
    if (!token) return;
    setRevoking(true);
    try {
      await api.revokeAllSessions(token);
      setSessions([]);
      success('All sessions revoked', 'You have been logged out from all other devices.');
    } catch {
      showError('Failed', 'Could not revoke sessions');
    } finally { setRevoking(false); }
  }

  const navSections = [
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'security', label: 'Security', icon: Lock },
    { key: 'sessions', label: 'Active Sessions', icon: Monitor },
  ] as const;

  return (
    <div className="space-y-6">
      <PageHeader title="My Profile" eyebrow="Manage your personal information, security, and account settings." />

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Left sidebar */}
        <div className="space-y-4">
          {/* Profile card */}
          <Card className="p-5 text-center">
            {/* Banner */}
            <div className="relative -mx-5 -mt-5 mb-0 rounded-t-2xl overflow-hidden h-20">
              {user?.bannerUrl ? (
                <img src={user.bannerUrl} alt="Banner" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600" />
              )}
              <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition">
                {bannerUploading ? <RefreshCw size={20} className="animate-spin text-white" /> : <Camera size={20} className="text-white" />}
                <input type="file" className="sr-only" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadBanner(f); e.target.value = ''; }} />
              </label>
            </div>

            {/* Avatar */}
            <div className="relative mx-auto -mt-8 mb-4 h-20 w-20">
              <div className="h-20 w-20 rounded-2xl overflow-hidden border-4 border-white shadow-md bg-slate-100">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700 text-2xl font-bold text-white">
                    {(user?.name ?? 'U')[0].toUpperCase()}
                  </div>
                )}
              </div>
              <label className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-primary text-white shadow-md hover:bg-blue-600 transition">
                {avatarUploading ? <RefreshCw size={12} className="animate-spin" /> : <Camera size={12} />}
                <input type="file" className="sr-only" accept="image/jpeg,image/png,image/webp" onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadAvatar(f); e.target.value = ''; }} />
              </label>
            </div>

            <h2 className="text-lg font-bold text-slate-900">{user?.name ?? 'Loading...'}</h2>
            {profileForm.designation && <p className="text-sm text-slate-500">{profileForm.designation}</p>}
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-primary">{user?.role}</p>

            {/* Verified badge */}
            <div className={cx(
              'mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
              user?.emailVerified ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700',
            )}>
              {user?.emailVerified ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
              {user?.emailVerified ? 'Verified' : 'Not Verified'}
            </div>

            {/* Meta */}
            <div className="mt-4 space-y-1.5 text-left">
              {user?.lastLoginAt && (
                <p className="flex items-center gap-2 text-xs text-slate-500">
                  <Clock size={12} className="text-slate-400" />
                  Last login: {new Date(user.lastLoginAt).toLocaleDateString()}
                </p>
              )}
              {user?.createdAt && (
                <p className="flex items-center gap-2 text-xs text-slate-500">
                  <Calendar size={12} className="text-slate-400" />
                  Joined: {new Date(user.createdAt).toLocaleDateString()}
                </p>
              )}
            </div>

            {/* Completion */}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Profile Completion</p>
                <p className="text-xs font-bold text-slate-700">{completion}%</p>
              </div>
              <div className="flex items-center gap-4">
                <CompletionRing pct={completion} />
                <div className="text-left">
                  <p className="text-xs text-slate-500">
                    {completion === 100
                      ? 'Your profile is complete!'
                      : `${COMPLETION_FIELDS.filter((f) => {
                          const v = (profileForm as any)[f.key] ?? (user as any)?.[f.key];
                          return !(v && (typeof v === 'string' ? v.trim() : Object.keys(v).length > 0));
                        }).length} fields remaining`}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Nav */}
          <Card className="p-3">
            {navSections.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveSection(key)}
                className={cx(
                  'mb-1 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition',
                  activeSection === key ? 'bg-blue-50 text-primary' : 'text-slate-600 hover:bg-slate-50',
                )}
              >
                <Icon size={17} />
                {label}
              </button>
            ))}
          </Card>
        </div>

        {/* Right content */}
        <div>
          {activeSection === 'profile' && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <SectionTitle title="Personal Information" />
                {!editMode && (
                  <Button variant="secondary" className="h-9 px-4 text-sm" onClick={() => setEditMode(true)}>
                    <Edit2 size={15} />Edit Profile
                  </Button>
                )}
              </div>

              {editMode ? (
                <form onSubmit={saveProfile} className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    {([
                      ['Full Name', 'name', 'text', true, 'Alex Thorne'],
                      ['Designation', 'designation', 'text', false, 'Senior Engineer'],
                      ['Department', 'department', 'text', false, 'Sales & Marketing'],
                      ['Company', '', '', false, ''],
                      ['Phone', 'phone', 'tel', false, '+1 555 000 0000'],
                      ['Location', 'location', 'text', false, 'Mumbai, India'],
                      ['Website', 'website', 'url', false, 'https://yoursite.com'],
                    ] as const).filter(([, k]) => k !== '').map(([label, key, type, req, ph]) => (
                      <div key={key as string}>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          {label}{req && <span className="ml-1 text-red-500">*</span>}
                        </label>
                        <input
                          type={type as string}
                          className={cx(
                            'h-11 w-full rounded-xl border px-4 text-sm outline-none transition',
                            profileErrors[key as string] ? 'border-red-400' : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-50',
                          )}
                          placeholder={ph as string}
                          value={(profileForm as any)[key as string] ?? ''}
                          onChange={(e) => setProfileForm({ ...profileForm, [key as string]: e.target.value })}
                        />
                        {profileErrors[key as string] && <p className="mt-1 text-xs text-red-500">{profileErrors[key as string]}</p>}
                      </div>
                    ))}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">
                        Email Address<span className="ml-1 text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        className={cx('h-11 w-full rounded-xl border px-4 text-sm outline-none transition', profileErrors.email ? 'border-red-400' : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-50')}
                        placeholder="alex@i3dion.com"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      />
                      {profileErrors.email && <p className="mt-1 text-xs text-red-500">{profileErrors.email}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Bio</label>
                    <textarea
                      className="min-h-28 w-full rounded-xl border border-slate-200 p-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50"
                      placeholder="Tell your team a little about yourself..."
                      value={profileForm.bio}
                      onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    />
                  </div>

                  {/* Social Links */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">Social Links</label>
                    <div className="space-y-3">
                      {[
                        { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, ph: 'https://linkedin.com/in/username' },
                        { key: 'twitter', label: 'Twitter / X', icon: Twitter, ph: 'https://twitter.com/username' },
                        { key: 'github', label: 'GitHub', icon: Github, ph: 'https://github.com/username' },
                      ].map(({ key, label, icon: Icon, ph }) => (
                        <div key={key} className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                            <Icon size={17} />
                          </div>
                          <input
                            className="flex-1 h-10 rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-500"
                            placeholder={ph}
                            value={profileForm.socialLinks[key as keyof typeof profileForm.socialLinks] ?? ''}
                            onChange={(e) => setProfileForm({
                              ...profileForm,
                              socialLinks: { ...profileForm.socialLinks, [key]: e.target.value },
                            })}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <Button variant="secondary" onClick={() => setEditMode(false)} disabled={profileSaving}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={profileSaving}>
                      {profileSaving ? <RefreshCw size={17} className="animate-spin" /> : <Save size={17} />}
                      {profileSaving ? 'Saving...' : 'Save Profile'}
                    </Button>
                  </div>
                </form>
              ) : (
                // Read-only view
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    {[
                      { label: 'Full Name', value: user?.name, icon: User },
                      { label: 'Designation', value: profileForm.designation, icon: User },
                      { label: 'Department', value: profileForm.department, icon: Building2 },
                      { label: 'Email', value: user?.email, icon: Mail },
                      { label: 'Phone', value: profileForm.phone, icon: Phone },
                      { label: 'Location', value: profileForm.location, icon: MapPin },
                      { label: 'Website', value: profileForm.website, icon: Globe },
                    ].map(({ label, value, icon: Icon }) => (
                      <div key={label} className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                          <Icon size={15} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                          <p className="mt-0.5 text-sm font-medium text-slate-800">{value || <span className="text-slate-300">—</span>}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {profileForm.bio && (
                    <div>
                      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Bio</p>
                      <p className="text-sm leading-relaxed text-slate-700">{profileForm.bio}</p>
                    </div>
                  )}

                  {Object.values(profileForm.socialLinks).some(Boolean) && (
                    <div>
                      <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Social Links</p>
                      <div className="flex flex-wrap gap-3">
                        {profileForm.socialLinks.linkedin && (
                          <a href={profileForm.socialLinks.linkedin} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-primary transition">
                            <Linkedin size={16} />LinkedIn
                          </a>
                        )}
                        {profileForm.socialLinks.twitter && (
                          <a href={profileForm.socialLinks.twitter} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-primary transition">
                            <Twitter size={16} />Twitter / X
                          </a>
                        )}
                        {profileForm.socialLinks.github && (
                          <a href={profileForm.socialLinks.github} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-primary transition">
                            <Github size={16} />GitHub
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          )}

          {activeSection === 'security' && (
            <div className="space-y-6">
              <Card className="p-6">
                <SectionTitle title="Change Password" />
                <form onSubmit={savePassword} className="space-y-4">
                  {[
                    ['Current Password', 'currentPassword', 'Your current password'],
                    ['New Password', 'newPassword', 'Minimum 8 characters'],
                    ['Confirm New Password', 'confirmPassword', 'Repeat your new password'],
                  ].map(([label, key, ph]) => (
                    <div key={key as string}>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">
                        {label}<span className="ml-1 text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        className={cx('h-11 w-full rounded-xl border px-4 text-sm outline-none transition', securityErrors[key as string] ? 'border-red-400' : 'border-slate-200 focus:border-blue-500')}
                        placeholder={ph as string}
                        value={(security as any)[key as string]}
                        onChange={(e) => setSecurity({ ...security, [key as string]: e.target.value })}
                      />
                      {key === 'newPassword' && <PasswordStrength password={security.newPassword} />}
                      {securityErrors[key as string] && <p className="mt-1 text-xs text-red-500">{securityErrors[key as string]}</p>}
                    </div>
                  ))}
                  <Button type="submit" disabled={securitySaving}>
                    {securitySaving ? <RefreshCw size={17} className="animate-spin" /> : <Lock size={17} />}
                    {securitySaving ? 'Changing...' : 'Change Password'}
                  </Button>
                </form>
              </Card>

              <Card className="p-6">
                <SectionTitle title="Two-Step Verification" />
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 p-5">
                  <div>
                    <p className="font-semibold text-slate-800">Two-Factor Authentication</p>
                    <p className="mt-1 text-sm text-slate-500">Add an extra layer of security to your account.</p>
                  </div>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-200">
                    Coming Soon
                  </span>
                </div>
              </Card>
            </div>
          )}

          {activeSection === 'sessions' && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <SectionTitle title="Active Sessions" />
                {sessions.length > 0 && (
                  <Button variant="danger" className="h-9 px-4 text-sm" onClick={() => void revokeAllSessions()} disabled={revoking}>
                    {revoking ? <RefreshCw size={14} className="animate-spin" /> : <LogOut size={14} />}
                    Sign Out All Devices
                  </Button>
                )}
              </div>
              {sessionsLoading ? (
                <div className="flex items-center justify-center py-10 text-slate-400">
                  <RefreshCw className="animate-spin mr-2" size={20} />Loading sessions...
                </div>
              ) : sessions.length === 0 ? (
                <div className="py-10 text-center text-slate-400">
                  <Monitor size={36} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">No active sessions found</p>
                  <p className="text-xs text-slate-300 mt-1">Backend session tracking requires database connection</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.map((s) => (
                    <div key={s.id} className="flex items-start gap-4 rounded-2xl border border-slate-200 p-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                        {/Mobile|Android|iPhone/i.test(s.user_agent ?? '') ? <Smartphone size={18} /> : <Monitor size={18} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{s.user_agent ?? 'Unknown Device'}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          IP: {s.ip_address ?? '—'} · Logged in {new Date(s.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">Active</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
