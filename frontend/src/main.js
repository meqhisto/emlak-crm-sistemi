import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
// import './assets/styles/global.css'; // Eğer global.css dosyanız varsa

// Pinia'yı import et (auth store'u initialize etmek için)
import { useAuthStore } from './store/modules/authStore'; // <<< YOLU KONTROL EDİN (authStore.js ise)

const app = createApp(App)
const pinia = createPinia();

app.use(pinia); // Önce Pinia
app.use(router);

// Pinia instance'ı app'e eklendikten sonra store'u çağır
// Bu, store'un app context'ine erişebilmesini sağlar.
// Ve router'dan önce veya sonra olması, store'un router'a bağımlılığına göre değişir.
// checkAuthStatus router'a bağımlı olmadığı için burada sorun yok.
const authStore = useAuthStore(); // Pinia instance'ını parametre olarak vermeye gerek yok
authStore.checkAuthStatus(); // Uygulama başladığında kimlik durumunu kontrol et

app.mount('#app')