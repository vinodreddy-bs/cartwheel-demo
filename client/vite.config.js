import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true,
    // bs-local.com is how BrowserStack Local reaches localhost from iOS devices.
    allowedHosts: ['bs-local.com'],
    proxy: { '/api': 'http://localhost:5001' },
  },
  preview: { port: 3000, allowedHosts: ['bs-local.com'] },
  test: { environment: 'node', include: ['src/**/*.test.js'] },
});
