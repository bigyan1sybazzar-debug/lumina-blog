import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],

    server: {
      port: 5173,
      strictPort: true,
      host: true,
      // PROXY CONFIGURATION START
      proxy: {
        '/api-video': {
          target: 'https://social-media-video-downloder.p.rapidapi.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api-video/, ''),
        },
        '/api-gmail': {
          target: 'https://temporary-gmail-account.p.rapidapi.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api-gmail/, ''),
        },
        // Inside vite.config.ts -> server -> proxy:
'/api-google-translate': {
  target: 'https://translate.googleapis.com',
  changeOrigin: true,
  rewrite: (path) => path.replace(/^\/api-google-translate/, ''),
}
      }
      // PROXY CONFIGURATION END
    },

    preview: {
      port: 5173,
      strictPort: true,
    },

    define: {
      'process.env': Object.fromEntries(
        Object.entries(env).map(([k, v]) => [k, JSON.stringify(v)])
      ),
    },

    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
          },
        },
      },
    },
  }
})