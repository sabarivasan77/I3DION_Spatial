import React from 'react';
import { cx } from '../utils/format';

interface LogoProps {
  variant?: 'full' | 'icon' | 'dark' | 'white' | 'text';
  theme?: 'dark' | 'light';
  className?: string;
  height?: number | string;
}

export function Logo({ variant = 'full', theme = 'light', className, height }: LogoProps) {
  const isDark = theme === 'dark';

  let logoSrc = '/images/logos/01_full_logo_primary.png';

  if (variant === 'icon') {
    logoSrc = isDark ? '/images/logos/07_icon_only_dark.png' : '/images/logos/03_icon_only.png';
  } else if (variant === 'text') {
    logoSrc = isDark ? '/images/logos/06_text_only_dark.png' : '/images/logos/02_text_only_wordmark.png';
  } else if (variant === 'white' || isDark) {
    logoSrc = '/images/logos/05_full_logo_dark.png';
  }

  const defaultHeightClass = variant === 'icon' ? 'h-8 md:h-9' : 'h-9 md:h-10';

  return (
    <img
      src={logoSrc}
      alt="I3DION Spatial"
      className={cx(
        height ? '' : defaultHeightClass,
        "w-auto object-contain shrink-0 transition-all duration-200 hover:scale-[1.02]",
        className
      )}
      style={height ? { height } : undefined}
      loading="eager"
    />
  );
}
