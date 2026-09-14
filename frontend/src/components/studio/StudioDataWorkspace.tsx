import React, { useState, useEffect } from 'react';
import { studioApi, StudioDatasetSchema, StudioQueryFilter, StudioQueryResult } from '../../api/studioApi';
import { Database, Table, Filter, Plus, CheckCircle2, ShieldCheck, Search, ArrowRight, Eye, RefreshCw, X } from 'lucide-react';

interface StudioDataWorkspaceProps {
  onClose?: () => void;
  onSelectBinding?: (datasetKey: string, fieldKey?: string) => void;
}

export const StudioDataWorkspace: React.FC<StudioDataWorkspaceProps> = ({ onClose, onSelectBinding }) => {
  const [activeTab, setActiveTab] = useState<'sources' | 'schema' | 'queries' | 'preview'>('sources');
  const [dataSources, setDataSources] = useState<any>(null);
  const [selectedDatasetKey, setSelectedDatasetKey] = useState<string>('vault_products');
  const [schema, setSchema] = useState<StudioDatasetSchema | null>(null);
  const [queryResult, setQueryResult] = useState<StudioQueryResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Query Builder state
  const [filters, setFilters] = useState<StudioQueryFilter[]>([]);
  const [sortField, setSortField] = useState('created_at');
  const [sortDir, setSortDir] = useState<'ASC' | 'DESC'>('DESC');

  useEffect(() => {
    loadDataSources();
  }, []);

  useEffect(() => {
    if (selectedDatasetKey) {
      loadSchemaAndPreview(selectedDatasetKey);
    }
  }, [selectedDatasetKey, sortField, sortDir]);

  const loadDataSources = async () => {
    try {
      const res = await studioApi.getDataSources();
      setDataSources(res);
    } catch (err) {
      console.error('Failed to load data sources', err);
    }
  };

  const loadSchemaAndPreview = async (datasetKey: string) => {
    setIsLoading(true);
    try {
      const schemaRes = await studioApi.getDatasetSchema(datasetKey);
      setSchema(schemaRes);

      const queryRes = await studioApi.executeQuery({
        dataset_key: datasetKey,
        filters,
        sort: [{ field: sortField, direction: sortDir }],
        search: searchQuery,
        pagination: { page: 1, limit: 15 }
      });
      setQueryResult(queryRes);
    } catch (err) {
      console.error('Failed to load dataset schema/preview', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyFilter = () => {
    if (selectedDatasetKey) {
      loadSchemaAndPreview(selectedDatasetKey);
    }
  };

  const addFilterRule = () => {
    setFilters([...filters, { field: 'status', operator: 'Equals', value: 'Published' }]);
  };

  const removeFilterRule = (idx: number) => {
    setFilters(filters.filter((_, i) => i !== idx));
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6 select-none font-sans">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-6xl h-[85vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Top Header Bar */}
        <header className="px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
              <Database size={20} />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-white">Spatial Data & Connectors Workspace</h2>
              <p className="text-xs text-slate-400">Configure Spatial Vault datasets, schema fields, collections, and live bindings</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadSchemaAndPreview(selectedDatasetKey)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition flex items-center gap-1.5 text-xs font-bold"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Sync Data
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="px-6 bg-slate-950/40 border-b border-slate-800 flex items-center gap-6 shrink-0 text-xs font-bold">
          <button
            onClick={() => setActiveTab('sources')}
            className={`py-3 border-b-2 flex items-center gap-2 transition ${
              activeTab === 'sources' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database size={14} /> Registered Connectors
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`py-3 border-b-2 flex items-center gap-2 transition ${
              activeTab === 'schema' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Table size={14} /> Field Schema Inspector
          </button>
          <button
            onClick={() => setActiveTab('queries')}
            className={`py-3 border-b-2 flex items-center gap-2 transition ${
              activeTab === 'queries' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Filter size={14} /> Query & Filter Builder
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`py-3 border-b-2 flex items-center gap-2 transition ${
              activeTab === 'preview' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye size={14} /> Live Record Preview
          </button>
        </div>

        {/* Main Content Workspace */}
        <div className="flex-1 overflow-hidden flex">
          
          {/* Left Sidebar Dataset Selector */}
          <div className="w-64 border-r border-slate-800 p-4 shrink-0 overflow-y-auto space-y-2 bg-slate-950/20">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider px-2">Authorized Datasets</span>
            {(dataSources?.datasets || []).map((ds: any) => (
              <button
                key={ds.id}
                onClick={() => setSelectedDatasetKey(ds.dataset_key)}
                className={`w-full p-3 rounded-2xl border text-left transition flex flex-col gap-1 ${
                  selectedDatasetKey === ds.dataset_key
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg'
                    : 'bg-slate-800/40 border-slate-700/50 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">{ds.name}</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-indigo-400">
                    {ds.source_type || 'Vault'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 line-clamp-1">{ds.description}</span>
              </button>
            ))}
          </div>

          {/* Right Main Panel Views */}
          <div className="flex-1 p-6 overflow-y-auto bg-slate-900/50">
            {activeTab === 'sources' && (
              <div className="space-y-6">
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400">
                      <ShieldCheck size={24} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-white">Spatial Vault Connector</h3>
                      <p className="text-xs text-slate-400">Status: <span className="text-emerald-400 font-bold">Connected & Authorized</span></p>
                    </div>
                  </div>
                  <span className="text-xs font-mono bg-slate-900 border border-slate-700 px-3 py-1 rounded-xl text-slate-300">
                    Tenant ID: Org-Active
                  </span>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-xs text-slate-300">Dataset Capabilities & Permissions</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {(dataSources?.datasets || []).map((ds: any) => (
                      <div key={ds.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <h5 className="font-bold text-xs text-white">{ds.name}</h5>
                          <span className="text-[10px] font-mono text-indigo-400">{ds.dataset_key}</span>
                        </div>
                        <p className="text-[11px] text-slate-400">{ds.description}</p>
                        <div className="flex items-center gap-2 pt-2 text-[10px] font-bold text-slate-300 border-t border-slate-800/80">
                          <span className="flex items-center gap-1 text-emerald-400"><CheckCircle2 size={12} /> Read</span>
                          <span className="flex items-center gap-1 text-emerald-400"><CheckCircle2 size={12} /> Create</span>
                          <span className="flex items-center gap-1 text-emerald-400"><CheckCircle2 size={12} /> Update</span>
                          <span className="flex items-center gap-1 text-emerald-400"><CheckCircle2 size={12} /> Audit Log</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'schema' && schema && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-sm text-white">{schema.name} Schema Inspector</h3>
                    <p className="text-xs text-slate-400">Dynamic field definitions discovered from table `{schema.table_name}`</p>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold">
                      <tr>
                        <th className="px-4 py-3">Field Name</th>
                        <th className="px-4 py-3">Display Label</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Required</th>
                        <th className="px-4 py-3">Read Only</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {(schema.fields || []).map((f) => (
                        <tr key={f.field_name} className="hover:bg-slate-900/50">
                          <td className="px-4 py-2.5 font-mono text-indigo-400 font-bold">{f.field_name}</td>
                          <td className="px-4 py-2.5 text-white font-bold">{f.display_name}</td>
                          <td className="px-4 py-2.5">
                            <span className="px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-300">
                              {f.field_type}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-slate-400">{f.is_required ? 'Yes' : 'No'}</td>
                          <td className="px-4 py-2.5 text-slate-400">{f.is_readonly ? 'Yes' : 'No'}</td>
                          <td className="px-4 py-2.5 text-right">
                            {onSelectBinding && (
                              <button
                                onClick={() => onSelectBinding(selectedDatasetKey, f.field_name)}
                                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] rounded-lg transition"
                              >
                                Bind Field
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'queries' && (
              <div className="space-y-6">
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-sm text-white">Structured Filter Rules</h3>
                    <button
                      onClick={addFilterRule}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1"
                    >
                      <Plus size={14} /> Add Filter Condition
                    </button>
                  </div>

                  {filters.length === 0 ? (
                    <div className="text-xs text-slate-400 p-4 border border-dashed border-slate-800 rounded-xl text-center">
                      No custom filter rules added. All records in dataset will be queried.
                    </div>
                  ) : (
                    filters.map((f, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <select
                          value={f.field}
                          onChange={(e) => {
                            const updated = [...filters];
                            updated[idx].field = e.target.value;
                            setFilters(updated);
                          }}
                          className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-bold outline-none"
                        >
                          {(schema?.fields || []).map((fd) => (
                            <option key={fd.field_name} value={fd.field_name}>{fd.display_name} ({fd.field_name})</option>
                          ))}
                        </select>

                        <select
                          value={f.operator}
                          onChange={(e) => {
                            const updated = [...filters];
                            updated[idx].operator = e.target.value as any;
                            setFilters(updated);
                          }}
                          className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-bold outline-none"
                        >
                          <option value="Equals">Equals (=)</option>
                          <option value="Not Equals">Not Equals (!=)</option>
                          <option value="Contains">Contains</option>
                          <option value="Starts With">Starts With</option>
                          <option value="Greater Than">Greater Than (&gt;)</option>
                          <option value="Less Than">Less Than (&lt;)</option>
                          <option value="Is Empty">Is Empty</option>
                          <option value="Is Not Empty">Is Not Empty</option>
                        </select>

                        <input
                          type="text"
                          value={f.value || ''}
                          onChange={(e) => {
                            const updated = [...filters];
                            updated[idx].value = e.target.value;
                            setFilters(updated);
                          }}
                          placeholder="Condition Value..."
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-semibold outline-none"
                        />

                        <button
                          onClick={() => removeFilterRule(idx)}
                          className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-xl transition"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))
                  )}

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={handleApplyFilter}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                    >
                      <Filter size={14} /> Apply Filter Rules
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'preview' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                    <input
                      type="text"
                      placeholder="Search records in real-time..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyFilter()}
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 outline-none focus:border-indigo-500"
                    />
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    Total Records: {queryResult?.pagination?.total_records || 0}
                  </span>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
                  {(!queryResult?.records || queryResult.records.length === 0) ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      No records found matching query filter criteria.
                    </div>
                  ) : (
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold">
                        <tr>
                          <th className="px-4 py-3">ID</th>
                          <th className="px-4 py-3">Name / Title</th>
                          <th className="px-4 py-3">Category</th>
                          <th className="px-4 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-medium">
                        {queryResult.records.map((r: any) => (
                          <tr key={r.id} className="hover:bg-slate-900/50">
                            <td className="px-4 py-2.5 font-mono text-slate-500 text-[10px]">{r.id}</td>
                            <td className="px-4 py-2.5 text-white font-bold">{r.name || r.full_name || 'Untitled Record'}</td>
                            <td className="px-4 py-2.5 text-indigo-400 font-semibold">{r.category || r.file_category || r.company_name || 'General'}</td>
                            <td className="px-4 py-2.5">
                              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                                {r.status || 'Active'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
