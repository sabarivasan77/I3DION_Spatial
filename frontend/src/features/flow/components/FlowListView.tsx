import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Zap,
  Copy,
  Trash2,
  Clock,
  Sparkles,
  Send,
  Activity,
  ArrowRight,
  Loader2,
  Workflow,
  Upload,
  Download,
} from 'lucide-react';
import { flowApi, FlowListItem } from '../services/flowApi';
import { useFlowDesignerStore } from '../store/useFlowDesignerStore';
import { FlowRunsView } from './FlowRunsView';
import { FlowAnalyticsView } from './FlowAnalyticsView';
import { EcosystemHeader } from '../../../design-system/navigation/EcosystemHeader';

export const FlowListView: React.FC = () => {
  const navigate = useNavigate();
  const [flows, setFlows] = useState<FlowListItem[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
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
    flowApi.listRecipes().then(setRecipes).catch(console.error);
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

  const handleExport = async (flowId: string, flowName: string) => {
    try {
      const data = await flowApi.exportFlow(flowId);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${flowName.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}.flow.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Export failed');
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportError(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const created = await flowApi.importFlow(parsed);
      setShowImportModal(false);
      navigate(`/flow/${created.id}`);
    } catch (err: any) {
      setImportError(err.message || 'Import failed: Invalid workflow JSON format');
    } finally {
      setIsImporting(false);
    }
  };

  const handleInstantiateRecipe = async (recipeKey: string) => {
    try {
      const newFlow = await flowApi.instantiateRecipe(recipeKey);
      setShowTemplateModal(false);
      navigate(`/flow/${newFlow.id}`);
    } catch (err: any) {
      console.error('Instantiate recipe failed, falling back to client draft:', err);
      handleSelectTemplate(recipeKey);
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
      {/* 1. Global I3DION Unified Ecosystem Header */}
      <EcosystemHeader productName="Flow" productBadgeColor="text-cyan-700 bg-cyan-50 border-cyan-200" />

      {/* 2. Top Dark Obsidian Hero Card (Inspired by Omni Studio Tier-1 Aesthetics) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <div className="bg-gradient-to-br from-[#0B0F19] via-[#0F172A] to-[#1E293B] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Ambient Glow Orbs */}
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-cyan-400 bg-cyan-950/80 px-3 py-1 rounded-full border border-cyan-800/80 shadow-sm flex items-center gap-1.5">
                  <Sparkles size={12} className="text-cyan-400 animate-pulse" />
                  WELCOME TO I3DION FLOW
                </span>
                <span className="text-xs font-mono text-slate-400">Enterprise v2.0</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                Autonomous 3D Spatial Automation Engine
              </h1>
              <p className="text-sm sm:text-base text-slate-300 mt-2 leading-relaxed">
                Design, test, and automate 3D spatial lead qualification, CAD document generation, and ERP business event workflows with an intuitive visual designer.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 mt-6">
                <button
                  onClick={() => setShowTemplateModal(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/25 transition active:scale-95 cursor-pointer"
                >
                  <Plus size={18} className="stroke-[2.5]" />
                  <span>+ Create New Flow</span>
                </button>
                <button
                  onClick={() => setShowTemplateModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white font-semibold text-sm border border-slate-700 shadow-md transition active:scale-95 cursor-pointer"
                >
                  <Sparkles size={16} className="text-cyan-400" />
                  <span>Browse Recipes</span>
                </button>
                <button
                  onClick={() => {
                    setImportError(null);
                    setShowImportModal(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 hover:text-white font-medium text-sm border border-slate-700/70 transition cursor-pointer"
                >
                  <Upload size={16} />
                  <span>Import Package</span>
                </button>
              </div>
            </div>

            {/* Right Side Featured Automation Pipeline Preview */}
            <div className="w-full lg:w-96 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-3 border-b border-slate-800 pb-2">
                <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
                  <Workflow size={14} />
                  <span>Active Ecosystem Pipeline</span>
                </span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800 font-bold">
                  Live
                </span>
              </div>
              <div className="space-y-2.5 font-mono text-xs">
                <div className="flex items-center gap-2 text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span className="text-[11px] text-cyan-300 font-bold">Spatial Hub / Engine</span>
                  <span className="text-slate-500">→</span>
                  <span className="text-[11px] text-slate-300">Hotspot Inspected</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-[11px] text-amber-300 font-bold">Rule Engine</span>
                  <span className="text-slate-500">→</span>
                  <span className="text-[11px] text-slate-300">Dwell &gt; 60s (VIP Lead)</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-[11px] text-emerald-300 font-bold">CRM &amp; Outbox</span>
                  <span className="text-slate-500">→</span>
                  <span className="text-[11px] text-slate-300">Spec Sheet &amp; Webhook</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Ribbon (Dark Glassmorphic) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800/80">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <span className="text-xs font-medium text-slate-400">Total Automations</span>
              <div className="text-2xl font-black text-white mt-1">{flows.length}</div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <span className="text-xs font-medium text-slate-400">Executions (24h)</span>
              <div className="text-2xl font-black text-cyan-400 mt-1">1,482</div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <span className="text-xs font-medium text-slate-400">Success Rate</span>
              <div className="text-2xl font-black text-emerald-400 mt-1">99.8%</div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <span className="text-xs font-medium text-slate-400">Avg Latency (p50)</span>
              <div className="text-2xl font-black text-white mt-1">42ms</div>
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
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-400 bg-cyan-950/80 px-2.5 py-0.5 rounded-full border border-cyan-800">
                  Ready to Deploy
                </span>
                <h3 className="text-lg font-bold text-white mt-1">Get Started with Pre-Built Industrial Recipes</h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Select any pre-configured 3D workflow below to instantiate a production automation pipeline instantly.
                </p>
              </div>
              <button
                onClick={handleCreateBlank}
                className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition active:scale-95 cursor-pointer"
              >
                <Plus size={14} />
                <span>Blank Flow from Scratch</span>
              </button>
            </div>

            {/* Industrial Recipe Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {recipes.map((recipe) => (
                <div
                  key={recipe.key}
                  className="bg-white border border-slate-200 hover:border-cyan-400 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-100">
                        {recipe.triggerType?.replace('trigger_', '') || 'EVENT'}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {recipe.nodeCount || 3} steps
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm group-hover:text-cyan-700 transition">
                      {recipe.name}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-3 leading-relaxed">
                      {recipe.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => handleInstantiateRecipe(recipe.key)}
                      className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-cyan-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
                    >
                      <Sparkles size={13} className="text-cyan-400" />
                      <span>Use Recipe</span>
                      <ArrowRight size={13} className="ml-0.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
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
                      onClick={() => handleExport(flow.id, flow.name)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 transition"
                      title="Export Flow (.flow.json)"
                    >
                      <Download size={14} />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles size={20} className="text-cyan-600" />
                  <span>Industrial Workflow Recipe Gallery</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pre-configured 3D spatial lead qualification, CAD quotation, and alert automations.
                </p>
              </div>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3 flex-1">
              {/* Recipe Cards */}
              {(recipes.length > 0
                ? recipes
                : [
                    {
                      key: 'rfq_lead_qualification',
                      name: '3D RFQ Lead Scoring & Instant Spec Sheet',
                      description:
                        'Triggers when a buyer submits an RFQ from a 3D digital twin. Evaluates dwell time, routes VIPs to CRM, and delivers automated CAD spec sheets.',
                      category: 'Commercial',
                      nodeCount: 5,
                      tags: ['3D RFQ', 'Lead Scoring', 'CAD Spec', 'CRM'],
                    },
                    {
                      key: 'hotspot_dwell_alert',
                      name: 'Interactive Hotspot Dwell Alert & Slack Notification',
                      description:
                        'Fires when high-interest components (e.g. materials, tolerance pins) are inspected in 3D. Alerts the sales engineering team.',
                      category: 'Engineering',
                      nodeCount: 3,
                      tags: ['Hotspot', 'Telemetry', 'Slack', 'Alerts'],
                    },
                    {
                      key: 'cad_proposal_dispatcher',
                      name: 'Automated CAD Proposal & Spec Sheet Emailer',
                      description:
                        'Instantly renders technical product dimensions and CAD specification sheets upon quotation request, sending an automated email.',
                      category: 'Sales Automation',
                      nodeCount: 3,
                      tags: ['CAD', 'Email', 'PDF', 'Instant Quote'],
                    },
                    {
                      key: 'inventory_webhook_sync',
                      name: 'Transactional Outbox Webhook Dispatcher',
                      description:
                        'Dispatches an HMAC-signed transactional webhook to external ERP/CRM systems with strict SSRF protection.',
                      category: 'Integrations',
                      nodeCount: 2,
                      tags: ['ERP Sync', 'Webhook', 'SSRF Safe', 'HMAC'],
                    },
                  ]
              ).map((recipe) => (
                <div
                  key={recipe.key}
                  onClick={() => handleInstantiateRecipe(recipe.key)}
                  className="p-4 rounded-xl border border-slate-200 hover:border-cyan-500 hover:bg-cyan-50/20 cursor-pointer transition group shadow-2xs hover:shadow-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-100">
                        {recipe.category || 'Recipe'}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {recipe.nodeCount || 3} steps
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-cyan-600 group-hover:translate-x-0.5 transition flex items-center gap-1">
                      <span>Use Recipe</span>
                      <ArrowRight size={13} />
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 group-hover:text-cyan-700 transition mt-2">
                    {recipe.name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {recipe.description}
                  </p>

                  {recipe.tags && recipe.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {recipe.tags.map((tag: string, idx: number) => (
                        <span
                          key={idx}
                          className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Blank Canvas Option */}
              <div
                onClick={handleCreateBlank}
                className="p-4 rounded-xl border border-dashed border-slate-300 hover:border-slate-500 hover:bg-slate-50 cursor-pointer transition flex items-center gap-3.5 group mt-4"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                  <Plus size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-slate-900 group-hover:text-slate-800 transition">
                    Start from a Blank Canvas
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Design custom automation logic from scratch using the visual drag-and-drop designer.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Flow Package Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Upload size={18} className="text-cyan-600" />
                  <span>Import Workflow Package</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upload an exported <code>.flow.json</code> definition file.
                </p>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              {importError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                  {importError}
                </div>
              )}

              <label className="border-2 border-dashed border-slate-200 hover:border-cyan-500 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition bg-slate-50/50 hover:bg-cyan-50/20 group">
                <input
                  type="file"
                  accept=".json,.flow.json"
                  onChange={handleImportFile}
                  disabled={isImporting}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-xl bg-cyan-100 text-cyan-600 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                  {isImporting ? (
                    <Loader2 size={24} className="animate-spin" />
                  ) : (
                    <Upload size={24} />
                  )}
                </div>
                <span className="text-sm font-semibold text-slate-800">
                  {isImporting ? 'Validating & Importing...' : 'Choose .flow.json file'}
                </span>
                <span className="text-xs text-slate-400 mt-1">
                  Drag and drop or browse from local filesystem
                </span>
              </label>

              <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500 space-y-1 border border-slate-100">
                <p className="font-semibold text-slate-700">Import Verification:</p>
                <p>• Validates against FlowDefinitionSchema v1.0</p>
                <p>• Kahn's algorithm cycle & DAG dependency check</p>
                <p>• Generates fresh UUIDs to avoid tenant collision</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
