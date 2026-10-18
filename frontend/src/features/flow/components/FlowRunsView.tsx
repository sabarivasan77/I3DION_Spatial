import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Play,
  ArrowRight,
  Filter,
  RefreshCw,
  Loader2,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Check,
} from 'lucide-react';
import { flowApi, FlowRunItem } from '../services/flowApi';
import { FlowRunDetailModal } from './FlowRunDetailModal';

interface FlowRunsViewProps {
  flowId?: string; // If provided, filters runs specifically for this flow
  onSelectFlow?: (flowId: string) => void;
}

export const FlowRunsView: React.FC<FlowRunsViewProps> = ({ flowId, onSelectFlow }) => {
  const [runs, setRuns] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const limit = 20;

  // Selected run for inspector modal
  const [selectedRun, setSelectedRun] = useState<any | null>(null);
  const [isLoadingRunDetail, setIsLoadingRunDetail] = useState(false);
  const [retryingRunId, setRetryingRunId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const fetchRuns = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await flowApi.listAllRuns({
        flowId: flowId || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: searchQuery || undefined,
        limit,
        offset: page * limit,
      });

      setRuns(response.runs || []);
      setTotal(response.total || 0);
    } catch (err: any) {
      console.error('Failed to load workflow runs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [flowId, statusFilter, searchQuery, page]);

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  const handleInspect = async (runId: string) => {
    setIsLoadingRunDetail(true);
    try {
      const detail = await flowApi.getRun(runId);
      setSelectedRun(detail);
    } catch (err: any) {
      console.error('Failed to load run details:', err);
    } finally {
      setIsLoadingRunDetail(false);
    }
  };

  const handleRetry = async (runId: string) => {
    setRetryingRunId(runId);
    try {
      const newRun = await flowApi.retryRun(runId);
      setActionNotice(`Re-executed workflow! New Run ID: ${newRun.id.slice(0, 8)}...`);
      setTimeout(() => setActionNotice(null), 4000);
      await fetchRuns();
    } catch (err: any) {
      console.error('Failed to retry workflow run:', err);
      alert(err.message || 'Retry failed');
    } finally {
      setRetryingRunId(null);
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms && ms !== 0) return '—';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatTimestamp = (iso: string) => {
    if (!iso) return '—';
    const date = new Date(iso);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Action Notice Toast */}
      {actionNotice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-sm flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>{actionNotice}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
            placeholder="Search by flow name, error, or payload..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
          />
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            {[
              { id: 'all', label: 'All' },
              { id: 'completed', label: 'Completed' },
              { id: 'failed', label: 'Failed' },
              { id: 'running', label: 'Running' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setStatusFilter(tab.id);
                  setPage(0);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  statusFilter === tab.id
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchRuns}
            disabled={isLoading}
            className="p-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-xl transition"
            title="Refresh execution history"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin text-cyan-600' : ''} />
          </button>
        </div>
      </div>

      {/* Runs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        {isLoading && runs.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 size={32} className="animate-spin text-cyan-600" />
            <p className="text-sm font-medium">Loading execution logs...</p>
          </div>
        ) : runs.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
              <Clock size={24} />
            </div>
            <h4 className="text-sm font-semibold text-slate-900">No executions recorded</h4>
            <p className="text-xs text-slate-500 mt-1">
              Trigger a test run or ingest a 3D spatial event to view automated execution telemetry.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Workflow</th>
                  <th className="py-3 px-4">Trigger / Source</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Executed At</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {runs.map((r) => {
                  const isCompleted = r.status === 'completed';
                  const isFailed = r.status === 'failed';
                  const isRunning = r.status === 'running';

                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-slate-50/60 transition group cursor-pointer"
                      onClick={() => handleInspect(r.id)}
                    >
                      {/* Status Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            isCompleted
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isFailed
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : isRunning
                              ? 'bg-cyan-50 text-cyan-700 border border-cyan-200 animate-pulse'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 size={13} className="text-emerald-600" />
                          ) : isFailed ? (
                            <AlertTriangle size={13} className="text-rose-600" />
                          ) : (
                            <Loader2 size={13} className="animate-spin text-cyan-600" />
                          )}
                          <span className="capitalize">{r.status}</span>
                        </span>
                      </td>

                      {/* Workflow Name */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 group-hover:text-cyan-600 transition flex items-center gap-2">
                          <span>{r.flow_name || 'Automation Flow'}</span>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            v{r.flow_version || 1}.0
                          </span>
                        </div>
                        {r.error && (
                          <p className="text-xs text-rose-600 line-clamp-1 mt-0.5 font-mono">
                            {r.error}
                          </p>
                        )}
                      </td>

                      {/* Trigger Event */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs font-mono text-slate-600">
                          <Sparkles size={13} className="text-cyan-500" />
                          <span>{r.trigger_type || 'trigger_event'}</span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {r.triggered_by_name || 'Autonomous Engine'}
                        </div>
                      </td>

                      {/* Duration */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {formatDuration(r.duration_ms)}
                        </span>
                      </td>

                      {/* Timestamp */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500">
                        {formatTimestamp(r.started_at)}
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3.5 px-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleInspect(r.id)}
                            className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition"
                          >
                            Inspect
                          </button>

                          <button
                            onClick={() => handleRetry(r.id)}
                            disabled={retryingRunId === r.id}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-cyan-700 hover:text-cyan-800 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 transition flex items-center gap-1"
                            title="Re-execute workflow with original payload"
                          >
                            {retryingRunId === r.id ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <RotateCcw size={12} />
                            )}
                            <span>Re-run</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {total > limit && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
            <div>
              Showing <span className="font-semibold text-slate-800">{page * limit + 1}</span> to{' '}
              <span className="font-semibold text-slate-800">
                {Math.min((page + 1) * limit, total)}
              </span>{' '}
              of <span className="font-semibold text-slate-800">{total}</span> runs
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="font-medium text-slate-700">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedRun && (
        <FlowRunDetailModal
          run={selectedRun}
          onClose={() => setSelectedRun(null)}
          onRetry={handleRetry}
        />
      )}
    </div>
  );
};
