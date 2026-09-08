import React, { useEffect, useState } from 'react';
import { Bell, Mail, Shield, Sparkles, Box, CreditCard, Users, Save } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export const NotificationSettingsPage: React.FC = () => {
  const { token } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const [emailPrefs, setEmailPrefs] = useState({
    security: true,
    leads: true,
    publishing: true,
    billing: true,
    weekly_report: true,
  });

  const [inAppPrefs, setInAppPrefs] = useState({
    security: true,
    leads: true,
    publishing: true,
    billing: true,
    team: true,
  });

  useEffect(() => {
    if (!token) return;
    fetch('/api/notifications/preferences', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.preferences) {
          setEmailPrefs((prev) => ({ ...prev, ...(data.preferences.email_notifications || {}) }));
          setInAppPrefs((prev) => ({ ...prev, ...(data.preferences.in_app_notifications || {}) }));
        }
      })
      .catch((err) => console.warn('Could not fetch notification preferences:', err));
  }, [token]);

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);

    try {
      const res = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email_notifications: emailPrefs,
          in_app_notifications: inAppPrefs,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save preferences:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Bell className="text-blue-400" size={22} />
          Notification & Alert Preferences
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Configure how you and your team receive security alerts, lead updates, publishing notifications, and weekly reports.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Email Notifications Card */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 text-white backdrop-blur-xl">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 mb-4">
            <Mail size={16} className="text-blue-400" />
            Email Notifications
          </h3>
          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs font-medium text-slate-300 flex items-center gap-2">
                <Shield size={14} className="text-amber-400" /> Security & Account Alerts
              </span>
              <input
                type="checkbox"
                checked={emailPrefs.security}
                onChange={(e) => setEmailPrefs({ ...emailPrefs, security: e.target.checked })}
                className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs font-medium text-slate-300 flex items-center gap-2">
                <Sparkles size={14} className="text-emerald-400" /> New Lead Alerts
              </span>
              <input
                type="checkbox"
                checked={emailPrefs.leads}
                onChange={(e) => setEmailPrefs({ ...emailPrefs, leads: e.target.checked })}
                className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs font-medium text-slate-300 flex items-center gap-2">
                <Box size={14} className="text-purple-400" /> Publishing & Approval Notices
              </span>
              <input
                type="checkbox"
                checked={emailPrefs.publishing}
                onChange={(e) => setEmailPrefs({ ...emailPrefs, publishing: e.target.checked })}
                className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs font-medium text-slate-300 flex items-center gap-2">
                <CreditCard size={14} className="text-rose-400" /> Subscription & Billing Notices
              </span>
              <input
                type="checkbox"
                checked={emailPrefs.billing}
                onChange={(e) => setEmailPrefs({ ...emailPrefs, billing: e.target.checked })}
                className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-slate-800">
              <span className="text-xs font-medium text-slate-300">Automated Weekly Analytics Digest</span>
              <input
                type="checkbox"
                checked={emailPrefs.weekly_report}
                onChange={(e) => setEmailPrefs({ ...emailPrefs, weekly_report: e.target.checked })}
                className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500"
              />
            </label>
          </div>
        </div>

        {/* In-App Notifications Card */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 text-white backdrop-blur-xl">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 mb-4">
            <Bell size={16} className="text-blue-400" />
            In-App Notifications
          </h3>
          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs font-medium text-slate-300 flex items-center gap-2">
                <Shield size={14} className="text-amber-400" /> Security Events
              </span>
              <input
                type="checkbox"
                checked={inAppPrefs.security}
                onChange={(e) => setInAppPrefs({ ...inAppPrefs, security: e.target.checked })}
                className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs font-medium text-slate-300 flex items-center gap-2">
                <Sparkles size={14} className="text-emerald-400" /> Real-time Lead Notifications
              </span>
              <input
                type="checkbox"
                checked={inAppPrefs.leads}
                onChange={(e) => setInAppPrefs({ ...inAppPrefs, leads: e.target.checked })}
                className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs font-medium text-slate-300 flex items-center gap-2">
                <Box size={14} className="text-purple-400" /> Product & Catalog Activity
              </span>
              <input
                type="checkbox"
                checked={inAppPrefs.publishing}
                onChange={(e) => setInAppPrefs({ ...inAppPrefs, publishing: e.target.checked })}
                className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs font-medium text-slate-300 flex items-center gap-2">
                <Users size={14} className="text-blue-400" /> Team Member Activity
              </span>
              <input
                type="checkbox"
                checked={inAppPrefs.team}
                onChange={(e) => setInAppPrefs({ ...inAppPrefs, team: e.target.checked })}
                className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4">
        {success && <span className="text-xs font-medium text-emerald-400">Preferences saved successfully!</span>}
        <div className="ml-auto flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition shadow-lg shadow-blue-600/30 flex items-center gap-2"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
};
