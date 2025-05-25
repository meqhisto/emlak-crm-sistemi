import { defineStore } from 'pinia';
import apiClient from '../../services/apiClient'; // API istemcimiz
import router from '../../router'; // Yönlendirme için

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user')) || null, // Giriş yapmış kullanıcı bilgileri
    accessToken: localStorage.getItem('accessToken') || null,
    refreshToken: localStorage.getItem('refreshToken') || null,
    status: { // API istek durumları ve genel durumlar
      isLoading: false, // Genel login/register yükleme durumu
      isCheckingAuth: true, // Uygulama ilk yüklendiğinde auth kontrolü durumu
      error: null, // Son hata mesajı
      successMessage: null, // Son başarı mesajı
    },
  }),

  getters: {
    isAuthenticated: (state) => !!state.accessToken && !!state.user, // Hem token hem user olmalı
    currentUser: (state) => state.user,
    currentUserId: (state) => state.user?.id || null,
    currentUserRole: (state) => state.user?.role || null,
    isAdmin: (state) => state.user && state.user.role === 'admin',
    isBroker: (state) => state.user && state.user.role === 'broker', // <<< BU TANIM DOĞRU MU?
    isDanisman: (state) => state.user && state.user.role === 'danisman',
    isLoading: (state) => state.status.isLoading,
    isCheckingAuth: (state) => state.status.isCheckingAuth,
    error: (state) => state.status.error,
    successMessage: (state) => state.status.successMessage,
  },

  actions: {
    // --- Durum Yönetimi Yardımcıları ---
    _setLoading(loading) {
      this.status.isLoading = loading;
      if (loading) { this.status.error = null; this.status.successMessage = null; }
    },
    _setError(errorMsg) {
      this.status.error = errorMsg || "Bilinmeyen bir kimlik doğrulama hatası oluştu.";
      this.status.isLoading = false;
      this.status.successMessage = null;
    },
    _setSuccess(message) {
      this.status.successMessage = message;
      this.status.isLoading = false;
      this.status.error = null;
    },
    resetAuthStatus() { // Form gönderimleri veya sayfa geçişleri için
      this.status.isLoading = false;
      this.status.error = null;
      this.status.successMessage = null;
    },
    _clearAuthData() {
      this.user = null;
      this.accessToken = null;
      this.refreshToken = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      // apiClient'dan Authorization header'ını temizle (eğer interceptor'da default'a set edildiyse)
      if (apiClient.defaults.headers.common['Authorization']) {
        delete apiClient.defaults.headers.common['Authorization'];
      }
    },
    _setAuthData(access_token, refresh_token, user_data) {
        this.accessToken = access_token;
        this.refreshToken = refresh_token;
        this.user = user_data; // Backend'den gelen user objesi (id, username, email, role içermeli)
        localStorage.setItem('accessToken', access_token);
        localStorage.setItem('refreshToken', refresh_token);
        localStorage.setItem('user', JSON.stringify(user_data));
        // Interceptor zaten her istekte store'dan token'ı alıp ekleyecek,
        // bu yüzden apiClient.defaults.headers.common'a burada set etmeye gerek yok.
    },

    // --- Ana Kimlik Doğrulama Eylemleri ---
    async login(credentials) {
      this._setLoading(true);
      try {
        const response = await apiClient.post('/auth/login', credentials);
        const { access_token, refresh_token, user } = response.data; // Backend'den user objesini bekle
        if (!user || !user.id || !user.role) {
            console.error("Login yanıtında eksik kullanıcı bilgisi:", user);
            throw new Error("Sunucudan eksik kullanıcı bilgisi alındı.");
        }
        this._setAuthData(access_token, refresh_token, user);
        this._setSuccess('Giriş başarılı!');
        // Yönlendirme: Eğer query'de redirect varsa oraya, yoksa ana sayfaya
        const redirectPath = router.currentRoute.value.query.redirect || '/';
        router.push(redirectPath);
        return true;
      } catch (err) {
        const errorMessage = err.response?.data?.msg || err.message || 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.';
        this._setError(errorMessage);
        this._clearAuthData(); // Hata durumunda token ve kullanıcı bilgilerini temizle
        return false;
      }
    },

    async register(userData) {
      this._setLoading(true);
      try {
        // userData: { username, email, password, first_name, last_name }
        // role backend'de varsayılan olarak 'danisman' atanıyor.
        await apiClient.post('/auth/register', userData);
        this._setSuccess('Kayıt başarılı! Lütfen giriş yapın.');
        return true; // Component'in yönlendirme yapabilmesi için
      } catch (err) {
        const errorMessage = err.response?.data?.msg || err.message || 'Kayıt işlemi başarısız oldu.';
        this._setError(errorMessage);
        return false;
      }
    },

    logout() {
      // TODO: Backend'e bir /auth/logout isteği gönderilebilir (token'ı blacklist'e almak için - eğer refresh token kullanılıyorsa önemli)
      // Şimdilik sadece frontend'den temizlik yapıyoruz.
      this._clearAuthData();
      this.resetAuthStatus();
      // Kullanıcıyı login sayfasına yönlendir, eğer zaten orada değilse.
      if (router.currentRoute.value.name !== 'login') {
        router.push({ name: 'login' });
      }
    },

    async refreshTokenIfNeeded() {
      if (!this.refreshToken) {
        // console.warn("Refresh token bulunmuyor, logout yapılıyor.");
        // this.logout(); // Otomatik logout yerine, isteğin 401 almasını bekle ve interceptor handle etsin.
        return false;
      }
      // this._setLoading(true); // Ayrı bir loading state olabilir veya genel isSubmitting kullanılabilir
      try {
        // apiClient interceptor'ı refresh token'ı header'a eklemeli
        const response = await apiClient.post('/auth/refresh'); // Header interceptor'da set ediliyor
        const { access_token } = response.data;
        this.accessToken = access_token;
        localStorage.setItem('accessToken', access_token);
        // apiClient.defaults.headers.common['Authorization'] = `Bearer ${access_token}`; // Interceptor yapsın
        // this.status.isLoading = false;
        return true;
      } catch (err) {
        this._setError(err.response?.data?.msg || 'Oturum yenilenemedi. Lütfen tekrar giriş yapın.');
        this.logout(); // Refresh token da geçersizse veya başka bir hata oluşursa logout yap
        return false;
      }
    },

    checkAuthStatus() {
      this.status.isCheckingAuth = true;
      this.resetAuthStatus(); // Önceki durumları temizle
      const token = localStorage.getItem('accessToken');
      const storedUser = localStorage.getItem('user');
      const refreshTokenExists = localStorage.getItem('refreshToken'); // Refresh token da kontrol et

      if (token && storedUser && refreshTokenExists) {
        try {
            const parsedUser = JSON.parse(storedUser);
            // Basit bir token geçerlilik kontrolü (sadece varlığına bakıyor, süresi dolmuş olabilir)
            // Daha iyisi, backend'e bir /auth/me veya /auth/check isteği atmak olabilir.
            // Şimdilik, token varsa ve user bilgisi varsa, login olmuş sayıyoruz.
            // Interceptor 401 alırsa refreshTokenIfNeeded çağrılacak.
            this.accessToken = token;
            this.user = parsedUser;
            this.refreshToken = refreshTokenExists;
            // apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`; // Interceptor yapsın
        } catch(e) {
            console.error("localStorage'daki kullanıcı bilgisi parse edilemedi:", e);
            this._clearAuthData(); // Bozuk veri varsa temizle
        }
      } else {
        this._clearAuthData(); // Eksik bilgi varsa temizle
      }
      this.status.isCheckingAuth = false;
    }
  }
});