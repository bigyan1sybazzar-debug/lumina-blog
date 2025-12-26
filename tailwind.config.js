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
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',   // Main brand color
          600: '#0284c7',   // Hover states
          700: '#0369a1',   // Active/darker
          800: '#075985',   // Critical: now included
          900: '#0c4a6e',
          950: '#082f49',
        },
      },

      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Merriweather', 'Georgia', 'serif'],
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