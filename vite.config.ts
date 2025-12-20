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

    // SSG Options
    ssgOptions: {
      script: 'async',
      formatting: 'none'
      // ⚠ Removed useHelmet; now using @unhead/react
    },

    ssr: {
      noExternal: [
        'react-router-dom',
        'react-syntax-highlighter',
        'lucide-react',
        'react-slick',
        'slick-carousel'
      ]
    },

    define: {
      'process.env': env,
      global: 'globalThis'
    },

    server: {
      port: 5173
    },

    preview: {
      port: 5173
    },

    resolve: {
      alias: {
        // Ensure CJS styles work for SSR/SSG
        'react-syntax-highlighter/dist/esm/styles/prism/coy':
          'react-syntax-highlighter/dist/cjs/styles/prism/coy.js'
      }
    }
  }
})
