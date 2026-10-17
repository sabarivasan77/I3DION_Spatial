/**
 * I3DION Design System v1.0 — Design Tokens
 * Industrial precision, high-contrast, calm ergonomics.
 */

export const tokens = {
  colors: {
    // Brand Foundations
    primary: '#2563EB',         // Spatial Blue
    primaryHover: '#1D4ED8',
    primaryLight: '#EFF6FF',
    navy: '#0F172A',            // Deep Navy
    white: '#FFFFFF',

    // Neutral Slate Scale (WCAG 2.2 AA compliant)
    slate: {
      50: '#F8FAFC',
      100: '#F1F5F9',
      200: '#E2E8F0',
      300: '#CBD5E1',
      400: '#94A3B8',
      500: '#64748B',
      600: '#475569',
      700: '#334155',
      800: '#1E293B',
      900: '#0F172A',
      950: '#020617',
    },

    // Semantic Status Colors
    status: {
      success: '#22C55E',
      successLight: '#F0FDF4',
      warning: '#F59E0B',
      warningLight: '#FFFBEB',
      error: '#EF4444',
      errorLight: '#FEF2F2',
      info: '#3B82F6',
      infoLight: '#EFF6FF',
    },

    // Product Wayfinding Accents (strictly controlled, small highlights)
    products: {
      hub: '#4F46E5',           // Indigo (Public Discovery)
      vault: '#D97706',         // Warm Amber (Authoritative Data)
      studio: '#2563EB',        // Spatial Blue (Catalog Composer)
      engine: '#0891B2',        // Technical Cyan (3D/AR Experience)
      lens: '#059669',          // Emerald (Telemetry & Intent)
      core: '#6366F1',          // Violet (Identity & Org)
    },

    // Technical Blueprint Line Accent (for dimension lines & technical callouts)
    blueprint: {
      line: '#06B6D4',
      dim: '#0891B2',
      grid: 'rgba(6, 182, 212, 0.12)',
      bg: '#0F172A',
    }
  },

  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    sizes: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',      // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem',// 30px
    },
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    }
  },

  radii: {
    sm: '0.25rem',      // 4px
    md: '0.5rem',       // 8px (base standard)
    lg: '0.75rem',      // 12px (cards, dialogs)
    xl: '1rem',         // 16px (major panels)
    full: '9999px',
  },

  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    elevated: '0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.06)',
  },

  motion: {
    durations: {
      micro: '120ms',
      standard: '200ms',
      spatial: '320ms',
    },
    easings: {
      standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      emphasized: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
      decelerate: 'cubic-bezier(0.0, 0.0, 0.0, 1)',
    }
  }
};
