<template>
  <div class="project-list-view admin-page-container">
    <div class="page-header">
      <h2>Proje Listesi</h2>
    <router-link v-if="canCreateProject" :to="{ name: 'project-new' }" class="action-button add-new-button">
        <i class="fas fa-plus-circle"></i> Yeni Proje Ekle
      </router-link>
    </div>

    <!-- Filtreler Paneli -->
    <div class="filters-panel card">
      <div class="filter-row">
        <div class="filter-item flex-grow">
          <label for="searchProjects">Proje Ara:</label>
          <input
            type="text"
            id="searchProjects"
            v-model="filters.search"
            placeholder="Proje Adı, Geliştirici, Açıklama..."
            @keyup.enter="applyFiltersAndSearch"
          />
        </div>
      </div>
      <div class="filter-row">
        <div class="filter-item">
          <label for="projectStatusFilter">Proje Durumu:</label>
          <select id="projectStatusFilter" v-model="filters.status">
            <option :value="null">Tüm Durumlar</option>
            <option v-for="pstatus in projectStore.projectStatuses" :key="pstatus" :value="pstatus">
              {{ pstatus }}
            </option>
          </select>
        </div>
        <div class="filter-item">
          <label for="projectCityFilter">Şehir:</label>
          <input
            type="text"
            id="projectCityFilter"
            v-model="filters.city"
            placeholder="Şehir Ara..."
            @keyup.enter="applyFiltersAndSearch"
          />
        </div>
        <!-- İleride daha fazla filtre eklenebilir (örn: geliştirici, başlangıç tarihi aralığı) -->
      </div>
      <div class="filter-actions">
        <button @click="applyFiltersAndSearch" class="action-button filter-button">
            <i class="fas fa-filter"></i> Filtrele / Ara
        </button>
        <button @click="resetAllFilters" class="action-button reset-button">
            <i class="fas fa-undo"></i> Sıfırla
        </button>
      </div>
    </div>

    <div v-if="projectStore.status.isLoading" class="loading-spinner">Projeler yükleniyor...</div>
    <div v-if="projectStore.status.error" class="error-message">{{ projectStore.status.error }}</div>
    <div v-if="!projectStore.status.isLoading && !projectStore.status.error && (!projects || projects.length === 0)" class="no-data-message">
      Filtrelere uygun proje bulunamadı veya hiç proje kaydı yok.
    </div>

    <div v-if="!projectStore.status.isLoading && projects && projects.length > 0" class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Proje Adı</th>
              <th>Durum</th>
              <th>Şehir / İlçe</th>
              <th>Geliştirici</th>
              <th>Birimler (T/S/R/K)</th> <!-- Toplam/Satılan/Rezerve/Kalan -->
              <th>Başlangıç T.</th>
              <th>Tahmini Bitiş T.</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="project in projects" :key="project.id">
              <td>
                <router-link :to="{ name: 'project-detail', params: { id: project.id } }" class="item-title-link">
                  {{ project.name }}
                </router-link>
              </td>
              <td><span :class="['status-badge', getProjectStatusClass(project.status)]">{{ project.status }}</span></td>
              <td>{{ project.city }}{{ project.district ? ` / ${project.district}` : '' }}</td>
              <td>{{ project.developer_company || '-' }}</td>
              <td>
                <span v-if="project.units_summary">
                  {{ project.units_summary.total_defined || 0 }} /
                  <span class="text-success">{{ project.units_summary.sold || 0 }}</span> /
                  <span class="text-warning">{{ project.units_summary.reserved || 0 }}</span> /
                  <span class="text-info">{{ project.units_summary.available || 0 }}</span>
                </span>
                <span v-else>-</span>
              </td>
              <td>{{ formatDate(project.start_date) }}</td>
              <td>{{ formatDate(project.estimated_completion_date) }}</td>
              <td class="table-actions">
                <router-link :to="{ name: 'project-detail', params: { id: project.id } }" class="action-button view small" title="Detay">
                  <i class="fas fa-eye"></i>
                </router-link>
                <router-link
                  v-if="canModifyProject(project)"
                  :to="{ name: 'project-edit', params: { id: project.id } }"
                  class="action-button edit small" title="Düzenle">
                  <i class="fas fa-edit"></i>
                </router-link>
                <button
                  v-if="canDeleteProject(project)"
                  @click="confirmDeleteProject(project.id)"
                  class="action-button delete small" title="Sil"
                  :disabled="projectStore.status.isSubmitting && projectStore.currentProject?.id === project.id"
                >
                  <i class="fas fa-trash-alt"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
    </div>

    <!-- Pagination -->
    <div v-if="!projectStore.status.isLoading && projectStore.pagination.pages > 1" class="pagination-controls">
        <button @click="changePage(1)" :disabled="projectStore.pagination.currentPage === 1" title="İlk Sayfa"><i class="fas fa-angle-double-left"></i></button>
        <button @click="changePage(projectStore.pagination.currentPage - 1)" :disabled="projectStore.pagination.currentPage <= 1" title="Önceki Sayfa"><i class="fas fa-angle-left"></i></button>
        <span>Sayfa {{ projectStore.pagination.currentPage }} / {{ projectStore.pagination.pages }}</span>
        <button @click="changePage(projectStore.pagination.currentPage + 1)" :disabled="projectStore.pagination.currentPage >= projectStore.pagination.pages" title="Sonraki Sayfa"><i class="fas fa-angle-right"></i></button>
        <button @click="changePage(projectStore.pagination.pages)" :disabled="projectStore.pagination.currentPage === projectStore.pagination.pages" title="Son Sayfa"><i class="fas fa-angle-double-right"></i></button>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, computed, reactive, watch } from 'vue';
