import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173, // Geliştirme sunucusu portu
     proxy: { // Eğer API isteklerini proxy'lemek isterseniz (CORS sorunları için alternatif)
       '/api': {
           target: 'http://localhost:5000', // Backend adresiniz
           changeOrigin: true,
           // rewrite: (path) => path.replace(/^\/api/, '') // Eğer backend /api olmadan bekliyorsa
       }
    }
  }
})