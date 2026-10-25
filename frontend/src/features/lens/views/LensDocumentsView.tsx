import React, { useState, useEffect } from 'react';
import { useLensStore } from '../store/useLensStore';
import { CrmDocument } from '../types/lensTypes';
import {
  FileText,
  Plus,
  Search,
  Download,
  FileCode,
  FileCheck,
  Shield,
  Layers,
  ExternalLink,
  Calendar,
  X,
  Building
} from 'lucide-react';

export const LensDocumentsView: React.FC = () => {
  const {
    documents,
    deals,
    accounts,
    fetchDocuments,
    createDocument
  } = useLensStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isAddDocOpen, setIsAddDocOpen] = useState(false);

  // Form State
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'contract' | 'proposal' | 'nda' | 'tech_spec' | 'brochure'>('proposal');
  const [newFileUrl, setNewFileUrl] = useState('');
  const [newFileSize, setNewFileSize] = useState('2.4 MB');
  const [newDealId, setNewDealId] = useState('');
  const [newAccountId, setNewAccountId] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const filteredDocs = documents.filter((doc) => {
    if (typeFilter !== 'all' && doc.type !== typeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return doc.name.toLowerCase().includes(q) || doc.uploadedBy.toLowerCase().includes(q);
    }
    return true;
  });

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    await createDocument({
      name: newName.trim(),
      type: newType,
      fileUrl: newFileUrl.trim() || `https://storage.i3dion.com/vault/docs/${encodeURIComponent(newName.trim().toLowerCase())}.pdf`,
      fileSize: newFileSize.trim() || '1.8 MB',
      dealId: newDealId || undefined,
      accountId: newAccountId || undefined
    });

    setNewName('');
    setNewFileUrl('');
    setIsAddDocOpen(false);
  };

  const getDocTypeIcon = (type: string) => {
    switch (type) {
      case 'contract':
        return <FileCheck size={20} className="text-emerald-600" />;
      case 'proposal':
        return <FileText size={20} className="text-blue-600" />;
      case 'nda':
        return <Shield size={20} className="text-purple-600" />;
      case 'tech_spec':
        return <FileCode size={20} className="text-amber-600" />;
      default:
        return <Layers size={20} className="text-slate-600" />;
    }
  };

  const getDocTypeBadge = (type: string) => {
    switch (type) {
      case 'contract':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'proposal':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'nda':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'tech_spec':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Enterprise Vault</span>
          <h2 className="text-xl font-black mt-1">Sales Collateral & Commercial Contracts</h2>
          <p className="text-xs text-slate-300 max-w-xl mt-1">
            Centrally governed repository of client proposals, non-disclosure agreements, master service agreements, and technical engineering specifications.
          </p>
        </div>
        <button
          onClick={() => setIsAddDocOpen(true)}
          className="flex items-center gap-1.5 bg-[#F4B400] hover:bg-[#D97706] text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-sm"
        >
          <Plus size={16} />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Main Container */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
        {/* Controls */}
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                typeFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({documents.length})
            </button>
            <button
              onClick={() => setTypeFilter('contract')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                typeFilter === 'contract' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              Contracts
            </button>
            <button
              onClick={() => setTypeFilter('proposal')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                typeFilter === 'proposal' ? 'bg-white text-blue-800 shadow-2xs' : 'text-slate-600 hover:text-blue-700'
              }`}
            >
              Proposals
            </button>
            <button
              onClick={() => setTypeFilter('nda')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                typeFilter === 'nda' ? 'bg-white text-purple-800 shadow-2xs' : 'text-slate-600 hover:text-purple-700'
              }`}
            >
              NDAs
            </button>
            <button
              onClick={() => setTypeFilter('tech_spec')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                typeFilter === 'tech_spec' ? 'bg-white text-amber-800 shadow-2xs' : 'text-slate-600 hover:text-amber-700'
              }`}
            >
              Specs
            </button>
          </div>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#F4B400] w-64"
            />
          </div>
        </div>

        {/* Documents Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 text-xs font-medium">
              No sales documents found matching your filter criteria.
            </div>
          ) : (
            filteredDocs.map((doc) => {
              const linkedDeal = deals.find((d) => d.id === doc.dealId);
              const linkedAccount = accounts.find((a) => a.id === doc.accountId);

              return (
                <div
                  key={doc.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs hover:shadow-md hover:border-amber-300 transition space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center shrink-0">
                        {getDocTypeIcon(doc.type)}
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${getDocTypeBadge(doc.type)}`}>
                        {doc.type.replace('_', ' ')}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs font-black text-slate-900 line-clamp-1">{doc.name}</h4>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">{doc.fileSize}</p>
                    </div>

                    <div className="text-[11px] text-slate-500 space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      {linkedDeal && (
                        <div className="truncate font-semibold text-amber-900">
                          Deal: {linkedDeal.name}
                        </div>
                      )}
                      {linkedAccount && !linkedDeal && (
                        <div className="truncate font-semibold text-slate-700">
                          Account: {linkedAccount.name}
                        </div>
                      )}
                      <div className="text-slate-400">
                        Uploaded by <strong className="text-slate-600">{doc.uploadedBy}</strong> on{' '}
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
                    >
                      <ExternalLink size={12} />
                      <span>Preview</span>
                    </a>
                    <a
                      href={doc.fileUrl}
                      download={doc.name}
                      className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition"
                    >
                      <Download size={12} />
                      <span>Download</span>
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Upload Document Modal */}
      {isAddDocOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Upload Sales Collateral</h3>
              <button
                onClick={() => setIsAddDocOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateDocument} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Services Agreement - Apex 2026.pdf"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-900 focus:outline-none focus:border-[#F4B400] focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Document Category</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:outline-none focus:border-[#F4B400] focus:bg-white"
                  >
                    <option value="contract">Commercial Contract</option>
                    <option value="proposal">Sales Proposal</option>
                    <option value="nda">Mutual NDA</option>
                    <option value="tech_spec">Technical Spec Sheet</option>
                    <option value="brochure">Marketing Brochure</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">File Size</label>
                  <input
                    type="text"
                    placeholder="e.g. 3.2 MB"
                    value={newFileSize}
                    onChange={(e) => setNewFileSize(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-900 focus:outline-none focus:border-[#F4B400] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Link to Deal (Optional)</label>
                <select
                  value={newDealId}
                  onChange={(e) => setNewDealId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-900 focus:outline-none focus:border-[#F4B400] focus:bg-white"
                >
                  <option value="">No deal linked</option>
                  {deals.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} (${Number(d.value).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Link to Account (Optional)</label>
                <select
                  value={newAccountId}
                  onChange={(e) => setNewAccountId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-900 focus:outline-none focus:border-[#F4B400] focus:bg-white"
                >
                  <option value="">No account linked</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Direct Storage URL (Optional)</label>
                <input
                  type="text"
                  placeholder="https://storage.i3dion.com/vault/..."
                  value={newFileUrl}
                  onChange={(e) => setNewFileUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-900 focus:outline-none focus:border-[#F4B400] focus:bg-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddDocOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#F4B400] hover:bg-[#D97706] text-slate-950 font-bold transition shadow-2xs"
                >
                  Save to Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
