import { useState, useEffect } from 'react';
import { X, Send, User, Building, Mail, Phone, Lock } from 'lucide-react';
import { Tracker } from '../services/Tracker';

import { motion, AnimatePresence } from 'framer-motion';

interface SmartLeadCaptureProps {
  isOpen?: boolean;
  onClose?: () => void;
  productSlug?: string;
  intent?: 'quote' | 'demo' | 'brochure' | 'contact';
  customTitle?: string;
}

export function SmartLeadCapture({
  isOpen: externalIsOpen,
  onClose,
  productSlug,
  intent = 'quote',
  customTitle,
}: SmartLeadCaptureProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [hasDismissed, setHasDismissed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    company: '',
    message: '',
  });

  useEffect(() => {
    if (externalIsOpen !== undefined) return;
    // Auto-trigger fallback for un-dismissed visitors
    const isRegistered = localStorage.getItem('i3dion:registered') === 'true';
    if (isRegistered || hasDismissed) return;

    const timer = setTimeout(() => {
      setInternalIsOpen(true);
    }, 12000); // 12 seconds auto-prompt

    return () => clearTimeout(timer);
  }, [hasDismissed, externalIsOpen]);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setInternalIsOpen(false);
    }
    setHasDismissed(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || (!formData.email && !formData.phone)) return;

    setSubmitting(true);
    try {
      const visitorId = localStorage.getItem('i3dion_visitor_id') || `v_${Date.now()}`;
      const res = await fetch(`${import.meta.env.VITE_API_URL ?? '/api'}/public/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: productSlug || 'default',
          visitorId,
          name: formData.name,
          email: formData.email || `${formData.phone.replace(/[^0-9]/g, '')}@lead.i3dion.com`,
          phone: formData.phone,
          company: formData.company,
          intent,
          message: formData.message,
        }),
      });

      if (res.ok) {
        localStorage.setItem('i3dion:registered', 'true');
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          handleClose();
        }, 2000);
      }
    } catch (err) {
      console.error('Failed to submit lead', err);
    } finally {
      setSubmitting(false);
    }
  };

  const getTitle = () => {
    if (customTitle) return customTitle;
    switch (intent) {
      case 'quote': return 'Request Enterprise Pricing';
      case 'demo': return 'Schedule 3D & AR Demo';
      case 'brochure': return 'Download Technical Specs';
      default: return 'Get in Touch with Sales';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-8 text-white shadow-2xl"
          >
            <button
              onClick={handleClose}
              className="absolute right-5 top-5 rounded-full p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            >
              <X size={20} />
            </button>

            {success ? (
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
                  <Send size={32} />
                </div>
                <h3 className="text-2xl font-bold text-white">Request Received!</h3>
                <p className="mt-2 text-sm text-slate-400">
                  Our spatial expert will be in touch shortly.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-6 text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                    <Lock size={24} />
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-white">{getTitle()}</h2>
                  <p className="mt-1.5 text-xs text-slate-400">
                    Enter your contact info to receive detailed specifications and custom quotes.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3.5">
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                      required
                      type="text"
                      placeholder="Full Name *"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950/60 pl-11 pr-4 text-sm font-medium text-white placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                      type="email"
                      placeholder="Work Email *"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950/60 pl-11 pr-4 text-sm font-medium text-white placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                      type="tel"
                      placeholder="Phone Number (Optional)"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950/60 pl-11 pr-4 text-sm font-medium text-white placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="relative">
                    <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                      type="text"
                      placeholder="Company Name (Optional)"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950/60 pl-11 pr-4 text-sm font-medium text-white placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-blue-600 px-8 font-semibold text-white transition hover:bg-blue-500 disabled:opacity-70 shadow-lg shadow-blue-600/25"
                    >
                      <span className="relative z-10">{submitting ? 'Submitting...' : 'Submit Request'}</span>
                      <Send size={18} className="relative z-10 transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="text-xs font-medium text-slate-500 hover:text-slate-400 transition"
                    >
                      Dismiss for now
                    </button>
                  </div>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
