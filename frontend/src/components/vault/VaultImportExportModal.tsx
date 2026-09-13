import React, { useState } from 'react';
import { X, UploadCloud, Download, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { VaultCollection, VaultRecord } from '../../api/vaultApi';

interface ImportModalProps {
  collection: VaultCollection;
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (records: any[]) => void;
}

export function VaultImportModal({ collection, isOpen, onClose, onImportComplete }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setError('');

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          if (selected.name.endsWith('.json')) {
            const data = JSON.parse(content);
            const arrayData = Array.isArray(data) ? data : [data];
            setParsedData(arrayData);
            autoMapFields(arrayData[0] || {});
            setStep(2);
          } else if (selected.name.endsWith('.csv')) {
            const lines = content.split('\n').filter(l => l.trim());
            if (lines.length === 0) throw new Error('Empty CSV file');
            const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
            const rows = lines.slice(1).map(line => {
              const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
              const obj: Record<string, string> = {};
              headers.forEach((h, i) => { obj[h] = values[i] || ''; });
              return obj;
            });
            setParsedData(rows);
            autoMapFields(rows[0] || {});
            setStep(2);
          } else {
            setError('Unsupported file format. Please upload .csv or .json');
          }
        } catch (err: any) {
          setError('Failed to parse file: ' + err.message);
        }
      };
      reader.readAsText(selected);
    }
  };

  const autoMapFields = (sampleRow: Record<string, any>) => {
    const mapping: Record<string, string> = {};
    const sampleKeys = Object.keys(sampleRow);
    
    collection.schema_fields.forEach(f => {
      const match = sampleKeys.find(k => k.toLowerCase() === f.name.toLowerCase() || k.toLowerCase() === f.key.toLowerCase());
      if (match) mapping[f.key] = match;
    });

    // Name default
    if (!mapping['name']) {
      const nameMatch = sampleKeys.find(k => k.toLowerCase().includes('name') || k.toLowerCase().includes('title'));
      if (nameMatch) mapping['name'] = nameMatch;
    }

    setFieldMapping(mapping);
  };

  const executeImport = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const importedRecords = parsedData.map(row => {
        const customData: Record<string, any> = {};
        let recordName = row[fieldMapping['name']] || row['name'] || row['Name'] || 'Imported Record';

        collection.schema_fields.forEach(f => {
          const mappedKey = fieldMapping[f.key];
          if (mappedKey && row[mappedKey] !== undefined) {
            customData[f.key] = row[mappedKey];
          }
        });

        return {
          name: recordName,
          data: customData,
          status: 'Active'
        };
      });

      onImportComplete(importedRecords);
      setIsProcessing(false);
      setStep(3);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in fade-in duration-200">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <UploadCloud size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Import Data Workspace Dataset</h2>
              <p className="text-xs text-slate-500">Import records into {collection.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700 flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-2xl p-10 bg-slate-50/50 hover:border-emerald-500 transition">
              <FileText size={48} className="text-slate-400 mb-4" />
              <p className="text-sm font-bold text-slate-800">Select CSV or JSON file to import</p>
              <p className="text-xs text-slate-500 mt-1 mb-6">Supports UTF-8 formatted CSV or JSON array</p>
              <label className="cursor-pointer rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition">
                Browse Files
                <input type="file" accept=".csv,.json" onChange={handleFileChange} className="hidden" />
              </label>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 p-3 rounded-xl text-xs font-semibold text-emerald-800">
                <span>File: {file?.name}</span>
                <span>{parsedData.length} records detected</span>
              </div>

              <h3 className="text-xs font-bold uppercase text-slate-400">Map File Columns to Schema Fields</h3>

              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {collection.schema_fields.map(f => (
                  <div key={f.key} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">{f.name}</span>
                      <span className="text-[10px] text-slate-400">({f.type})</span>
                      {f.required && <span className="text-[10px] font-bold text-red-500">*Required</span>}
                    </div>
                    <select
                      value={fieldMapping[f.key] || ''}
                      onChange={(e) => setFieldMapping({ ...fieldMapping, [f.key]: e.target.value })}
                      className="h-8 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 outline-none focus:border-emerald-500"
                    >
                      <option value="">-- Ignore Field --</option>
                      {Object.keys(parsedData[0] || {}).map(k => (
                        <option key={k} value={k}>{k}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle size={36} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Import Successful!</h3>
              <p className="text-xs text-slate-500">{parsedData.length} records processed into {collection.name}.</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4 bg-slate-50">
          <button onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition">
            {step === 3 ? 'Close' : 'Cancel'}
          </button>
          {step === 2 && (
            <button
              onClick={executeImport}
              disabled={isProcessing}
              className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {isProcessing ? 'Importing...' : `Import ${parsedData.length} Records`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface ExportModalProps {
  collectionName: string;
  records: VaultRecord[];
  isOpen: boolean;
  onClose: () => void;
}

export function VaultExportModal({ collectionName, records, isOpen, onClose }: ExportModalProps) {
  const [format, setFormat] = useState<'csv' | 'json'>('csv');

  if (!isOpen) return null;

  const handleExport = () => {
    let content = '';
    let mimeType = 'text/csv';
    let extension = 'csv';

    if (format === 'json') {
      content = JSON.stringify(records, null, 2);
      mimeType = 'application/json';
      extension = 'json';
    } else {
      if (records.length > 0) {
        const headers = ['id', 'name', 'status', 'created_at', ...Object.keys(records[0].data || {})];
        const csvRows = [headers.join(',')];
        records.forEach(r => {
          const values = headers.map(h => {
            let val = (r as any)[h] !== undefined ? (r as any)[h] : r.data[h];
            if (typeof val === 'object') val = JSON.stringify(val);
            return `"${String(val || '').replace(/"/g, '""')}"`;
          });
          csvRows.push(values.join(','));
        });
        content = csvRows.join('\n');
      }
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${collectionName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_export.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Download size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Export Dataset</h2>
              <p className="text-xs text-slate-500">{records.length} records selected</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Export Format</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setFormat('csv')}
                className={`p-4 rounded-xl border text-center font-bold text-xs transition ${
                  format === 'csv' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                CSV File (.csv)
              </button>
              <button
                onClick={() => setFormat('json')}
                className={`p-4 rounded-xl border text-center font-bold text-xs transition ${
                  format === 'json' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                JSON Package (.json)
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4 bg-slate-50">
          <button onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition">
            Cancel
          </button>
          <button
            onClick={handleExport}
            className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
          >
            Download Export
          </button>
        </div>
      </div>
    </div>
  );
}
