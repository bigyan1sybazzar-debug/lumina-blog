/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./layouts/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  darkMode: 'class',

  theme: {
    extend: {
      colors: {
        primary: {
          light: '#EF4444',
          dark: '#F97316',
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444', // Red-500
          600: '#DC2626', // Red-600
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
          950: '#450A0A',
          DEFAULT: '#EF4444',
        },
        secondary: {
          light: '#3B82F6',
          dark: '#8B5CF6',
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6', // Blue-500
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
          950: '#172554',
          DEFAULT: '#3B82F6',
        },
        accent: {
          success: '#10B981', // Emerald
          warning: '#F59E0B', // Amber
          premium: '#EAB308', // Yellow
        },
        surface: {
          light: {
            50: '#FFFFFF',
            100: '#F9FAFB',
            200: '#F3F4F6',
          },
          dark: {
            950: '#030712',
            900: '#111827',
            800: '#1F2937',
          }
        }
      },
      borderRadius: {
        'card': '1.5rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
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