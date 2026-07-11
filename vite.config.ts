import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'web',
  plugins: [react()],
  build: {
    outDir: '../dist/client',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    // Dev often runs in a cloud devbox behind a forwarding proxy; accept its
    // public hostnames instead of only localhost.
    host: true,
    allowedHosts: ['.preview.runaether.dev'],
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
});
