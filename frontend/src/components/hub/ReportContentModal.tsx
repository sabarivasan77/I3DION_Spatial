import { useState, useEffect } from 'react';
import { AlertTriangle, X, CheckCircle, ShieldAlert, Loader2 } from 'lucide-react';
import { hubApi } from '../../services/hubApi';
import { useAuthStore } from '../../store/authStore';

interface ReportContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: 'product' | 'catalog' | 'comment' | 'organization' | 'shortlink';
  entityId: string;
  entityName?: string;
}

const REPORT_REASONS = [
  'Broken 3D Model / Rendering Error',
  'Incorrect CAD Specifications / Dimensions',
  'Copyright / Intellectual Property Infringement',
  'Misleading Marketing / Fabricated Information',
  'Inappropriate or Abusive Material',
  'Other Issue'
];

export function ReportContentModal({
  isOpen,
  onClose,
  entityType,
  entityId,
  entityName
}: ReportContentModalProps) {
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');
  const [hpToken, setHpToken] = useState('');
  const [websiteTrap, setWebsiteTrap] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (user?.email) {
      setReporterEmail(user.email);
    }
  }, [user]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return;

    setSubmitting(true);
    setErrorMsg(null);

    try {
      await hubApi.submitReport({
        entityType,
        entityId,
        reason,
        details: details.trim() || undefined,
        reporterEmail: reporterEmail.trim() || undefined,
        hp_token: hpToken || undefined,
        website_trap: websiteTrap || undefined
      }, token || undefined);

      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 2500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit report. Please try again.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close report dialog"
          className="absolute top-4 right-4 p-2.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white">Report Submitted</h3>
            <p className="text-slate-400 text-sm max-w-sm mx-auto">
              Thank you for keeping I3DION Spatial Hub authentic and safe. Our trust and safety engineering team will review this promptly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h2 id="report-modal-title" className="text-lg font-bold text-white">
                  Report Content
                </h2>
                <p className="text-xs text-slate-400">
                  {entityName ? `Reporting "${entityName}"` : `Reporting ${entityType}`}
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Anti-spam honeypot (hidden from human visitors) */}
            <div className="hidden" aria-hidden="true">
              <input
                type="text"
                name="hp_token"
                tabIndex={-1}
                value={hpToken}
                onChange={(e) => setHpToken(e.target.value)}
                autoComplete="off"
              />
              <input
                type="text"
                name="website_trap"
                tabIndex={-1}
                value={websiteTrap}
                onChange={(e) => setWebsiteTrap(e.target.value)}
                autoComplete="off"
              />
            </div>

            {/* Reason selector */}
            <div className="space-y-1.5">
              <label htmlFor="report-reason" className="block text-xs font-semibold text-slate-300">
                Reason for Report <span className="text-rose-400">*</span>
              </label>
              <select
                id="report-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 transition-colors"
                required
              >
                {REPORT_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Details textarea */}
            <div className="space-y-1.5">
              <label htmlFor="report-details" className="block text-xs font-semibold text-slate-300">
                Additional Details (Optional)
              </label>
              <textarea
                id="report-details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Describe the issue, specific visual artifact, or copyright reference..."
                rows={3}
                maxLength={1000}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 transition-colors resize-none"
              />
            </div>

            {/* Contact Email */}
            <div className="space-y-1.5">
              <label htmlFor="report-email" className="block text-xs font-semibold text-slate-300">
                Your Email (Optional, for follow-up resolution)
              </label>
              <input
                type="email"
                id="report-email"
                value={reporterEmail}
                onChange={(e) => setReporterEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 transition-colors"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-800 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="min-h-[44px] flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-sm font-semibold text-white shadow-lg shadow-rose-950/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:opacity-50 transition-all cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit Report</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
