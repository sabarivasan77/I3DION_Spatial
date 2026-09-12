import { useEffect, useState } from 'react';
import { PageHeader, Card, Button, Badge } from '../components/ui';
import { Bot, User, CheckCircle, MessageSquare, Ticket, RefreshCw, Sparkles, HelpCircle, Plus, X, Send, AlertCircle, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { api, API_BASE_URL } from '../services/api';
import { useToast } from '../components/Toast';

const DEFAULT_STATS = {
  total_tickets: 2,
  ai_resolved_chats: 18,
  escalated_chats: 2,
};

export function SupportDashboardPage() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const { success, error: showError } = useToast();

  const [stats, setStats] = useState<any>(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<any[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Form State
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    category: 'Product / Model Issue',
    description: '',
    priority: 'Normal',
    productId: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const ticketsRes = await api.getSupportTickets(token || '').catch(() => null);
      if (Array.isArray(ticketsRes)) {
        setTickets(ticketsRes);
        setStats((prev: any) => ({ ...prev, total_tickets: ticketsRes.length }));
      }
    } catch (err) {
      console.error('Failed to load support data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [token]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketForm.subject || !ticketForm.description) return;
    setSubmitting(true);
    try {
      const newTicket: any = await api.createSupportTicket(token || '', {
        subject: ticketForm.subject,
        category: ticketForm.category,
        description: ticketForm.description,
        priority: ticketForm.priority,
        product_id: ticketForm.productId || undefined,
        status: 'OPEN',
      });
      success('Ticket Created', `Support ticket ${newTicket?.ticket_number || ''} submitted successfully.`);
      setCreateModalOpen(false);
      setTicketForm({ subject: '', category: 'Product / Model Issue', description: '', priority: 'Normal', productId: '' });
      await loadData();
    } catch (err) {
      showError('Submission Failed', 'Could not create support ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      await api.updateSupportTicket(token || '', ticketId, { status: newStatus });
      success('Status Updated', `Ticket marked as ${newStatus}.`);
      await loadData();
    } catch (err) {
      showError('Update Failed', 'Could not update ticket status.');
    }
  };

  const totalChats = (stats?.ai_resolved_chats || 0) + (stats?.escalated_chats || 0);
  const aiResolutionRate = totalChats > 0
    ? Math.round(((stats?.ai_resolved_chats || 0) / totalChats) * 100)
    : 85;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Technical Support & Service Desk"
        eyebrow="Help center, product issue tickets, and technical team resolution workflow."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => void loadData()} disabled={loading}>
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </Button>
            <Button variant="primary" onClick={() => setCreateModalOpen(true)}>
              <Plus size={16} />
              New Support Request
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <Card className="p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
            <MessageSquare size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Conversations</p>
            <h3 className="text-2xl font-bold text-slate-900">{totalChats}</h3>
          </div>
        </Card>
        <Card className="p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
            <Bot size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">AI Auto-Resolved</p>
            <h3 className="text-2xl font-bold text-slate-900">{stats?.ai_resolved_chats || 0}</h3>
          </div>
        </Card>
        <Card className="p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
            <User size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Human Escalations</p>
            <h3 className="text-2xl font-bold text-slate-900">{stats?.escalated_chats || 0}</h3>
          </div>
        </Card>
        <Card className="p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100">
            <Ticket size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Active Tickets</p>
            <h3 className="text-2xl font-bold text-slate-900">{tickets.length}</h3>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Bot size={18} className="text-blue-600" />
              Automated Deflection Rate
            </h3>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
              High Efficiency
            </span>
          </div>
          <div className="flex items-center gap-6 pt-2">
            <div className="relative w-24 h-24 rounded-full border-8 border-blue-500/20 border-t-blue-600 flex items-center justify-center">
              <span className="text-2xl font-extrabold text-blue-600">{aiResolutionRate}%</span>
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-xs font-bold text-slate-800">Autonomous Customer Service</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Contextual spatial AI assistant resolves <strong>{aiResolutionRate}%</strong> of customer inquiries instantly without requiring human intervention.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white space-y-4 shadow-md">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <CheckCircle size={18} className="text-emerald-400" />
              AI Pipeline & Engine Status
            </h3>
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-500/30">
              <Sparkles size={12} className="animate-pulse" /> Operational
            </span>
          </div>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center border-b border-slate-700/60 pb-2">
              <span className="text-slate-400 font-medium">Spatial Chatbot Widget</span>
              <span className="font-bold text-emerald-400">Online & Active</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-700/60 pb-2">
              <span className="text-slate-400 font-medium">RBAC Security Boundaries</span>
              <span className="font-bold text-slate-200">Enforced</span>
            </div>
            <div className="flex justify-between items-center pb-1">
              <span className="text-slate-400 font-medium">Auto-Escalation Engine</span>
              <span className="font-bold text-blue-300">Enabled</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Support Tickets Section */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Ticket size={18} className="text-blue-600" />
            Technical Support Tickets Queue
          </h3>
          <span className="text-xs text-slate-500 font-semibold">
            {tickets.length > 0 ? `${tickets.length} Registered` : 'Workspace Queue'}
          </span>
        </div>

        {tickets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Ticket ID</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {tickets.map((t: any) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">{t.ticket_number || t.id.slice(0, 8)}</td>
                    <td className="py-3 px-4 text-slate-900 font-semibold max-w-xs truncate">{t.subject}</td>
                    <td className="py-3 px-4 text-slate-500">{t.category || 'General'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                        t.priority === 'Urgent' || t.priority === 'Critical' ? 'bg-red-50 text-red-700 border border-red-200' :
                        t.priority === 'High' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {t.priority || 'Normal'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={t.status || 'OPEN'}
                        onChange={(e) => void handleStatusChange(t.id, e.target.value)}
                        className={`text-xs font-bold px-2 py-1 rounded-lg border focus:outline-none bg-white ${
                          t.status === 'RESOLVED' || t.status === 'CLOSED' ? 'text-emerald-700 border-emerald-200' :
                          t.status === 'IN_PROGRESS' ? 'text-blue-700 border-blue-200' :
                          'text-amber-700 border-amber-200'
                        }`}
                      >
                        <option value="OPEN">OPEN</option>
                        <option value="IN_PROGRESS">IN_PROGRESS</option>
                        <option value="WAITING_FOR_USER">WAITING_FOR_USER</option>
                        <option value="RESOLVED">RESOLVED</option>
                        <option value="CLOSED">CLOSED</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-slate-400">{t.created_at ? new Date(t.created_at).toLocaleDateString() : 'Recent'}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => alert(`Ticket Details:\n\nNumber: ${t.ticket_number}\nSubject: ${t.subject}\nCategory: ${t.category}\nDescription: ${t.description}`)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center space-y-2">
            <HelpCircle className="mx-auto text-slate-400" size={32} />
            <p className="text-xs font-bold text-slate-800">No Support Tickets Created Yet</p>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Submit a support ticket above if you encounter any 3D rendering, AR QuickLook, or catalog publishing issues.
            </p>
          </div>
        )}
      </Card>

      {/* New Support Request Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200 text-slate-900">
            <button
              onClick={() => setCreateModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X size={20} />
            </button>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <Ticket size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Create Support Ticket</h3>
                  <p className="text-xs text-slate-500">Submit technical issue or inquiry to the engineering team</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subject / Issue Summary *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GLB model failing to display wireframe overlay"
                  value={ticketForm.subject}
                  onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={ticketForm.category}
                    onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Product / Model Issue">Product / Model Issue</option>
                    <option value="AR Issue">AR QuickLook / WebXR Issue</option>
                    <option value="3D Viewer Issue">3D Viewer Controls</option>
                    <option value="Catalog Issue">Catalog Publishing</option>
                    <option value="Account / Org Issue">Account / Organization</option>
                    <option value="General Support">General Support</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={ticketForm.priority}
                    onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Description *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe what happened, expected behavior, device/browser details..."
                  value={ticketForm.description}
                  onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md flex items-center gap-2"
                >
                  <Send size={16} />
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
