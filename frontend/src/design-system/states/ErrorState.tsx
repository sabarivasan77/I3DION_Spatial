import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Failed to load data',
  message = 'An unexpected network or service error occurred. Please try again.',
  onRetry,
  className = '',
}) => {
  return (
    <div className={`rounded-xl border border-red-200 bg-red-50/40 p-8 text-center ${className}`}>
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600">
        <AlertTriangle className="h-6 w-6" />
      </div>

      <h3 className="mt-3 text-base font-semibold text-slate-900">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">{message}</p>

      {onRetry && (
        <div className="mt-5">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400/20"
          >
            <RefreshCw className="h-4 w-4" />
            Retry Request
          </button>
        </div>
      )}
    </div>
  );
};
