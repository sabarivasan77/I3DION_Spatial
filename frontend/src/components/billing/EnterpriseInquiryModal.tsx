import React, { useState } from 'react';
import { X, Building2, Mail, User, Phone, CheckCircle2, Send, ShieldAlert } from 'lucide-react';
import { submitEnterpriseInquiry } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

interface EnterpriseInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EnterpriseInquiryModal: React.FC<EnterpriseInquiryModalProps> = ({ isOpen, onClose }) => {
  const { token, user } = useAuthStore();
  const [formData, setFormData] = useState({
    companyName: user?.name || '',
    workEmail: user?.email || '',
    contactName: user?.name || '',
    phone: '',
    expectedProducts: 100,
    expectedCatalogs: 50,
    teamSize: 10,
    message: ''
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      await submitEnterpriseInquiry(token, {
        company_name: formData.companyName,
        work_email: formData.workEmail,
        contact_name: formData.contactName,
        phone: formData.phone,
        expected_product_count: Number(formData.expectedProducts),
        expected_catalog_usage: Number(formData.expectedCatalogs),
        team_size: Number(formData.teamSize),
        message: formData.message
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit Enterprise inquiry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 md:p-8 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-200 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-100">Enterprise Request Received</h2>
            <p className="text-slate-300 text-sm max-w-md mx-auto">
              Thank you for reaching out. Our I3DION Spatial enterprise solutions team will review your organization&apos;s requirements and contact you within 24 hours.
            </p>
            <button
              onClick={onClose}
              className="mt-6 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-blue-400">Enterprise Custom Plan</span>
              <h2 className="text-2xl font-bold text-slate-100 mt-1">Talk to Our Enterprise Team</h2>
              <p className="text-slate-400 text-xs mt-1">
                Custom product quotas, dedicated infrastructure, tailored branding, and SLAs for large industrial companies.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1.5 font-medium flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" /> Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  placeholder="ABC Engineering Ltd."
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1.5 font-medium flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> Work Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.workEmail}
                  onChange={(e) => setFormData({ ...formData, workEmail: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  placeholder="contact@abc-engineering.com"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1.5 font-medium flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" /> Contact Person *
                </label>
                <input
                  type="text"
                  required
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1.5 font-medium flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Expected Products</label>
                <input
                  type="number"
                  min="10"
                  value={formData.expectedProducts}
                  onChange={(e) => setFormData({ ...formData, expectedProducts: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Monthly Catalogs</label>
                <input
                  type="number"
                  min="5"
                  value={formData.expectedCatalogs}
                  onChange={(e) => setFormData({ ...formData, expectedCatalogs: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Team Members</label>
                <input
                  type="number"
                  min="1"
                  value={formData.teamSize}
                  onChange={(e) => setFormData({ ...formData, teamSize: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 mb-1.5 text-xs font-medium">Custom Requirements / Message</label>
              <textarea
                rows={3}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                placeholder="Mention any custom domain, ERP integrations, security compliance, or SLA needs..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition flex items-center gap-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Request Enterprise Plan</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
