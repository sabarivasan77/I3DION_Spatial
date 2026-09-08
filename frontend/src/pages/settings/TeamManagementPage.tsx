import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import {
  fetchOrganizationProfile,
  inviteTeamMember,
  removeTeamMember
} from '../../services/api';
import { Users, UserPlus, Trash2, Mail, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';

export const TeamManagementPage: React.FC = () => {
  const { token, user } = useAuthStore();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Sales User');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    if (!token) return;
    try {
      const data = await fetchOrganizationProfile(token);
      setMembers(data.members || []);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to load team members' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !inviteEmail) return;

    setSubmitting(true);
    setMessage(null);

    try {
      await inviteTeamMember(token, inviteEmail, inviteRole);
      setMessage({ type: 'success', text: `Invitation sent to ${inviteEmail}!` });
      setInviteEmail('');
      await loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to invite team member' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!token || !window.confirm('Are you sure you want to remove this member?')) return;
    try {
      await removeTeamMember(token, userId);
      setMessage({ type: 'success', text: 'Member removed successfully' });
      await loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to remove member' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Users className="w-6 h-6 text-blue-400" /> Team & Member Management
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Manage team access, invite collaborators, and assign roles for your organization.
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-sm ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Invite Member Form */}
      <form onSubmit={handleInvite} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-blue-400" /> Invite New Team Member
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-400 mb-1">Work Email</label>
            <input
              type="email"
              required
              placeholder="colleague@company.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Role</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="Admin">Admin</option>
              <option value="Manager">Manager</option>
              <option value="Sales User">Sales User</option>
              <option value="Viewer">Viewer</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-500/20 transition flex items-center gap-2"
        >
          {submitting ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : <Mail className="w-4 h-4" />}
          <span>Send Invitation</span>
        </button>
      </form>

      {/* Member List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-lg font-bold text-slate-100">Active Members ({members.length})</h2>

        <div className="divide-y divide-slate-800">
          {members.map((m) => (
            <div key={m.id} className="py-3 flex justify-between items-center text-sm">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-blue-400">
                  {m.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <div className="font-semibold text-slate-200">{m.name}</div>
                  <div className="text-xs text-slate-400">{m.email}</div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-blue-400" />
                  <span>{m.role}</span>
                </span>

                {m.id !== user?.id && (
                  <button
                    onClick={() => handleRemoveMember(m.id)}
                    className="p-2 text-slate-400 hover:text-rose-400 transition"
                    title="Remove member"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
