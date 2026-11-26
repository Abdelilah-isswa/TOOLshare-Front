import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// In development the API runs on :3000; the proxy avoids CORS entirely.
// In Docker, nginx does the same job (see nginx.conf).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': { target: process.env.VITE_PROXY_TARGET || 'http://localhost:3000', changeOrigin: true } },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    css: false,
    testTimeout: 15000,
  },
});
