import React, { useState, useEffect } from 'react';
import { useLensStore } from '../store/useLensStore';
import { CrmEnquiry } from '../types/lensTypes';
import {
  HelpCircle,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  Building,
  Tag,
  MessageSquare,
  X,
  FileCheck2,
  SlidersHorizontal
} from 'lucide-react';

export const LensEnquiriesView: React.FC = () => {
  const {
    enquiries,
    accounts,
    fetchEnquiries,
    createEnquiry,
    updateEnquiryStatus
  } = useLensStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Resolution Modal
  const [resolvingEnquiry, setResolvingEnquiry] = useState<CrmEnquiry | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  // Create Modal
  const [isAddEnquiryOpen, setIsAddEnquiryOpen] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState<'technical' | 'pricing' | 'asset_request' | 'integration' | 'general'>('technical');
  const [newPriority, setNewPriority] = useState<'urgent' | 'high' | 'medium' | 'low'>('medium');
  const [newContactName, setNewContactName] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newAccountId, setNewAccountId] = useState('');

  useEffect(() => {
    fetchEnquiries();
  }, [fetchEnquiries]);

  const openCount = enquiries.filter((e) => e.status === 'open').length;
  const inProgressCount = enquiries.filter((e) => e.status === 'in_progress').length;
  const resolvedCount = enquiries.filter((e) => e.status === 'resolved').length;

  const filteredEnquiries = enquiries.filter((e) => {
    if (statusFilter !== 'all' && e.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
    if (priorityFilter !== 'all' && e.priority !== priorityFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        e.subject.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        (e.contactName && e.contactName.toLowerCase().includes(q)) ||
        (e.contactEmail && e.contactEmail.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleCreateEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newDescription.trim()) return;

    await createEnquiry({
      subject: newSubject.trim(),
      description: newDescription.trim(),
      category: newCategory,
      priority: newPriority,
      contactName: newContactName.trim() || undefined,
      contactEmail: newContactEmail.trim() || undefined,
      accountId: newAccountId || undefined
    });

    setNewSubject('');
    setNewDescription('');
    setNewContactName('');
    setNewContactEmail('');
    setIsAddEnquiryOpen(false);
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingEnquiry) return;

    await updateEnquiryStatus(resolvingEnquiry.id, 'resolved', resolutionNotes.trim());
    setResolvingEnquiry(null);
    setResolutionNotes('');
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'urgent':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'high':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'open':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'in_progress':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'resolved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Enquiries</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{enquiries.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <HelpCircle size={20} />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-500">Open Tickets</span>
            <p className="text-2xl font-black text-blue-600 mt-1">{openCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <Clock size={20} />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500">In Progress</span>
            <p className="text-2xl font-black text-amber-600 mt-1">{inProgressCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <SlidersHorizontal size={20} />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-500">Resolved</span>
            <p className="text-2xl font-black text-emerald-600 mt-1">{resolvedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
        {/* Controls */}
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({enquiries.length})
            </button>
            <button
              onClick={() => setStatusFilter('open')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                statusFilter === 'open' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-blue-700'
              }`}
            >
              Open ({openCount})
            </button>
            <button
              onClick={() => setStatusFilter('in_progress')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                statusFilter === 'in_progress' ? 'bg-white text-amber-700 shadow-2xs' : 'text-slate-600 hover:text-amber-700'
              }`}
            >
              In Progress ({inProgressCount})
            </button>
            <button
              onClick={() => setStatusFilter('resolved')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                statusFilter === 'resolved' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              Resolved ({resolvedCount})
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search enquiries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#F4B400] w-48 sm:w-56"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#F4B400]"
            >
              <option value="all">All Categories</option>
              <option value="technical">Technical</option>
              <option value="pricing">Commercial / Pricing</option>
              <option value="asset_request">3D Asset Request</option>
              <option value="integration">API / Integration</option>
              <option value="general">General</option>
            </select>

            <button
              onClick={() => setIsAddEnquiryOpen(true)}
              className="flex items-center gap-1.5 bg-[#F4B400] hover:bg-[#D97706] text-slate-950 font-bold text-xs px-3.5 py-1.5 rounded-xl transition shadow-2xs"
            >
              <Plus size={15} />
              <span>New Ticket</span>
            </button>
          </div>
        </div>

        {/* List of Enquiries */}
        <div className="divide-y divide-slate-100">
          {filteredEnquiries.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs font-medium">
              No enquiries match the current filters.
            </div>
          ) : (
            filteredEnquiries.map((enquiry) => {
              const account = accounts.find((a) => a.id === enquiry.accountId);

              return (
                <div key={enquiry.id} className="p-4 hover:bg-slate-50/70 transition space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900">{enquiry.subject}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(enquiry.status)} capitalize`}>
                          {enquiry.status.replace('_', ' ')}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPriorityBadge(enquiry.priority)} capitalize`}>
                          {enquiry.priority}
                        </span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold capitalize">
                          {enquiry.category.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2">{enquiry.description}</p>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {enquiry.status !== 'resolved' && (
                        <>
                          {enquiry.status === 'open' && (
                            <button
                              onClick={() => updateEnquiryStatus(enquiry.id, 'in_progress')}
                              className="text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1 rounded-xl transition"
                            >
                              Start Progress
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setResolvingEnquiry(enquiry);
                              setResolutionNotes('');
                            }}
                            className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1 rounded-xl transition flex items-center gap-1"
                          >
                            <CheckCircle2 size={13} />
                            <span>Resolve</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {enquiry.resolutionNotes && (
                    <div className="p-2.5 bg-emerald-50/60 border border-emerald-100 rounded-xl text-xs text-emerald-900">
                      <span className="font-bold text-emerald-800 block text-[11px]">Resolution Details:</span>
                      {enquiry.resolutionNotes}
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-[11px] text-slate-400 font-medium pt-1">
                    <span>Created: {new Date(enquiry.createdAt).toLocaleDateString()}</span>
                    {enquiry.contactName && (
                      <span className="flex items-center gap-1 text-slate-600">
                        <User size={11} /> {enquiry.contactName} ({enquiry.contactEmail})
                      </span>
                    )}
                    {account && (
                      <span className="flex items-center gap-1 text-slate-600">
                        <Building size={11} /> {account.name}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Resolve Modal */}
      {resolvingEnquiry && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Mark Enquiry Resolved</h3>
              <button
                onClick={() => setResolvingEnquiry(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleResolveSubmit} className="space-y-4 text-xs">
              <p className="text-slate-600">
                Resolving: <strong className="text-slate-900">{resolvingEnquiry.subject}</strong>
              </p>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Resolution Summary / Solution *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain how the technical inquiry or request was satisfied..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResolvingEnquiry(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-2xs"
                >
                  Confirm Resolution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Enquiry Modal */}
      {isAddEnquiryOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Create Customer Enquiry</h3>
              <button
                onClick={() => setIsAddEnquiryOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateEnquiry} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Subject *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Inquire on WebXR CAD file ingestion formats"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-900 focus:outline-none focus:border-[#F4B400] focus:bg-white transition"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Detailed customer inquiry..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-900 focus:outline-none focus:border-[#F4B400] focus:bg-white resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:outline-none focus:border-[#F4B400] focus:bg-white"
                  >
                    <option value="technical">Technical</option>
                    <option value="pricing">Commercial / Pricing</option>
                    <option value="asset_request">3D Asset Request</option>
                    <option value="integration">Integration / API</option>
                    <option value="general">General</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:outline-none focus:border-[#F4B400] focus:bg-white"
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Contact Name</label>
                  <input
                    type="text"
                    placeholder="Customer contact"
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-900 focus:outline-none focus:border-[#F4B400] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Contact Email</label>
                  <input
                    type="email"
                    placeholder="contact@customer.com"
                    value={newContactEmail}
                    onChange={(e) => setNewContactEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-900 focus:outline-none focus:border-[#F4B400] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Affiliated Account (Optional)</label>
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

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddEnquiryOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#F4B400] hover:bg-[#D97706] text-slate-950 font-bold transition shadow-2xs"
                >
                  Submit Enquiry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