import { useProjectStore } from '../../store/modules/projectStore';
import { useAuthStore } from '../../store/modules/authStore';
// Font Awesome için (main.js'de global import edildiğini varsayıyoruz)
// import '@fortawesome/fontawesome-free/css/all.css';
import { useRouter } from 'vue-router';
const router = useRouter();

const goToNewProjectPage = () => {
  router.push({ name: 'project-new' }); // ÖNEMLİ: Route adı doğru mu?
};

const projectStore = useProjectStore();
const authStore = useAuthStore();

const projects = computed(() => projectStore.projects);

const initialFilters = {
  search: '',
  status: null,
  city: '',
  // district: '', // İhtiyaca göre eklenebilir
};
const filters = reactive({ ...initialFilters });

const perPageOptions = [10, 25, 50];
const currentPerPage = ref(projectStore.pagination.perPage || 10);

const loadProjects = async (page = 1) => {
  const params = {
    page: page,
    per_page: currentPerPage.value,
  };
  for (const key in filters) {
    if (filters[key] !== null && filters[key] !== '') {
      params[key] = filters[key];
    }
  }
  await projectStore.fetchProjects(params);
};

const fetchFilterDropdownOptions = async () => {
  await projectStore.fetchProjectStatuses();
  // Başka dropdownlar için (örn: geliştiriciler) API çağrıları eklenebilir
};

onMounted(() => {
  projectStore.resetStatus();
  fetchFilterDropdownOptions();
  loadProjects(1);
});

const applyFiltersAndSearch = () => {
  loadProjects(1);
};

const resetAllFilters = () => {
  Object.assign(filters, initialFilters);
  currentPerPage.value = 10;
  loadProjects(1);
};

const changePage = (page) => {
  if (page >= 1 && page <= projectStore.pagination.pages && page !== projectStore.pagination.currentPage) {
    loadProjects(page);
  }
};

watch(currentPerPage, () => {
    loadProjects(1);
});

const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleDateString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  } catch (e) { return dateString; }
};

