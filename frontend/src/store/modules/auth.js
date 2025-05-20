import { defineStore } from 'pinia';
import apiClient from '../../services/apiClient';
import router from '../../router'; // Yönlendirme için

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user')) || null,
    accessToken: localStorage.getItem('accessToken') || null,
    refreshToken: localStorage.getItem('refreshToken') || null,
    status: {
      isLoading: false,
      isSuccess: false,
      error: null,
    },
  }),
  getters: {
    isAuthenticated: (state) => !!state.accessToken,
    currentUser: (state) => state.user,
    isAdmin: (state) => state.user && state.user.role === 'admin',
    isLoading: (state) => state.status.isLoading,
    error: (state) => state.status.error,
  },
  actions: {
    _setLoading(loading) {
      this.status.isLoading = loading;
      if (loading) { this.status.error = null; this.status.isSuccess = false; }
    },
    _setError(error) {
      this.status.error = error;
      this.status.isLoading = false; this.status.isSuccess = false;
    },
    _setSuccess() {
      this.status.isSuccess = true;
      this.status.isLoading = false; this.status.error = null;
    },
    resetStatus() {
      this.status.isLoading = false; this.status.isSuccess = false; this.status.error = null;
    },
    _clearAuthData() {
      this.user = null; this.accessToken = null; this.refreshToken = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      delete apiClient.defaults.headers.common['Authorization']; // Axios header'ını temizle
    },
    _setAuthData(access_token, refresh_token, user_data) {
        this.accessToken = access_token;
        this.refreshToken = refresh_token;
        this.user = user_data;
        localStorage.setItem('accessToken', access_token);
        localStorage.setItem('refreshToken', refresh_token);
        localStorage.setItem('user', JSON.stringify(user_data));
        // apiClient.defaults.headers.common['Authorization'] = `Bearer ${access_token}`; // Bu interceptor'da yapılıyor
    },

    async login(credentials) {
      this._setLoading(true);
      try {
        const response = await apiClient.post('/auth/login', credentials);
        const { access_token, refresh_token, user } = response.data;
        this._setAuthData(access_token, refresh_token, user);
        this._setSuccess();
        // Yönlendirme login sayfasından sonraki hedef_sayfa'ya veya ana sayfaya
        const redirectPath = router.currentRoute.value.query.redirect || '/';
        router.push(redirectPath);
        return true;
      } catch (err) {
        const errorMessage = err.response?.data?.msg || err.message || 'Giriş başarısız.';
        this._setError(errorMessage);
        this._clearAuthData();
        return false;
      }
    },
    async register(userData) {
      this._setLoading(true);
      try {
        await apiClient.post('/auth/register', userData);
        this._setSuccess();
        return true;
      } catch (err) {
        const errorMessage = err.response?.data?.msg || err.message || 'Kayıt başarısız.';
        this._setError(errorMessage);
        return false;
      }
    },
    logout() {
      this._clearAuthData();
      this.resetStatus(); // Durumu da sıfırla
      if (router.currentRoute.value.name !== 'login') { // Zaten login sayfasındaysa tekrar yönlendirme
        router.push('/login');
      }
    },
    async refreshTokenIfNeeded() {
      if (!this.refreshToken) {
        this.logout(); // Refresh token yoksa direkt logout
        return false;
      }
      this._setLoading(true); // Sadece token yenileme için loading
      try {
        // apiClient interceptor'ı refresh token'ı header'a ekleyecektir.
        const response = await apiClient.post('/auth/refresh');
        const { access_token } = response.data;
        this.accessToken = access_token;
        localStorage.setItem('accessToken', access_token);
        // apiClient.defaults.headers.common['Authorization'] = `Bearer ${access_token}`; // Interceptor hallediyor
        this.status.isLoading = false; // Sadece loading'i kapat, success/error durumu yok
        return true;
      } catch (err) {
        this._setError(err.response?.data?.msg || 'Token yenileme başarısız.');
        this.logout(); // Refresh token da geçersizse logout yap
        return false;
      }
    },
    checkAuthStatus() {
      this.resetStatus(); // Başlangıçta durumu sıfırla
      const token = localStorage.getItem('accessToken');
      const storedUser = localStorage.getItem('user');
      const refreshTokenExists = localStorage.getItem('refreshToken');

      if (token && storedUser && refreshTokenExists) {
        try {
            this.accessToken = token;
            this.user = JSON.parse(storedUser);
            this.refreshToken = refreshTokenExists;
            // apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`; // Interceptor hallediyor
        } catch(e) { // JSON parse hatası olursa
            this._clearAuthData();
        }
      } else {
        this._clearAuthData();
      }
    }
  }
});