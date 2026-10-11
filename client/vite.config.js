import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// In development the API runs on :8080 and Vite proxies /api to it, so the
// browser only ever talks to one origin (no CORS setup needed).
const API_TARGET = process.env.VITE_DEV_API_TARGET ?? 'http://localhost:8080';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // "@/..." points at client/src (used by the mapcn map component).
    alias: { '@': path.resolve(import.meta.dirname, 'src') },
  },
  server: {
    port: 5173,
    proxy: { '/api': { target: API_TARGET, changeOrigin: true } },
  },
  build: {
    chunkSizeWarningLimit: 1200, // MapLibre GL is a large library
  },
});
