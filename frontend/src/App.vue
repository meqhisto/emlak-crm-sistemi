<template>
  <div id="app-container">
    <header class="app-header">
      <nav>
        <router-link to="/">Ana Sayfa</router-link> |
        <router-link to="/about">Hakkında</router-link> |
        <!-- İleride Auth durumuna göre değişecek linkler -->
        <router-link to="/login">Giriş Yap</router-link>
        <!-- <router-link to="/register">Kayıt Ol</router-link> -->
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
import { computed } from 'vue';

const appTitle = computed(() => import.meta.env.VITE_APP_TITLE || 'Emlak CRM');
</script>

<style>
/* Temel Global Stiller (global.css'e taşınabilir) */
body {
  margin: 0;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

#app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  background-color: #f8f9fa;
  padding: 1rem;
  border-bottom: 1px solid #dee2e6;
}

.app-header nav a {
  font-weight: bold;
  color: #2c3e50;
  margin: 0 0.5rem;
  text-decoration: none;
}

.app-header nav a.router-link-exact-active {
  color: #42b983;
}

.app-main {
  flex-grow: 1;
  padding: 1.5rem;
}

.app-footer {
  background-color: #343a40;
  color: white;
  text-align: center;
  padding: 1rem;
  font-size: 0.9em;
}
</style>