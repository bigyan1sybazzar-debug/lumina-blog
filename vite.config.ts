// vite.config.ts
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react()],

    base: "/", // Must stay "/" for Vercel/Netlify

    define: {
      'process.env': Object.fromEntries(
        Object.entries(env).map(([k, v]) => [k, JSON.stringify(v)])
      ),
    },

    // This makes /sitemap.xml work as a dynamic API route
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          // This line adds your dynamic sitemap route
          'sitemap.xml': resolve(__dirname, 'src/routes/sitemap.xml.ts'),
        },
      },
    },

    // Optional: better dev server experience
    server: {
      port: 5173,
      strictPort: true,
    },
  };
});