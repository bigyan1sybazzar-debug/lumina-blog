import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    preview: {
      port: 5173,
    },
    server: {
      port: 5173,
    },
    define: {
      'process.env': Object.fromEntries(
        Object.entries(env).map(([k, v]) => [k, JSON.stringify(v)])
      ),
    },
  }
})