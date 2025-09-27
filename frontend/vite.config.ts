import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.VITE_MASTRA_BASE_URL': JSON.stringify('http://localhost:3001'),
    'process.env.VITE_MASTRA_API_KEY': JSON.stringify('stub-key-for-development'),
  },
  server: {
    port: 5173,
    strictPort: true, // Fail if port 5173 is not available
    host: true, // Listen on all addresses
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
