import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'card' | 'table' | 'thumbnail';
  count?: number;
}

export const SkeletonLoader: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  count = 1,
}) => {
  const items = Array.from({ length: count });

  if (variant === 'card') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {items.map((_, i) => (
          <div key={i} className={`rounded-xl border border-slate-200 bg-white p-5 space-y-4 animate-pulse ${className}`}>
            <div className="h-44 bg-slate-100 rounded-lg w-full flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-slate-200" />
            </div>
            <div className="space-y-2">
              <div className="h-5 bg-slate-200 rounded w-3/4" />
              <div className="h-4 bg-slate-100 rounded w-1/2" />
            </div>
            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <div className="h-4 bg-slate-100 rounded w-1/4" />
              <div className="h-4 bg-slate-100 rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className={`rounded-xl border border-slate-200 bg-white overflow-hidden animate-pulse ${className}`}>
        <div className="h-12 bg-slate-50 border-b border-slate-200 px-6 flex items-center gap-6">
          <div className="h-4 bg-slate-200 rounded w-1/4" />
          <div className="h-4 bg-slate-200 rounded w-1/4" />
          <div className="h-4 bg-slate-200 rounded w-1/4" />
          <div className="h-4 bg-slate-200 rounded w-1/6" />
        </div>
        {items.map((_, i) => (
          <div key={i} className="h-14 border-b border-slate-100 px-6 flex items-center gap-6">
            <div className="h-4 bg-slate-100 rounded w-1/4" />
            <div className="h-4 bg-slate-100 rounded w-1/4" />
            <div className="h-4 bg-slate-100 rounded w-1/4" />
            <div className="h-4 bg-slate-100 rounded w-1/6" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'thumbnail') {
    return (
      <div className={`w-16 h-16 rounded-lg bg-slate-100 animate-pulse flex items-center justify-center ${className}`}>
        <div className="w-6 h-6 rounded bg-slate-200" />
      </div>
    );
  }

  return (
    <div className={`space-y-2.5 animate-pulse ${className}`}>
      {items.map((_, i) => (
        <div key={i} className="h-4 bg-slate-200 rounded w-full" />
      ))}
    </div>
  );
};
