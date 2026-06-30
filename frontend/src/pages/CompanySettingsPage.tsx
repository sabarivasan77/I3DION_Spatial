import { useEffect, useState, type FormEvent } from 'react';
import { Building2, Lock, Save, Bell, Settings, Sparkles, RefreshCw, Upload } from 'lucide-react';
import { Button, Card, PageHeader, SectionTitle } from '../components/ui';
import { useToast } from '../components/Toast';
import { api, ApiClientError, uploadFileWithProgress } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { cx } from '../utils/format';

// ─── Settings ───

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone: string) {
  return /^\+?[0-9\s\-()]{7,20}$/.test(phone);
}

function validateUrl(url: string) {
  return /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(url);
}

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
