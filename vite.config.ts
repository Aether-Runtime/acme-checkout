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
    // Dev often runs in a cloud devbox whose forwarding proxy reaches the VM
    // over IPv6; bind dual-stack (not 0.0.0.0) and accept the proxy hostnames.
    host: '::',
    allowedHosts: ['.preview.runaether.dev'],
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
});