const getProjectStatusClass = (status) => {
  if (!status) return 'status-default';
  const normalizedStatus = status.toLowerCase()
    .replace(/ /g, '-')
    .replace(/ı/g, 'i').replace(/İ/g, 'i')
    .replace(/ğ/g, 'g').replace(/ü/g, 'u')
    .replace(/ş/g, 's').replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
  return `status-project-${normalizedStatus}`;
};

// ProjectListView.vue -> <script setup>
const canCreateProject = computed(() => {
    return authStore.isAdmin || authStore.isBroker;
});
const canModifyProject = (project) => { // Proje özelinde yetki (ileride daha detaylı olabilir)
    return authStore.isAdmin || authStore.isBroker;
};
const canDeleteProject = (project) => { // Proje özelinde yetki
    return authStore.isAdmin; // Sadece admin silebilir (örnek)
};

const confirmDeleteProject = async (projectId) => {
  if (confirm('Bu projeyi ve tüm birimlerini kalıcı olarak silmek istediğinizden emin misiniz?')) {
    // Silme işlemi sırasında currentProject'i geçici olarak set edebiliriz ki buton disabled olsun
    projectStore.currentProject = { id: projectId }; // Ya da ayrı bir deletingProjectId ref'i
    const success = await projectStore.deleteProject(projectId);
    if (success) {
      if (projects.value.length === 0 && projectStore.pagination.currentPage > 1) {
        loadProjects(projectStore.pagination.currentPage - 1);
      } else {
        loadProjects(projectStore.pagination.currentPage);
      }
    }
    projectStore.currentProject = null; // Temizle
  }
};
</script>

<style scoped>
/* admin-page-container, page-header, action-button, table, pagination-controls vb. genel stiller App.vue'den miras alınabilir */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}
.page-header h2 { margin: 0; }
.add-new-button i { margin-right: 0.5rem; }

.card { /* Filtre paneli için */
  background-color: #fff;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.07);
  margin-bottom: 1.5rem;
}

.filters-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: flex-end;
}
.filter-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1 1 220px; /* Esnek genişlik */
}
.filter-item.flex-grow {
    flex-grow: 2;
}
.filter-item label {
  font-size: 0.85em;
  color: #495057;
  margin-bottom: 0.25rem;
}
.filter-item input[type="text"],
.filter-item input[type="number"],
.filter-item select {
  width: 100%;
  padding: 0.6rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.9rem;
}
.filter-actions {
  display: flex;
  gap: 0.75rem;
  align-items: flex-end;
  /* margin-left: auto;  Eğer filter-row içindeyse bu gereksiz */
}
.filter-actions button i { margin-right: 0.5rem; }
.reset-button { background-color: #6c757d; }
.reset-button:hover { background-color: #5a6268; }

.item-title-link {
    font-weight: 500;
    color: #007bff;
    text-decoration: none;
}
.item-title-link:hover {
    text-decoration: underline;
}

.status-badge { /* Genel durum badge stili */
  padding: 0.25em 0.6em; font-size: 0.8em; font-weight: 600;
  border-radius: 0.25rem; color: #fff; text-transform: capitalize;
  white-space: nowrap;
}
/* Proje Durum Renkleri (Örnek) */
.status-project-planlama-asamasinda { background-color: #17a2b8; } /* Mavi */
.status-project-insaat-halinde { background-color: #ffc107; color: #212529 !important;} /* Sarı */
.status-project-satista { background-color: #28a745; } /* Yeşil */
.status-project-tamamlandi { background-color: #007bff; } /* Koyu Mavi */
.status-project-iptal-edildi { background-color: #dc3545; } /* Kırmızı */
.status-project-default { background-color: #6c757d; } /* Gri */

.text-success { color: #28a745; font-weight: bold; }
.text-warning { color: #ffc107; font-weight: bold; }
.text-info { color: #17a2b8; font-weight: bold; }

.table-responsive { overflow-x: auto; }
.table-actions .action-button.small i { margin-right: 0; } /* İkonlu küçük butonlarda yazı olmasın */
</style>