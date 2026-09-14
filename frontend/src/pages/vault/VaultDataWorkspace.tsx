import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  Plus,
  Download,
  UploadCloud,
  Settings2,
  Grid,
  List,
  Trash2,
  Edit3,
  X,
  CheckCircle2,
  Database,
  FileText,
  Share2,
  Bookmark,
  AlertCircle
} from 'lucide-react';
import { vaultApi, VaultCollection, VaultRecord, VaultSchemaField } from '../../api/vaultApi';
import VaultSchemaModal from '../../components/vault/VaultSchemaModal';
import { VaultImportModal, VaultExportModal } from '../../components/vault/VaultImportExportModal';
import { VaultShareModal } from '../../components/vault/VaultShareModal';

export default function VaultDataWorkspace() {
  const { sourceId } = useParams();
  const navigate = useNavigate();

  const [collection, setCollection] = useState<VaultCollection | null>(null);
  const [records, setRecords] = useState<VaultRecord[]>([]);
  const [savedViews, setSavedViews] = useState<any[]>([]);
  const [activeViewId, setActiveViewId] = useState<string>('default');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);
  const [activeRecord, setActiveRecord] = useState<VaultRecord | null>(null);

  // Modals
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAddRecordOpen, setIsAddRecordOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleName, setTitleName] = useState('');

  // Saved View Modal
  const [isSaveViewOpen, setIsSaveViewOpen] = useState(false);
  const [newViewName, setNewViewName] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // New Record form
  const [newRecordName, setNewRecordName] = useState('');
  const [newRecordData, setNewRecordData] = useState<Record<string, any>>({});

  // Edit Record state
  const [isEditingRecord, setIsEditingRecord] = useState(false);
  const [editRecordName, setEditRecordName] = useState('');
  const [editRecordStatus, setEditRecordStatus] = useState('Active');
  const [editRecordData, setEditRecordData] = useState<Record<string, any>>({});

  const handleStartEditRecord = (rec: VaultRecord) => {
    setActiveRecord(rec);
    setEditRecordName(rec.name);
    setEditRecordStatus(rec.status || 'Active');
    setEditRecordData(rec.data || {});
    setIsEditingRecord(true);
  };

  const handleSaveEditRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collection || !activeRecord) return;

    try {
      const updated = await vaultApi.updateRecord(collection.id, activeRecord.id, {
        name: editRecordName,
        status: editRecordStatus,
        data: editRecordData
      });

      setRecords((records || []).map(r => r.id === activeRecord.id ? updated : r));
      setActiveRecord(updated);
      setIsEditingRecord(false);
    } catch (err) {
      console.error('Failed to update record', err);
    }
  };


  useEffect(() => {
    if (sourceId) {
      loadWorkspaceData(sourceId);
      loadSavedViews(sourceId);
    }
  }, [sourceId]);

  const loadWorkspaceData = async (id: string) => {
    setIsLoading(true);
    try {
      const res = await vaultApi.getRecords(id);
      setCollection(res.collection);
      setTitleName(res.collection?.name || 'Workspace');
      setRecords(Array.isArray(res?.records) ? res.records : []);
      setError('');
    } catch (err: any) {
      console.error(err);
      setRecords([]);
      setError('Failed to load data workspace');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSavedViews = async (id: string) => {
    try {
      const views = await vaultApi.getSavedViews(id);
      setSavedViews(views);
    } catch {
      // silent
    }
  };

  const handleRenameCollection = async () => {
    if (!collection || !titleName.trim()) return;
    try {
      const updated = await vaultApi.updateCollection(collection.id, { name: titleName });
      setCollection(updated);
      setIsEditingTitle(false);
    } catch (err) {
      console.error('Rename collection failed', err);
    }
  };

  const validateRecordInput = (): boolean => {
    if (!newRecordName.trim()) {
      setValidationError('Record Name is required');
      return false;
    }

    const fields: VaultSchemaField[] = collection?.schema_fields || [];
    for (const f of fields) {
      if (f.required && !newRecordData[f.key]) {
        setValidationError(`Field "${f.name}" is required.`);
        return false;
      }
      if (f.type === 'Number' && newRecordData[f.key] !== undefined && newRecordData[f.key] !== '') {
        if (isNaN(Number(newRecordData[f.key]))) {
          setValidationError(`Field "${f.name}" must be a valid number.`);
          return false;
        }
      }
    }

    setValidationError(null);
    return true;
  };

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collection) return;
    if (!validateRecordInput()) return;

    try {
      const created = await vaultApi.createRecord(collection.id, {
        name: newRecordName,
        data: newRecordData,
        status: 'Active'
      });
      setRecords([created, ...(records || [])]);
      setNewRecordName('');
      setNewRecordData({});
      setValidationError(null);
      setIsAddRecordOpen(false);
    } catch (err: any) {
      setValidationError(err.message || 'Failed to create record');
    }
  };

  const handleSaveView = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collection || !newViewName.trim()) return;

    try {
      const createdView = await vaultApi.createSavedView({
        collection_id: collection.id,
        name: newViewName.trim(),
        is_shared: true,
        columns_config: collection.schema_fields || []
      });
      setSavedViews([createdView, ...savedViews]);
      setActiveViewId(createdView.id);
      setNewViewName('');
      setIsSaveViewOpen(false);
    } catch {
      // silent
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!collection) return;
    try {
      await vaultApi.deleteRecord(collection.id, recordId);
      setRecords((records || []).filter(r => r.id !== recordId));
      if (activeRecord?.id === recordId) setActiveRecord(null);
    } catch (err) {
      console.error('Delete record failed', err);
    }
  };

  const handleBulkDelete = async () => {
    if (!collection || selectedRecordIds.length === 0) return;
    try {
      await Promise.all(selectedRecordIds.map(id => vaultApi.deleteRecord(collection.id, id)));
      setRecords((records || []).filter(r => !selectedRecordIds.includes(r.id)));
      setSelectedRecordIds([]);
    } catch (err) {
      console.error('Bulk delete records failed', err);
    }
  };

  const handleImportRecords = async (importedList: any[]) => {
    if (!collection) return;
    try {
      const createdRecords = await Promise.all(
        importedList.map(rec => vaultApi.createRecord(collection.id, rec))
      );
      setRecords([...createdRecords, ...(records || [])]);
    } catch (err) {
      console.error('Batch import failed', err);
    }
  };

  const filteredRecords = (records || []).filter(r => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      r.name.toLowerCase().includes(term) ||
      Object.values(r.data || {}).some(val => String(val).toLowerCase().includes(term))
    );
  });

  if (isLoading) {
    return <div className="h-full flex items-center justify-center text-slate-400 font-bold">Loading Data Workspace...</div>;
  }

  if (error || !collection) {
    return <div className="h-full flex items-center justify-center text-red-500 font-bold">{error || 'Data Workspace not found'}</div>;
  }

  const fields: VaultSchemaField[] = collection.schema_fields || [];

  return (
    <div className="mx-auto max-w-7xl h-full flex flex-col space-y-6 animate-in fade-in duration-300 select-none">
      {/* ─── HEADER BAR ───────── */}
      <div className="flex flex-col gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/vault/collections')}
            className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
          >
            <ArrowLeft size={14} /> Back to Collections
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
            >
              <Share2 size={14} /> Share Access
            </button>
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
            >
              <Download size={14} /> Export
            </button>
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
            >
              <UploadCloud size={14} /> Import
            </button>
            <button
              onClick={() => setIsSchemaModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition shadow-2xs"
            >
              <Settings2 size={14} /> Manage Schema
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2 border-t border-slate-100">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white font-bold shadow-md">
                <Database size={20} />
              </div>
              {isEditingTitle ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={titleName}
                    onChange={(e) => setTitleName(e.target.value)}
                    className="text-xl font-bold text-slate-900 border-b-2 border-emerald-500 outline-none px-1"
                    autoFocus
                  />
                  <button onClick={handleRenameCollection} className="text-xs font-bold text-emerald-600 hover:underline">Save</button>
                  <button onClick={() => setIsEditingTitle(false)} className="text-xs font-bold text-slate-400 hover:underline">Cancel</button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{collection.name}</h1>
                  <button onClick={() => setIsEditingTitle(true)} className="text-slate-400 hover:text-slate-700 p-1" title="Rename">
                    <Edit3 size={16} />
                  </button>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1 ml-13">{collection.description || 'Enterprise spatial data source repository.'}</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Saved View Selector */}
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <Bookmark size={14} className="text-emerald-600" />
              <select
                value={activeViewId}
                onChange={(e) => setActiveViewId(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
              >
                <option value="default">Default View</option>
                {savedViews.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
              <button
                onClick={() => setIsSaveViewOpen(true)}
                className="text-[10px] font-extrabold text-emerald-600 hover:underline pl-1"
              >
                + Save View
              </button>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
              <div>Records: <span className="font-bold text-slate-900">{records.length}</span></div>
              <div className="h-4 w-px bg-slate-200"></div>
              <div>Fields: <span className="font-bold text-slate-900">{fields.length}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── ACTION TOOLBAR ───────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search records in workspace..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-64 rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-xs font-medium outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {selectedRecordIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex h-10 items-center gap-2 rounded-xl bg-red-50 text-red-700 border border-red-200 px-4 text-xs font-bold transition hover:bg-red-100"
            >
              <Trash2 size={14} /> Delete Selected ({selectedRecordIds.length})
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 p-1 bg-slate-50">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md ${viewMode === 'table' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Grid size={16} />
            </button>
          </div>

          <button
            onClick={() => { setValidationError(null); setIsAddRecordOpen(true); }}
            className="flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700"
          >
            <Plus size={16} /> Add Record
          </button>
        </div>
      </div>

      {/* ─── DATA TABLE / GRID VIEW ───────── */}
      <div className="flex-1 overflow-auto">
        {filteredRecords.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-slate-400 flex-col rounded-2xl border border-slate-200 bg-white">
            <FileText size={48} className="mb-4 opacity-40" />
            <p className="text-sm font-semibold">No records in this workspace</p>
            <button onClick={() => setIsAddRecordOpen(true)} className="mt-3 text-xs font-bold text-emerald-600 hover:underline">+ Add First Record</button>
          </div>
        ) : viewMode === 'table' ? (
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3.5 w-10">
                    <input
                      type="checkbox"
                      checked={selectedRecordIds.length === filteredRecords.length && filteredRecords.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedRecordIds(filteredRecords.map(r => r.id));
                        else setSelectedRecordIds([]);
                      }}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </th>
                  <th className="px-4 py-3.5 font-bold">Record Name</th>
                  <th className="px-4 py-3.5 font-bold">Status</th>
                  {fields.map(f => (
                    <th key={f.key} className="px-4 py-3.5 font-bold">{f.name}</th>
                  ))}
                  <th className="px-4 py-3.5 font-bold">Created</th>
                  <th className="px-4 py-3.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map(rec => (
                  <tr
                    key={rec.id}
                    onClick={() => setActiveRecord(rec)}
                    className="hover:bg-slate-50 transition cursor-pointer"
                  >
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedRecordIds.includes(rec.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedRecordIds([...selectedRecordIds, rec.id]);
                          else setSelectedRecordIds(selectedRecordIds.filter(id => id !== rec.id));
                        }}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">{rec.name}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        {rec.status}
                      </span>
                    </td>
                    {fields.map(f => (
                      <td key={f.key} className="px-4 py-3 text-slate-600 truncate max-w-xs">
                        {String(rec.data?.[f.key] ?? '—')}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-slate-400">{new Date(rec.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => handleDeleteRecord(rec.id)}
                        className="text-slate-400 hover:text-red-600 transition p-1"
                        title="Delete Record"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecords.map(rec => (
              <div
                key={rec.id}
                onClick={() => setActiveRecord(rec)}
                className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs hover:border-emerald-300 hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-slate-900 truncate">{rec.name}</h3>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">{rec.status}</span>
                  </div>
                  <div className="space-y-1 mt-3">
                    {fields.slice(0, 3).map(f => (
                      <div key={f.key} className="flex justify-between text-xs">
                        <span className="text-slate-400 font-medium">{f.name}:</span>
                        <span className="font-semibold text-slate-700 truncate max-w-[150px]">{String(rec.data?.[f.key] ?? '—')}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>{new Date(rec.created_at).toLocaleDateString()}</span>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteRecord(rec.id); }} className="hover:text-red-600">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── ADD RECORD DRAWER / MODAL ───────── */}
      {isAddRecordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
              <h2 className="text-base font-bold text-slate-900">Add New Workspace Record</h2>
              <button onClick={() => setIsAddRecordOpen(false)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateRecord} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {validationError && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-800 border border-rose-200">
                  <AlertCircle size={16} />
                  <span>{validationError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Record Name *</label>
                <input
                  type="text"
                  required
                  value={newRecordName}
                  onChange={(e) => setNewRecordName(e.target.value)}
                  placeholder="e.g. Compressor Specification Record #1"
                  className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-semibold outline-none focus:border-emerald-500"
                />
              </div>

              {fields.map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                    {f.name} {f.required && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type={f.type === 'Number' ? 'number' : f.type === 'Date' ? 'date' : 'text'}
                    value={newRecordData[f.key] || ''}
                    onChange={(e) => setNewRecordData({ ...newRecordData, [f.key]: e.target.value })}
                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-semibold outline-none focus:border-emerald-500"
                  />
                </div>
              ))}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsAddRecordOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs">Save Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── SAVE VIEW MODAL ───────── */}
      {isSaveViewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white shadow-2xl p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-2">Save Custom View</h3>
            <p className="text-xs text-slate-500 mb-4">Save your current columns and layout filters for easy team reuse.</p>
            <form onSubmit={handleSaveView} className="space-y-4">
              <input
                type="text"
                required
                value={newViewName}
                onChange={(e) => setNewViewName(e.target.value)}
                placeholder="View Name (e.g. Approved Specs)"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-emerald-500 outline-none"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsSaveViewOpen(false)} className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── RECORD DETAIL DRAWER ───────── */}
      {activeRecord && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white border-l border-slate-200 shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-300">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 truncate">{isEditingRecord ? 'Edit Record' : activeRecord.name}</h2>
            <button onClick={() => { setActiveRecord(null); setIsEditingRecord(false); }} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
          </div>

          {isEditingRecord ? (
            <form onSubmit={handleSaveEditRecord} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Record Name *</label>
                <input
                  type="text"
                  required
                  value={editRecordName}
                  onChange={(e) => setEditRecordName(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-semibold outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Status</label>
                <select
                  value={editRecordStatus}
                  onChange={(e) => setEditRecordStatus(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500"
                >
                  <option value="Active">Active</option>
                  <option value="In Review">In Review</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>

              <div className="space-y-3 pt-2">
                <span className="text-slate-400 font-bold uppercase block mb-1">Attributes</span>
                {fields.map(f => (
                  <div key={f.key}>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">{f.name}</label>
                    <input
                      type={f.type === 'Number' ? 'number' : f.type === 'Date' ? 'date' : 'text'}
                      value={editRecordData[f.key] || ''}
                      onChange={(e) => setEditRecordData({ ...editRecordData, [f.key]: e.target.value })}
                      className="h-9 w-full rounded-xl border border-slate-200 px-3 text-xs font-medium outline-none focus:border-emerald-500"
                    />
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-2 justify-end">
                <button type="button" onClick={() => setIsEditingRecord(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs">Save Changes</button>
              </div>
            </form>
          ) : (
            <div className="space-y-6 text-xs">
              <div>
                <span className="text-slate-400 font-bold uppercase block mb-1">Status</span>
                <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 font-bold text-emerald-700">{activeRecord.status}</span>
              </div>

              <div>
                <span className="text-slate-400 font-bold uppercase block mb-2">Record Attributes</span>
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  {fields.map(f => (
                    <div key={f.key} className="flex justify-between border-b border-slate-200/60 pb-2 last:border-0 last:pb-0">
                      <span className="font-bold text-slate-500">{f.name}:</span>
                      <span className="font-semibold text-slate-800">{String(activeRecord.data?.[f.key] ?? '—')}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-bold uppercase block mb-1">System Audit</span>
                <p className="text-slate-500">Created: {new Date(activeRecord.created_at).toLocaleString()}</p>
                <p className="text-slate-500">Last Modified: {new Date(activeRecord.updated_at).toLocaleString()}</p>
              </div>

              <div className="pt-6 border-t border-slate-100 flex gap-3">
                <button
                  onClick={() => handleStartEditRecord(activeRecord)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-bold text-xs hover:bg-slate-100 transition"
                >
                  Edit Attributes
                </button>
                <button
                  onClick={() => handleDeleteRecord(activeRecord.id)}
                  className="flex-1 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-700 font-bold text-xs hover:bg-red-100 transition"
                >
                  Delete Record
                </button>
              </div>
            </div>
          )}
        </div>
      )}


      {/* MODALS */}
      {collection && (
        <>
          <VaultSchemaModal
            collection={collection}
            isOpen={isSchemaModalOpen}
            onClose={() => setIsSchemaModalOpen(false)}
            onSave={(updated) => setCollection(updated)}
          />
          <VaultImportModal
            collection={collection}
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            onImportComplete={handleImportRecords}
          />
          <VaultExportModal
            collectionName={collection.name}
            records={filteredRecords}
            isOpen={isExportModalOpen}
            onClose={() => setIsExportModalOpen(false)}
          />
          <VaultShareModal
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            resourceType="dataset"
            resourceId={collection.id}
            resourceName={collection.name}
          />
        </>
      )}
    </div>
  );
}
