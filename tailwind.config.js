/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Hanken Grotesk', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        // Existing intermediate slate shades (kept for any residual usage)
        slate: {
          450: '#8695a9',
          550: '#576274',
          650: '#3e4c61',
          750: '#293548',
          755: '#27334a',
          805: '#1c2636',
          850: '#172033',
        },
        // ── Design system semantic accent colors ────────────────
        accent:    '#6d5cf0',    // violet — active / in-progress / primary action
        gain:      '#2faa78',    // green — completed / done / positive delta
        'gain-t':  '#5cc99a',    // green text on dark backgrounds
        peak:      '#e0a93b',    // amber — PR / milestone / RPE 9+ warning
        // ── Background tokens ────────────────────────────────────
        canvas:       '#101725', // screen background
        'surf':       '#182031', // default card surface
        'surf-hi':    '#1b2538', // card in violet/active state
        'surf-ok':    '#16241f', // card in green/complete state
        'surf-nav':   '#131b29', // bottom navigation bar
        'surf-chip':  '#222e44', // icon buttons, quiet chips
        // ── Border tokens ────────────────────────────────────────
        'line-sub':   '#1d2738', // section dividers, card borders
        'line-c':     '#232e42', // default card border
        'line-hi':    '#2e3a52', // violet-state card border
        'line-ok':    '#21433a', // green-state card border
        'line-in':    '#34415c', // input field border
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.3s ease-out',
        slideUp: 'slideUp 0.35s ease-out',
      },
    },
  },
  plugins: [],
}
