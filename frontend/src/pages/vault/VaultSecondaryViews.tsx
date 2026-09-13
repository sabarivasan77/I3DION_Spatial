import { Folder, FileText, Settings, Cpu, Trash2, Share2, Plus } from 'lucide-react';

export function VaultCollections() {
  return (
    <div className="mx-auto max-w-7xl h-full flex flex-col animate-in fade-in duration-300">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Collections</h1>
        <button className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 transition">
          <Plus size={16} /> New Collection
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { name: 'Industrial Products', count: '124 assets', color: 'text-blue-600', bg: 'bg-blue-100' },
          { name: 'Marketing Assets', count: '66 assets', color: 'text-emerald-600', bg: 'bg-emerald-100' },
          { name: 'Product Renders', count: '14 assets', color: 'text-indigo-600', bg: 'bg-indigo-100' },
          { name: 'Technical Docs', count: '32 assets', color: 'text-amber-600', bg: 'bg-amber-100' },
        ].map(c => (
          <div key={c.name} className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-emerald-300 hover:shadow-md transition">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl mb-4 ${c.bg}`}>
              <Folder size={24} className={c.color} />
            </div>
            <h3 className="text-sm font-bold text-slate-900">{c.name}</h3>
            <p className="text-xs text-slate-500 mt-1">{c.count}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function VaultTemplates() {
  return (
    <div className="mx-auto max-w-7xl h-full flex flex-col animate-in fade-in duration-300">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Templates</h1>
        <button className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 transition">
          <Plus size={16} /> New Template
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { name: 'Product Information', fields: '5 fields' },
          { name: 'Technical Specification', fields: '8 fields' },
          { name: 'Marketing Asset', fields: '6 fields' },
          { name: 'Spare Parts Template', fields: '12 fields' },
        ].map(t => (
          <div key={t.name} className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-emerald-300 transition">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <FileText size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">{t.name}</h3>
                <p className="text-xs text-slate-500">{t.fields}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 rounded-lg border border-slate-200 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">Edit</button>
              <button className="flex-1 rounded-lg border border-slate-200 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">Assign</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function VaultProcessing() {
  return (
    <div className="mx-auto max-w-7xl h-full flex flex-col animate-in fade-in duration-300">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Processing Center</h1>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-center h-64 flex-col text-slate-500">
          <Cpu size={48} className="mb-4 opacity-50" />
          <p className="text-sm font-semibold">No active processing tasks</p>
        </div>
      </div>
    </div>
  );
}

export function VaultTrash() {
  return (
    <div className="mx-auto max-w-7xl h-full flex flex-col animate-in fade-in duration-300">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Trash</h1>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-center h-64 flex-col text-slate-500">
          <Trash2 size={48} className="mb-4 opacity-50" />
          <p className="text-sm font-semibold">Trash is empty</p>
        </div>
      </div>
    </div>
  );
}

export function VaultShared() {
  return (
    <div className="mx-auto max-w-7xl h-full flex flex-col animate-in fade-in duration-300">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Shared With Me</h1>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-center h-64 flex-col text-slate-500">
          <Share2 size={48} className="mb-4 opacity-50" />
          <p className="text-sm font-semibold">No assets have been shared with you</p>
        </div>
      </div>
    </div>
  );
}

export function VaultSettings() {
  return (
    <div className="mx-auto max-w-7xl h-full flex flex-col animate-in fade-in duration-300">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Vault Settings</h1>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm max-w-3xl">
        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <Settings size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Workspace</h3>
              <p className="text-xs text-slate-500 mb-3">Manage your workspace settings and preferences.</p>
              <button className="rounded-lg border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Configure</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
