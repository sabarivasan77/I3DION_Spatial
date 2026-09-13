import { useState } from 'react';
import { MessageSquare, Send, CheckCircle2, Clock, Filter, Plus } from 'lucide-react';

interface EnquiryItem {
  id: string;
  orgName: string;
  orgAvatar: string;
  query: string;
  productName: string;
  timestamp: string;
  status: 'Open' | 'Replied' | 'Closed';
}

export function HubEnquiriesPage() {
  const [filter, setFilter] = useState<'All' | 'Open' | 'Replied' | 'Closed'>('All');
  const [showNewModal, setShowNewModal] = useState(false);
  const [newOrg, setNewOrg] = useState('I3DION Industrial');
  const [newQuery, setNewQuery] = useState('');

  const [enquiries, setEnquiries] = useState<EnquiryItem[]>([
    {
      id: 'enq_1',
      orgName: 'Vertex Buildings',
      orgAvatar: 'V',
      productName: 'Modular Office Building',
      query: 'Hi, I would like to know more about the modular office building specs and installation timeline.',
      timestamp: '2 hours ago',
      status: 'Open',
    },
    {
      id: 'enq_2',
      orgName: 'I3DION Industrial',
      orgAvatar: 'I3',
      productName: 'Centrifugal Pump X1',
      query: 'Can you share the technical specifications for the pressure valve and impeller tolerances?',
      timestamp: '1 day ago',
      status: 'Replied',
    },
    {
      id: 'enq_3',
      orgName: 'Armoni Design',
      orgAvatar: 'A',
      productName: 'Vortek Lounge Chair',
      query: 'Do you provide customization options for bulk commercial seating orders?',
      timestamp: '2 days ago',
      status: 'Open',
    },
    {
      id: 'enq_4',
      orgName: 'Green Energy',
      orgAvatar: 'G',
      productName: 'Solar Panel System',
      query: 'Interested in the solar panel system for our manufacturing facility.',
      timestamp: '3 days ago',
      status: 'Closed',
    },
  ]);

  const filteredEnquiries = enquiries.filter((e) => (filter === 'All' ? true : e.status === filter));

  const handleCreateEnquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuery.trim()) return;

    const item: EnquiryItem = {
      id: `enq_${Date.now()}`,
      orgName: newOrg,
      orgAvatar: newOrg.slice(0, 2).toUpperCase(),
      productName: 'Custom Product Inquiry',
      query: newQuery.trim(),
      timestamp: 'Just now',
      status: 'Open',
    };

    setEnquiries([item, ...enquiries]);
    setNewQuery('');
    setShowNewModal(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16 pt-6 px-4 md:px-8 select-none">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl bg-white p-6 md:p-8 shadow-2xs border border-slate-200/80">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <MessageSquare size={20} />
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900">Enquiries</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Direct product and experience enquiries sent to verified spatial organizations.
            </p>
          </div>

          <button
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 shadow-sm transition active:scale-95 shrink-0"
          >
            <Plus size={16} />
            New Enquiry
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2">
          {(['All', 'Open', 'Replied', 'Closed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                filter === f
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Enquiries List Matching Screen 6 */}
        <div className="space-y-3">
          {filteredEnquiries.map((e) => (
            <div
              key={e.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs hover:border-slate-300 transition"
            >
              <div className="flex items-start gap-3.5 flex-1 min-w-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0F172A] text-xs font-bold text-white shrink-0">
                  {e.orgAvatar}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{e.orgName}</h3>
                    <span className="text-xs text-slate-400">• {e.productName}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">{e.query}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0 sm:self-center">
                <span className="text-[11px] font-medium text-slate-400">{e.timestamp}</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    e.status === 'Open'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : e.status === 'Replied'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {e.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Modal for New Enquiry */}
        {showNewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
              <h3 className="text-base font-bold text-slate-900 mb-1">Submit Product Enquiry</h3>
              <p className="text-xs text-slate-500 mb-4">Send a direct message to the organization team.</p>

              <form onSubmit={handleCreateEnquiry} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Select Organization</label>
                  <select
                    value={newOrg}
                    onChange={(e) => setNewOrg(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold text-slate-800"
                  >
                    <option value="I3DION Industrial">I3DION Industrial</option>
                    <option value="Vertex Buildings">Vertex Buildings</option>
                    <option value="Armoni Design">Armoni Design</option>
                    <option value="Green Energy">Green Energy</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Enquiry Message</label>
                  <textarea
                    rows={4}
                    value={newQuery}
                    onChange={(e) => setNewQuery(e.target.value)}
                    placeholder="Ask about technical specs, pricing, or custom solutions..."
                    className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewModal(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-sm"
                  >
                    <Send size={14} />
                    Send Enquiry
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
