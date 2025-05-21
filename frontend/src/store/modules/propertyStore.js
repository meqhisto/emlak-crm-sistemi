import { defineStore } from 'pinia';
import apiClient from '../../services/apiClient'; // API istemcimiz

export const usePropertyStore = defineStore('property', {
  state: () => ({
    properties: [], // Portföy listesi
    currentProperty: null, // Detay sayfasında gösterilecek portföy
    propertyTypes: [], // Backend'den çekilecek portföy tipleri
    propertyStatuses: [], // Backend'den çekilecek portföy durumları
    pagination: {
      total: 0,
      pages: 0,
      currentPage: 1,
      perPage: 10,
    },
    status: { // API istek durumları
      isLoading: false,
      isSubmitting: false,
      error: null,
      successMessage: null,
    },
  }),

  getters: {
    // İhtiyaç duyulursa getter'lar eklenebilir
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

    // --- Portföy CRUD İşlemleri ---
    async fetchProperties(params = { page: 1, per_page: 10 }) {
      this._setLoading(true);
      try {
        // Boş veya null olan parametreleri isteğe eklememek için temizle
        const cleanParams = Object.fromEntries(
          Object.entries(params).filter(([_, v]) => v != null && v !== '')
        );
        const response = await apiClient.get('/properties', { params: cleanParams });
        this.properties = response.data.properties;
        this.pagination.total = response.data.total;
        this.pagination.pages = response.data.pages;
        this.pagination.currentPage = response.data.current_page;
        this.pagination.perPage = params.per_page || this.pagination.perPage;
        this.status.isLoading = false;
      } catch (err) {
        const msg = err.response?.data?.msg || 'Portföyler yüklenirken bir hata oluştu.';
        this._setError(msg);
        this.properties = [];
      }
    },

    async fetchPropertyById(propertyId) {
      this._setLoading(true);
      this.currentProperty = null;
      try {
        const response = await apiClient.get(`/properties/${propertyId}`);
        this.currentProperty = response.data;
        this.status.isLoading = false;
        return this.currentProperty;
      } catch (err) {
        const msg = err.response?.data?.msg || 'Portföy detayı yüklenemedi.';
        this._setError(msg);
        return null;
      }
    },

    async createProperty(propertyData) {
      this._setSubmitting(true);
      try {
        const response = await apiClient.post('/properties', propertyData);
        this._setSuccess('Portföy başarıyla oluşturuldu.');
        // İsteğe bağlı: Listeyi yenile veya yeni portföyü listeye ekle
        // await this.fetchProperties({ page: this.pagination.currentPage, per_page: this.pagination.perPage });
        return response.data; // Oluşturulan portföyü dön
      } catch (err) {
        const msg = err.response?.data?.msg || 'Portföy oluşturulamadı.';
        this._setError(msg);
        throw err;
      }
    },

    async updateProperty(propertyId, propertyData) {
      this._setSubmitting(true);
      try {
        const response = await apiClient.put(`/properties/${propertyId}`, propertyData);
        if (this.currentProperty && this.currentProperty.id === propertyId) {
          this.currentProperty = response.data;
        }
        const index = this.properties.findIndex(p => p.id === propertyId);
        if (index !== -1) {
          this.properties[index] = response.data;
        }
        this._setSuccess('Portföy başarıyla güncellendi.');
        return response.data;
      } catch (err) {
        const msg = err.response?.data?.msg || 'Portföy güncellenemedi.';
        this._setError(msg);
        throw err;
      }
    },

    async deleteProperty(propertyId) {
      this._setSubmitting(true);
      try {
        await apiClient.delete(`/properties/${propertyId}`);
        this.properties = this.properties.filter(p => p.id !== propertyId);
        if (this.currentProperty && this.currentProperty.id === propertyId) {
            this.currentProperty = null;
        }
        this._setSuccess('Portföy başarıyla silindi.');
        return true;
      } catch (err) {
        const msg = err.response?.data?.msg || 'Portföy silinemedi.';
        this._setError(msg);
        return false;
      }
    },

    // --- Yardımcı Verileri Çekme ---
    async fetchPropertyTypes() {
      // Cache kontrolü eklenebilir (eğer tipler sık değişmiyorsa)
      // if (this.propertyTypes.length > 0) return;
      this._setLoading(true); // Ayrı bir loading state de kullanılabilir
      try {
        const response = await apiClient.get('/properties/types');
        this.propertyTypes = response.data;
        this.status.isLoading = false; // Genel loading'i etkilemesin diye ayrı bir state olabilir
      } catch (err) {
        console.error("Portföy tipleri yüklenemedi:", err);
        // Hata yönetimi eklenebilir, this.status.error'u etkilemesin
        this.propertyTypes = [];
        this.status.isLoading = false;
      }
    },

    async fetchPropertyStatuses() {
      // if (this.propertyStatuses.length > 0) return;
      this._setLoading(true);
      try {
        const response = await apiClient.get('/properties/statuses');
        this.propertyStatuses = response.data;
        this.status.isLoading = false;
      } catch (err) {
        console.error("Portföy durumları yüklenemedi:", err);
        this.propertyStatuses = [];
        this.status.isLoading = false;
      }
    },
  }
});