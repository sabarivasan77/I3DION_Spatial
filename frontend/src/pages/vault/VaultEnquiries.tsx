import { useState, useEffect } from 'react';
import {
  Inbox,
  Search,
  Filter,
  CheckCircle2,
  Mail,
  User,
  Building,
  Phone,
  ChevronRight,
  X
} from 'lucide-react';
import { vaultApi, VaultEnquiry } from '../../api/vaultApi';

export default function VaultEnquiries() {
  const [enquiries, setEnquiries] = useState<VaultEnquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [activeEnquiry, setActiveEnquiry] = useState<VaultEnquiry | null>(null);

  useEffect(() => {
    loadEnquiries();
  }, [search, sourceFilter, statusFilter]);

  const loadEnquiries = async () => {
    setIsLoading(true);
    try {
      const data = await vaultApi.getEnquiries({
        search,
        source_application: sourceFilter === 'All' ? undefined : sourceFilter,
        status: statusFilter === 'All' ? undefined : statusFilter
      });
      setEnquiries(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load enquiries', err);
      setEnquiries([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: VaultEnquiry['status']) => {
    try {
      const updated = await vaultApi.updateEnquiry(id, { status: newStatus });
      setEnquiries(enquiries.map(e => e.id === id ? updated : e));
      if (activeEnquiry?.id === id) setActiveEnquiry(updated);
    } catch (err) {
      console.error('Failed to update enquiry status', err);
    }
  };

  const sources = ['All', 'Spatial Hub', 'OmniStudio', 'Spatial Engine', 'Spatial Lens'];
  const statuses = ['All', 'New', 'In Progress', 'Contacted', 'Qualified', 'Closed'];

  return (
    <div className="mx-auto max-w-7xl h-full flex flex-col space-y-6 animate-in fade-in duration-300 select-none pb-8">
      {/* ─── HEADER ───────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Ecosystem Enquiry Inbox</h1>
          <p className="text-xs text-slate-500 mt-1">Authoritative lead & enquiry records generated across Hub, OmniStudio, Engine, and Lens.</p>
        </div>
      </div>

      {/* ─── FILTER BAR ───────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search customer name, email, company, message..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs font-semibold outline-none focus:border-emerald-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
            <Filter size={14} className="text-slate-400" />
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="bg-transparent font-bold text-slate-700 outline-none cursor-pointer"
            >
              <option value="All">All Sources</option>
              {sources.filter(s => s !== 'All').map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent font-bold text-slate-700 outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              {statuses.filter(st => st !== 'All').map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ─── MAIN CONTENT ───────── */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs flex-1">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center text-slate-400 font-bold">Loading enquiries...</div>
        ) : enquiries.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-slate-400">
            <Inbox size={48} className="mb-4 opacity-30 text-emerald-600" />
            <p className="text-sm font-bold text-slate-700">No enquiries recorded yet</p>
            <p className="text-xs text-slate-400 mt-1">Leads captured across your Hub catalogs and 3D experiences will appear here.</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">Customer / Company</th>
                <th className="px-4 py-3.5">Source App</th>
                <th className="px-4 py-3.5">Product Link</th>
                <th className="px-4 py-3.5">Priority</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Received</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {enquiries.map(enq => (
                <tr
                  key={enq.id}
                  onClick={() => setActiveEnquiry(enq)}
                  className="hover:bg-slate-50 cursor-pointer transition"
                >
                  <td className="px-4 py-3">
                    <span className="font-bold text-slate-900 block">{enq.customer_name}</span>
                    <span className="text-[11px] text-slate-400">{enq.email} {enq.company ? `• ${enq.company}` : ''}</span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-700">
                    <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                      {enq.source_application}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-emerald-600 truncate max-w-xs">{enq.product_name || 'General Inquiry'}</td>
                  <td className="px-4 py-3 font-bold">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      enq.priority === 'Urgent' ? 'bg-red-100 text-red-700' :
                      enq.priority === 'High' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {enq.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      enq.status === 'New' ? 'bg-emerald-100 text-emerald-700' :
                      enq.status === 'Closed' ? 'bg-slate-100 text-slate-500' : 'bg-blue-100 text-blue-700'
                    }`}>
                      <CheckCircle2 size={12} /> {enq.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{new Date(enq.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-600 hover:underline">
                    View Lead <ChevronRight size={14} className="inline" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ─── ENQUIRY DETAIL DRAWER ───────── */}
      {activeEnquiry && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white border-l border-slate-200 shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-300 text-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">Enquiry Lead Record</h2>
            <button onClick={() => setActiveEnquiry(null)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-slate-400 font-bold uppercase block mb-1">Customer Identity</span>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-slate-800 font-bold">
                  <User size={15} className="text-emerald-600" /> {activeEnquiry.customer_name}
                </div>
                <div className="flex items-center gap-2 text-slate-600 font-medium">
                  <Mail size={15} className="text-slate-400" /> {activeEnquiry.email}
                </div>
                {activeEnquiry.company && (
                  <div className="flex items-center gap-2 text-slate-600 font-medium">
                    <Building size={15} className="text-slate-400" /> {activeEnquiry.company}
                  </div>
                )}
                {activeEnquiry.phone && (
                  <div className="flex items-center gap-2 text-slate-600 font-medium">
                    <Phone size={15} className="text-slate-400" /> {activeEnquiry.phone}
                  </div>
                )}
              </div>
            </div>

            <div>
              <span className="text-slate-400 font-bold uppercase block mb-1">Message Payload</span>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-700 leading-relaxed font-medium">
                {activeEnquiry.message || 'No message provided.'}
              </div>
            </div>

            <div>
              <span className="text-slate-400 font-bold uppercase block mb-1">Lead Lifecycle Status</span>
              <select
                value={activeEnquiry.status}
                onChange={(e) => handleUpdateStatus(activeEnquiry.id, e.target.value as any)}
                className="h-10 w-full rounded-xl border border-slate-200 px-3 font-bold text-slate-800 outline-none focus:border-emerald-500"
              >
                <option value="New">New</option>
                <option value="In Progress">In Progress</option>
                <option value="Contacted">Contacted</option>
                <option value="Qualified">Qualified</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-1 text-slate-400">
              <p>Source App: <span className="font-bold text-slate-700">{activeEnquiry.source_application}</span></p>
              <p>Received: <span className="font-bold text-slate-700">{new Date(activeEnquiry.created_at).toLocaleString()}</span></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
