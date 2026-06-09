import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // This forwards all frontend calls starting with /api to your Node backend
      '/api': {
        target: 'http://localhost:5000', // 🌟 Replace 5000 with your exact backend port if different
        changeOrigin: true,
        secure: false,
      }
    }
  }
});
