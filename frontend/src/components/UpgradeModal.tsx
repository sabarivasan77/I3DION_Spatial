import React from 'react';
import { Sparkles, AlertCircle, ArrowUpRight } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  currentCount?: number;
  limitCount?: number;
  onUpgradeClick: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  title = 'Plan Limit Reached',
  message = 'You have reached the maximum allowance for your current SaaS plan.',
  currentCount,
  limitCount,
  onUpgradeClick
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center space-x-3 text-amber-400">
          <div className="p-3 bg-amber-500/10 rounded-xl">
            <AlertCircle className="w-6 h-6 text-amber-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-100">{title}</h3>
        </div>

        <p className="text-slate-300 text-sm leading-relaxed">{message}</p>

        {limitCount !== undefined && (
          <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50 flex justify-between items-center text-sm">
            <span className="text-slate-400">Current Usage</span>
            <span className="font-semibold text-slate-200">
              {currentCount} / <span className="text-amber-400 font-bold">{limitCount}</span>
            </span>
          </div>
        )}

        <div className="flex space-x-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl text-slate-400 border border-slate-700 hover:bg-slate-800 transition font-medium text-sm"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onClose();
              onUpgradeClick();
            }}
            className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-blue-500/20 flex items-center justify-center space-x-2 transition"
          >
            <Sparkles className="w-4 h-4" />
            <span>Upgrade Plan</span>
            <ArrowUpRight className="w-4 h-4 opacity-70" />
          </button>
        </div>
      </div>
    </div>
  );
};
