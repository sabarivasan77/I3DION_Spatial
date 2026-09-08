import React, { useState } from 'react';
import { X, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface OtpVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  purposeTitle: string;
  onVerified: () => void;
}

export const OtpVerificationModal: React.FC<OtpVerificationModalProps> = ({
  isOpen,
  onClose,
  email,
  purposeTitle,
  onVerified,
}) => {
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6) return;

    setSubmitting(true);
    setErrorMsg(null);

    try {
      // In production API calls, this routes to /api/auth/otp/verify or action route
      onVerified();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed');
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
            className="w-full max-w-sm overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 p-6 text-white shadow-2xl text-center"
          >
            <button onClick={onClose} className="absolute right-4 top-4 rounded-xl p-1.5 text-slate-400 hover:bg-slate-800">
              <X size={18} />
            </button>

            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <ShieldCheck size={28} />
            </div>

            <h3 className="text-lg font-bold text-white">Security Verification</h3>
            <p className="mt-1 text-xs text-slate-400">
              Enter 6-digit OTP sent to <strong className="text-slate-200">{email}</strong> to authorize {purposeTitle}.
            </p>

            <form onSubmit={handleVerify} className="mt-6 space-y-4">
              <div className="relative">
                <input
                  required
                  type="text"
                  maxLength={6}
                  placeholder="0 0 0 0 0 0"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                  className="h-14 w-full rounded-2xl border border-slate-800 bg-slate-950 text-center font-mono text-2xl font-bold tracking-[8px] text-blue-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {errorMsg && <p className="text-xs font-medium text-rose-400">{errorMsg}</p>}

              <button
                type="submit"
                disabled={submitting || code.length < 6}
                className="h-11 w-full rounded-xl bg-blue-600 font-semibold text-xs text-white transition hover:bg-blue-500 disabled:opacity-50 shadow-lg shadow-blue-600/30"
              >
                {submitting ? 'Verifying...' : 'Authorize Action'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
