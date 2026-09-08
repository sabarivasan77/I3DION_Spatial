import React, { useEffect, useState } from 'react';
import { Bell, Check, ShieldAlert, Users, Box, CreditCard, Sparkles, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  notification_type: string;
  read_at: string | null;
  action_url: string | null;
  created_at: string;
}

export const NotificationCenter: React.FC = () => {
  const { token } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = () => {
    if (!token) return;
    fetch('/api/notifications', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.notifications) {
          setNotifications(data.notifications);
          setUnreadCount(data.unreadCount || 0);
        }
      })
      .catch((err) => console.warn('Could not fetch notifications:', err));
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Polling every 30s
    return () => clearInterval(interval);
  }, [token]);

  const markAsRead = (id: string) => {
    fetch(`/api/notifications/${id}/read`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    }).then(() => fetchNotifications());
  };

  const markAllAsRead = () => {
    fetch('/api/notifications/read-all', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    }).then(() => fetchNotifications());
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'security': return <ShieldAlert size={16} className="text-amber-400" />;
      case 'leads': return <Sparkles size={16} className="text-emerald-400" />;
      case 'team': return <Users size={16} className="text-blue-400" />;
      case 'publishing': return <Box size={16} className="text-purple-400" />;
      case 'billing': return <CreditCard size={16} className="text-rose-400" />;
      default: return <Bell size={16} className="text-slate-400" />;
    }
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/80 text-slate-300 hover:text-white transition hover:bg-slate-800 active:scale-95 shadow-md"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-lg animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl border border-slate-800 bg-slate-900/95 backdrop-blur-2xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-slate-800 p-4">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-blue-400" />
                <h3 className="text-sm font-bold text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-300">
                    {unreadCount} unread
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[11px] font-medium text-slate-400 hover:text-blue-400 transition"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/50 scrollbar-thin scrollbar-thumb-slate-800">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No notifications yet.
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-4 transition hover:bg-slate-800/40 flex items-start gap-3 ${
                      !n.read_at ? 'bg-blue-500/5' : ''
                    }`}
                  >
                    <div className="mt-0.5 rounded-lg bg-slate-800 p-2 border border-slate-700/50">
                      {getIcon(n.notification_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold text-white truncate">{n.title}</h4>
                        {!n.read_at && (
                          <button
                            onClick={() => markAsRead(n.id)}
                            title="Mark as read"
                            className="text-slate-500 hover:text-blue-400 transition"
                          >
                            <Check size={14} />
                          </button>
                        )}
                      </div>
                      <p className="mt-1 text-[11px] text-slate-400 leading-relaxed line-clamp-2">{n.body}</p>
                      <div className="mt-1.5 text-[10px] text-slate-500">
                        {new Date(n.created_at).toLocaleDateString()} at {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
