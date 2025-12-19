import { defineConfig, loadEnv, type UserConfig } from 'vite'
import react from '@vitejs/plugin-react'

// We extend the Vite UserConfig with SSG options to satisfy TypeScript
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
      // Fixed the "ERR_MODULE_NOT_FOUND" for react-syntax-highlighter
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
      // Using direct env object is safer for Vite's internal replacement engine
      'process.env': env,
      'global': 'globalThis',
    },
    
    resolve: {
      alias: {
        // Direct fix for the specific broken ESM path in the syntax highlighter
        'react-syntax-highlighter/dist/esm/styles/prism/coy': 'react-syntax-highlighter/dist/cjs/styles/prism/coy.js',
      }
    }
  }
})