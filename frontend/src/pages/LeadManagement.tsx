import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Search, RefreshCw, User, Users, Plus, Trash2, Edit2, Box,
  X, Check, AlertCircle, Phone, Mail, Building2, Star,
  TrendingUp, Clock, MessageSquare, Filter,
  Target, Flame, Zap, Snowflake, Activity,
} from 'lucide-react';
import { Button, Card, PageHeader } from '../components/ui';
import { api, ApiClientError } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../components/Toast';
import { cx } from '../utils/format';


// ─── Types ─────────────────────────────────────────────────────────────────

type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Proposal Sent' | 'Closed' | 'Lost';
type LeadPriority = 'Low' | 'Normal' | 'High' | 'Urgent';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  designation?: string;
  status: LeadStatus;
  priority: LeadPriority;
  source?: string;
  notes?: string;
  score?: number;
  intent_level?: string;
  total_events?: number;
  total_qr_scans?: number;
  total_ar_sessions?: number;
  total_products_viewed?: number;
  created_at: string;
  updated_at?: string;
}

interface LeadFormData {
  name: string;
  company: string;
  email: string;
  phone: string;
  designation: string;
  productInterested: string;
  notes: string;
  source: string;
  priority: LeadPriority;
  status: LeadStatus;
}

const EMPTY_FORM: LeadFormData = {
  name: '', company: '', email: '', phone: '', designation: '',
  productInterested: '', notes: '', source: 'Manual', priority: 'Normal', status: 'New',
};

// ─── Score helpers ──────────────────────────────────────────────────────────

function getScoreLabel(score?: number, intent?: string): string {
  if (intent) return intent;
  if (!score) return 'Cold';
  if (score >= 90) return 'High Priority';
  if (score >= 76) return 'Qualified';
  if (score >= 51) return 'Hot';
  if (score >= 26) return 'Warm';
  return 'Cold';
}

function ScoreIcon({ label }: { label: string }) {
  if (label === 'High Priority') return <Zap size={14} />;
  if (label === 'Qualified') return <Check size={14} />;
  if (label === 'Hot') return <Flame size={14} />;
  if (label === 'Warm') return <TrendingUp size={14} />;
  return <Snowflake size={14} />;
}

function ScoreBadge({ score, intent }: { score?: number; intent?: string }) {
  const label = getScoreLabel(score, intent);
  const colorMap: Record<string, string> = {
    'High Priority': 'bg-red-100 text-red-700 border-red-200',
    'Qualified': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Hot': 'bg-orange-100 text-orange-700 border-orange-200',
    'Warm': 'bg-amber-100 text-amber-700 border-amber-200',
    'Cold': 'bg-blue-50 text-blue-600 border-blue-200',
    'SQL': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'High Intent': 'bg-red-100 text-red-700 border-red-200',
  };
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold', colorMap[label] ?? 'bg-slate-100 text-slate-600 border-slate-200')}>
      <ScoreIcon label={label} />
      {label}
    </span>
  );
}

