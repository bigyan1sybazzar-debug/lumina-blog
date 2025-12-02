import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    base: '/',
    
    define: {
      'import.meta.env.VITE_REVALIDATE_SECRET': JSON.stringify(env.VITE_REVALIDATE_SECRET || ''),
    },
    
    optimizeDeps: {
      include: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
    },
    
    build: {
      target: 'es2022',
      chunkSizeWarningLimit: 1000,
    },
    
    server: {
      port: 5173,
      open: true,
      host: true,
      
      // ADD PROXY FOR API ROUTES
      proxy: {
        '/api': {
          target: 'http://localhost:3000', // Your API server (if you have one)
          changeOrigin: true,
          // Or for serverless functions in dev, create a dev server
        },
      },
    },
    
    clearScreen: false,
  };
});