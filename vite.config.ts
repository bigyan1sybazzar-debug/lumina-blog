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
      formatting: 'minify',
    },

    ssr: {
      // This forces the SSG engine to bundle these libraries correctly
      noExternal: [
        'react-helmet-async',
        'react-syntax-highlighter',
        'react-router-dom',
        'lucide-react',
        'react-slick',
        'slick-carousel'
      ],
    },

    preview: { port: 5173 },
    server: { port: 5173 },

    define: {
      'process.env': env,
      'global': 'globalThis',
    },
    
    resolve: {
      alias: {
        // Fixes the SyntaxHighlighter ESM issue
        'react-syntax-highlighter/dist/esm/styles/prism/coy': 'react-syntax-highlighter/dist/cjs/styles/prism/coy.js',
        // Fixes the "Named Export" issue by pointing to the main file
        'react-helmet-async': 'react-helmet-async'
      }
    }
  }
})