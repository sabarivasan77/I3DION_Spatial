export interface ColorToken {
  name: string;
  value: string;
  label: string;
}

export interface DesignTokens {
  colors: {
    primary: string;
    secondary: string;
    surface: string;
    background: string;
    text: string;
    muted: string;
    accent: string;
    border: string;
  };
  typography: {
    fontFamilies: string[];
    fontSizes: Record<string, number>;
    fontWeights: Record<string, number>;
  };
  spacing: number[];
  borderRadius: Record<string, number>;
  shadows: Record<string, string>;
}

export const defaultDesignTokens: DesignTokens = {
  colors: {
    primary: '#2563eb',
    secondary: '#4f46e5',
    surface: '#ffffff',
    background: '#f8fafc',
    text: '#0f172a',
    muted: '#64748b',
    accent: '#06b6d4',
    border: '#e2e8f0',
  },
  typography: {
    fontFamilies: ['Inter, sans-serif', 'Roboto, sans-serif', 'Outfit, sans-serif', 'monospace'],
    fontSizes: { xs: 12, sm: 14, base: 16, lg: 18, xl: 24, '2xl': 32, '3xl': 40 },
    fontWeights: { normal: 400, medium: 500, semibold: 600, bold: 700 },
  },
  spacing: [0, 4, 8, 12, 16, 24, 32, 48, 64],
  borderRadius: { none: 0, sm: 4, md: 8, lg: 12, xl: 16, full: 9999 },
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  },
};
