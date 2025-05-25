import axios from 'axios';
import { useAuthStore } from '../store/modules/auth';
// import router from '../router'; // Döngüsel bağımlılık olmaması için router'ı burada import etmeyin.
                                // Gerekirse logout işlemi store içinde yapılmalı.

const apiClient = axios.create({
  // baseURL: 'http://localhost:5000/api', // ESKİ
  baseURL: '/api', // YENİ - Vite proxy'si için göreceli yol
  headers: { /* ... */ }
});

apiClient.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore();
    console.log("API Interceptor - Request URL:", config.url); // <<< LOG
    console.log("API Interceptor - Access Token in Store:", authStore.accessToken); // <<< LOG
    if (authStore.accessToken) {
      if (config.url === '/auth/refresh') {
        if (authStore.refreshToken) {
            config.headers['Authorization'] = `Bearer ${authStore.refreshToken}`;
            console.log("API Interceptor - Refresh Token ADDED to header"); // <<< LOG
        }
      } else {
        config.headers['Authorization'] = `Bearer ${authStore.accessToken}`;
        console.log("API Interceptor - Access Token ADDED to header"); // <<< LOG
      }
    } else {
        console.warn("API Interceptor - NO TOKEN in store, Authorization header NOT SET for", config.url); // <<< LOG
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