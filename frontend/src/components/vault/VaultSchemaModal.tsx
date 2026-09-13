import React, { useState } from 'react';
import { X, Plus, Trash2, ArrowUp, ArrowDown, Settings2, AlertTriangle } from 'lucide-react';
import { vaultApi, VaultCollection, VaultSchemaField } from '../../api/vaultApi';

interface Props {
  collection: VaultCollection;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: VaultCollection) => void;
}

export default function VaultSchemaModal({ collection, isOpen, onClose, onSave }: Props) {
  const [fields, setFields] = useState<VaultSchemaField[]>(collection.schema_fields || []);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const fieldTypes: VaultSchemaField['type'][] = [
    'Text', 'Number', 'Boolean', 'Date', 'File', '3D Model', 'Status', 'Reference', 'Tags'
  ];

  const handleAddField = () => {
    const newKey = `field_${Date.now().toString().slice(-4)}`;
    setFields([
      ...fields,
      { key: newKey, name: `Custom Field ${fields.length + 1}`, type: 'Text', required: false }
    ]);
  };

  const handleUpdateField = (index: number, key: keyof VaultSchemaField, value: any) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], [key]: value };
    // Update key if name changed and key was auto-generated
    if (key === 'name') {
      const sanitizedKey = value.toLowerCase().replace(/[^a-z0-9]/g, '_');
      if (sanitizedKey) updated[index].key = sanitizedKey;
    }
    setFields(updated);
  };

  const handleRemoveField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === fields.length - 1)) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...fields];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setFields(updated);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    try {
      const updatedColl = await vaultApi.updateCollection(collection.id, { schema_fields: fields });
      onSave(updatedColl);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to update schema');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Settings2 size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Schema & Field Management</h2>
              <p className="text-xs text-slate-500">Configure database columns for {collection.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700 flex items-center gap-2">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

          <div className="space-y-3">
            {fields.map((field, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition shadow-2xs">
                <div className="flex items-center gap-1 text-slate-400">
                  <button onClick={() => handleMove(idx, 'up')} disabled={idx === 0} className="p-1 hover:text-slate-700 disabled:opacity-30">
                    <ArrowUp size={14} />
                  </button>
                  <button onClick={() => handleMove(idx, 'down')} disabled={idx === fields.length - 1} className="p-1 hover:text-slate-700 disabled:opacity-30">
                    <ArrowDown size={14} />
                  </button>
                </div>

                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Field Label</label>
                    <input
                      type="text"
                      value={field.name}
                      onChange={(e) => handleUpdateField(idx, 'name', e.target.value)}
                      className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Data Type</label>
                    <select
                      value={field.type}
                      onChange={(e) => handleUpdateField(idx, 'type', e.target.value as any)}
                      className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-500"
                    >
                      {fieldTypes.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Key Name</label>
                    <input
                      type="text"
                      value={field.key}
                      readOnly
                      className="h-9 w-full rounded-lg border border-slate-200 bg-slate-100 px-3 text-xs font-mono text-slate-500 outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-2 sm:pt-0">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.required || false}
                      onChange={(e) => handleUpdateField(idx, 'required', e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    Required
                  </label>

                  <button
                    onClick={() => handleRemoveField(idx)}
                    className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                    title="Remove Field"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleAddField}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-xs font-bold text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 transition"
          >
            <Plus size={16} />
            Add Custom Property Field
          </button>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4 bg-slate-50">
          <button onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition disabled:opacity-50"
          >
            {isSaving ? 'Saving Schema...' : 'Save Schema Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
