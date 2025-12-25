import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Load env from frontend directory
  const env = loadEnv(mode, path.resolve(__dirname), '');
  
  return {
    plugins: [react()],
    server: {
      port: 5173,
      open: true
    },
    build: {
      outDir: 'dist',
      sourcemap: false
    },
    preview: {
      port: 5173,
      host: '0.0.0.0'
    },
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL),
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL || env.VITE_API_URL)
    }
  };
});

