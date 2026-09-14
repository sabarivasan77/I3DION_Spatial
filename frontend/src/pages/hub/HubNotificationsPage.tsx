import { useEffect, useState, useCallback } from 'react';
import {
  Bell,
  CheckCheck,
  Check,
  ShieldAlert,
  Sparkles,
  Users,
  Box,
  CreditCard,
  Filter,
  Info,
  ExternalLink
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Link } from 'react-router-dom';

export interface AppNotificationItem {
  id: string;
  title: string;
  body: string;
  notification_type: 'security' | 'leads' | 'publishing' | 'billing' | 'team' | string;
  read_at: string | null;
  action_url: string | null;
  created_at: string;
}

const DEFAULT_DEMO_NOTIFICATIONS: AppNotificationItem[] = [
  {
    id: 'notif-1',
    title: 'New High-Intent Lead Captured',
    body: 'A user requested an AR product preview quote on 3D Model Catalog #84.',
    notification_type: 'leads',
    read_at: null,
    action_url: '/hub/organization',
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString()
  },
  {
    id: 'notif-2',
    title: 'Spatial Experience Published',
    body: 'Spatial Engine build "Interactive Showroom V2" successfully deployed to global CDN.',
    notification_type: 'publishing',
    read_at: null,
    action_url: '/hub/organization/experiences',
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString()
  },
  {
    id: 'notif-3',
    title: 'Security Alert: New Sign-in',
    body: 'New login detected from Mumbai, India (Chrome on Windows).',
    notification_type: 'security',
    read_at: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    action_url: '/settings',
    created_at: new Date(Date.now() - 1000 * 60 * 360).toISOString()
  },
  {
    id: 'notif-4',
    title: 'Subscription Status Updated',
    body: 'Your organization license tier was verified for Professional Tier access.',
    notification_type: 'billing',
    read_at: new Date(Date.now() - 1000 * 60 * 1440).toISOString(),
    action_url: '/settings/billing',
    created_at: new Date(Date.now() - 1000 * 60 * 1500).toISOString()
  }
];

export function HubNotificationsPage() {
  const { token } = useAuthStore();
  const [notifications, setNotifications] = useState<AppNotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'leads' | 'publishing' | 'security' | 'billing'>('all');

  const fetchNotifications = useCallback(async () => {
    if (!token) {
      setNotifications(DEFAULT_DEMO_NOTIFICATIONS);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data?.notifications && data.notifications.length > 0) {
        setNotifications(data.notifications);
      } else {
        setNotifications(DEFAULT_DEMO_NOTIFICATIONS);
      }
    } catch {
      setNotifications(DEFAULT_DEMO_NOTIFICATIONS);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
    );

    if (token && !id.startsWith('notif-')) {
      try {
        await fetch(`/api/notifications/${id}/read`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch {
        // silent catch
      }
    }
  };

  const markAllAsRead = async () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
    );

    if (token) {
      try {
        await fetch('/api/notifications/read-all', {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch {
        // silent catch
      }
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'security':
        return <ShieldAlert size={18} className="text-amber-500" />;
      case 'leads':
        return <Sparkles size={18} className="text-emerald-500" />;
      case 'team':
        return <Users size={18} className="text-blue-500" />;
      case 'publishing':
        return <Box size={18} className="text-purple-500" />;
      case 'billing':
        return <CreditCard size={18} className="text-indigo-500" />;
      default:
        return <Info size={18} className="text-slate-500" />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  const filteredNotifications = notifications.filter((n) => {
    if (filterTab === 'unread') return !n.read_at;
    if (filterTab === 'all') return true;
    return n.notification_type === filterTab;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16 pt-6 px-4 md:px-8 select-none">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl bg-white p-6 md:p-8 shadow-2xs border border-slate-200/80">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 shadow-2xs">
              <Bell size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold text-slate-900">Notifications &amp; Activity</h1>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-blue-600 px-2.5 py-0.5 text-xs font-extrabold text-white shadow-xs">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Stay updated on organization activities, leads, experience publishing, and security alerts.
              </p>
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition shadow-2xs shrink-0"
            >
              <CheckCheck size={16} />
              Mark all as read
            </button>
          )}
        </div>

        {/* Filter Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {[
            { key: 'all', label: 'All' },
            { key: 'unread', label: `Unread (${unreadCount})` },
            { key: 'leads', label: 'Leads & Inquiries' },
            { key: 'publishing', label: 'Publishing' },
            { key: 'security', label: 'Security' },
            { key: 'billing', label: 'Billing & Plan' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterTab(tab.key as any)}
              className={`rounded-2xl px-4 py-2 text-xs font-bold transition whitespace-nowrap ${
                filterTab === tab.key
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notification List */}
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <Filter size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-bold text-slate-800">No notifications found</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              There are no notifications matching your selected filter at this time.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((n) => {
              const isUnread = !n.read_at;
              return (
                <div
                  key={n.id}
                  className={`group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl p-5 md:p-6 transition border ${
                    isUnread
                      ? 'bg-white border-blue-200/90 shadow-2xs ring-1 ring-blue-500/10'
                      : 'bg-white/80 border-slate-200/70 hover:bg-white'
                  }`}
                >
                  {isUnread && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-blue-600 ring-4 ring-blue-100 hidden sm:block" />
                  )}

                  <div className="flex items-start gap-4 sm:pl-3">
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 border border-slate-200/60 shadow-2xs">
                      {getIcon(n.notification_type)}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-slate-900">{n.title}</h3>
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                          {n.notification_type}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{n.body}</p>
                      <p className="text-[10px] font-medium text-slate-400">
                        {new Date(n.created_at).toLocaleDateString()} at{' '}
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    {n.action_url && (
                      <Link
                        to={n.action_url}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-600 px-3.5 py-2 text-xs font-bold text-slate-700 transition"
                      >
                        <span>View</span>
                        <ExternalLink size={13} />
                      </Link>
                    )}

                    {isUnread && (
                      <button
                        onClick={() => markAsRead(n.id)}
                        title="Mark as read"
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 transition"
                      >
                        <Check size={14} />
                        <span>Read</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
