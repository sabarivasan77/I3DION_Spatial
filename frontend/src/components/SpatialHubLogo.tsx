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
        <img
          src="/assets/logos/hub.png"
          alt="I3DION Spatial Hub"
          className="w-full h-full object-contain drop-shadow-md"
        />
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
