import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import dotenv from 'dotenv';

dotenv.config();

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(
    {
      jsxImportSource: 'react',
    }
  ), tailwindcss()],
  server: {
    port: parseInt(process.env.PORT || '5173'),
    host: true,
  },
  build: {
    target: 'esnext',
    terserOptions: {
      compress: {
        drop_console: true,
      }
    }
  }
})
