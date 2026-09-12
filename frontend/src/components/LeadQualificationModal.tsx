import { useState } from 'react';
import { X, Sparkles, Send, CheckCircle2, ShieldCheck, Building2, User, Mail, Phone, Briefcase } from 'lucide-react';
import { LeadEngine } from '../services/leadEngine';

interface LeadQualificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName?: string;
  productId?: string;
}

export function LeadQualificationModal({
  isOpen,
  onClose,
  productName = 'Industrial 3D Asset',
  productId,
}: LeadQualificationModalProps) {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    designation: '',
    interest: 'Technical Specifications',
    notes: '',
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    LeadEngine.submitLeadForm({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      company: formData.company,
      designation: formData.designation,
      productInterested: productName,
      notes: `Interest Area: ${formData.interest}${formData.notes ? `\nUser Notes: ${formData.notes}` : ''}`,
      source: 'Public Product Viewer Qualification Modal',
      productId,
    });

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 2200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200 text-slate-900 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
        >
          <X size={20} />
        </button>

        {submitted ? (
          <div className="py-10 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">Request Sent Successfully!</h3>
            <p className="text-sm text-slate-600 max-w-sm mx-auto">
              Our engineering team has received your inquiry for <span className="font-semibold text-blue-600">{productName}</span>. We will follow up shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Request Product Information</h3>
                <p className="text-xs text-slate-500">Connect with technical specialists for <span className="font-semibold text-slate-700">{productName}</span></p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Work Email *</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="john@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone / Mobile</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Org</label>
                <div className="relative">
                  <Building2 size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Industrial Corp"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Interest Area</label>
              <select
                value={formData.interest}
                onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="Technical Specifications">Technical Specifications & CAD Data</option>
                <option value="Pricing & Quotation">Enterprise Pricing & Quotation</option>
                <option value="Bulk Deployment">Bulk Deployment / Custom AR Integration</option>
                <option value="Live Demonstration">Schedule Live Demonstration</option>
              </select>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span>Privacy Protected. No Spam.</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Skip
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition shadow-md flex items-center gap-2"
                >
                  <Send size={16} />
                  Submit Request
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
