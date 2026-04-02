/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Satoshi', 'sans-serif'],
      },
      colors: {
        primary:      '#0F172A',
        accent:       '#6366F1',
        'accent-light': '#EEF2FF',
        success:      '#10B981',
        warning:      '#F59E0B',
        danger:       '#EF4444',
        muted:        '#64748B',
        border:       '#E2E8F0',
        surface:      '#F8FAFC',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
}
