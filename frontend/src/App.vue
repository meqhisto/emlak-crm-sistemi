<template>
  <div id="app-container">
    <header class="app-header">
      <nav>
        <router-link to="/">Ana Sayfa</router-link> |
        <router-link to="/about">Hakkında</router-link> |

        <!-- Müşteri Yönetimi Linki (Giriş yapmış tüm kullanıcılar görebilir) -->
        <router-link v-if="isAuthenticated" to="/customers">Müşteriler</router-link> |

        <template v-if="isAdmin">
          <router-link to="/admin/users">Kullanıcılar</router-link> |
          <router-link to="/admin/offices">Ofisler</router-link> |
        </template>
        <template v-if="!isAuthenticated">
          <router-link to="/login">Giriş Yap</router-link> |
          <router-link to="/register">Kayıt Ol</router-link>
        </template>
        <template v-else>
          <span>Merhaba, {{ currentUser?.username || 'Kullanıcı' }}!</span> |
          <button @click="handleLogout" class="logout-button">Çıkış Yap</button>
        </template>
      </nav>
    </header>

    <main class="app-main">
      <router-view />
    </main>

    <footer class="app-footer">
      <p>© {{ new Date().getFullYear() }} {{ appTitle }}</p>
    </footer>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useAuthStore } from './store/modules/auth';
import { useRouter } from 'vue-router'; // Eğer logout sonrası yönlendirme için gerekirse

const authStore = useAuthStore();
const router = useRouter(); // Gerekirse

const appTitle = computed(() => import.meta.env.VITE_APP_TITLE || 'Emlak CRM');
const isAuthenticated = computed(() => authStore.isAuthenticated);
const currentUser = computed(() => authStore.currentUser);
const isAdmin = computed(() => authStore.isAdmin);

onMounted(() => {
  authStore.checkAuthStatus(); // Uygulama yüklendiğinde auth durumunu kontrol et
});

const handleLogout = () => {
  authStore.logout();
  // router.push('/login'); // authStore.logout() içinde zaten yapılıyor
};
</script>

<style>
/* Temel Global Stiller (src/assets/styles/global.css'e taşınabilir) */
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  background-color: #f4f6f8;
}

#app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  background-color: #ffffff;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.app-header nav {
  display: flex;
  align-items: center;
  gap: 1rem;
  /* Linkler arası boşluk */
}

.app-header nav a {
  font-weight: 500;
  color: #333;
  text-decoration: none;
  padding: 0.5rem 0;
  transition: color 0.2s ease-in-out;
}

.app-header nav a:hover {
  color: #42b983;
}

.app-header nav a.router-link-exact-active {
  color: #42b983;
  border-bottom: 2px solid #42b983;
}

.app-header nav span {
  margin-left: auto;
  /* Merhaba mesajını sağa yasla */
  color: #555;
}

.logout-button {
  background: none;
  border: 1px solid #ff4d4f;
  color: #ff4d4f;
  cursor: pointer;
  font-weight: 500;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.logout-button:hover {
  background-color: #ff4d4f;
  color: white;
}

.app-main {
  flex-grow: 1;
  padding: 1.5rem;
  max-width: 1200px;
  /* İçerik için maksimum genişlik */
  margin: 0 auto;
  /* Ortala */
  width: 100%;
  box-sizing: border-box;
}

.app-footer {
  background-color: #343a40;
  color: white;
  text-align: center;
  padding: 1rem;
  font-size: 0.9em;
  margin-top: auto;
  /* Sayfa içeriği kısa olsa bile altta kalmasını sağlar */
}

/* Genel Form Stilleri */
.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.form-group input[type="text"],
.form-group input[type="email"],
.form-group input[type="password"],
.form-group input[type="tel"],
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  border-color: #42b983;
  outline: none;
  box-shadow: 0 0 0 2px rgba(66, 185, 131, 0.2);
}

.form-group textarea {
  min-height: 100px;
  resize: vertical;
}

button[type="submit"],
.action-button {
  padding: 0.75rem 1.5rem;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: background-color 0.2s ease;
}

button[type="submit"]:hover,
.action-button:hover {
  background-color: #36a471;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.error-message {
  color: #ff4d4f;
  /* Kırmızı */
  background-color: #fff1f0;
  border: 1px solid #ffccc7;
  padding: 0.75rem;
  border-radius: 4px;
  margin-top: 1rem;
  font-size: 0.9em;
}

.success-message {
  color: #52c41a;
  /* Yeşil */
  background-color: #f6ffed;
  border: 1px solid #b7eb8f;
  padding: 0.75rem;
  border-radius: 4px;
  margin-top: 1rem;
  font-size: 0.9em;
}

/* Genel Tablo Stilleri */
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
  background-color: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  overflow: hidden;
  /* border-radius'un th/td'yi kapsaması için */
}

th,
td {
  border-bottom: 1px solid #e0e0e0;
  padding: 0.8rem 1rem;
  text-align: left;
  font-size: 0.95rem;
}

th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #333;
}

tr:last-child td {
  border-bottom: none;
}

tr:hover {
  background-color: #f5f5f5;
}

.table-actions button {
  margin-right: 0.5rem;
  padding: 0.3rem 0.6rem;
  font-size: 0.85rem;
  border-radius: 3px;
}

.table-actions button.edit {
  background-color: #1890ff;
  color: white;
  border: none;
}

.table-actions button.delete {
  background-color: #ff4d4f;
  color: white;
  border: none;
}

.loading-spinner,
.no-data-message {
  text-align: center;
  padding: 2rem;
  font-style: italic;
  color: #777;
}
</style>