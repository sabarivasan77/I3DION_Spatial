import { useEffect, useState } from 'react';
import { ShieldAlert, Users, Activity, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export function SecurityDashboard() {
  const token = useAuthStore((s) => s.token);
  const [stats, setStats] = useState({ activeUsers: 0, failedLogins: 0, activeAlerts: 0 });
  const [sessions, setSessions] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    
    Promise.all([
      fetch('/api/security/dashboard', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch('/api/security/sessions', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch('/api/security/audit-logs', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch('/api/security/alerts', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
    ]).then(([statsData, sessionsData, logsData, alertsData]) => {
      setStats(statsData);
      setSessions(sessionsData);
      setLogs(logsData);
      setAlerts(alertsData);
      setLoading(false);
    }).catch(console.error);

  }, [token]);

  async function revokeSession(id: string) {
    if (!token) return;
    await fetch(`/api/security/sessions/${id}/revoke`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    setSessions(s => s.filter(x => x.id !== id));
  }

  if (loading) return <div className="p-12 text-center text-slate-500">Loading Security Data...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Security Dashboard</h1>
        <p className="mt-2 text-slate-500">Monitor enterprise Zero Trust metrics and threat detection alerts.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600"><Users size={24} /></div>
            <div><p className="text-sm font-medium text-slate-500">Active Users</p><p className="text-2xl font-bold text-slate-900">{stats.activeUsers}</p></div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-orange-50 p-3 text-orange-600"><Activity size={24} /></div>
            <div><p className="text-sm font-medium text-slate-500">Failed Logins</p><p className="text-2xl font-bold text-slate-900">{stats.failedLogins}</p></div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-red-50 p-3 text-red-600"><ShieldAlert size={24} /></div>
            <div><p className="text-sm font-medium text-slate-500">Active Alerts</p><p className="text-2xl font-bold text-slate-900">{stats.activeAlerts}</p></div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/50 p-6">
            <h3 className="font-semibold text-slate-900">Active Sessions</h3>
          </div>
          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {sessions.map((s, i) => (
              <div key={i} className="flex items-center justify-between p-4 hover:bg-slate-50">
                <div>
                  <p className="font-medium text-sm">{s.email}</p>
                  <p className="text-xs text-slate-500">{s.device_info} • {s.ip_address}</p>
                </div>
                <button onClick={() => revokeSession(s.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><LogOut size={16} /></button>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/50 p-6">
            <h3 className="font-semibold text-slate-900">Audit Logs</h3>
          </div>
          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {logs.map((l, i) => (
              <div key={i} className="p-4 hover:bg-slate-50">
                <div className="flex justify-between mb-1">
                  <p className="font-semibold text-sm">{l.action}</p>
                  <p className="text-xs text-slate-500">{new Date(l.created_at).toLocaleString()}</p>
                </div>
                <p className="text-xs text-slate-600">{l.email} • {l.ip_address}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
