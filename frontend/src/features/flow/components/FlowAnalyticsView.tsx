import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  BarChart3,
  Layers,
  RefreshCw,
  Loader2,
  Zap,
  ShieldAlert,
  Flame,
} from 'lucide-react';
import { flowApi } from '../services/flowApi';

interface FlowAnalyticsViewProps {
  flowId?: string;
  flowName?: string;
}

export const FlowAnalyticsView: React.FC<FlowAnalyticsViewProps> = ({ flowId, flowName }) => {
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      if (flowId) {
        const data = await flowApi.getFlowAnalytics(flowId);
        setAnalytics(data);
      } else {
        const data = await flowApi.getOverviewAnalytics();
        setAnalytics(data);
      }
    } catch (err: any) {
      console.error('Failed to load flow analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [flowId]);

  if (isLoading && !analytics) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 size={32} className="animate-spin text-cyan-600" />
        <p className="text-sm font-medium">Computing execution throughput and latency percentiles...</p>
      </div>
    );
  }

  const overview = analytics?.overview || {
    totalRuns: 0,
    completedRuns: 0,
    failedRuns: 0,
    runningRuns: 0,
    successRate: 100,
    avgDurationMs: 0,
    p50DurationMs: 0,
    p90DurationMs: 0,
    p95DurationMs: 0,
  };

  const dailyHistory: Array<{ date: string; total: number; completed: number; failed: number }> =
    analytics?.dailyHistory || [];

  const topErrors: Array<{ error: string; count: number; last_occurred_at: string }> =
    analytics?.topErrors || [];

  const maxDaily = Math.max(...dailyHistory.map((d) => d.total), 1);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Activity size={20} className="text-cyan-600" />
            <span>{flowName ? `${flowName} Analytics` : 'Organization Workflow Telemetry'}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time execution latency percentiles, throughput volume, and diagnostic error insights.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          disabled={isLoading}
          className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition"
        >
          <RefreshCw size={13} className={isLoading ? 'animate-spin text-cyan-600' : ''} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* KPI Cards Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Runs */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Executions</span>
            <Layers size={18} className="text-slate-400" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">
            {overview.totalRuns.toLocaleString()}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-500 font-medium">
            <span className="text-emerald-600 font-semibold">{overview.completedRuns} completed</span>
            <span>•</span>
            <span className="text-rose-600 font-semibold">{overview.failedRuns} failed</span>
          </div>
        </div>

        {/* Success Rate */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Success Rate</span>
            <CheckCircle2 size={18} className="text-emerald-500" />
          </div>
          <div
            className={`text-3xl font-extrabold mt-2 ${
              overview.successRate >= 95
                ? 'text-emerald-600'
                : overview.successRate >= 80
                ? 'text-amber-600'
                : 'text-rose-600'
            }`}
          >
            {overview.successRate}%
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                overview.successRate >= 95
                  ? 'bg-emerald-500'
                  : overview.successRate >= 80
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${overview.successRate}%` }}
            />
          </div>
        </div>

        {/* Average Duration */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Average Latency</span>
            <Clock size={18} className="text-cyan-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">
            {overview.avgDurationMs}
            <span className="text-sm font-semibold text-slate-400 ml-1">ms</span>
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Median (p50): <span className="font-semibold text-slate-800">{overview.p50DurationMs}ms</span>
          </div>
        </div>

        {/* Tail Latency (p90 / p95) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Tail Latency</span>
            <Zap size={18} className="text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-extrabold text-slate-900">{overview.p95DurationMs}ms</span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">p95</span>
          </div>
          <div className="text-xs text-slate-500 mt-2">
            p90 latency: <span className="font-semibold text-slate-800">{overview.p90DurationMs}ms</span>
          </div>
        </div>
      </div>

      {/* Grid: 7-Day Throughput Chart & Top Failure Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Throughput Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900">7-Day Execution Volume</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Automated workflow runs per day, segregated by success and failure.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Failed</span>
              </div>
            </div>
          </div>

          {dailyHistory.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-xs">
              No executions recorded in the past 7 days.
            </div>
          ) : (
            <div className="h-56 flex items-end gap-3 pt-6 pb-2 px-2 border-b border-slate-100">
              {dailyHistory.map((day, idx) => {
                const completedHeight = (day.completed / maxDaily) * 100;
                const failedHeight = (day.failed / maxDaily) * 100;
                const dateLabel = new Date(day.date).toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'numeric',
                  day: 'numeric',
                });

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                    <div className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                      {day.total} runs
                    </div>
                    <div className="w-full max-w-[40px] flex flex-col-reverse rounded-t-lg overflow-hidden bg-slate-100 h-full max-h-[160px]">
                      {/* Completed Portion */}
                      <div
                        className="w-full bg-emerald-500 group-hover:bg-emerald-400 transition"
                        style={{ height: `${completedHeight}%` }}
                        title={`${day.completed} completed`}
                      />
                      {/* Failed Portion */}
                      <div
                        className="w-full bg-rose-500 group-hover:bg-rose-400 transition"
                        style={{ height: `${failedHeight}%` }}
                        title={`${day.failed} failed`}
                      />
                    </div>
                    <span className="text-[11px] font-medium text-slate-500 group-hover:text-slate-900 transition truncate max-w-[55px]">
                      {dateLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Failures / Error Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-1">
              <ShieldAlert size={18} className="text-rose-500" />
              <span>Top Error Diagnostics</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Frequent root causes encountered across executions.
            </p>

            {topErrors.length === 0 ? (
              <div className="py-12 text-center">
                <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-800">Clean execution health!</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  No failed workflows in active monitoring window.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {topErrors.map((errItem, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-rose-50/60 border border-rose-100 rounded-xl text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-mono text-rose-800">
                      <span className="font-semibold line-clamp-1">{errItem.error}</span>
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 font-bold text-[10px] shrink-0 ml-2">
                        {errItem.count}x
                      </span>
                    </div>
                    <div className="text-[10px] text-rose-600 font-medium">
                      Last occurred: {new Date(errItem.last_occurred_at).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-400">
              Deterministic PostgreSQL `flow_runs` telemetry
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
