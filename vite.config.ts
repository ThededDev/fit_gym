import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 5174,
    proxy: {
      '/api': 'http://localhost:8787',
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
