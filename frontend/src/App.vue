<template>
  <div id="app-container">
    <header class="app-header">
      <nav>
        <router-link to="/">Ana Sayfa</router-link>
        <router-link v-if="isAuthenticated" to="/customers">Müşteriler</router-link>
        <router-link v-if="isAuthenticated" to="/properties">Portföyler</router-link> <!-- PORTFÖY LİNKİ BURADA -->
        <!-- Diğer modül linkleri buraya eklenecek (Görevler, Projeler vb.) -->

        <span class="spacer"></span> <!-- Linkleri sola, kullanıcı bilgilerini/butonları sağa ayırmak için -->

        <router-link v-if="isAdmin" to="/admin/users" class="admin-link">Kullanıcı Yön.</router-link>
        <router-link v-if="isAdmin" to="/admin/offices" class="admin-link">Ofis Yön.</router-link>
        <router-link to="/about" class="secondary-link">Hakkında</router-link>

        <template v-if="!isAuthenticated">
          <router-link to="/login" class="auth-link">Giriş Yap</router-link>
          <router-link to="/register" class="auth-link register">Kayıt Ol</router-link>
        </template>
        <template v-else>
          <span class="user-greeting">Merhaba, {{ currentUser?.username || 'Kullanıcı' }}!</span>
          <button @click="handleLogout" class="logout-button">Çıkış Yap</button>
        </template>
      </nav>
    </header>

    <main class="app-main">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <footer class="app-footer">
      <p>© {{ new Date().getFullYear() }} {{ appTitle }}</p>
    </footer>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useAuthStore } from './store/modules/auth';
// import { useRouter } from 'vue-router'; // Artık logout içinde yönlendirme var

const authStore = useAuthStore();
// const router = useRouter();

const appTitle = computed(() => import.meta.env.VITE_APP_TITLE || 'Emlak CRM');
const isAuthenticated = computed(() => authStore.isAuthenticated);
const currentUser = computed(() => authStore.currentUser);
const isAdmin = computed(() => authStore.isAdmin);

onMounted(() => {
  authStore.checkAuthStatus();
});

const handleLogout = () => {
  authStore.logout();
  // router.push('/login'); // authStore.logout() içinde zaten yapılıyor
};
</script>

<style>
/* Temel Global Stiller */
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  background-color: #f4f6f8; /* Hafif gri arka plan */
}

#app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  background-color: #ffffff;
  padding: 0 1.5rem; /* Dikey padding'i nav item'larına bırakalım */
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  position: sticky; /* Üstte sabit kalması için */
  top: 0;
  z-index: 100; /* Diğer elementlerin üzerinde kalması için */
}

.app-header nav {
  display: flex;
  align-items: center;
  height: 60px; /* Sabit yükseklik */
  gap: 0.5rem; /* Linkler arası boşluk */
}

.app-header nav a, .app-header nav .user-greeting {
  font-weight: 500;
  color: #333;
  text-decoration: none;
  padding: 0.5rem 0.75rem; /* Padding'i arttırdık */
  border-radius: 4px;
  transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;
  white-space: nowrap; /* Linklerin kırılmasını engelle */
}

.app-header nav a:hover {
  background-color: #f0f0f0;
  color: #28a745; /* Yeşil hover rengi */
}

.app-header nav a.router-link-exact-active {
  background-color: #e6f7ff; /* Aktif link için açık mavi arka plan */
  color: #096dd9; /* Aktif link için mavi renk */
}
.app-header nav a.admin-link.router-link-exact-active {
  background-color: #fff1b8; /* Admin aktif link için sarımsı */
  color: #d46b08;
}

.spacer {
    margin-left: auto; /* Navigasyonun sol ve sağ gruplarını ayırır */
}

.app-header nav .user-greeting {
    color: #555;
    padding-right: 0.5rem; /* Logout butonuyla arasına boşluk */
}
.app-header nav .secondary-link {
    font-size: 0.9em;
    color: #555;
}
.app-header nav .auth-link {
    border: 1px solid transparent;
}
.app-header nav .auth-link.register {
    background-color: #52c41a;
    color: white;
    border-color: #52c41a;
}
.app-header nav .auth-link.register:hover {
    background-color: #389e0d;
    border-color: #389e0d;
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
  /* max-width: 1200px; /* Sayfa bazlı ayarlanabilir */
  /* margin: 0 auto; */
  /* width: 100%; */
  /* box-sizing: border-box; */
}

