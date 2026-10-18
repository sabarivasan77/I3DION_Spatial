import React from 'react';
import {
  Plus,
  LayoutTemplate,
  FileCode,
  Upload,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Workflow,
  ChevronRight
} from 'lucide-react';
import { FlowListItem } from '../services/flowApi';

interface FlowHomeDashboardProps {
  flows: FlowListItem[];
  onCreateNew: () => void;
  onBrowseTemplates: () => void;
  onImportWorkflow: () => void;
  onOpenAiSuggestions: () => void;
  onSelectFlow: (flowId: string) => void;
  userName?: string;
}

export const FlowHomeDashboard: React.FC<FlowHomeDashboardProps> = ({
  flows,
  onCreateNew,
  onBrowseTemplates,
  onImportWorkflow,
  onOpenAiSuggestions,
  onSelectFlow,
  userName = 'Ravi'
}) => {
  const activeCount = flows.filter((f) => f.status === 'active').length || 24;
  const recentFlows = flows.slice(0, 5);

  const fallbackRecent = [
    {
      id: 'wf_demo_01',
      name: 'New Lead → Email → CRM',
      category: 'Lead Management',
      status: 'active',
      runs: 24,
      successRate: '98%'
    },
    {
      id: 'wf_demo_02',
      name: 'Generate Product Catalog',
      category: 'Document Automation',
      status: 'active',
      runs: 12,
      successRate: '100%'
    },
    {
      id: 'wf_demo_03',
      name: 'Customer Follow Up Sequence',
      category: 'Email Automation',
      status: 'active',
      runs: 48,
      successRate: '89%'
    }
  ];

  const displayRecent = recentFlows.length > 0 ? recentFlows : fallbackRecent;

  return (
    <div className="space-y-6 pb-12 font-sans select-none">
      {/* 1. Welcome Greeting & Primary Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Welcome back, {userName}</span>
            <span>👋</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Here's what's happening with your automations today:
          </p>
        </div>

        <button
          onClick={onCreateNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} className="stroke-[2.5]" />
          <span>Create Workflow</span>
        </button>
      </div>

      {/* 2. Key Performance Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Workflows */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition">
          <div className="text-xs font-semibold text-slate-500">Active Workflows</div>
          <div className="text-3xl font-black text-slate-900 mt-2">{activeCount}</div>
          <div className="text-[11px] text-emerald-600 font-bold mt-1.5 flex items-center gap-1">
            <TrendingUp size={12} />
            <span>+3 new this week</span>
          </div>
        </div>

        {/* Runs (24h) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition">
          <div className="text-xs font-semibold text-slate-500">Runs (24h)</div>
          <div className="text-3xl font-black text-blue-600 mt-2">186</div>
          <div className="text-[11px] text-slate-400 mt-1.5">Across all active flows</div>
        </div>

        {/* Success Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition">
          <div className="text-xs font-semibold text-slate-500">Success Rate</div>
          <div className="text-3xl font-black text-emerald-600 mt-2">92%</div>
          <div className="text-[11px] text-slate-400 mt-1.5">5% failed • 3% in-flight</div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition">
          <div className="text-xs font-semibold text-slate-500">Pending Approvals</div>
          <div className="text-3xl font-black text-amber-500 mt-2">12</div>
          <div className="text-[11px] text-amber-700 font-medium mt-1.5 flex items-center gap-1">
            <Clock size={12} />
            <span>Action required</span>
          </div>
        </div>
      </div>

      {/* 3. Quick Actions Row */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Create from Template */}
          <button
            onClick={onBrowseTemplates}
            className="group p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:border-blue-500/50 hover:shadow-md transition text-left flex items-center gap-3.5 active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition">
              <LayoutTemplate size={20} />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-xs">Create from Template</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Start with pre-built logic</div>
            </div>
          </button>

          {/* Start from Scratch */}
          <button
            onClick={onCreateNew}
            className="group p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:border-blue-500/50 hover:shadow-md transition text-left flex items-center gap-3.5 active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition">
              <Plus size={20} />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-xs">Start from Scratch</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Blank drag &amp; drop canvas</div>
            </div>
          </button>

          {/* Import Workflow */}
          <button
            onClick={onImportWorkflow}
            className="group p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:border-blue-500/50 hover:shadow-md transition text-left flex items-center gap-3.5 active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition">
              <Upload size={20} />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-xs">Import Workflow</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Upload JSON package</div>
            </div>
          </button>

          {/* AI Suggestion */}
          <button
            onClick={onOpenAiSuggestions}
            className="group p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:border-blue-500/50 hover:shadow-md transition text-left flex items-center gap-3.5 active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-xs">AI Suggestion</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Generate from prompt</div>
            </div>
          </button>
        </div>
      </div>

      {/* 4. Analytics & Insights Row: Bar Chart & Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Workflow Runs (Last 7 Days) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Automation Insights</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Workflow Runs (Last 7 Days)</p>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
              Last 7 days
            </span>
          </div>

          {/* Mock Bar Chart matching reference image */}
          <div className="h-44 flex items-end justify-between gap-3 pt-6 px-4 border-b border-slate-100">
            {[
              { day: 'Aug 10', count: 45, height: '45%' },
              { day: 'Aug 11', count: 65, height: '65%' },
              { day: 'Aug 12', count: 30, height: '30%' },
              { day: 'Aug 13', count: 85, height: '85%' },
              { day: 'Aug 14', count: 70, height: '70%' },
              { day: 'Aug 15', count: 95, height: '95%' },
              { day: 'Aug 16', count: 110, height: '100%' }
            ].map((bar) => (
              <div key={bar.day} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="relative w-full flex items-end justify-center h-32">
                  <div
                    style={{ height: bar.height }}
                    className="w-full max-w-[36px] bg-blue-600 rounded-t-lg group-hover:bg-blue-500 transition-all duration-300 relative shadow-sm"
                  >
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-mono px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition shadow pointer-events-none">
                      {bar.count}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">{bar.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Donut Breakdown (186 Total Runs) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Execution Health</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Status breakdown of all runs</p>
          </div>

          <div className="flex items-center justify-center py-4">
            {/* Donut Chart Mock */}
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                {/* Background circle */}
                <path
                  className="text-slate-100"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {/* Success slice (92%) */}
                <path
                  className="text-emerald-500"
                  strokeDasharray="92, 100"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-slate-900 leading-none">186</span>
                <span className="text-[10px] text-slate-400 font-medium mt-0.5">Total Runs</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 text-xs pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Successful</span>
              </span>
              <span className="font-bold text-slate-900">92%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Failed</span>
              </span>
              <span className="font-bold text-slate-900">5%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>In Progress</span>
              </span>
              <span className="font-bold text-slate-900">3%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Recent Workflows Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Recent Workflows</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Latest configured automation pipelines</p>
          </div>
          <button
            onClick={() => onSelectFlow('all')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>View all</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {displayRecent.map((item: any) => (
            <div
              key={item.id}
              onClick={() => onSelectFlow(item.id)}
              className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/80 transition cursor-pointer group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                  <Workflow size={18} />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-xs group-hover:text-blue-600 transition">
                    {item.name}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {item.category || item.trigger_type || 'Lead Automation'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 text-xs">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider">
                  {item.status || 'Active'}
                </span>
                <span className="text-slate-500 font-mono text-[11px] hidden sm:inline">
                  {item.runs || item.run_count || 12} runs
                </span>
                <span className="text-emerald-600 font-bold text-[11px] hidden sm:inline">
                  {item.successRate || '98%'}
                </span>
                <div className="p-1.5 text-slate-400 group-hover:text-blue-600 rounded-lg group-hover:bg-blue-50 transition">
                  <ArrowRight size={14} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
