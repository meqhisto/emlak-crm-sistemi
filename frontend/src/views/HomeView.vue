<template>
  <div class="home-view page-container">
    <h1>Emlak CRM Ana Sayfasına Hoş Geldiniz!</h1>
    <p>Bu sistem, emlak yönetimi süreçlerinizi kolaylaştırmak için tasarlanmıştır.</p>

    <div class="status-section">
      <h3>API Bağlantı Durumu</h3>
      <button @click="checkApi" :disabled="apiCheckLoading" class="action-button">
        {{ apiCheckLoading ? 'Kontrol Ediliyor...' : 'API Durumunu Kontrol Et' }}
      </button>
      <p :class="['api-status', apiStatusColorClass]">{{ apiStatusMessage }}</p>
    </div>

    <div v-if="authStore.isAuthenticated" class="user-info">
      <p><strong>Giriş Yapıldı:</strong> {{ authStore.currentUser?.username }} ({{ authStore.currentUser?.role }})</p>
    </div>
    <div v-else>
      <p>Sistemin tüm özelliklerini kullanmak için lütfen <router-link to="/login">giriş yapın</router-link> veya <router-link to="/register">kayıt olun</router-link>.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import apiClient from '../services/apiClient';
import { useAuthStore } from '../store/modules/auth';

const authStore = useAuthStore();

const apiStatusMessage = ref('Bilinmiyor');
const apiStatusColorClass = ref('status-unknown'); // 'status-ok', 'status-error', 'status-unknown'
const apiCheckLoading = ref(false);

const checkApi = async () => {
  apiCheckLoading.value = true;
  apiStatusMessage.value = 'Kontrol ediliyor...';
  apiStatusColorClass.value = 'status-checking';
  try {
    const response = await apiClient.get('/ping');
    if (response.status === 200 && response.data.message === "Pong! Backend is alive.") {
      apiStatusMessage.value = 'Bağlı ve Çalışıyor!';
      apiStatusColorClass.value = 'status-ok';
    } else {
      apiStatusMessage.value = `Bağlı ama beklenmeyen yanıt: ${response.status}`;
      apiStatusColorClass.value = 'status-error';
    }
  } catch (error) {
    console.error("API bağlantı hatası:", error);
    apiStatusMessage.value = `Bağlantı Hatası: ${error.response?.data?.msg || error.message || 'Sunucuya ulaşılamadı'}`;
    apiStatusColorClass.value = 'status-error';
  } finally {
    apiCheckLoading.value = false;
  }
};
</script>

<style scoped>
.page-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}
.home-view h1 {
  color: #333;
  text-align: center;
  margin-bottom: 1.5rem;
}
.home-view p {
  line-height: 1.6;
  color: #555;
  text-align: center;
  margin-bottom: 1rem;
}
.status-section {
  margin-top: 2rem;
  padding: 1.5rem;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background-color: #f9f9f9;
  text-align: center;
}
.status-section h3 {
    margin-top: 0;
    margin-bottom: 1rem;
    color: #444;
}
.api-status {
  margin-top: 1rem;
  font-weight: bold;
  padding: 0.5rem;
  border-radius: 4px;
}
.status-ok { color: #28a745; background-color: #e9f7ef; border: 1px solid #a6d7b5;} /* Yeşil */
.status-error { color: #dc3545; background-color: #fdecea; border: 1px solid #f5b6bd;} /* Kırmızı */
.status-unknown { color: #6c757d; background-color: #e9ecef; border: 1px solid #ced4da;} /* Gri */
.status-checking { color: #007bff; background-color: #e7f3ff; border: 1px solid #afd5fb;} /* Mavi */

.user-info {
    margin-top: 2rem;
    padding: 1rem;
    background-color: #e7f3ff;
    border: 1px solid #afd5fb;
    border-radius: 4px;
    text-align: center;
}
.user-info strong {
    color: #0056b3;
}
</style>