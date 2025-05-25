import { defineStore } from 'pinia';
import apiClient from '../../services/apiClient'; // API istemcimiz

export const usePropertyStore = defineStore('property', {
  state: () => ({
    properties: [], // Portföy listesi
    currentProperty: null, // Detay sayfasında veya düzenleme formunda gösterilecek portföy
    currentPropertyPhotos: [], // Seçili portföyün fotoğrafları (detay sayfası için)
    currentPropertyDocuments: [], // Seçili portföyün belgeleri (detay sayfası için)
    propertyTypes: [], // Backend'den çekilecek portföy tipleri (form dropdownları için)
    propertyStatuses: [], // Backend'den çekilecek portföy durumları (form dropdownları için)
    pagination: {
      total: 0,
      pages: 0,
      currentPage: 1,
      perPage: 10, // Varsayılan, PropertyListView'de ayarlanabilir
    },
    status: { // API istek durumları
      isLoading: false, // Genel liste veya detay yükleme durumu
      isSubmitting: false, // Form gönderme (create/update) durumu
      error: null, // API'den dönen hata mesajı
      successMessage: null, // Başarılı işlem mesajı
    },
  }),

  getters: {
    // İhtiyaç duyulursa buraya getter'lar eklenebilir. Örneğin:
    // getPropertyById: (state) => (id) => state.properties.find(p => p.id === id),
    // isLoadingOverall: (state) => state.status.isLoading || state.status.isSubmitting,
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
      this.status.error = errorMsg || "Bilinmeyen bir hata oluştu."; // Varsayılan hata mesajı
      this.status.isLoading = false;
      this.status.isSubmitting = false;
      this.status.successMessage = null; // Başarı mesajını temizle
    },
    _setSuccess(message) {
      this.status.successMessage = message;
      this.status.isLoading = false;
      this.status.isSubmitting = false;
      this.status.error = null; // Hata mesajını temizle
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
        const cleanParams = Object.fromEntries(
          Object.entries(params).filter(([_, v]) => v != null && v !== '')
        );
        const response = await apiClient.get('/properties', { params: cleanParams });
        this.properties = response.data.properties;
        this.pagination.total = response.data.total;
        this.pagination.pages = response.data.pages;
        this.pagination.currentPage = response.data.current_page;
        this.pagination.perPage = params.per_page || this.pagination.perPage;
        // Listeleme için başarı mesajı genellikle gösterilmez, o yüzden _setSuccess çağrılmıyor.
        this.status.isLoading = false; // Sadece loading'i kapat
      } catch (err) {
        const msg = err.response?.data?.msg || 'Portföyler yüklenirken bir hata oluştu.';
        this._setError(msg);
        this.properties = []; // Hata durumunda listeyi boşalt ki UI'da sorun olmasın
      }
    },

// propertyStore.js -> fetchPropertyById
async fetchPropertyById(propertyId) {
  this._setLoading(true);
  this.currentProperty = null;
  this.currentPropertyPhotos = [];
  this.currentPropertyDocuments = [];
  let fetchedPropertyData = null; // Geçici değişken

  try {
    const response = await apiClient.get(`/properties/${propertyId}`);
    console.log("Store - API Response Property Detail:", response.data);
    fetchedPropertyData = response.data; // Önce geçici değişkene al
    // ... (details parse etme kısmı kalabilir)
    if (fetchedPropertyData && typeof fetchedPropertyData.details === 'string') {
        try { fetchedPropertyData.details = JSON.parse(fetchedPropertyData.details); }
        catch (e) { fetchedPropertyData.details = {}; }
    }
  } catch (err) {
    const msg = err.response?.data?.msg || `Portföy (ID: ${propertyId}) detayı yüklenemedi. Hata Kodu: ${err.response?.status}`;
    this._setError(msg);
    this.status.isLoading = false; // Hata durumunda loading'i kapat
    return null; // Hata durumunda null dön
  }

  // Eğer ana veri başarıyla çekildiyse, state'i güncelle ve medyaları çek
  if (fetchedPropertyData) {
    this.currentProperty = fetchedPropertyData;
    if (this.currentProperty.id) { // ID varsa medyaları çek
        console.log("Store - Ana portföy çekildi, medyalar çekiliyor...");
        // Bu çağrıların da await ile bitmesini bekleyebiliriz veya ayrı loading state'leri olabilir
        await this.fetchPropertyPhotos(this.currentProperty.id);
        await this.fetchPropertyDocuments(this.currentProperty.id);
    }
  }
  this.status.isLoading = false; // Tüm işlemler bittikten sonra
  return this.currentProperty;
},
    async createProperty(propertyData) {
      this._setSubmitting(true); // Ana form gönderme işlemi için
      try {
        const response = await apiClient.post('/properties', propertyData);
        // Başarı mesajı handleSubmit içinde set edilecek (medya yüklemeden sonra)
        // this._setSuccess('Portföy başarıyla oluşturuldu.');
        // Listeyi yenilemek yerine, genellikle kullanıcı yeni oluşturulan kaydın detayına yönlendirilir.
        return response.data; // Oluşturulan portföyü dön (ID'si medya yükleme için lazım olacak)
      } catch (err) {
        const msg = err.response?.data?.msg || 'Portföy oluşturulamadı.';
        this._setError(msg);
        throw err; // Hatanın component tarafından yakalanabilmesi için tekrar fırlat
      } finally {
        // this._setSubmitting(false); // Bu, handleSubmit'in en sonunda yapılmalı
      }
    },

    async updateProperty(propertyId, propertyData) {
      this._setSubmitting(true);
      try {
        const response = await apiClient.put(`/properties/${propertyId}`, propertyData);
        // if (this.currentProperty && this.currentProperty.id === propertyId) {
        //   this.currentProperty = response.data; // Detay sayfası açıksa güncelle
        // }
        // // Listede varsa onu da güncelle
        // const index = this.properties.findIndex(p => p.id === propertyId);
        // if (index !== -1) {
        //   this.properties[index] = response.data;
        // }
        // Başarı mesajı handleSubmit içinde set edilecek
        return response.data;
      } catch (err) {
        const msg = err.response?.data?.msg || 'Portföy güncellenemedi.';
        this._setError(msg);
        throw err;
      } finally {
        // this._setSubmitting(false);
      }
    },

    async deleteProperty(propertyId) {
      this._setSubmitting(true); // Genel bir işlem olduğu için
      try {
        await apiClient.delete(`/properties/${propertyId}`);
        // Listeden ve currentProperty'den çıkarma işlemi component'te yapılabilir veya burada da
        this.properties = this.properties.filter(p => p.id !== propertyId);
        if (this.currentProperty && this.currentProperty.id === propertyId) {
            this.currentProperty = null;
            this.currentPropertyPhotos = [];
            this.currentPropertyDocuments = [];
        }
        this._setSuccess('Portföy başarıyla silindi.');
        return true;
      } catch (err) {
        const msg = err.response?.data?.msg || 'Portföy silinemedi.';
        this._setError(msg);
        return false;
      } finally {
        this._setSubmitting(false);
      }
    },

    // --- Portföy Medya Listeleme Action'ları ---
    async fetchPropertyPhotos(propertyId) {
        // Bu action fetchPropertyById içinde veya medya yüklendikten sonra çağrılabilir.
        // Ayrı bir loading state (örn: this.status.isPhotosLoading) kullanılabilir.
        try {
            const response = await apiClient.get(`/properties/${propertyId}/photos`);
            this.currentPropertyPhotos = response.data || [];
            console.log("Store: Fetched Photos:", JSON.parse(JSON.stringify(this.currentPropertyPhotos))); // <<< KONTROL
        } catch (err) {
            console.error(`Fotoğraflar yüklenemedi (Portföy ID: ${propertyId}):`, err.response?.data?.msg || err.message);
            this.currentPropertyPhotos = [];
            // Kullanıcıya gösterilecek bir hata state'i set edilebilir.
            // this.status.error = 'Portföye ait fotoğraflar yüklenemedi.';
        }
    },

    async fetchPropertyDocuments(propertyId) {
        try {
        const response = await apiClient.get(`/properties/${propertyId}/documents`);
        this.currentPropertyDocuments = response.data || [];
        console.log("Store: Fetched Documents:", JSON.parse(JSON.stringify(this.currentPropertyDocuments))); // <<< KONTROL
        } catch (err) {
            console.error(`Belgeler yüklenemedi (Portföy ID: ${propertyId}):`, err.response?.data?.msg || err.message);
            this.currentPropertyDocuments = [];
            // this.status.error = 'Portföye ait belgeler yüklenemedi.';
        }
    },

    // Not: Fotoğraf/Belge yükleme (POST) ve silme (DELETE) action'ları
    // doğrudan PropertyFormView.vue içinde apiClient kullanılarak yapılıyor.
    // Bu action'lar istenirse merkezi yönetim için buraya da taşınabilir.
    // Örneğin:
    // async uploadPhoto(propertyId, formData) { /* ... */ }
    // async deletePhoto(propertyId, photoId) { /* ... */ }


    // --- Yardımcı Verileri Çekme (Dropdownlar için) ---
    async fetchPropertyTypes() {
      if (this.propertyTypes.length > 0 && !this.status.error) return; // Basit cache
      // this.status.isLoading = true; // Ayrı bir loading state
      try {
        const response = await apiClient.get('/properties/types');
        this.propertyTypes = response.data;
        // this.status.isLoading = false;
      } catch (err) {
        console.error("Portföy tipleri yüklenemedi:", err.response?.data?.msg || err.message);
        this.propertyTypes = []; // Hata durumunda boşalt
        // this.status.isLoading = false;
        // this.status.error = "Portföy tipleri yüklenemedi."; // Genel hatayı etkileyebilir
      }
    },

    async fetchPropertyStatuses() {
      if (this.propertyStatuses.length > 0 && !this.status.error) return; // Basit cache
      // this.status.isLoading = true;
      try {
        const response = await apiClient.get('/properties/statuses');
        this.propertyStatuses = response.data;
        // this.status.isLoading = false;
      } catch (err) {
        console.error("Portföy durumları yüklenemedi:", err.response?.data?.msg || err.message);
        this.propertyStatuses = [];
        // this.status.isLoading = false;
        // this.status.error = "Portföy durumları yüklenemedi.";
      }
    },
  }
});