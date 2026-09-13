import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Folder,
  FileText,
  Cpu,
  Trash2,
  Share2,
  Plus,
  ArrowRight,
  CheckCircle2,
  Database,
  X,
  ShieldCheck,
  HardDrive
} from 'lucide-react';
import { vaultApi, VaultCollection, VaultTemplate, VaultProcessingJob } from '../../api/vaultApi';

// ---------------------------------------------------------
// 1. DATA SOURCES / COLLECTIONS
// ---------------------------------------------------------
export function VaultCollections() {
  const navigate = useNavigate();
  const [collections, setCollections] = useState<VaultCollection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    setIsLoading(true);
    try {
      const data = await vaultApi.getCollections();
      setCollections(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load collections', err);
      setCollections([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const newColl = await vaultApi.createCollection({ name, description });
      setCollections([newColl, ...collections]);
      setName('');
      setDescription('');
      setIsModalOpen(false);
      navigate(`/vault/workspace/${newColl.id}`);
    } catch (err) {
      console.error('Failed to create collection', err);
    }
  };

  return (
    <div className="mx-auto max-w-7xl h-full flex flex-col space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Data Sources & Collections</h1>
          <p className="text-xs text-slate-500 mt-1">Enterprise datasets and asset organization boundaries.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-sm"
        >
          <Plus size={16} /> New Data Source
        </button>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center text-slate-400">Loading data sources...</div>
      ) : (!collections || collections.length === 0) ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          <Database size={48} className="mb-4 opacity-40 text-emerald-600" />
          <p className="text-sm font-bold text-slate-800">No Data Sources created yet</p>
          <p className="text-xs text-slate-500 mt-1 mb-4">Create your first database workspace to organize assets & structured data.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
          >
            Create Data Source
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(collections || []).map(c => (
            <div
              key={c.id}
              onClick={() => navigate(`/vault/workspace/${c.id}`)}
              className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-emerald-300 hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <Folder size={24} />
                  </div>
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 group-hover:translate-x-1 transition-transform">
                    Open Workspace <ArrowRight size={14} />
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition">{c.name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{c.description || 'Enterprise Data Source Repository'}</p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>{c.record_count || 0} Records</span>
                <span>{c.schema_fields?.length || 0} Schema Fields</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
              <h2 className="text-base font-bold text-slate-900">Create New Data Source</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Data Source Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Industrial Compressor Models"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-semibold outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Description</label>
                <textarea
                  placeholder="Describe the purpose and contents of this dataset..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-24 w-full rounded-xl border border-slate-200 p-3 text-xs font-medium outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs">Create Workspace</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------
// 2. TEMPLATES
// ---------------------------------------------------------
export function VaultTemplates() {
  const [templates, setTemplates] = useState<VaultTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const data = await vaultApi.getTemplates();
      setTemplates(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load templates', err);
      setTemplates([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const created = await vaultApi.createTemplate({
        name,
        description,
        schema: {
          fields: [
            { key: 'serial_number', name: 'Serial Number', type: 'Text', required: true },
            { key: 'inspection_date', name: 'Inspection Date', type: 'Date' }
          ]
        }
      });
      setTemplates([created, ...templates]);
      setName('');
      setDescription('');
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to create template', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await vaultApi.deleteTemplate(id);
      setTemplates(templates.filter(t => t.id !== id));
    } catch (err) {
      console.error('Delete template failed', err);
    }
  };

  return (
    <div className="mx-auto max-w-7xl h-full flex flex-col space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Metadata & Field Templates</h1>
          <p className="text-xs text-slate-500 mt-1">Reusable schema definitions for consistent asset structuring.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-sm"
        >
          <Plus size={16} /> New Template
        </button>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center text-slate-400">Loading templates...</div>
      ) : (!templates || templates.length === 0) ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          <FileText size={48} className="mb-4 opacity-40 text-indigo-600" />
          <p className="text-sm font-bold text-slate-800">No Templates available</p>
          <button onClick={() => setIsModalOpen(true)} className="mt-3 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700">Create Template</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(templates || []).map(t => (
            <div key={t.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-emerald-300 transition flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 font-bold">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{t.name}</h3>
                    <p className="text-xs text-slate-500">{t.schema?.fields?.length || 0} predefined fields</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600">{t.description || 'Custom metadata schema template'}</p>
              </div>

              <div className="flex gap-2 pt-4 mt-4 border-t border-slate-100">
                <button className="flex-1 rounded-lg border border-slate-200 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Edit Schema</button>
                <button onClick={() => handleDelete(t.id)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
              <h2 className="text-base font-bold text-slate-900">Create New Template</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Template Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Technical Specification"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-semibold outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Description</label>
                <textarea
                  placeholder="Template description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-24 w-full rounded-xl border border-slate-200 p-3 text-xs font-medium outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs">Save Template</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------
// 3. PROCESSING CENTER
// ---------------------------------------------------------
export function VaultProcessing() {
  const [jobs, setJobs] = useState<VaultProcessingJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    vaultApi.getProcessingJobs()
      .then(data => { setJobs(Array.isArray(data) ? data : []); setIsLoading(false); })
      .catch(() => { setJobs([]); setIsLoading(false); });
  }, []);

  return (
    <div className="mx-auto max-w-7xl h-full flex flex-col space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Processing Center</h1>
        <p className="text-xs text-slate-500 mt-1">Real-time status of 3D asset conversions, validations, and imports.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center text-slate-400">Loading background jobs...</div>
        ) : (!jobs || jobs.length === 0) ? (
          <div className="flex items-center justify-center h-64 flex-col text-slate-500">
            <Cpu size={48} className="mb-4 opacity-40 text-emerald-600" />
            <p className="text-sm font-bold text-slate-800">No active processing tasks</p>
            <p className="text-xs text-slate-400 mt-1">All uploaded assets have been validated and stored cleanly.</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Task Type</th>
                <th className="px-4 py-3">Target Asset</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Progress</th>
                <th className="px-4 py-3">Started</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(jobs || []).map(j => (
                <tr key={j.id}>
                  <td className="px-4 py-3 font-bold text-slate-900">{j.job_type}</td>
                  <td className="px-4 py-3 font-medium text-slate-700">{j.asset_name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      j.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      <CheckCircle2 size={12} /> {j.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-800">{j.progress_pct}%</td>
                  <td className="px-4 py-3 text-slate-400">{new Date(j.started_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// 4. TRASH & RECOVERY
// ---------------------------------------------------------
export function VaultTrash() {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTrash();
  }, []);

  const loadTrash = async () => {
    setIsLoading(true);
    try {
      const data = await vaultApi.getTrash();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await vaultApi.restoreAsset(id);
      setItems(items.filter(i => i.id !== id));
    } catch (err) {
      console.error('Restore failed', err);
    }
  };

  const handleEmptyTrash = async () => {
    if (!confirm('Are you sure you want to permanently purge all items in Trash?')) return;
    try {
      await vaultApi.emptyTrash();
      setItems([]);
    } catch (err) {
      console.error('Empty trash failed', err);
    }
  };

  return (
    <div className="mx-auto max-w-7xl h-full flex flex-col space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Trash & Recovery</h1>
          <p className="text-xs text-slate-500 mt-1">Deleted items remain here for 30 days before permanent deletion.</p>
        </div>
        {(items?.length || 0) > 0 && (
          <button
            onClick={handleEmptyTrash}
            className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-100 transition"
          >
            <Trash2 size={14} /> Empty Trash
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center text-slate-400">Loading trash...</div>
        ) : (!items || items.length === 0) ? (
          <div className="flex items-center justify-center h-64 flex-col text-slate-500">
            <Trash2 size={48} className="mb-4 opacity-40 text-slate-400" />
            <p className="text-sm font-bold text-slate-800">Trash is empty</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Item Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Deleted Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(items || []).map(i => (
                <tr key={i.id}>
                  <td className="px-4 py-3 font-bold text-slate-900">{i.name}</td>
                  <td className="px-4 py-3 text-slate-600">{i.type}</td>
                  <td className="px-4 py-3 text-slate-400">{new Date(i.deleted_at).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleRestore(i.id)}
                      className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition"
                    >
                      Restore
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// 5. SHARED DATA
// ---------------------------------------------------------
export function VaultShared() {
  return (
    <div className="mx-auto max-w-7xl h-full flex flex-col space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Shared Datasets</h1>
        <p className="text-xs text-slate-500 mt-1">Cross-organization and team shared assets.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm flex flex-col items-center justify-center text-center h-64 text-slate-500">
        <Share2 size={48} className="mb-4 opacity-40 text-emerald-600" />
        <p className="text-sm font-bold text-slate-800">No assets have been shared with you directly</p>
        <p className="text-xs text-slate-400 mt-1">Assets shared across teams in your organization appear in your Vault Assets library.</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// 6. VAULT SETTINGS
// ---------------------------------------------------------
export function VaultSettings() {
  return (
    <div className="mx-auto max-w-7xl h-full flex flex-col space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Vault Enterprise Settings</h1>
        <p className="text-xs text-slate-500 mt-1">Configure Vault storage limits, metadata rules, and access control policies.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <HardDrive size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Storage & Quotas</h3>
              <p className="text-xs text-slate-500">256 GB used of 1 TB allocated space.</p>
            </div>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full bg-emerald-500 w-1/4"></div>
          </div>
          <button className="text-xs font-bold text-emerald-600 hover:underline">Request Expansion →</button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Access Control & RBAC</h3>
              <p className="text-xs text-slate-500">Enforce role-based access for Vault dataset creators.</p>
            </div>
          </div>
          <button className="text-xs font-bold text-indigo-600 hover:underline">Configure Permissions →</button>
        </div>
      </div>
    </div>
  );
}
