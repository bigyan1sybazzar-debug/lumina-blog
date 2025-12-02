// vite.config.ts

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react({
        // Fast Refresh is ON by default in Vite 5+ → no need to set it
        // Just keep the plugin and you're good
      }),
    ],

    base: '/',

    define: {
      // Make env vars available as import.meta.env.VITE_...
      ...Object.fromEntries(
        Object.entries(env).map(([key, value]) => [
          `import.meta.env.${key}`,
          JSON.stringify(value),
        ])
      ),
    },

    // HUGE speed boost: pre-bundle Firebase modular SDK
    optimizeDeps: {
      include: [
        'firebase/app',
        'firebase/auth',
        'firebase/firestore',
      ],
    },

    build: {
      target: 'es2022',
      rollupOptions: {
        output: {
          manualChunks: {
            firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
            lucide: ['lucide-react'],
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },

    server: {
      port: 5173,
      open: true,
    },

    clearScreen: false,
  };
});