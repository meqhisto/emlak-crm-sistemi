import { defineStore } from 'pinia';
import apiClient from '../../services/apiClient'; // API istemcimiz
// import { useAuthStore } from './auth'; // Gerekirse authStore'a erişim için

export const useCustomerStore = defineStore('customer', {
  state: () => ({
    customers: [], // Müşteri listesi
    currentCustomer: null, // Detay sayfasında gösterilecek müşteri
    customerInteractions: [], // Seçili müşterinin etkileşimleri
    pagination: { // Listeleme için sayfalama bilgisi
      total: 0,
      pages: 0,
      currentPage: 1,
      perPage: 10, // Backend ITEMS_PER_PAGE ile senkronize olmalı
    },
    status: { // API istek durumları
      isLoading: false,
      isSubmitting: false, // Form gönderimleri için ayrı bir loading durumu
      error: null,
      successMessage: null,
    },
    // Filtreleme ve arama için (opsiyonel, state'de tutulabilir)
    // filters: {
    //   searchTerm: '',
    //   consultantId: null,
    // }
  }),

  getters: {
    // isLoading: (state) => state.status.isLoading,
    // error: (state) => state.status.error,
    // ... diğer getter'lar
  },

  actions: {
    // --- Durum Yönetimi Yardımcıları ---
    _setLoading(loading) {
      this.status.isLoading = loading;
      if (loading) { this.status.error = null; this.status.successMessage = null; }
    },
    _setSubmitting(submitting) {
      this.status.isSubmitting = submitting;
      if (submitting) { this.status.error = null; this.status.successMessage = null; }
    },
    _setError(errorMsg) {
      this.status.error = errorMsg;
      this.status.isLoading = false; this.status.isSubmitting = false;
    },
    _setSuccess(message) {
      this.status.successMessage = message;
      this.status.isLoading = false; this.status.isSubmitting = false; this.status.error = null;
    },
    resetStatus() {
      this.status.isLoading = false;
      this.status.isSubmitting = false;
      this.status.error = null;
      this.status.successMessage = null;
    },

    // --- Müşteri CRUD İşlemleri ---
    async fetchCustomers(params = { page: 1, per_page: 10, search: '', consultant_id: null }) {
      this._setLoading(true);
      try {
        const response = await apiClient.get('/customers', { params });
        this.customers = response.data.customers;
        this.pagination.total = response.data.total;
        this.pagination.pages = response.data.pages;
        this.pagination.currentPage = response.data.current_page;
        this.pagination.perPage = params.per_page; // Gönderilen per_page'i sakla
        // this._setSuccess('Müşteriler başarıyla yüklendi.'); // Genellikle listelemede mesaj gösterilmez
        this.status.isLoading = false; // Sadece loading'i kapat
      } catch (err) {
        const msg = err.response?.data?.msg || 'Müşteriler yüklenirken bir hata oluştu.';
        this._setError(msg);
        this.customers = []; // Hata durumunda listeyi boşalt
      }
    },

    async fetchCustomerById(customerId) {
      this._setLoading(true);
      this.currentCustomer = null; // Önceki müşteriyi temizle
      this.customerInteractions = []; // Etkileşimleri de temizle
      try {
        const response = await apiClient.get(`/customers/${customerId}`);
        this.currentCustomer = response.data; // Backend to_dict(include_interactions=True) ile geliyorsa
        if (response.data.interactions) { // Eğer etkileşimler ayrı gelmiyorsa
            this.customerInteractions = response.data.interactions;
        }
        // this._setSuccess('Müşteri detayı başarıyla yüklendi.');
        this.status.isLoading = false;
        return this.currentCustomer;
      } catch (err) {
        const msg = err.response?.data?.msg || 'Müşteri detayı yüklenemedi.';
        this._setError(msg);
        return null;
      }
    },

    async createCustomer(customerData) {
      this._setSubmitting(true);
      try {
        const response = await apiClient.post('/customers', customerData);
        // Listeye ekleme veya listeyi yeniden çekme yerine, başarılı mesajı verip yönlendirme yapılabilir.
        // this.customers.unshift(response.data); // Eğer hemen listeye eklenecekse
        this._setSuccess('Müşteri başarıyla oluşturuldu.');
        return response.data; // Oluşturulan müşteriyi dön
      } catch (err) {
        const msg = err.response?.data?.msg || 'Müşteri oluşturulamadı.';
        this._setError(msg);
        throw err; // Hatanın component tarafından yakalanabilmesi için tekrar fırlat
      }
    },

    async updateCustomer(customerId, customerData) {
      this._setSubmitting(true);
      try {
        const response = await apiClient.put(`/customers/${customerId}`, customerData);
        // Eğer currentCustomer güncelleniyorsa onu da güncelle
        if (this.currentCustomer && this.currentCustomer.id === customerId) {
          this.currentCustomer = response.data;
        }
        // Listede varsa onu da güncelle (daha karmaşık, şimdilik atlanabilir veya liste yeniden çekilebilir)
        const index = this.customers.findIndex(c => c.id === customerId);
        if (index !== -1) {
          this.customers[index] = response.data;
        }
        this._setSuccess('Müşteri başarıyla güncellendi.');
        return response.data; // Güncellenen müşteriyi dön
      } catch (err) {
        const msg = err.response?.data?.msg || 'Müşteri güncellenemedi.';
        this._setError(msg);
        throw err;
      }
    },

    async deleteCustomer(customerId) {
      this._setSubmitting(true); // Veya setLoading(true)
      try {
        await apiClient.delete(`/customers/${customerId}`);
        this.customers = this.customers.filter(c => c.id !== customerId); // Listeden çıkar
        if (this.currentCustomer && this.currentCustomer.id === customerId) {
            this.currentCustomer = null; // Eğer silinen müşteri detayda ise temizle
        }
        this._setSuccess('Müşteri başarıyla silindi.');
        return true;
      } catch (err) {
        const msg = err.response?.data?.msg || 'Müşteri silinemedi.';
        this._setError(msg);
        return false;
      }
    },

    // --- Müşteri Etkileşim İşlemleri ---
    async fetchCustomerInteractions(customerId) {
      // Bu, fetchCustomerById içinde zaten yapılıyor olabilir (eğer backend interactions'ı dahil ediyorsa)
      // Veya ayrı bir endpoint varsa buradan çağrılır.
      // Bizim get_customer endpoint'imiz include_interactions=True ile geliyor.
      // Bu fonksiyon yine de ayrı çağrım için kalabilir.
      this._setLoading(true);
      try {
        const response = await apiClient.get(`/customers/${customerId}/interactions`);
        this.customerInteractions = response.data;
        this.status.isLoading = false;
      } catch (err) {
        const msg = err.response?.data?.msg || 'Müşteri etkileşimleri yüklenemedi.';
        this._setError(msg);
        this.customerInteractions = [];
      }
    },

    async addInteraction(customerId, interactionData) {
      this._setSubmitting(true);
      try {
        const response = await apiClient.post(`/customers/${customerId}/interactions`, interactionData);
        // Eğer customerInteractions state'i aktifse yeni etkileşimi ekle
        if (this.currentCustomer && this.currentCustomer.id === customerId) {
            this.customerInteractions.unshift(response.data); // Başa ekle (yeni etkileşimler)
        }
        this._setSuccess('Etkileşim başarıyla eklendi.');
        return response.data;
      } catch (err) {
        const msg = err.response?.data?.msg || 'Etkileşim eklenemedi.';
        this._setError(msg);
        throw err;
      }
    },

    // TODO: Etkileşim güncelleme ve silme için action'lar eklenebilir.
    // async updateInteraction(customerId, interactionId, interactionData) { ... }
    // async deleteInteraction(customerId, interactionId) { ... }
  }
});