import React from 'react';
import { Logo } from './Logo';

type LogoVariant = 
  | 'primary'    // Used on light backgrounds (color)
  | 'dark'       // Used on dark backgrounds (color/light)
  | 'white'      // Solid white for dark backgrounds
  | 'black'      // Solid black for light backgrounds
  | 'icon'       // Icon only
  | 'icon-dark'  // Icon only for dark backgrounds
  | 'text'       // Text wordmark only
  | 'text-dark'; // Text wordmark for dark backgrounds

interface BrandLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  variant?: LogoVariant;
  orgLogoUrl?: string | null;
  className?: string;
  fallbackToDefault?: boolean;
}

export function BrandLogo({ 
  variant = 'primary', 
  orgLogoUrl, 
  className = '', 
  fallbackToDefault = true,
  alt = 'I3DION Spatial',
  ...props 
}: BrandLogoProps) {
  
  if (orgLogoUrl) {
    return (
      <img 
        src={orgLogoUrl} 
        alt={alt}
        className={`object-contain ${className}`}
        loading="lazy"
        {...props}
      />
    );
  }

  if (!fallbackToDefault) {
    return null;
  }

  const isDark = variant === 'dark' || variant === 'white' || variant === 'text-dark' || variant === 'icon-dark';
  const isIconOnly = variant === 'icon' || variant === 'icon-dark';

  return (
    <Logo 
      variant={isIconOnly ? 'icon' : 'full'} 
      theme={isDark ? 'dark' : 'light'} 
      className={className} 
    />
  );
}
