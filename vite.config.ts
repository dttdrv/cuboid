/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
  server: {
    proxy: {
      '/v1': {
        target: process.env.VITE_CUBOID_BACKEND_URL || `http://127.0.0.1:${process.env.CUBOID_BACKEND_PORT || '4173'}`,
        changeOrigin: true,
      },
    },
  },
});
