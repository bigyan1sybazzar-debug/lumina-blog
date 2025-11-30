// vite.config.ts
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react()],

    base: "/", // Must be "/" for Vercel/Netlify

    define: {
      'process.env': Object.fromEntries(
        Object.entries(env).map(([k, v]) => [k, JSON.stringify(v)])
      ),
    },

    // Removed rollupOptions.input → no more error
    // Sitemap is now generated separately → perfect
  };
});