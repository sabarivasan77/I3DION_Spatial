import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  RefreshCw,
  User,
  Clock,
  Activity
} from 'lucide-react';
import { vaultApi, VaultAuditLog } from '../../api/vaultApi';

export default function VaultAuditTrail() {
  const [logs, setLogs] = useState<VaultAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter] = useState('');

  useEffect(() => {
    loadAuditLogs();
  }, [search, actionFilter]);

  const loadAuditLogs = async () => {
    setIsLoading(true);
    try {
      const data = await vaultApi.getActivityLogs({ search, action: actionFilter });
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load audit logs', err);
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const actionColors: Record<string, string> = {
    'Uploaded Asset': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Created Data Source': 'bg-blue-100 text-blue-700 border-blue-200',
    'Created Record': 'bg-indigo-100 text-indigo-700 border-indigo-200',
    'Updated Asset Metadata': 'bg-purple-100 text-purple-700 border-purple-200',
    'Moved Asset to Trash': 'bg-amber-100 text-amber-700 border-amber-200',
    'Permanently Deleted Asset': 'bg-red-100 text-red-700 border-red-200'
  };

  return (
    <div className="mx-auto max-w-7xl h-full flex flex-col space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Activity Audit Trail</h1>
          <p className="text-xs text-slate-500 mt-1">Immutable security log of dataset operations, schema changes, and asset accesses.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search audit trail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-64 rounded-xl border border-slate-200 pl-9 pr-4 text-xs font-semibold outline-none focus:border-emerald-500"
            />
          </div>

          <button
            onClick={loadAuditLogs}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition"
            title="Refresh Audit Logs"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center text-slate-400">Loading audit trail...</div>
        ) : (!logs || logs.length === 0) ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <ShieldCheck size={48} className="mb-4 opacity-40 text-emerald-600" />
            <p className="text-sm font-semibold text-slate-800">No activity logs matching criteria</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">Action Event</th>
                <th className="px-4 py-3.5">Resource Type</th>
                <th className="px-4 py-3.5">Target Name</th>
                <th className="px-4 py-3.5">User</th>
                <th className="px-4 py-3.5">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map(log => {
                const colorClass = actionColors[log.action] || 'bg-slate-100 text-slate-700 border-slate-200';
                return (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold ${colorClass}`}>
                        <Activity size={12} />
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-800">{log.target_type}</td>
                    <td className="px-4 py-3.5 font-medium text-slate-900">{log.target_name || '—'}</td>
                    <td className="px-4 py-3.5 text-slate-700">
                      <div className="flex items-center gap-1.5 font-semibold">
                        <User size={13} className="text-slate-400" />
                        {log.user_name || 'System'}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-400 font-mono">
                      <div className="flex items-center gap-1">
                        <Clock size={13} />
                        {new Date(log.created_at).toLocaleString()}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
