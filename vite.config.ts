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
      formatting: 'none',
    },

    ssr: {
      noExternal: [
        'react-helmet-async',
        'react-syntax-highlighter',
        'react-router-dom',
        'lucide-react',
        'react-slick',
        'slick-carousel',
      ],
    },

    server: {
      port: 5173,
    },

    preview: {
      port: 5173,
    },

    define: {
      'process.env': env,
      global: 'globalThis',
    },

    resolve: {
      alias: {
        // Fix ESM/CJS issue with syntax highlighter
        'react-syntax-highlighter/dist/esm/styles/prism/coy':
          'react-syntax-highlighter/dist/cjs/styles/prism/coy.js',
      },
    },
  }
})
