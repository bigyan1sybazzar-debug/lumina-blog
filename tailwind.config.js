/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./layouts/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}", // Extra safety net
  ],

  darkMode: 'class',

  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6', // Vibrant Violet
          600: '#7c3aed', // Rich Purple-Indigo
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        surface: {
          light: '#f8fafc', // Clean Slate/Stone
          dark: '#020617',  // Deep Midnight
          darkElevated: '#0f172a', // Subtle depth for cards
        }
      },

      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-merriweather)', 'Georgia', 'serif'],
      },

      // Optional: nicer transitions & spacing
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      },
    },
  },

  // Critical: Prevent Tailwind from purging your dynamic classes
  safelist: [
    // Font sizes used in PostCard via textSizeClass
    'text-xs',
    'text-sm',
    'text-base',
    'text-lg',
    'text-xl',
    'text-2xl',

    'sm:text-sm',
    'sm:text-base',
    'sm:text-lg',
    'sm:text-xl',

    'md:text-base',
    'md:text-lg',
    'md:text-xl',

    // Font weights
    'font-medium',
    'font-semibold',
    'font-bold',

    // For slider arrows
    'hidden',
    'sm:flex',
  ],

  plugins: [],
};