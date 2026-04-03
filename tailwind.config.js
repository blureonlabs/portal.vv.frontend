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
        primary:      '#161f3f',
        accent:       '#161f3f',
        'accent-light': '#f0f1f5',
        success:      '#10B981',
        warning:      '#F59E0B',
        danger:       '#EF4444',
        muted:        '#6b7280',
        border:       '#e5e7eb',
        surface:      '#fefefe',
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
