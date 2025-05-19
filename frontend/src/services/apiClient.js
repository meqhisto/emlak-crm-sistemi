import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    // 'Accept': 'application/json' // Opsiyonel
  }
});

// İleride JWT token'ı otomatik olarak eklemek için interceptor eklenebilir
// apiClient.interceptors.request.use(config => {
//   const token = localStorage.getItem('authToken'); // Veya Pinia store'dan al
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// }, error => {
//   return Promise.reject(error);
// });

export default apiClient;