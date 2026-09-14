import React, { useState, useEffect } from 'react';
import { X, Share2, Shield, Trash2, CheckCircle2, UserPlus, AlertCircle } from 'lucide-react';
import { vaultApi } from '../../api/vaultApi';

interface VaultShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceType: 'asset' | 'collection' | 'dataset';
  resourceId: string;
  resourceName: string;
}

export function VaultShareModal({ isOpen, onClose, resourceType, resourceId, resourceName }: VaultShareModalProps) {
  const [shares, setShares] = useState<any[]>([]);
  const [userIdInput, setUserIdInput] = useState('');
  const [permissionLevel, setPermissionLevel] = useState<'view' | 'comment' | 'edit' | 'admin'>('view');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchShares = async () => {
    try {
      setLoading(true);
      const data = await vaultApi.getShares(resourceType, resourceId);
      setShares(data);
    } catch {
      setMessage({ type: 'error', text: 'Failed to load permissions' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchShares();
    }
  }, [isOpen, resourceId]);

  if (!isOpen) return null;

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userIdInput.trim()) return;

    try {
      setMessage(null);
      await vaultApi.createShare({
        resource_type: resourceType,
        resource_id: resourceId,
        shared_with_user_id: userIdInput.trim(),
        permission_level: permissionLevel
      });
      setMessage({ type: 'success', text: 'Access granted successfully!' });
      setUserIdInput('');
      fetchShares();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to grant permission' });
    }
  };

  const handleRevoke = async (shareId: string) => {
    try {
      await vaultApi.deleteShare(shareId);
      setShares((prev) => prev.filter((s) => s.id !== shareId));
      setMessage({ type: 'success', text: 'Permission revoked' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to revoke permission' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 md:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Share2 size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Manage Sharing &amp; Access</h2>
              <p className="text-xs text-slate-500 truncate max-w-xs">{resourceName}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition">
            <X size={18} />
          </button>
        </div>

        {message && (
          <div
            className={`mb-4 flex items-center gap-2 rounded-2xl p-3 text-xs font-semibold ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Add User Permission Form */}
        <form onSubmit={handleShare} className="space-y-4 border-b border-slate-100 pb-6 mb-6">
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">Grant User Access</label>
          <div className="flex gap-2">
            <input
              type="text"
              required
              value={userIdInput}
              onChange={(e) => setUserIdInput(e.target.value)}
              placeholder="User ID or Email"
              className="flex-1 rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs font-medium focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            <select
              value={permissionLevel}
              onChange={(e) => setPermissionLevel(e.target.value as any)}
              className="rounded-2xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500"
            >
              <option value="view">Viewer</option>
              <option value="comment">Commenter</option>
              <option value="edit">Editor</option>
              <option value="admin">Co-Owner</option>
            </select>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-xs"
            >
              <UserPlus size={15} />
              Add
            </button>
          </div>
        </form>

        {/* Existing Shares List */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Authorized Members</h3>
          {loading ? (
            <div className="flex justify-center p-6">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-600" />
            </div>
          ) : shares.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500 font-medium">
              No custom permissions granted. Accessible to organization members.
            </div>
          ) : (
            <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-slate-50/30">
              {shares.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-200 text-xs font-bold text-slate-700">
                      {s.shared_with_name ? s.shared_with_name.slice(0, 2).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{s.shared_with_name || s.shared_with_email || 'Organization Member'}</p>
                      <p className="text-[10px] text-slate-500 capitalize flex items-center gap-1">
                        <Shield size={10} className="text-emerald-500" /> {s.permission_level} Access
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRevoke(s.id)}
                    title="Revoke access"
                    className="rounded-xl p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
