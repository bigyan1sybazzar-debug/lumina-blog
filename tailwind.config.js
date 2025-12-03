/** @type {import('tailwindcss').Config} */
export default {
    // 🟢 FIX: Restricting content paths to only source directories to fix the performance warning.
    content: [
      "./index.html",
      './pages/**/*.{js,ts,jsx,tsx}',
      './components/**/*.{js,ts,jsx,tsx}',
      './layouts/**/*.{js,ts,jsx,tsx}',
      './services/**/*.{js,ts,jsx,tsx}',
      './lib/**/*.{js,ts,jsx,tsx}',
    ],
    darkMode: 'class',
    theme: {
      extend: {
        colors: {
          primary: {
            // You must ensure shades 500, 600, 700, and 800 are all present.
            // Example (using default blue shades for illustration):
            50: '#f0f9ff',
            100: '#e0f2fe',
            500: '#0ea5e9',
            600: '#0284c7',
            700: '#0369a1',
            // 🚨 THIS IS THE MISSING CLASS YOU NEED TO ADD/CORRECT 🚨
            800: '#075985', 
            900: '#0c4a6e',
          }
        },
        fontFamily: {
          sans: ['Inter', 'sans-serif'],
          serif: ['Merriweather', 'serif'],
        }
      },
    },
    plugins: [],
  }