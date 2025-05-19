<template>
  <div class="home">
    <h1>Emlak CRM Ana Sayfa</h1>
    <p>Burası Emlak CRM Sisteminin ana sayfasıdır.</p>
    <p>API Bağlantı Durumu: <span :style="{ color: apiStatusColor }">{{ apiStatus }}</span></p>
    <button @click="checkApi">API Durumunu Kontrol Et</button>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios'; // API istekleri için

const apiStatus = ref('Bilinmiyor');
const apiStatusColor = ref('orange');

const checkApi = async () => {
  apiStatus.value = 'Kontrol ediliyor...';
  apiStatusColor.value = 'blue';
  try {
    const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/ping`);
    if (response.status === 200 && response.data.message === "Pong! Backend is alive.") {
      apiStatus.value = 'Bağlı ve Çalışıyor!';
      apiStatusColor.value = 'green';
    } else {
      apiStatus.value = 'Bağlı ama beklenmeyen yanıt.';
      apiStatusColor.value = 'red';
    }
  } catch (error) {
    console.error("API bağlantı hatası:", error);
    apiStatus.value = `Bağlantı Hatası (${error.message})`;
    apiStatusColor.value = 'red';
  }
};
</script>

<script>
export default {
  name: 'HomeView',
  components: {
  }
}
</script>

<style scoped>
.home {
  padding: 20px;
}

.home-view {
  text-align: center;
}
</style>