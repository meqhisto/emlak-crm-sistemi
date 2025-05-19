import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

// Genel stiller (eğer varsa)
// import './assets/styles/global.css' // Bu dosyayı oluşturmanız gerekebilir

const app = createApp(App)

app.use(createPinia()) // Pinia'yı etkinleştir
app.use(router)        // Vue Router'ı etkinleştir

app.mount('#app')