function ScoreRing({ score = 0 }: { score?: number }) {
  const pct = Math.min(score, 100);
  const r = 22;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const color = pct >= 76 ? '#10b981' : pct >= 51 ? '#f97316' : pct >= 26 ? '#f59e0b' : '#3b82f6';
  return (
    <div className="relative h-14 w-14">
      <svg className="-rotate-90" width="56" height="56" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={r} fill="none" stroke="#e2e8f0" strokeWidth="5" />
        <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease' }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-slate-800">{pct}</span>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: LeadStatus }) {
  const colors: Record<LeadStatus, string> = {
    'New': 'bg-blue-50 text-blue-700 border-blue-200',
    'Contacted': 'bg-purple-50 text-purple-700 border-purple-200',
    'Qualified': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Proposal Sent': 'bg-amber-50 text-amber-700 border-amber-200',
    'Closed': 'bg-slate-100 text-slate-600 border-slate-200',
    'Lost': 'bg-red-50 text-red-600 border-red-200',
  };
  return (
    <span className={cx('rounded-full border px-2.5 py-0.5 text-xs font-semibold', colors[status] ?? 'bg-slate-100 text-slate-600')}>
      {status}
    </span>
  );
}

function PriorityDot({ priority }: { priority: LeadPriority }) {
  const colors: Record<LeadPriority, string> = {
    'Urgent': 'bg-red-500',
    'High': 'bg-orange-400',
    'Normal': 'bg-blue-400',
    'Low': 'bg-slate-300',
  };
  return <span className={cx('inline-block h-2 w-2 rounded-full', colors[priority])} title={priority} />;
}

// ─── Lead Form Modal ──────────────────────────────────────────────────────────

function LeadFormModal({
  lead, onClose, onSave,
}: {
  lead: Lead | null; onClose: () => void; onSave: (data: LeadFormData) => Promise<void>;
}) {
  const [form, setForm] = useState<LeadFormData>(
    lead
      ? {
          name: lead.name, company: lead.company ?? '', email: lead.email,
          phone: lead.phone ?? '', designation: lead.designation ?? '',
          productInterested: '', notes: lead.notes ?? '',
          source: lead.source ?? 'Manual', priority: lead.priority ?? 'Normal', status: lead.status,
        }
      : EMPTY_FORM,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email address';
    if (form.phone && !/^\+?[\d\s\-().]{7,20}$/.test(form.phone)) errs.phone = 'Invalid phone number';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  }

  function field(
    label: string, key: keyof LeadFormData, type = 'text', required = false,
    placeholder = '',
  ) {
    return (
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">
          {label}{required && <span className="ml-1 text-red-500">*</span>}
        </label>
        <input
          type={type}
          className={cx(
            'h-11 w-full rounded-xl border px-4 text-sm outline-none transition',
            errors[key] ? 'border-red-400 focus:ring-2 focus:ring-red-100' : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-50',
          )}
          placeholder={placeholder}
          value={String(form[key])}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        />
        {errors[key] && <p className="mt-1 text-xs text-red-500">{errors[key]}</p>}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{lead ? 'Edit Lead' : 'Create Lead'}</h2>
            <p className="mt-0.5 text-sm text-slate-500">{lead ? 'Update lead information' : 'Manually add a new lead to your pipeline'}</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X size={20} /></button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {field('Full Name', 'name', 'text', true, 'John Smith')}
            {field('Company', 'company', 'text', false, 'Acme Industries')}
            {field('Email', 'email', 'email', true, 'john@acme.com')}
            {field('Phone', 'phone', 'tel', false, '+1 555 000 0000')}
            {field('Designation', 'designation', 'text', false, 'Procurement Manager')}
            {field('Product Interested', 'productInterested', 'text', false, 'Hydraulic Pump Series X')}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Lead Source</label>
              <select
                className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-500"
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
              >
                {['Manual', 'Catalog', 'QR Scan', 'AR Session', 'Trade Show', 'Website', 'Referral', 'Cold Outreach'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Priority</label>
              <select
                className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-500"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as LeadPriority })}
              >
                {(['Low', 'Normal', 'High', 'Urgent'] as LeadPriority[]).map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
              <select
                className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-500"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as LeadStatus })}
              >
                {(['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Closed', 'Lost'] as LeadStatus[]).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Notes</label>
            <textarea
              className="min-h-24 w-full rounded-xl border border-slate-200 p-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-50"
              placeholder="Add any notes about this lead..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? <RefreshCw size={18} className="animate-spin" /> : <Check size={18} />}
              {saving ? 'Saving...' : lead ? 'Update Lead' : 'Create Lead'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

// ─── Confirm Delete Dialog ────────────────────────────────────────────────────

function ConfirmDeleteDialog({
  lead, onConfirm, onCancel, loading,
}: {
  lead: Lead; onConfirm: () => void; onCancel: () => void; loading?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/50 p-4">
      <Card className="w-full max-w-md p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-red-50 p-2.5 text-red-500"><AlertCircle size={22} /></div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Delete Lead</h3>
            <p className="mt-2 text-sm text-slate-500">
              Are you sure you want to delete <strong>{lead.name}</strong>? This will permanently remove their journey data and cannot be undone.
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm} disabled={loading}>
            {loading ? <RefreshCw size={16} className="animate-spin" /> : <Trash2 size={16} />}
            {loading ? 'Deleting...' : 'Delete Lead'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

// ─── Lead Detail Panel ────────────────────────────────────────────────────────

function LeadDetailPanel({
  lead, token, onEdit, onClose,
}: {
  lead: Lead; token: string | null; onEdit: () => void; onClose: () => void;
}) {
  const [journey, setJourney] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'journey' | 'notes' | 'stats'>('journey');
  const [loadingJourney, setLoadingJourney] = useState(false);
  const [note, setNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const { success, error: showError } = useToast();

  useEffect(() => {
    if (!token) return;
    setLoadingJourney(true);
    Promise.all([
      api.getLeadJourney(token, lead.id).catch(() => []),
      api.getLeadActivities(token, lead.id).catch(() => []),
    ]).then(([j, a]) => {
      setJourney(j as any[]);
      setActivities(a as any[]);
    }).finally(() => setLoadingJourney(false));
  }, [token, lead.id]);

  async function addNote() {
    if (!note.trim() || !token) return;
    setAddingNote(true);
    try {
      const act = await api.addLeadActivity(token, lead.id, { activityType: 'note', body: note.trim() }) as any;
      setActivities((c) => [act, ...c]);
      setNote('');
      success('Note added');
    } catch {
      showError('Failed to add note');
    } finally {
      setAddingNote(false);
    }
  }

  const scoreLabel = getScoreLabel(lead.score, lead.intent_level);

  return (
    <Card className="flex flex-col overflow-hidden h-full min-h-[600px]">
      <div className="flex items-center justify-between border-b border-slate-100 p-4">
        <h3 className="font-bold text-slate-900">Lead Profile</h3>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
            title="Edit lead"
          >
            <Edit2 size={16} />
          </button>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="overflow-y-auto flex-1">
        {/* Header */}
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-start gap-4">
            <div className="relative">
              <ScoreRing score={lead.score} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900 truncate">{lead.name}</p>
              {lead.designation && (
                <p className="text-xs text-slate-500 mt-0.5">{lead.designation}</p>
              )}
              {lead.company && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-600">
                  <Building2 size={12} className="text-slate-400" />{lead.company}
                </p>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                <ScoreBadge score={lead.score} intent={lead.intent_level} />
                <StatusBadge status={lead.status} />
                <PriorityDot priority={lead.priority ?? 'Normal'} />
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {lead.email && (
              <a href={`mailto:${lead.email}`} className="flex items-center gap-2 text-xs text-slate-600 hover:text-primary">
                <Mail size={13} className="text-slate-400" />{lead.email}
              </a>
            )}
            {lead.phone && (
              <a href={`tel:${lead.phone}`} className="flex items-center gap-2 text-xs text-slate-600 hover:text-primary">
                <Phone size={13} className="text-slate-400" />{lead.phone}
              </a>
            )}
            <p className="flex items-center gap-2 text-xs text-slate-500">
              <Clock size={13} className="text-slate-400" />
              Created {new Date(lead.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 border-b border-slate-100">
          {[
            { label: 'Interactions', value: lead.total_events ?? 0, icon: Activity },
            { label: 'QR Scans', value: lead.total_qr_scans ?? 0, icon: Target },
            { label: 'AR Sessions', value: lead.total_ar_sessions ?? 0, icon: Star },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex flex-col items-center py-3 border-r border-slate-100 last:border-0">
              <Icon size={16} className="text-slate-400 mb-1" />
              <p className="text-lg font-bold text-slate-900">{value}</p>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 overflow-x-auto scrollbar-hide">
          {[
            { key: 'journey', label: 'Timeline', icon: Activity },
            { key: 'interests', label: 'Interests', icon: Box },
            { key: 'notes', label: 'Notes', icon: MessageSquare },
            { key: 'stats', label: 'Profile Data', icon: User },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={cx(
                'flex flex-none items-center justify-center gap-1.5 px-4 py-3 text-xs font-semibold transition',
                activeTab === key ? 'border-b-2 border-blue-500 text-blue-600' : 'text-slate-500 hover:text-slate-700',
              )}
            >
              <Icon size={14} />{label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {activeTab === 'journey' && (
            <>
              {loadingJourney ? (
                <div className="flex items-center justify-center py-8 text-slate-400">
                  <RefreshCw className="animate-spin mr-2" size={20} />
                  Loading journey...
                </div>
              ) : journey.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  <Activity size={28} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No tracked events yet</p>
                </div>
              ) : (
                <div className="relative border-l-2 border-slate-100 ml-3 space-y-5 pb-4">
                  {journey.map((event, i) => (
                    <div key={i} className="relative pl-6">
                      <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full border-4 border-white bg-blue-500" />
                      <p className="text-[10px] font-semibold uppercase text-slate-400">
                        {new Date(event.created_at).toLocaleString()}
                      </p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5 capitalize">
                        {event.event_type.replace(/_/g, ' ')}
                      </p>
                      {event.product_name && (
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          <Box size={11} />{event.product_name}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'interests' && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-800">Product Interests</h4>
              {journey.filter(e => e.event_type === 'product_view' || e.event_type === 'ar_launch' || e.event_type === 'model_download').length === 0 ? (
                <div className="py-6 text-center text-slate-400">
                  <Box size={24} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No product interactions recorded</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {Array.from(new Set(journey.filter(e => e.product_name).map(e => e.product_name))).map(productName => (
                    <div key={productName} className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-blue-50 p-2 text-blue-600"><Box size={16} /></div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{productName}</p>
                          <p className="text-xs text-slate-500">
                            Viewed {journey.filter(e => e.product_name === productName && e.event_type === 'product_view').length} times
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {journey.some(e => e.product_name === productName && e.event_type === 'ar_launch') && (
                          <Badge variant="blue"><Smartphone size={10} className="mr-1" /> AR</Badge>
                        )}
                        {journey.some(e => e.product_name === productName && e.event_type === 'model_download') && (
                          <Badge variant="green"><Download size={10} className="mr-1" /> DL</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  placeholder="Add a note..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void addNote(); } }}
                />
                <Button
                  className="h-10 px-4 text-sm"
                  onClick={() => void addNote()}
                  disabled={addingNote || !note.trim()}
                >
                  {addingNote ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
                </Button>
              </div>
              {activities.length === 0 ? (
                <div className="py-6 text-center text-slate-400">
                  <MessageSquare size={24} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No notes yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activities.map((act) => (
                    <div key={act.id} className="rounded-xl bg-slate-50 p-3">
                      <p className="text-sm text-slate-700">{act.body}</p>
                      <p className="mt-1 text-[10px] text-slate-400">
                        {act.user_name ? `${act.user_name} · ` : ''}{new Date(act.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-3">
              {[
                { label: 'Lead Source', value: lead.source ?? 'Unknown' },
                { label: 'Priority', value: lead.priority ?? 'Normal' },
                { label: 'Score', value: `${lead.score ?? 0} / 100 — ${scoreLabel}` },
                { label: 'Products Viewed', value: String(lead.total_products_viewed ?? 0) },
                { label: 'Last Updated', value: lead.updated_at ? new Date(lead.updated_at).toLocaleDateString() : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
                  <span className="text-sm font-semibold text-slate-800">{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export function LeadManagementPage() {
  const token = useAuthStore((s) => s.token);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | LeadStatus>('All');
  const [priorityFilter, setPriorityFilter] = useState<'All' | LeadPriority>('All');
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'name' | 'priority'>('score');
  
  const [activeTab, setActiveTab] = useState<'Leads' | 'Queries'>('Leads');
  const [tickets, setTickets] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [formLead, setFormLead] = useState<Lead | null>(null); // null = create, Lead = edit
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Lead | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const { success, error: showError } = useToast();

  const loadLeads = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await api.listLeads(token);
      setLeads(data as Lead[]);
    } catch (err) {
      showError('Failed to load leads', err instanceof ApiClientError ? err.message : 'Could not fetch leads');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const loadTickets = useCallback(async () => {
    if (!token) return;
    setLoadingTickets(true);
    try {
      const res = await fetch('/api/support/tickets', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setTickets(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTickets(false);
    }
  }, [token]);

  useEffect(() => { loadLeads(); loadTickets(); }, [loadLeads, loadTickets]);

  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      const q = filter.toLowerCase();
      const matchSearch = !q || l.name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q) || (l.company ?? '').toLowerCase().includes(q);
      const matchStatus = statusFilter === 'All' || l.status === statusFilter;
      const matchPriority = priorityFilter === 'All' || l.priority === priorityFilter;
      return matchSearch && matchStatus && matchPriority;
    }).sort((a, b) => {
      if (sortBy === 'score') return (b.score ?? 0) - (a.score ?? 0);
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'date') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      const pOrder: Record<string, number> = { Urgent: 0, High: 1, Normal: 2, Low: 3 };
      return (pOrder[a.priority ?? 'Normal'] ?? 2) - (pOrder[b.priority ?? 'Normal'] ?? 2);
    });
  }, [leads, filter, statusFilter, priorityFilter, sortBy]);

  async function handleSave(data: LeadFormData) {
    if (!token) return;
    try {
      if (formLead) {
        // Edit existing
        const updated = await api.updateLead(token, formLead.id, {
          name: data.name, email: data.email, phone: data.phone || null,
          company: data.company || null, designation: data.designation || null,
          notes: data.notes || null, status: data.status, priority: data.priority,
          source: data.source,
        }) as Lead;
        setLeads((c) => c.map((l) => l.id === formLead.id ? { ...l, ...updated } : l));
        if (selectedLead?.id === formLead.id) setSelectedLead({ ...selectedLead, ...updated });
        success('Lead updated', `"${data.name}" has been saved.`);
      } else {
        // Create new
        const created = await api.createLead(token, {
          name: data.name, email: data.email, phone: data.phone || null,
          company: data.company || null, designation: data.designation || null,
          notes: data.notes || null, status: data.status, priority: data.priority,
          source: data.source, score: 0,
        }) as Lead;
        setLeads((c) => [created, ...c]);
        success('Lead created', `"${data.name}" added to your pipeline.`);
      }
      setShowForm(false);
      setFormLead(null);
    } catch (err) {
      showError('Save failed', err instanceof ApiClientError ? err.message : 'Could not save lead');
      throw err;
    }
  }

  async function handleDelete() {
    if (!deleteTarget || !token) return;
    setDeleting(true);
    try {
      await api.deleteLead(token, deleteTarget.id);
      setLeads((c) => c.filter((l) => l.id !== deleteTarget.id));
      if (selectedLead?.id === deleteTarget.id) setSelectedLead(null);
      success('Lead deleted', `"${deleteTarget.name}" has been removed.`);
      setDeleteTarget(null);
    } catch (err) {
      showError('Delete failed', err instanceof ApiClientError ? err.message : 'Could not delete lead');
    } finally {
      setDeleting(false);
    }
  }



  // KPI summary
  const kpis = useMemo(() => {
    const total = leads.length;
    const hot = leads.filter((l) => (l.score ?? 0) >= 51).length;
    const qualified = leads.filter((l) => l.status === 'Qualified' || l.status === 'Proposal Sent').length;
    const avgScore = total ? Math.round(leads.reduce((a, l) => a + (l.score ?? 0), 0) / total) : 0;
    return { total, hot, qualified, avgScore };
  }, [leads]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lead Management"
        eyebrow="Manage, score, and track your complete lead pipeline."
        action={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={loadLeads} disabled={loading}>
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              Refresh
            </Button>
            <Button onClick={() => { setFormLead(null); setShowForm(true); }}>
              <Plus size={18} />
              New Lead
            </Button>
          </div>
        }
      />

      <div className="flex space-x-6 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('Leads')}
          className={cx("pb-3 text-sm font-semibold transition-colors border-b-2", activeTab === 'Leads' ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-700")}
        >
          Lead Pipeline
        </button>
        <button
          onClick={() => setActiveTab('Queries')}
          className={cx("pb-3 text-sm font-semibold transition-colors border-b-2", activeTab === 'Queries' ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-700")}
        >
          Customer Queries (Support)
        </button>
      </div>

      {activeTab === 'Leads' ? (
        <>
          {/* KPI bar */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: 'Total Leads', value: kpis.total, color: 'text-blue-600', bg: 'bg-blue-50', icon: Users },
              { label: 'Hot & Above', value: kpis.hot, color: 'text-orange-600', bg: 'bg-orange-50', icon: Flame },
              { label: 'Qualified', value: kpis.qualified, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: Check },
              { label: 'Avg Score', value: kpis.avgScore, color: 'text-purple-600', bg: 'bg-purple-50', icon: Star },
            ].map(({ label, value, color, bg, icon: Icon }) => (
              <Card key={label} className="p-5">
                <div className={cx('mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl', bg, color)}>
                  <Icon size={18} />
                </div>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
                <p className="mt-0.5 text-xs font-medium text-slate-500">{label}</p>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Left: Lead Table */}
        <Card className="flex flex-col overflow-hidden">
          {/* Filters */}
          <div className="space-y-3 p-4 border-b border-slate-100">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm outline-none focus:border-blue-500 focus:bg-white"
                  placeholder="Search by name, email, company..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cx(
                  'flex items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition',
                  showFilters ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                )}
              >
                <Filter size={16} />Filters
                {(statusFilter !== 'All' || priorityFilter !== 'All') && (
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                )}
              </button>
              <select
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none focus:border-blue-500"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <option value="score">Sort: Score</option>
                <option value="name">Sort: Name</option>
                <option value="date">Sort: Date</option>
                <option value="priority">Sort: Priority</option>
              </select>
            </div>

            {showFilters && (
              <div className="flex flex-wrap gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Status:</span>
                  {(['All', 'New', 'Contacted', 'Qualified', 'Proposal Sent', 'Closed', 'Lost'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={cx(
                        'rounded-lg px-3 py-1 text-xs font-semibold transition',
                        statusFilter === s ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Priority:</span>
                  {(['All', 'Urgent', 'High', 'Normal', 'Low'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPriorityFilter(p)}
                      className={cx(
                        'rounded-lg px-3 py-1 text-xs font-semibold transition',
                        priorityFilter === p ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Lead list */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loading && (
              <div className="flex items-center justify-center py-16 text-slate-400">
                <RefreshCw className="animate-spin mr-3" size={24} />Loading leads...
              </div>
            )}
            {!loading && filteredLeads.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Users size={40} className="text-slate-200 mb-3" />
                <h3 className="font-semibold text-slate-600">No leads found</h3>
                <p className="mt-1 text-sm text-slate-400">
                  {filter ? 'Try a different search term' : 'Create your first lead using the + button'}
                </p>
                {!filter && (
                  <Button className="mt-4 text-sm h-10" onClick={() => { setFormLead(null); setShowForm(true); }}>
                    <Plus size={16} />New Lead
                  </Button>
                )}
              </div>
            )}
            {!loading && filteredLeads.map((lead) => (
              <button
                key={lead.id}
                onClick={() => setSelectedLead(lead)}
                className={cx(
                  'flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-slate-50',
                  selectedLead?.id === lead.id ? 'bg-blue-50 border-l-4 border-blue-500' : 'border-l-4 border-transparent',
                )}
              >
                {/* Avatar */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white font-bold text-sm">
                  {lead.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <PriorityDot priority={lead.priority ?? 'Normal'} />
                    <p className="truncate font-semibold text-slate-900">{lead.name}</p>
                  </div>
                  <p className="truncate text-xs text-slate-500">
                    {lead.company ? `${lead.company} · ` : ''}{lead.email}
                  </p>
                </div>
                {/* Badges */}
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <ScoreBadge score={lead.score} intent={lead.intent_level} />
                  <StatusBadge status={lead.status} />
                </div>
                {/* Actions */}
                <div className="flex shrink-0 flex-col gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                    onClick={(e) => { e.stopPropagation(); setFormLead(lead); setShowForm(true); }}
                    title="Edit"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(lead); }}
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </button>
            ))}
          </div>

          {/* Footer */}
          {!loading && (
            <div className="border-t border-slate-100 px-5 py-2.5 text-xs text-slate-400">
              {filteredLeads.length} of {leads.length} leads
            </div>
          )}
        </Card>

        {/* Right: Detail Panel */}
        <div>
          {selectedLead ? (
            <LeadDetailPanel
              lead={selectedLead}
              token={token}
              onEdit={() => { setFormLead(selectedLead); setShowForm(true); }}
              onClose={() => setSelectedLead(null)}
            />
          ) : (
            <Card className="flex h-full min-h-[500px] flex-col items-center justify-center p-8 text-center border-dashed border-2">
              <User size={48} className="text-slate-200 mb-4" />
              <h3 className="font-bold text-slate-600">Select a Lead</h3>
              <p className="mt-2 text-sm text-slate-400 max-w-[200px]">
                Click any lead to view their behavioral journey, score, and activities.
              </p>
            </Card>
          )}
        </div>
      </div>
      </>
      ) : (
        <Card className="flex flex-col overflow-hidden h-[600px]">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-700 flex items-center gap-2"><MessageSquare size={18} className="text-primary" /> Active Customer Queries</h3>
            <span className="text-xs text-slate-500">{tickets.length} support tickets</span>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loadingTickets ? (
               <div className="p-8 text-center text-slate-400">Loading queries...</div>
            ) : tickets.length === 0 ? (
               <div className="p-8 text-center text-slate-400 flex flex-col items-center">
                 <AlertCircle size={32} className="mb-2 opacity-50" />
                 <p>No customer queries found.</p>
               </div>
            ) : (
              tickets.map((t) => (
                <div key={t.id} className="p-4 hover:bg-slate-50 transition cursor-pointer flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{t.subject}</h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">{t.message}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <span className={cx("text-[10px] px-2 py-0.5 rounded-full font-bold", t.priority === 'Critical' ? "bg-red-100 text-red-700" : "bg-blue-50 text-blue-700")}>{t.priority}</span>
                      <span className="text-[10px] text-slate-400">{new Date(t.created_at).toLocaleDateString()}</span>
                      {t.customer_name && <span className="text-[10px] text-slate-400 flex items-center gap-1"><User size={10} /> {t.customer_name}</span>}
                    </div>
                  </div>
                  <div className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded">
                    {t.status}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* FAB */}
      <button
        onClick={() => { setFormLead(null); setShowForm(true); }}
        className="fixed bottom-8 right-8 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-all hover:bg-blue-600 hover:scale-105 hover:shadow-xl active:scale-95"
        title="Create new lead"
      >
        <Plus size={24} />
      </button>

      {/* Modals */}
      {showForm && (
        <LeadFormModal
          lead={formLead}
          onClose={() => { setShowForm(false); setFormLead(null); }}
          onSave={handleSave}
        />
      )}
      {deleteTarget && (
        <ConfirmDeleteDialog
          lead={deleteTarget}
          onConfirm={() => void handleDelete()}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
