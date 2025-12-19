import { defineConfig, loadEnv, type UserConfig } from 'vite'
import react from '@vitejs/plugin-react'
import type { ViteReactSSGOptions } from 'vite-react-ssg'

interface Config extends UserConfig {
  ssgOptions?: ViteReactSSGOptions
}

export default defineConfig(({ mode }): Config => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],

    // Force Vite to handle these problematic CJS libraries during build
    ssr: {
      noExternal: [
        'react-helmet-async',
        'react-syntax-highlighter',
        'react-router-dom',
        'lucide-react',
        'react-slick',
        'slick-carousel',
        // This catch-all helps with sub-modules inside these libraries
        /react-helmet-async/,
      ],
    },

    ssgOptions: {
      script: 'async',
  
    },

    preview: {
      port: 5173,
    },
    server: {
      port: 5173,
    },

    define: {
      // Direct replacement for environment variables
      'process.env': env,
      'global': 'globalThis',
    },
    
    resolve: {
      alias: {
        // Fix for syntax highlighter ESM bug
        'react-syntax-highlighter/dist/esm/styles/prism/coy': 'react-syntax-highlighter/dist/cjs/styles/prism/coy.js',
        // IMPORTANT: If you keep getting the Helmet error, this alias forces the CJS version
        'react-helmet-async': 'react-helmet-async/lib/index.js',
      }
    },

    optimizeDeps: {
      include: ['react-helmet-async', 'react-syntax-highlighter'],
    }
  }
})