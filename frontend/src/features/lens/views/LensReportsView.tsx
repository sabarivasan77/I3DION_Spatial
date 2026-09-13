import React, { useState } from 'react';
import { useLensStore } from '../store/useLensStore';
import { FileText, Download, Plus, Trash2, CheckCircle2, X } from 'lucide-react';

export const LensReportsView: React.FC = () => {
  const { reports, createReport, deleteReport } = useLensStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [format, setFormat] = useState<'PDF' | 'CSV' | 'JSON' | 'Excel'>('PDF');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createReport({
      title: title.trim(),
      datasetName: 'Vault Leads & Intelligence',
      format,
      dateRange: 'Last 30 Days',
      metricsCount: 10,
      createdBy: 'John Doe',
      fileSize: '1.8 MB'
    });

    setTitle('');
    setShowCreateModal(false);
  };

  const handleDownload = (reportTitle: string, fmt: string) => {
    const dummyContent = `I3DION Spatial Lens Report - ${reportTitle}\nFormat: ${fmt}\nGenerated: ${new Date().toISOString()}`;
    const blob = new Blob([dummyContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${reportTitle.toLowerCase().replace(/\s+/g, '_')}.${fmt.toLowerCase()}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto font-sans select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Executive Reports & Data Export</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Generate, preview, and download structured intelligence reports from Vault.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 bg-[#F4B400] hover:bg-[#D97706] text-slate-950 font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition active:scale-95 shrink-0"
        >
          <Plus size={16} />
          <span>Generate New Report</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((rep) => (
          <div key={rep.id} className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs space-y-4 hover:shadow-md transition">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-[#D97706] flex items-center justify-center font-bold">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm leading-snug">{rep.title}</h3>
                  <span className="text-[10px] text-slate-400 font-medium block mt-0.5">{rep.datasetName}</span>
                </div>
              </div>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                {rep.format}
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs font-semibold text-slate-600 space-y-1">
              <div className="flex justify-between">
                <span>Date Range:</span> <span className="text-slate-900">{rep.dateRange}</span>
              </div>
              <div className="flex justify-between">
                <span>File Size:</span> <span className="text-slate-900">{rep.fileSize}</span>
              </div>
              <div className="flex justify-between">
                <span>Created By:</span> <span className="text-slate-900">{rep.createdBy}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => deleteReport(rep.id)}
                className="text-xs font-bold text-slate-400 hover:text-rose-600"
              >
                Delete
              </button>
              <button
                onClick={() => handleDownload(rep.title, rep.format)}
                className="flex items-center gap-1.5 bg-[#F4B400] hover:bg-[#D97706] text-slate-950 font-bold text-xs px-3.5 py-1.5 rounded-xl transition shadow-2xs"
              >
                <Download size={13} />
                <span>Download Report</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200 text-xs font-medium">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-extrabold text-slate-900 text-sm">Generate Executive Report</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Report Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q3 Regional Lead Performance"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-[#F4B400]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Export Format</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-[#F4B400]"
                >
                  <option value="PDF">PDF Executive Summary</option>
                  <option value="CSV">CSV Data Export</option>
                  <option value="Excel">Excel Spreadsheet</option>
                  <option value="JSON">JSON Telemetry Payload</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#F4B400] text-slate-950 font-bold shadow-sm"
                >
                  Generate Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
