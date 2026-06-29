import { useState, useEffect } from 'react';
import { X, ArrowRight, MessageSquare } from 'lucide-react';
import { Tracker } from '../services/Tracker';
import { motion, AnimatePresence } from 'framer-motion';

export function ExitIntentSurvey() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasDismissed, setHasDismissed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const isRegistered = localStorage.getItem('i3dion:registered') === 'true';
    const exitIntentShown = localStorage.getItem('i3dion:exit_intent_shown') === 'true';
    if (isRegistered || exitIntentShown || hasDismissed) return;

    const handleMouseLeave = (e: MouseEvent) => {
      // Trigger when mouse leaves through the top of the window (usually towards address bar/tabs)
      if (e.clientY <= 0) {
        setIsOpen(true);
        localStorage.setItem('i3dion:exit_intent_shown', 'true');
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [hasDismissed]);

  const handleOptionSelect = async (option: string) => {
    setSubmitting(true);
    try {
      await fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'}/public/analytics/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'exit_intent',
          visitorId: Tracker.getVisitorId(),
          metadata: {
            selected_option: option,
            source: 'Exit Intent Survey'
          }
        })
      });

      setIsOpen(false);
    } catch (err) {
      console.error('Failed to submit exit intent', err);
    } finally {
      setSubmitting(false);
      setHasDismissed(true);
    }
  };

  const options = [
    { label: 'Looking to Purchase', value: 'purchase' },
    { label: 'Just Exploring', value: 'exploring' },
    { label: 'Comparing Products', value: 'comparing' },
    { label: 'Need Technical Information', value: 'tech_info' }
  ];

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
              onClick={() => {
                setIsOpen(false);
                setHasDismissed(true);
              }}
              className="absolute right-6 top-6 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <X size={20} />
            </button>
            
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <MessageSquare size={24} />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">Wait! Before you go...</h2>
              <p className="mt-2 text-sm text-slate-500">
                What are you primarily looking for today?
              </p>
            </div>

            <div className="space-y-3">
              {options.map((opt) => (
                <button
                  key={opt.value}
                  disabled={submitting}
                  onClick={() => handleOptionSelect(opt.value)}
                  className="group flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-blue-200 hover:bg-blue-50 hover:shadow-sm"
                >
                  <span className="font-semibold text-slate-700 transition group-hover:text-blue-700">
                    {opt.label}
                  </span>
                  <ArrowRight size={18} className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-500" />
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
