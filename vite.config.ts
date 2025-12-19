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

    ssgOptions: {
      script: 'async',

    },

    ssr: {
      // We removed react-helmet-async from here because you are using <Head />
      noExternal: [
        'react-syntax-highlighter',
        'react-router-dom',
        'lucide-react',
        'react-slick',
        'slick-carousel'
      ],
    },

    preview: {
      port: 5173,
    },
    server: {
      port: 5173,
    },

    define: {
      'process.env': env,
      'global': 'globalThis',
    },
    
    resolve: {
      alias: {
        // Fix for syntax highlighter ESM bug
        'react-syntax-highlighter/dist/esm/styles/prism/coy': 'react-syntax-highlighter/dist/cjs/styles/prism/coy.js',
        
        // This line tells Vite: "If anything tries to import helmet, give it nothing."
        // This stops the SyntaxError: Named export 'HelmetProvider' not found.
        'react-helmet-async': 'identity-obj-proxy', 
      }
    }
  }
})