.app-footer {
  background-color: #343a40;
  color: white;
  text-align: center;
  padding: 1rem;
  font-size: 0.9em;
  margin-top: auto;
}

/* Genel Sayfa Konteyneri Stili (AdminPageContainer ve PageContainer için) */
.admin-page-container, .page-container {
  background-color: #fff;
  padding: 1.5rem 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 2rem; /* Sayfalar arası boşluk */
}

/* Genel Form Stilleri */
.form-group { margin-bottom: 1rem; }
.form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; color: #495057; }
.form-group input[type="text"],
.form-group input[type="email"],
.form-group input[type="password"],
.form-group input[type="tel"],
.form-group input[type="number"],
.form-group input[type="date"],
.form-group textarea,
.form-group select {
  width: 100%; padding: 0.65rem 0.75rem;
  border: 1px solid #ced4da; border-radius: 4px; box-sizing: border-box;
  font-size: 0.95rem;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}
.form-group input:focus, .form-group textarea:focus, .form-group select:focus {
  border-color: #80bdff; outline: 0;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}
.form-group textarea { min-height: 100px; resize: vertical; }

.form-check { display: flex; align-items: center; margin-top: 0.5rem;}
.form-check input[type="checkbox"] { margin-right: 0.5rem; width: auto; height: auto; }
.form-check-label { font-weight: normal; margin-bottom: 0;}

.action-button, button[type="submit"] { /* Genel buton stili */
  padding: 0.6rem 1.2rem; background-color: #007bff; /* Mavi tema */
  color: white; border: none; border-radius: 4px; cursor: pointer;
  font-size: 0.95rem; font-weight: 500;
  transition: background-color 0.15s ease-in-out;
  text-decoration: none;
  display: inline-block;
  line-height: normal;
}
.action-button:hover, button[type="submit"]:hover { background-color: #0056b3; }
button:disabled, .action-button:disabled { background-color: #adb5bd; cursor: not-allowed; }

/* Hata ve Başarı Mesajları */
.error-message {
  color: #721c24; background-color: #f8d7da; border: 1px solid #f5c6cb;
  padding: 0.75rem 1.25rem; border-radius: 4px; margin-top: 1rem; font-size: 0.9em;
}
.success-message {
  color: #155724; background-color: #d4edda; border: 1px solid #c3e6cb;
  padding: 0.75rem 1.25rem; border-radius: 4px; margin-top: 1rem; font-size: 0.9em;
}

/* Genel Tablo Stilleri */
table {
  width: 100%; border-collapse: collapse; margin-top: 1.5rem;
  background-color: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.07);
  border-radius: 6px;
  overflow: hidden;
}
th, td {
  border-bottom: 1px solid #dee2e6; padding: 0.9rem 1rem;
  text-align: left; font-size: 0.9rem;
  vertical-align: middle;
}
th {
  background-color: #f8f9fa; font-weight: 600; color: #495057;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
tr:last-child td { border-bottom: none; }
tr:hover { background-color: #f1f3f5; }

.table-actions button, .table-actions .action-button {
  margin-right: 0.4rem; padding: 0.35rem 0.65rem;
  font-size: 0.8rem; border-radius: 3px;
}
.table-actions button.edit, .table-actions .action-button.edit { background-color: #17a2b8; }
.table-actions button.edit:hover, .table-actions .action-button.edit:hover { background-color: #117a8b; }
.table-actions button.delete, .table-actions .action-button.delete { background-color: #dc3545; }
.table-actions button.delete:hover, .table-actions .action-button.delete:hover { background-color: #c82333; }

.loading-spinner, .no-data-message {
  text-align: center; padding: 2.5rem;
  font-style: italic; color: #6c757d; font-size: 1rem;
}

/* Vue Transition */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease; /* Hızlandırıldı */
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>