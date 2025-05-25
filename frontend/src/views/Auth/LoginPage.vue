<template>
  <div class="auth-page-container">
    <div class="auth-form-card">
      <h2>Giriş Yap</h2>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="identifier">Kullanıcı Adı veya E-posta:</label>
          <input type="text" id="identifier" v-model="identifier" required autocomplete="username"/>
        </div>
        <div class="form-group">
          <label for="password">Şifre:</label>
          <input type="password" id="password" v-model="password" required autocomplete="current-password"/>
        </div>
        <button type="submit" :disabled="authStore.isLoading" class="submit-button">
          {{ authStore.isLoading ? 'Giriş Yapılıyor...' : 'Giriş Yap' }}
        </button>
        <p v-if="authStore.error" class="error-message">{{ authStore.error }}</p>
        <div class="form-footer">
          <p>
            Hesabınız yok mu? <router-link to="/register">Kayıt Olun</router-link>
          </p>
          <p>
            <router-link to="/forgot-password">Şifrenizi mi unuttunuz?</router-link>
          </p>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue';
import { useAuthStore } from '../../store/modules/authStore'; // Vuex store'dan authStore'u alıyoruz

const authStore = useAuthStore();
const identifier = ref('');
const password = ref('');

const handleLogin = async () => {
  if (!identifier.value || !password.value) {
    authStore.setError('Kullanıcı adı/e-posta ve şifre boş bırakılamaz.');
    return;
  }
  await authStore.login({
    identifier: identifier.value,
    password: password.value,
  });
};

onUnmounted(() => {
  authStore.resetStatus();
});
</script>

<style scoped>
.auth-page-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 150px); /* Header/footer yüksekliğini çıkar */
  padding: 2rem;
}
.auth-form-card {
  background-color: #fff;
  padding: 2.5rem;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 420px;
}
.auth-form-card h2 {
  text-align: center;
  margin-bottom: 2rem;
  color: #333;
  font-weight: 600;
}
.submit-button {
    width: 100%;
}
.form-footer {
    margin-top: 1.5rem;
    text-align: center;
    font-size: 0.9em;
}
.form-footer p {
    margin-bottom: 0.5rem;
}
.form-footer a {
    color: #42b983;
    text-decoration: none;
}
.form-footer a:hover {
    text-decoration: underline;
}
</style>