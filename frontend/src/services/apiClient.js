import axios from 'axios';
import { useAuthStore } from '../store/modules/auth';
// import router from '../router'; // Döngüsel bağımlılık olmaması için router'ı burada import etmeyin.
                                // Gerekirse logout işlemi store içinde yapılmalı.

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

apiClient.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore();
    if (authStore.accessToken) {
      // Refresh token isteği kendi token'ını header'da taşıyacak, bu yüzden normal access token'ı ekleme
      if (config.url === '/auth/refresh') {
        if (authStore.refreshToken) { // Sadece refreshToken varsa refresh isteği için header ekle
            config.headers['Authorization'] = `Bearer ${authStore.refreshToken}`;
        }
      } else {
        config.headers['Authorization'] = `Bearer ${authStore.accessToken}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const authStore = useAuthStore();

    if (error.response?.status === 401 && originalRequest.url !== '/auth/login' && originalRequest.url !== '/auth/refresh' && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshed = await authStore.refreshTokenIfNeeded(); // Bu metodun varlığını kontrol et
        if (refreshed) {
          // Axios instance'ının default header'ını güncellemek yerine,
          // originalRequest'in header'ını güncellemek daha güvenli olabilir.
          originalRequest.headers['Authorization'] = `Bearer ${authStore.accessToken}`;
          return apiClient(originalRequest);
        } else {
          // Yenileme başarısız olduysa veya refresh token yoksa, logout tetiklenmeli.
          // Store içindeki refreshTokenIfNeeded zaten logout'u tetikleyebilir.
          // Eğer tetiklemiyorsa burada authStore.logout() çağrılabilir.
          // authStore.logout(); // Zaten refreshTokenIfNeeded içinde veya store'un kendisinde yapılmalı
          return Promise.reject(error);
        }
      } catch (refreshError) {
        // authStore.logout(); // Zaten refreshTokenIfNeeded içinde veya store'un kendisinde yapılmalı
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;