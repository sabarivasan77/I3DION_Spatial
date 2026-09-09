import React from 'react';

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

/**
 * BrandLogo - Centralized component for rendering organization and default branding logos.
 * Handles graceful fallbacks and proper variant selection.
 */
export function BrandLogo({ 
  variant = 'primary', 
  orgLogoUrl, 
  className = '', 
  fallbackToDefault = true,
  alt = 'Logo',
  ...props 
}: BrandLogoProps) {
  
  // If organization logo is provided, we prefer that for customer-facing experiences.
  // Note: custom org logos might not have all variants (they usually just upload one).
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

  // Map variants to actual filenames inside public/images/logos/
  const variantMap: Record<LogoVariant, string> = {
    'primary': '/images/logos/01_full_logo_primary.png',
    'text': '/images/logos/02_text_only_wordmark.png',
    'icon': '/images/logos/03_icon_only.png',
    'black': '/images/logos/04_black_and_white.png',
    'dark': '/images/logos/05_full_logo_dark.png',
    'text-dark': '/images/logos/06_text_only_dark.png',
    'icon-dark': '/images/logos/07_icon_only_dark.png',
    'white': '/images/logos/08_white_only.png',
  };

  const src = variantMap[variant] || variantMap['primary'];

  return (
    <img 
      src={src} 
      alt={alt || 'I3DION Spatial'}
      className={`object-contain ${className}`}
      loading="lazy"
      {...props}
    />
  );
}
