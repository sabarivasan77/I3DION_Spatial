import { useState, useEffect } from 'react';
import { X, Send, User, Building, Mail, Phone, Lock } from 'lucide-react';
import { Tracker } from '../services/Tracker';

import { motion, AnimatePresence } from 'framer-motion';

export function SmartLeadCapture() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasDismissed, setHasDismissed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    company: ''
  });

  useEffect(() => {
    // Check if user has already submitted or is logged in
    const isRegistered = localStorage.getItem('i3dion:registered') === 'true';
    if (isRegistered || hasDismissed) return;

    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 5500); // 5.5 seconds delay

    return () => clearTimeout(timer);
  }, [hasDismissed]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;

    setSubmitting(true);
    try {
      await fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'}/public/analytics/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'user_register',
          visitorId: Tracker.getVisitorId(),
          metadata: {
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
            company: formData.company,
            source: 'Smart Lead Capture'
          }
        })
      });

      localStorage.setItem('i3dion:registered', 'true');
      setIsOpen(false);
    } catch (err) {
      console.error('Failed to submit lead', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    setIsOpen(false);
    setHasDismissed(true);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-md overflow-hidden rounded-[2rem] bg-white p-8 shadow-2xl"
          >
            <button
              onClick={handleSkip}
              className="absolute right-6 top-6 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <X size={20} />
            </button>
            
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-xl shadow-slate-900/20">
                <Lock size={28} />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">Unlock Full Access</h2>
              <p className="mt-2 text-sm text-slate-500">
                Join to explore our premium 3D models and technical specifications.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  required
                  type="text"
                  placeholder="Full Name *"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-12 w-full rounded-2xl border-none bg-slate-50 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none ring-1 ring-slate-200 transition focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  required
                  type="tel"
                  placeholder="Mobile Number *"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="h-12 w-full rounded-2xl border-none bg-slate-50 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none ring-1 ring-slate-200 transition focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="email"
                  placeholder="Work Email (Optional)"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-12 w-full rounded-2xl border-none bg-slate-50 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none ring-1 ring-slate-200 transition focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="relative">
                <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Company Name (Optional)"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="h-12 w-full rounded-2xl border-none bg-slate-50 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none ring-1 ring-slate-200 transition focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-slate-950 px-8 font-semibold text-white transition hover:bg-slate-900 disabled:opacity-70"
                >
                  <span className="relative z-10">{submitting ? 'Unlocking...' : 'Continue'}</span>
                  <Send size={18} className="relative z-10 transition-transform group-hover:translate-x-1" />
                </button>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleSkip}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition"
                >
                  Skip for now
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
