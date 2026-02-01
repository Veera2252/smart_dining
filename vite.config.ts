
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Specifically define process.env.API_KEY for the Gemini SDK
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || '')
  },
  server: {
    host: '0.0.0.0',
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
    allowedHosts: true
  },
  preview: {
    host: '0.0.0.0',
    port: process.env.PORT ? Number(process.env.PORT) : 4173,
    allowedHosts: true,
    // Disable HMR in production preview mode to stop websocket errors
    // Render handles the connection; we don't need a dev-style socket
  }
});
