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
  Filter,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { flowApi, FlowListItem } from '../services/flowApi';
import { useFlowDesignerStore } from '../store/useFlowDesignerStore';
import { FlowSidebar, FlowNavTab } from './FlowSidebar';
import { FlowTopHeader } from './FlowTopHeader';
import { FlowHomeDashboard } from './FlowHomeDashboard';
import { FlowTemplatesView } from './FlowTemplatesView';
import { FlowConnectionsView } from './FlowConnectionsView';
import { FlowApprovalsView } from './FlowApprovalsView';
import { FlowAiSuggestionsView } from './FlowAiSuggestionsView';
import { FlowSettingsView } from './FlowSettingsView';
import { FlowRunsView } from './FlowRunsView';
import { FlowAnalyticsView } from './FlowAnalyticsView';

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
  const [activeNavTab, setActiveNavTab] = useState<FlowNavTab>('home');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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
        return <Sparkles size={16} className="text-blue-600" />;
      case 'trigger_webhook':
        return <Send size={16} className="text-indigo-600" />;
      default:
        return <Zap size={16} className="text-amber-600" />;
    }
  };

  // Filter flows by search input in real time
  const filteredFlows = flows.filter((f) => {
    if (!searchQuery) return true;
    return (
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.trigger_type?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="h-screen w-full flex bg-slate-50 text-slate-900 overflow-hidden font-sans select-none">
      {/* 1. Persistent Left Navigation Sidebar */}
      <FlowSidebar
        activeTab={activeNavTab}
        onSelectTab={setActiveNavTab}
        activeWorkflowsCount={flows.length}
        pendingApprovalsCount={3}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* 2. Main Content Container */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header Bar */}
        <FlowTopHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenHelp={() => setActiveNavTab('ai-suggestions')}
        />

        {/* Dynamic View Scrollable Canvas */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {activeNavTab === 'home' ? (
              <FlowHomeDashboard
                flows={flows}
                onCreateNew={handleCreateBlank}
                onBrowseTemplates={() => setActiveNavTab('templates')}
                onImportWorkflow={() => setShowImportModal(true)}
                onOpenAiSuggestions={() => setActiveNavTab('ai-suggestions')}
                onSelectFlow={(fid) =>
                  fid === 'all' ? setActiveNavTab('workflows') : navigate(`/flow/${fid}`)
                }
              />
            ) : activeNavTab === 'templates' ? (
              <FlowTemplatesView
                onSelectTemplate={handleSelectTemplate}
                onCreateBlank={handleCreateBlank}
              />
            ) : activeNavTab === 'connections' ? (
              <FlowConnectionsView />
            ) : activeNavTab === 'runs' ? (
              <FlowRunsView onSelectFlow={(fid) => navigate(`/flow/${fid}`)} />
            ) : activeNavTab === 'approvals' ? (
              <FlowApprovalsView />
            ) : activeNavTab === 'ai-suggestions' ? (
              <FlowAiSuggestionsView />
            ) : activeNavTab === 'settings' ? (
              <FlowSettingsView />
            ) : activeNavTab === 'analytics' ? (
              <FlowAnalyticsView />
            ) : (
              /* My Workflows (ListView) */
              <div className="space-y-6">
                {/* Header & Primary Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                      My Workflows
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">
                      Manage, execute, duplicate, and monitor your automated 3D pipelines.
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => {
                        setImportError(null);
                        setShowImportModal(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-2xs transition active:scale-95 cursor-pointer"
                    >
                      <Upload size={14} />
                      <span>Import</span>
                    </button>

                    <button
                      onClick={handleCreateBlank}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition active:scale-95 cursor-pointer"
                    >
                      <Plus size={16} className="stroke-[2.5]" />
                      <span>Create Workflow</span>
                    </button>
                  </div>
                </div>

                {/* Filter & Search Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Status Pills */}
                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs self-stretch sm:self-auto">
                    {['all', 'active', 'draft', 'paused'].map((status) => (
                      <button
                        key={status}
                        onClick={() => setSelectedStatus(status)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition cursor-pointer ${
                          selectedStatus === status
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>

                  {/* Search count info */}
                  <span className="text-xs text-slate-400 font-medium">
                    Showing {filteredFlows.length} workflow{filteredFlows.length === 1 ? '' : 's'}
                  </span>
                </div>

                {/* Flows Grid or Empty State */}
                {isLoading ? (
                  <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
                    <Loader2 size={32} className="animate-spin text-blue-600" />
                    <p className="text-sm">Loading workflows from database...</p>
                  </div>
                ) : filteredFlows.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400 text-xs space-y-3">
                    <Workflow size={36} className="mx-auto text-slate-300" />
                    <div className="font-bold text-slate-800 text-sm">No workflows found</div>
                    <p className="max-w-md mx-auto text-slate-500">
                      You haven't created any flows matching this filter yet. Create a flow or pick a
                      pre-built template to get started.
                    </p>
                    <div className="flex items-center justify-center gap-3 pt-2">
                      <button
                        onClick={() => setActiveNavTab('templates')}
                        className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl font-bold text-xs transition"
                      >
                        Browse Templates
                      </button>
                      <button
                        onClick={handleCreateBlank}
                        className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-bold text-xs shadow-xs transition"
                      >
                        Create New Workflow
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredFlows.map((flow) => (
                      <div
                        key={flow.id}
                        className="bg-white border border-slate-200/80 hover:border-blue-400 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
                                {getTriggerIcon(flow.trigger_type)}
                              </div>
                              <span className="text-[11px] font-mono text-slate-500">
                                {flow.trigger_type?.replace('trigger_', '') || 'manual'}
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

                          <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition line-clamp-1">
                            {flow.name}
                          </h3>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                            {flow.description || 'Automated spatial qualification & data workflow.'}
                          </p>
                        </div>

                        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                            <Clock size={12} />
                            <span>
                              {flow.run_count || 12} runs
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleDuplicate(flow.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                              title="Duplicate Flow"
                            >
                              <Copy size={13} />
                            </button>
                            <button
                              onClick={() => handleExport(flow.id, flow.name)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                              title="Export Flow (.flow.json)"
                            >
                              <Download size={13} />
                            </button>
                            <button
                              onClick={() => handleArchive(flow.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              title="Archive Flow"
                            >
                              <Trash2 size={13} />
                            </button>
                            <button
                              onClick={() => navigate(`/flow/${flow.id}`)}
                              className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white font-bold text-xs transition flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
                            >
                              <span>Open</span>
                              <ChevronRight size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Import Flow Package Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Upload size={18} className="text-blue-600" />
                  <span>Import Workflow Package</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upload an exported <code>.flow.json</code> definition file.
                </p>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
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

              <label className="border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition bg-slate-50/50 hover:bg-blue-50/20 group">
                <input
                  type="file"
                  accept=".json,.flow.json"
                  onChange={handleImportFile}
                  disabled={isImporting}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 transition">
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
                <p>• Kahn's algorithm cycle &amp; DAG dependency check</p>
                <p>• Generates fresh UUIDs to avoid tenant collision</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlowListView;
