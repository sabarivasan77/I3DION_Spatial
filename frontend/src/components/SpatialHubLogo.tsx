import React from 'react';

interface SpatialHubLogoProps {
  variant?: 'light' | 'dark' | 'monochrome';
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export const SpatialHubLogo: React.FC<SpatialHubLogoProps> = ({
  variant = 'dark',
  size = 'md',
  showTagline = false,
}) => {
  const isDark = variant === 'dark';

  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  };

  const titleSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
  };

  const subTitleSizes = {
    sm: 'text-[9px]',
    md: 'text-[10px]',
    lg: 'text-xs',
  };

  return (
    <div className="flex items-center gap-3 select-none">
      {/* 3D Perspective Gateway Logo Mark */}
      <div className={`relative flex items-center justify-center ${iconSizes[size]} shrink-0`}>
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Left Solid Polygon */}
          <path d="M20 25 L50 10 L50 85 L20 70 Z" fill={variant === 'monochrome' ? '#64748B' : '#0EA5E9'} />
          {/* Top Perspective Face */}
          <path d="M50 10 L80 25 L50 40 L20 25 Z" fill={variant === 'monochrome' ? '#334155' : '#2563EB'} />
          {/* Right Gateway Glass Face */}
          <path d="M50 40 L80 25 L80 75 L50 90 Z" fill={variant === 'monochrome' ? '#0F172A' : '#38BDF8'} fillOpacity="0.9" />
          {/* Inner Gateway Frame Line */}
          <path d="M50 40 L50 90" stroke="#FFFFFF" strokeWidth="2.5" strokeOpacity="0.4" />
        </svg>
      </div>

      {/* Typography */}
      <div className="flex flex-col">
        <div className="flex items-baseline gap-1">
          <span className={`font-black tracking-tight ${titleSizes[size]} ${isDark ? 'text-white' : 'text-slate-900'}`}>
            I3DION
          </span>
          <span className="text-[10px] font-bold text-blue-500">™</span>
        </div>
        <span
          className={`font-extrabold uppercase tracking-[0.22em] ${subTitleSizes[size]} ${
            isDark ? 'text-slate-300' : 'text-slate-600'
          }`}
        >
          SPATIAL HUB
        </span>
        {showTagline && (
          <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
            DISCOVER • EXPERIENCE • CONNECT
          </span>
        )}
      </div>
    </div>
  );
};
