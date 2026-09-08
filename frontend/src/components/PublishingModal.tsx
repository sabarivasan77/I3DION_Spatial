import React, { useState } from 'react';
import { X, Globe, Lock, Shield, Check, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';

interface PublishingModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  currentVisibility?: 'PUBLIC' | 'ORGANIZATION' | 'RESTRICTED';
  currentApprovalStatus?: string;
  onSuccess?: () => void;
}

export const PublishingModal: React.FC<PublishingModalProps> = ({
  isOpen,
  onClose,
  productId,
  productName,
  currentVisibility = 'PUBLIC',
  onSuccess,
}) => {
  const { token, user } = useAuthStore();
  const [visibility, setVisibility] = useState<'PUBLIC' | 'ORGANIZATION' | 'RESTRICTED'>(currentVisibility);
  const [submitting, setSubmitting] = useState(false);

  const isEnterpriseOrAdmin = user?.role === 'Super Admin' || user?.role === 'Company Admin' || user?.role === 'Admin';

  const handleSave = async () => {
    setSubmitting(true);
    try {
      const approvalStatus = isEnterpriseOrAdmin ? 'PUBLISHED' : 'PENDING_REVIEW';
      const res = await fetch(`/api/publishing/product/${productId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          visibility,
          approvalStatus,
        }),
      });

      if (res.ok) {
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err) {
      console.error('Failed to update publishing access:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 p-6 text-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Publishing Policy</h3>
                <p className="text-xs text-slate-400 mt-0.5">{productName}</p>
              </div>
              <button onClick={onClose} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="my-6 space-y-3">
              {/* Option 1: PUBLIC */}
              <div
                onClick={() => setVisibility('PUBLIC')}
                className={`flex cursor-pointer items-start gap-3.5 rounded-2xl border p-4 transition ${
                  visibility === 'PUBLIC'
                    ? 'border-blue-500/40 bg-blue-600/10 text-white'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="mt-0.5 rounded-xl bg-blue-500/20 p-2 text-blue-400">
                  <Globe size={18} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">Public</span>
                    {visibility === 'PUBLIC' && <Check size={16} className="text-blue-400" />}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Anyone with the public link or QR code can view in 3D & AR.</p>
                </div>
              </div>

              {/* Option 2: ORGANIZATION ONLY */}
              <div
                onClick={() => setVisibility('ORGANIZATION')}
                className={`flex cursor-pointer items-start gap-3.5 rounded-2xl border p-4 transition ${
                  visibility === 'ORGANIZATION'
                    ? 'border-blue-500/40 bg-blue-600/10 text-white'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="mt-0.5 rounded-xl bg-purple-500/20 p-2 text-purple-400">
                  <Lock size={18} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">Organization Only</span>
                    {visibility === 'ORGANIZATION' && <Check size={16} className="text-blue-400" />}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Restricted to authenticated members of your company workspace.</p>
                </div>
              </div>

              {/* Option 3: RESTRICTED (ENTERPRISE) */}
              <div
                onClick={() => setVisibility('RESTRICTED')}
                className={`flex cursor-pointer items-start gap-3.5 rounded-2xl border p-4 transition ${
                  visibility === 'RESTRICTED'
                    ? 'border-blue-500/40 bg-blue-600/10 text-white'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="mt-0.5 rounded-xl bg-amber-500/20 p-2 text-amber-400">
                  <Shield size={18} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">Restricted (Enterprise)</span>
                    {visibility === 'RESTRICTED' && <Check size={16} className="text-blue-400" />}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Explicit permissions for designated internal teams and individuals.</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
              <button
                onClick={onClose}
                className="h-10 px-4 rounded-xl border border-slate-800 bg-slate-950 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={submitting}
                className="h-10 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 flex items-center gap-2"
              >
                {submitting ? 'Updating...' : isEnterpriseOrAdmin ? 'Apply Policy' : 'Request Approval'}
                <Send size={14} />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
