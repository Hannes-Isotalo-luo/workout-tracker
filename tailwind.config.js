/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      // Intermediate slate shades used throughout the UI for subtle hover/border
      // states. Tailwind's default scale jumps in 100s; these fill the gaps so
      // classes like `bg-slate-750` actually render instead of silently no-op'ing.
      colors: {
        slate: {
          450: '#8695a9',
          550: '#576274',
          650: '#3e4c61',
          750: '#293548',
          755: '#27334a',
          805: '#1c2636',
          850: '#172033',
        },
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
