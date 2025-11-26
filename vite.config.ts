import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react()],
    base:process.env.VITE_BASE_PATH ||"/lumina-blog"
    define: {
      // Safely stringify process.env to avoid injection issues
      'process.env': env
    }
  };
});