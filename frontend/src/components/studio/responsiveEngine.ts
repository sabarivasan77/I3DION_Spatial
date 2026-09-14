export type Breakpoint = 'desktop' | 'tablet' | 'mobile';

export interface ResponsiveProps {
  desktop?: Record<string, any>;
  tablet?: Record<string, any>;
  mobile?: Record<string, any>;
}

export const responsiveEngine = {
  resolveProps: (baseProps: Record<string, any>, responsiveOverrides: ResponsiveProps = {}, breakpoint: Breakpoint): Record<string, any> => {
    let resolved = { ...baseProps };

    // Desktop base
    if (responsiveOverrides.desktop) {
      resolved = { ...resolved, ...responsiveOverrides.desktop };
    }

    // Tablet override inherits desktop
    if ((breakpoint === 'tablet' || breakpoint === 'mobile') && responsiveOverrides.tablet) {
      resolved = { ...resolved, ...responsiveOverrides.tablet };
    }

    // Mobile override inherits tablet & desktop
    if (breakpoint === 'mobile' && responsiveOverrides.mobile) {
      resolved = { ...resolved, ...responsiveOverrides.mobile };
    }

    return resolved;
  },

  getBreakpointWidth: (breakpoint: Breakpoint): number => {
    switch (breakpoint) {
      case 'desktop': return 1280;
      case 'tablet': return 768;
      case 'mobile': return 375;
    }
  }
};
