import { defineConfig, loadEnv, type UserConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { ViteReactSSGOptions } from 'vite-react-ssg';

interface Config extends UserConfig {
  ssgOptions?: ViteReactSSGOptions;
}

export default defineConfig(({ mode }): Config => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],

    // Vite React SSG options
    ssgOptions: {
      script: 'async',
      formatting: 'none',
    },

    ssr: {
      noExternal: [
        'react-helmet-async', // keep 1.3.x for SSR-safe
        'react-router-dom',
        'react-syntax-highlighter',
        'lucide-react',
        'react-slick',
        'slick-carousel',
      ],
    },

    define: {
      'process.env': env,
      global: 'globalThis',
    },

    server: {
      port: 5173,
    },

    preview: {
      port: 5173,
    },

    resolve: {
      alias: {
        'react-syntax-highlighter/dist/esm/styles/prism/coy':
          'react-syntax-highlighter/dist/cjs/styles/prism/coy.js',
      },
    },
  };
});
