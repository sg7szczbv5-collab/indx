/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#0F172A', 800: '#1E293B', 700: '#334155', 950: '#070B16' },
        saudi: { DEFAULT: '#15803D', light: '#22C55E', dark: '#166534' },
        sand: { DEFAULT: '#D97706', light: '#F59E0B', pale: '#FDE68A' },
        snow: '#F8FAFC',
      },
      fontFamily: {
        sans: ['Cairo', 'IBM Plex Sans Arabic', 'system-ui', 'sans-serif'],
        plex: ['IBM Plex Sans Arabic', 'Cairo', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
