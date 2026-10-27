import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { sduiTemplateBridge } from './server/sduiTemplateBridge'

export default defineConfig({
  plugins: [react(), sduiTemplateBridge()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
  },
})
