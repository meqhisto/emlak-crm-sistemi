import { defineStore } from 'pinia';
import apiClient from '../../services/apiClient';

export const useProjectStore = defineStore('project', {
  state: () => ({
    projects: [],
    currentProject: null,
    currentProjectUnits: [],
    currentProjectDocuments: [],
    projectStatuses: [], // Backend'den çekilecek proje durumları
    projectGenelTipList: [], // Backend'den çekilecek proje genel tipleri
    unitTypes: [], // Backend'den çekilecek birim tipleri
    unitSaleStatuses: [], // Backend'den çekilecek birim satış durumları
    pagination: { total: 0, pages: 0, currentPage: 1, perPage: 10 },
    status: { isLoading: false, isSubmitting: false, error: null, successMessage: null },
  }),

  getters: {
    // ... (ihtiyaç duyulursa)
  },

  actions: {
    // --- Durum Yönetimi Yardımcıları ---
    _setLoading(loading) { this.status.isLoading = loading; if (loading) { this.status.error = null; this.status.successMessage = null; } },
    _setSubmitting(submitting) { this.status.isSubmitting = submitting; if (submitting) { this.status.error = null; this.status.successMessage = null; } },
    _setError(errorMsg) { this.status.error = errorMsg || "Bilinmeyen bir hata oluştu."; this.status.isLoading = false; this.status.isSubmitting = false; this.status.successMessage = null; },
    _setSuccess(message) { this.status.successMessage = message; this.status.isLoading = false; this.status.isSubmitting = false; this.status.error = null; },
    resetStatus() { this.status.isLoading = false; this.status.isSubmitting = false; this.status.error = null; this.status.successMessage = null; },

    // --- Proje CRUD İşlemleri ---
    async fetchProjects(params = { page: 1, per_page: 10 }) {
      this._setLoading(true);
      try {
        const cleanParams = Object.fromEntries(Object.entries(params).filter(([_, v]) => v != null && v !== ''));
        const response = await apiClient.get('/projects', { params: cleanParams });
        this.projects = response.data.projects;
        this.pagination = {
          total: response.data.total, pages: response.data.pages,
          currentPage: response.data.current_page, perPage: params.per_page || this.pagination.perPage,
        };
      } catch (err) {
        this._setError(err.response?.data?.msg || 'Projeler yüklenirken bir hata oluştu.');
        this.projects = [];
      } finally {
        this.status.isLoading = false; // finally bloğunda loading'i kapatmak daha iyi
      }
    },

    async fetchProjectById(projectId) {
      this._setLoading(true);
      this.currentProject = null; this.currentProjectUnits = []; this.currentProjectDocuments = [];
      try {
        const projectResponse = await apiClient.get(`/projects/${projectId}`);
        this.currentProject = projectResponse.data;
        if (this.currentProject && this.currentProject.id) {
          const unitsPromise = this.fetchUnitsForProject(this.currentProject.id);
          const documentsPromise = this.fetchProjectDocuments(this.currentProject.id);
          await Promise.all([unitsPromise, documentsPromise]);
        }
        return this.currentProject;
      } catch (err) {
        this._setError(err.response?.data?.msg || `Proje (ID: ${projectId}) detayı yüklenemedi.`);
        return null;
      } finally {
        this.status.isLoading = false;
      }
    },

    async createProject(projectData) {
      this._setSubmitting(true);
      try {
        const response = await apiClient.post('/projects', projectData);
        // Başarı mesajı genellikle component'te veya handleSubmit sonrası verilir.
        // this._setSuccess('Proje başarıyla oluşturuldu.');
        return response.data;
      } catch (err) {
        this._setError(err.response?.data?.msg || 'Proje oluşturulamadı.');
        throw err; // Component'in hatayı yakalaması için
      } finally {
        this._setSubmitting(false);
      }
    },

    async updateProject(projectId, projectData) {
      this._setSubmitting(true);
      try {
        const response = await apiClient.put(`/projects/${projectId}`, projectData);
        // this._setSuccess('Proje başarıyla güncellendi.');
        if (this.currentProject && this.currentProject.id === projectId) {
            await this.fetchProjectById(projectId); // Güncellenmiş veriyi ve ilişkili medyayı çek
        }
        return response.data;
      } catch (err) {
        this._setError(err.response?.data?.msg || 'Proje güncellenemedi.');
        throw err;
      } finally {
        this._setSubmitting(false);
      }
    },

    async deleteProject(projectId) {
      this._setSubmitting(true);
      try {
        await apiClient.delete(`/projects/${projectId}`);
        this.projects = this.projects.filter(p => p.id !== projectId);
        if (this.currentProject && this.currentProject.id === projectId) {
            this.currentProject = null; this.currentProjectUnits = []; this.currentProjectDocuments = [];
        }
        this._setSuccess('Proje başarıyla silindi.'); // Silme işlemi için başarı mesajı iyi olabilir
        return true;
      } catch (err) {
        this._setError(err.response?.data?.msg || 'Proje silinemedi.');
        return false;
      } finally {
        this._setSubmitting(false);
      }
    },

    // --- Projeye Bağlı Birim (Unit) İşlemleri ---
    async fetchUnitsForProject(projectId) {
        // Bu action için ayrı bir loading state (isUnitsLoading) daha iyi olabilir
        try {
            const response = await apiClient.get(`/projects/${projectId}/units`);
            this.currentProjectUnits = response.data || [];
        } catch (err) {
            console.error(`Birimler yüklenemedi (Proje ID: ${projectId}):`, err.response?.data?.msg || err.message);
            this.currentProjectUnits = [];
            // Genel error state'i etkilememek için burada _setError çağrılmayabilir veya ayrı bir error state.
        }
    },
    async createUnit(projectId, unitData) {
        this._setSubmitting(true); // Veya isUnitSubmitting gibi ayrı bir state
        try {
            const response = await apiClient.post(`/projects/${projectId}/units`, unitData);
            this.currentProjectUnits.unshift(response.data);
            // Ana projeyi yeniden çekerek units_summary'yi güncelle
            if(this.currentProject && this.currentProject.id === projectId) {
               await this.fetchProjectById(projectId); // Bu, birimleri de tekrar çeker, bu yüzden yukarıdaki unshift'e gerek kalmaz
            }
            // this._setSuccess('Birim başarıyla eklendi.'); // Ana formla çakışabilir
            return response.data;
        } catch (err) {
            this._setError(err.response?.data?.msg || 'Birim eklenemedi.');
            throw err;
        } finally {
            this._setSubmitting(false);
        }
    },
    async updateUnit(unitId, unitData) {
        this._setSubmitting(true);
        try {
            const response = await apiClient.put(`/projects/units/${unitId}`, unitData);
            // const index = this.currentProjectUnits.findIndex(u => u.id === unitId);
            // if (index !== -1) this.currentProjectUnits[index] = response.data;
            // Ana projeyi ve birim listesini yeniden çek
            if(this.currentProject) await this.fetchProjectById(this.currentProject.id);
            // this._setSuccess('Birim başarıyla güncellendi.');
            return response.data;
        } catch (err) {
            this._setError(err.response?.data?.msg || 'Birim güncellenemedi.');
            throw err;
        } finally {
            this._setSubmitting(false);
        }
    },
    async deleteUnit(unitId) {
        this._setSubmitting(true);
        try {
            await apiClient.delete(`/projects/units/${unitId}`);
            // this.currentProjectUnits = this.currentProjectUnits.filter(u => u.id !== unitId);
            // Ana projeyi ve birim listesini yeniden çek
            if(this.currentProject) await this.fetchProjectById(this.currentProject.id);
            // this._setSuccess('Birim başarıyla silindi.');
            return true;
        } catch (err) {
            this._setError(err.response?.data?.msg || 'Birim silinemedi.');
            return false;
        } finally {
            this._setSubmitting(false);
        }
    },

    // --- Proje Belge İşlemleri ---
    async fetchProjectDocuments(projectId) {
        try {
            const response = await apiClient.get(`/projects/${projectId}/documents`);
            this.currentProjectDocuments = response.data || [];
        } catch (err) {
            console.error(`Proje belgeleri yüklenemedi (Proje ID: ${projectId}):`, err.response?.data?.msg || err.message);
            this.currentProjectDocuments = [];
        }
    },

    // --- Yardımcı Verileri Çekme (Dropdownlar için) ---
    async fetchProjectStatuses() {
      if (this.projectStatuses.length > 0 && !this.status.error) return; // Basit cache
      try {
        const response = await apiClient.get('/projects/statuses'); // Backend route'u /statuses olarak güncellenmişti
        this.projectStatuses = response.data;
      } catch (err) {
        console.error("Proje durumları yüklenemedi:", err.response?.data?.msg || err.message);
        this.projectStatuses = [];
      }
    },
    async fetchUnitTypes() {
      if (this.unitTypes.length > 0 && !this.status.error) return;
      try {
        const response = await apiClient.get('/projects/unit-types');
        this.unitTypes = response.data;
      } catch (err) {
        console.error("Birim tipleri yüklenemedi:", err.response?.data?.msg || err.message);
        this.unitTypes = [];
      }
    },
    async fetchUnitSaleStatuses() {
      if (this.unitSaleStatuses.length > 0 && !this.status.error) return;
      try {
        const response = await apiClient.get('/projects/unit-sale-statuses');
        this.unitSaleStatuses = response.data;
      } catch (err) {
        console.error("Birim satış durumları yüklenemedi:", err.response?.data?.msg || err.message);
        this.unitSaleStatuses = [];
      }
    },
    async fetchProjectGenelTipleri() {
      if (this.projectGenelTipList.length > 0 && !this.status.error) return;
      try {
        const response = await apiClient.get('/projects/genel-tipler'); // Backend route'u /genel-tipler olarak güncellenmişti
        this.projectGenelTipList = response.data;
      } catch (err) {
        console.error("Proje genel tipleri yüklenemedi:", err.response?.data?.msg || err.message);
        this.projectGenelTipList = [];
      }
    },
  }
});