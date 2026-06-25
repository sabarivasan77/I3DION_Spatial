/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#2563EB',
        'primary-dark': '#004AC6',
        'primary-fixed': '#DBE1FF',
        navy: '#0F172A',
        surface: '#FAF8FF',
        background: '#F8FAFC',
        'surface-container': '#EDEDF9',
        'surface-container-low': '#F3F3FE',
        'surface-container-high': '#E7E7F3',
        'on-surface': '#191B23',
        'on-surface-variant': '#64748B',
        outline: '#737686',
        'outline-variant': '#C3C6D7',
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 12px rgba(15, 23, 42, 0.08)',
        modal: '0 12px 24px rgba(15, 23, 42, 0.15)',
      },
    },
  },
  plugins: [],
};
