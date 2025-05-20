<template>
  <div class="auth-page-container">
    <div class="auth-form-card">
      <h2>Kayıt Ol</h2>
      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label for="username">Kullanıcı Adı:</label>
          <input type="text" id="username" v-model="username" required autocomplete="username"/>
        </div>
        <div class="form-group">
          <label for="email">E-posta:</label>
          <input type="email" id="email" v-model="email" required autocomplete="email"/>
        </div>
        <div class="form-group">
          <label for="password">Şifre (En az 6 karakter):</label>
          <input type="password" id="password" v-model="password" required autocomplete="new-password"/>
        </div>
        <div class="form-group">
          <label for="confirmPassword">Şifre Tekrar:</label>
          <input type="password" id="confirmPassword" v-model="confirmPassword" required autocomplete="new-password"/>
        </div>
        <div class="form-group">
          <label for="firstName">Ad (Opsiyonel):</label>
          <input type="text" id="firstName" v-model="firstName" autocomplete="given-name"/>
        </div>
        <div class="form-group">
          <label for="lastName">Soyad (Opsiyonel):</label>
          <input type="text" id="lastName" v-model="lastName" autocomplete="family-name"/>
        </div>
        <button type="submit" :disabled="authStore.isLoading" class="submit-button">
          {{ authStore.isLoading ? 'Kayıt Olunuyor...' : 'Kayıt Ol' }}
        </button>
        <p v-if="authStore.error" class="error-message">{{ authStore.error }}</p>
        <p v-if="registrationSuccess" class="success-message">
          Kayıt başarılı! Lütfen giriş yapın.
        </p>
        <div class="form-footer">
          <p>
            Zaten hesabınız var mı? <router-link to="/login">Giriş Yapın</router-link>
          </p>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue';
import { useAuthStore } from '../../store/modules/auth';
import router from '../../router';

const authStore = useAuthStore();
const username = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const firstName = ref('');
const lastName = ref('');
const registrationSuccess = ref(false);

const handleRegister = async () => {
  authStore.resetStatus(); // Önceki hataları temizle
  registrationSuccess.value = false;

  if (password.value !== confirmPassword.value) {
    authStore.setError('Şifreler uyuşmuyor.');
    return;
  }
  if (!username.value || !email.value || !password.value) {
    authStore.setError('Kullanıcı adı, e-posta ve şifre boş bırakılamaz.');
    return;
  }
  if (password.value.length < 6) {
    authStore.setError('Şifre en az 6 karakter olmalıdır.');
    return;
  }

  const success = await authStore.register({
    username: username.value,
    email: email.value,
    password: password.value,
    first_name: firstName.value,
    last_name: lastName.value,
  });

  if (success) {
    registrationSuccess.value = true;
    username.value = ''; email.value = ''; password.value = '';
    confirmPassword.value = ''; firstName.value = ''; lastName.value = '';
    setTimeout(() => {
      if (registrationSuccess.value) router.push('/login');
    }, 2000);
  }
};

onUnmounted(() => {
  authStore.resetStatus();
  registrationSuccess.value = false;
});
</script>

<style scoped>
/* LoginPage ile aynı stilleri kullanabilir */
.auth-page-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 150px);
  padding: 2rem;
}
.auth-form-card {
  background-color: #fff;
  padding: 2.5rem;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 450px; /* Biraz daha geniş olabilir */
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