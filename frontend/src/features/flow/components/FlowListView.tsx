import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Zap,
  Play,
  Copy,
  Trash2,
  Clock,
  CheckCircle2,
  Sparkles,
  FileText,
  Sliders,
  Send,
  MoreVertical,
  Activity,
  Layers,
  ArrowRight,
  Loader2,
  Workflow,
} from 'lucide-react';
import { flowApi, FlowListItem } from '../services/flowApi';
import { useFlowDesignerStore } from '../store/useFlowDesignerStore';
import { FlowRunsView } from './FlowRunsView';
import { FlowAnalyticsView } from './FlowAnalyticsView';

export const FlowListView: React.FC = () => {
  const navigate = useNavigate();
  const [flows, setFlows] = useState<FlowListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [activeNavTab, setActiveNavTab] = useState<'workflows' | 'runs' | 'analytics'>('workflows');

  const { createBlankFlow, createFromTemplate } = useFlowDesignerStore();

  const fetchFlows = async () => {
    setIsLoading(true);
    try {
      const data = await flowApi.listFlows({
        status: selectedStatus === 'all' ? undefined : selectedStatus,
        search: searchQuery || undefined,
      });
      setFlows(data);
    } catch (err) {
      console.error('Failed to load flows:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFlows();
  }, [selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFlows();
  };

  const handleDuplicate = async (flowId: string) => {
    try {
      await flowApi.duplicateFlow(flowId);
      await fetchFlows();
    } catch (err) {
      console.error('Duplicate failed:', err);
    }
  };

  const handleArchive = async (flowId: string) => {
    if (!confirm('Are you sure you want to archive this flow?')) return;
    try {
      await flowApi.archiveFlow(flowId);
      await fetchFlows();
    } catch (err) {
      console.error('Archive failed:', err);
    }
  };

  const handleCreateBlank = () => {
    createBlankFlow('New Automation Flow');
    setShowTemplateModal(false);
    navigate('/flow/new');
  };

  const handleSelectTemplate = (templateKey: string) => {
    createFromTemplate(templateKey);
    setShowTemplateModal(false);
    navigate('/flow/new');
  };

  const getTriggerIcon = (triggerType: string) => {
    switch (triggerType) {
      case 'trigger_event':
        return <Sparkles size={16} className="text-cyan-600" />;
      case 'trigger_webhook':
        return <Send size={16} className="text-indigo-600" />;
      default:
        return <Zap size={16} className="text-amber-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Banner */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 shadow-2xs">
                  <Workflow size={22} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">I3DION Flow</h1>
                  <span className="text-xs font-semibold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-100 uppercase tracking-wider">
                    Visual Automation Platform
                  </span>
                </div>
              </div>
              <p className="text-sm text-slate-500 mt-1 max-w-2xl">
                Design, test, and automate 3D spatial lead scoring, document generation, and business event workflows with an intuitive drag-and-drop designer.
              </p>
            </div>

            <button
              onClick={() => setShowTemplateModal(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm shadow-sm transition active:scale-95"
            >
              <Plus size={18} />
              <span>Create New Flow</span>
            </button>
          </div>

          {/* Stats Ribbon */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-100">
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
              <span className="text-xs font-medium text-slate-400">Total Automations</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">{flows.length || 6}</div>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
              <span className="text-xs font-medium text-slate-400">Executions (24h)</span>
              <div className="text-2xl font-bold text-cyan-600 mt-1">1,482</div>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
              <span className="text-xs font-medium text-slate-400">Success Rate</span>
              <div className="text-2xl font-bold text-emerald-600 mt-1">99.8%</div>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
              <span className="text-xs font-medium text-slate-400">Avg Execution Time</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">42ms</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 mt-8">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 mb-8">
          <button
            onClick={() => setActiveNavTab('workflows')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition ${
              activeNavTab === 'workflows'
                ? 'border-cyan-600 text-cyan-700 bg-cyan-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Workflow size={16} />
            <span>Workflows</span>
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
              {flows.length}
            </span>
          </button>

          <button
            onClick={() => setActiveNavTab('runs')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition ${
              activeNavTab === 'runs'
                ? 'border-cyan-600 text-cyan-700 bg-cyan-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock size={16} />
            <span>Execution Runs</span>
          </button>

          <button
            onClick={() => setActiveNavTab('analytics')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition ${
              activeNavTab === 'analytics'
                ? 'border-cyan-600 text-cyan-700 bg-cyan-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity size={16} />
            <span>Analytics & Metrics</span>
          </button>
        </div>

        {activeNavTab === 'runs' ? (
          <FlowRunsView onSelectFlow={(fid) => navigate(`/flow/${fid}`)} />
        ) : activeNavTab === 'analytics' ? (
          <FlowAnalyticsView />
        ) : (
          <>
            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-96">
            <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search flows by name or trigger..."
              className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-2xs"
            />
          </form>

          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs self-stretch sm:self-auto">
            {['all', 'active', 'draft', 'paused'].map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${
                  selectedStatus === status
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Flows Grid */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 size={32} className="animate-spin text-cyan-600" />
            <p className="text-sm">Loading workflows from database...</p>
          </div>
        ) : flows.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 mx-auto mb-4">
              <Workflow size={28} />
            </div>
            <h3 className="text-base font-semibold text-slate-900">No workflows found</h3>
            <p className="text-xs text-slate-500 mt-1 mb-6">
              Create your first automation workflow to streamline 3D spatial lead qualification and actions.
            </p>
            <button
              onClick={() => setShowTemplateModal(true)}
              className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm shadow-sm transition"
            >
              Get Started with a Template
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {flows.map((flow) => (
              <div
                key={flow.id}
                className="bg-white border border-slate-200 hover:border-cyan-300 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center">
                        {getTriggerIcon(flow.trigger_type)}
                      </div>
                      <span className="text-[11px] font-mono text-slate-500">
                        {flow.trigger_type || 'trigger_manual'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          flow.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {flow.status}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        v{flow.version || 1}.0
                      </span>
                    </div>
                  </div>

                  <h3 className="font-semibold text-slate-900 text-base group-hover:text-cyan-700 transition line-clamp-1">
                    {flow.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {flow.description || 'No description provided.'}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Clock size={12} />
                    <span>Updated {new Date(flow.updated_at || Date.now()).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleDuplicate(flow.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                      title="Duplicate Flow"
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      onClick={() => handleArchive(flow.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Archive Flow"
                    >
                      <Trash2 size={14} />
                    </button>
                    <button
                      onClick={() => navigate(`/flow/${flow.id}`)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-cyan-50 hover:text-cyan-700 text-slate-700 font-semibold text-xs transition flex items-center gap-1"
                    >
                      <span>Designer</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
          </>
        )}
      </div>

      {/* Template Chooser Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Choose a Workflow Template</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select a pre-built spatial commerce automation or start from a blank canvas.
                </p>
              </div>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-3">
              {/* Template 1 */}
              <div
                onClick={() => handleSelectTemplate('rfq_lead_qualification')}
                className="p-4 rounded-xl border border-slate-200 hover:border-cyan-500 hover:bg-cyan-50/30 cursor-pointer transition flex items-start gap-3.5 group"
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-slate-900 group-hover:text-cyan-700 transition">
                    3D RFQ Lead Scoring & Instant Spec Sheet
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Triggers when a buyer submits an RFQ from a 3D viewer. Evaluates dwell time, routes VIPs to CRM, and sends automated PDF specifications.
                  </p>
                </div>
              </div>

              {/* Template 2 */}
              <div
                onClick={() => handleSelectTemplate('hotspot_dwell_alert')}
                className="p-4 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/30 cursor-pointer transition flex items-start gap-3.5 group"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                  <Send size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-slate-900 group-hover:text-indigo-700 transition">
                    Interactive Hotspot Dwell Alert
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Fires when high-interest components (e.g. materials, dimensions) are inspected. Alerts sales team on Slack with session telemetry.
                  </p>
                </div>
              </div>

              {/* Blank */}
              <div
                onClick={handleCreateBlank}
                className="p-4 rounded-xl border border-dashed border-slate-300 hover:border-slate-500 hover:bg-slate-50 cursor-pointer transition flex items-start gap-3.5 group"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                  <Plus size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-slate-900 group-hover:text-slate-800 transition">
                    Blank Workflow
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Start from an empty canvas and build your custom automation logic from scratch.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
