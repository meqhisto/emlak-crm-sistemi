<template>
  <div class="property-list-view admin-page-container">
    <div class="page-header">
      <h2>Portföy Listesi</h2>
<router-link
      v-if="canCreateProject"
      :to="{ name: 'project-new' }"
      class="action-button add-new-button"
    >
      <i class="fas fa-plus-circle"></i> Yeni Proje Ekle
    </router-link>
    </div>

    <!-- Filtreler Paneli -->
    <div class="filters-panel card">
      <div class="filter-row">
        <div class="filter-item flex-grow">
          <label for="search">Genel Arama:</label>
          <input
            type="text"
            id="search"
            v-model="filters.search"
            placeholder="Başlık, Açıklama, Şehir, İlçe..."
            @keyup.enter="applyFiltersAndSearch"
          />
        </div>
      </div>
      <div class="filter-row">
        <div class="filter-item">
          <label for="propertyType">Gayrimenkul Tipi:</label>
          <select id="propertyType" v-model="filters.property_type">
            <option :value="null">Tümü</option>
            <option v-for="ptype in propertyStore.propertyTypes" :key="ptype" :value="ptype">
              {{ ptype }}
            </option>
          </select>
        </div>
        <div class="filter-item">
          <label for="listingType">İlan Tipi:</label>
          <select id="listingType" v-model="filters.listing_type">
            <option :value="null">Tümü</option>
            <option value="Satılık">Satılık</option>
            <option value="Kiralık">Kiralık</option>
          </select>
        </div>
        <div class="filter-item">
          <label for="status">Durum:</label>
          <select id="status" v-model="filters.status">
            <option :value="null">Tümü</option>
            <option v-for="pstatus in propertyStore.propertyStatuses" :key="pstatus" :value="pstatus">
              {{ pstatus }}
            </option>
          </select>
        </div>
      </div>
      <div class="filter-row">
        <div class="filter-item price-filter">
          <label for="minPrice">Min. Fiyat:</label>
          <input type="number" id="minPrice" v-model.number="filters.min_price" placeholder="Min." />
        </div>
        <div class="filter-item price-filter">
          <label for="maxPrice">Maks. Fiyat:</label>
          <input type="number" id="maxPrice" v-model.number="filters.max_price" placeholder="Maks." />
        </div>
      </div>
      <div class="filter-row" v-if="authStore.isAdmin || authStore.isBroker">
        <div class="filter-item">
          <label for="consultantFilter">Danışman:</label>
          <select id="consultantFilter" v-model="filters.consultant_id">
              <option :value="null">Tüm Danışmanlar</option>
              <option v-for="consultant in availableConsultants" :key="consultant.id" :value="consultant.id">
                {{ consultant.first_name }} {{ consultant.last_name }}
              </option>
          </select>
        </div>
         <div class="filter-item">
          <label for="officeFilter">Ofis:</label>
          <select id="officeFilter" v-model="filters.office_id">
              <option :value="null">Tüm Ofisler</option>
              <option v-for="office in availableOffices" :key="office.id" :value="office.id">
                {{ office.name }}
              </option>
          </select>
        </div>
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

    <div v-if="propertyStore.status.isLoading" class="loading-spinner">Portföyler yükleniyor...</div>
    <div v-if="propertyStore.status.error" class="error-message">{{ propertyStore.status.error }}</div>
    <div v-if="!propertyStore.status.isLoading && !propertyStore.status.error && (!properties || properties.length === 0)" class="no-data-message">
      Filtrelere uygun portföy bulunamadı veya hiç portföy kaydı yok.
    </div>

    <div v-if="!propertyStore.status.isLoading && properties && properties.length > 0" class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Başlık</th>
              <th>Tip</th>
              <th>İlan Tipi</th>
              <th>Durum</th>
              <th>Fiyat</th>
              <th>Şehir/İlçe</th>
              <th>Danışman</th>
              <th>İlan Tarihi</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="property in properties" :key="property.id">
              <td>
                <router-link :to="{ name: 'property-detail', params: { id: property.id } }" class="property-title-link">
                  {{ property.title }}
                </router-link>
              </td>
              <td>{{ property.property_type }}</td>
              <td>{{ property.listing_type }}</td>
              <td><span :class="['status-badge', getStatusClass(property.status)]">{{ property.status }}</span></td>
              <td>{{ formatPrice(property.price, property.currency) }}</td>
              <td>{{ property.city }}{{ property.district ? ` / ${property.district}` : '' }}</td>
              <td>
                <span v-if="property.consultant">{{ property.consultant.full_name || property.consultant.username }}</span>
                <span v-else>-</span>
              </td>
              <td>{{ formatDate(property.listing_date) }}</td>
              <td class="table-actions">
                <router-link :to="{ name: 'property-detail', params: { id: property.id } }" class="action-button view small" title="Detay">
                  <i class="fas fa-eye"></i>
                </router-link>
                <router-link
                  v-if="canModify(property)"
                  :to="{ name: 'property-edit', params: { id: property.id } }"
                  class="action-button edit small" title="Düzenle">
                  <i class="fas fa-edit"></i>
                </router-link>
                <button
                  v-if="canModify(property)"
                  @click="confirmDeleteProperty(property.id)"
                  class="action-button delete small" title="Sil"
                >
                  <i class="fas fa-trash-alt"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
    </div>

    <!-- Pagination -->
    <div v-if="!propertyStore.status.isLoading && propertyStore.pagination.pages > 1" class="pagination-controls">
      <button @click="changePage(1)" :disabled="propertyStore.pagination.currentPage === 1" title="İlk Sayfa">
        <i class="fas fa-angle-double-left"></i>
      </button>
      <button @click="changePage(propertyStore.pagination.currentPage - 1)" :disabled="propertyStore.pagination.currentPage <= 1" title="Önceki Sayfa">
        <i class="fas fa-angle-left"></i>
      </button>
      <span>Sayfa {{ propertyStore.pagination.currentPage }} / {{ propertyStore.pagination.pages }}</span>
      <button @click="changePage(propertyStore.pagination.currentPage + 1)" :disabled="propertyStore.pagination.currentPage >= propertyStore.pagination.pages" title="Sonraki Sayfa">
        <i class="fas fa-angle-right"></i>
      </button>
      <button @click="changePage(propertyStore.pagination.pages)" :disabled="propertyStore.pagination.currentPage === propertyStore.pagination.pages" title="Son Sayfa">
        <i class="fas fa-angle-double-right"></i>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, reactive, watch } from 'vue';
import { usePropertyStore } from '../../store/modules/propertyStore';
import { useAuthStore } from '../../store/modules/auth';
import apiClient from '../../services/apiClient';
// Font Awesome ikonları için (opsiyonel, projenize eklemiş olmanız gerekir)
// import '@fortawesome/fontawesome-free/css/all.css';

const propertyStore = usePropertyStore();
const authStore = useAuthStore();

const properties = computed(() => propertyStore.properties);

const initialFilters = {
  search: '', property_type: null, listing_type: null, status: null,
  city: '', district: '', min_price: null, max_price: null,
  consultant_id: null, office_id: null,
};
const filters = reactive({ ...initialFilters });

const perPageOptions = [10, 25, 50, 100]; // Sayfa başına öğe sayısı seçenekleri
const currentPerPage = ref(propertyStore.pagination.perPage || 10);

const availableConsultants = ref([]);
const availableOffices = ref([]);

const loadProperties = async (page = 1) => {
  const params = {
    page: page,
    per_page: currentPerPage.value,
  };
  // Filtreleri params'a ekle (sadece dolu olanları)
  for (const key in filters) {
    if (filters[key] !== null && filters[key] !== '') {
      params[key] = filters[key];
    }
  }
  await propertyStore.fetchProperties(params);
};

const fetchFilterDropdownOptions = async () => {
  await propertyStore.fetchPropertyTypes();
  await propertyStore.fetchPropertyStatuses();

  if (authStore.isAdmin || authStore.isBroker) {
    try {
      const usersPromise = apiClient.get('/users', { params: { per_page: 500 } }); // Rol filtresi backend'de
      const officesPromise = apiClient.get('/offices', { params: { per_page: 500 } });
      const [usersResponse, officesResponse] = await Promise.all([usersPromise, officesPromise]);
      
      availableConsultants.value = usersResponse.data.users.filter(
        u => u.role === 'danisman' || u.role === 'broker'
      );
      availableOffices.value = officesResponse.data.offices;
    } catch (error) {
      console.error("Filtre dropdown seçenekleri yüklenirken hata:", error);
      propertyStore.status.error = "Danışman veya ofis listesi yüklenemedi.";
    }
  }
};

onMounted(() => {
  propertyStore.resetStatus();
  fetchFilterDropdownOptions();
  loadProperties(1);
});

const applyFiltersAndSearch = () => {
  loadProperties(1); // Filtreler değiştiğinde ilk sayfadan başla
};

const resetAllFilters = () => {
  Object.assign(filters, initialFilters);
  currentPerPage.value = 10; // Varsayılan perPage'e dön
  loadProperties(1);
};

const changePage = (page) => {
  if (page >= 1 && page <= propertyStore.pagination.pages && page !== propertyStore.pagination.currentPage) {
    loadProperties(page);
  }
};

watch(currentPerPage, () => { // Sayfa başına öğe sayısı değiştiğinde
    loadProperties(1); // İlk sayfadan yeniden yükle
});


const formatPrice = (price, currency = 'TRY') => {
  if (price == null || isNaN(price)) return '-';
  try {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price);
  } catch (e) { return `${price} ${currency}`; }
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleDateString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  } catch (e) { return dateString; }
};

const getStatusClass = (status) => {
  if (!status) return '';
  return `status-${status.toLowerCase().replace(/ /g, '-').replace(/ı/g, 'i').replace(/İ/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c')}`;
};


const canModify = (property) => {
  if (!authStore.currentUser) return false;
  if (authStore.isAdmin || authStore.isBroker) return true;
  return authStore.currentUser.id === property.assigned_consultant_id;
};

const confirmDeleteProperty = async (propertyId) => {
  if (confirm('Bu portföyü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
    const success = await propertyStore.deleteProperty(propertyId);
    if (success) {
      if (properties.value.length === 0 && propertyStore.pagination.currentPage > 1) {
        loadProperties(propertyStore.pagination.currentPage - 1);
      } else {
        loadProperties(propertyStore.pagination.currentPage);
      }
      // Başarı mesajı store'da set ediliyor, istenirse burada da gösterilebilir
    }
    // Hata mesajı zaten store tarafından yönetiliyor
  }
};
</script>

<style scoped>
/* admin-page-container, page-header, action-button, table stilleri App.vue'den miras alınır */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}
.page-header h2 { margin: 0; }
.add-new-button i { margin-right: 0.5rem; }

.card { /* Filtre paneli için genel kart stili */
  background-color: #fff;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.07);
  margin-bottom: 1.5rem;
}

.filters-panel {
  display: flex;
  flex-direction: column; /* Filtre gruplarını alt alta sırala */
  gap: 1rem;
}
.filter-row {
  display: flex;
  flex-wrap: wrap; /* Küçük ekranlarda alt alta */
  gap: 1rem;
  align-items: flex-end; /* Label ve inputları hizala */
}
.filter-item {
  display: flex;
  flex-direction: column; /* Label üstte, input altta */
  gap: 0.25rem;
  flex: 1 1 200px; /* Esnek genişlik, minimum 200px */
}
.filter-item.flex-grow {
    flex-grow: 2; /* Arama inputu daha fazla yer kaplasın */
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
.price-filter {
    flex-basis: 120px; /* Fiyat inputları için daha dar */
    flex-grow: 0;
}
.filter-actions {
  display: flex;
  gap: 0.75rem;
  align-items: flex-end; /* Butonları diğerleriyle hizala */
  margin-left: auto; /* Eğer filter-row içinde değilse */
}
.filter-button i, .reset-button i { margin-right: 0.5rem; }
.reset-button { background-color: #6c757d; }
.reset-button:hover { background-color: #5a6268; }

.property-title-link {
    font-weight: 500;
    color: #007bff;
    text-decoration: none;
}
.property-title-link:hover {
    text-decoration: underline;
}

.status-badge {
  padding: 0.25em 0.6em; font-size: 0.8em; font-weight: 600;
  border-radius: 0.25rem; color: #fff; text-transform: capitalize;
  white-space: nowrap;
}
.status-aktif { background-color: #28a745; }
.status-satildi, .status-kiralandi { background-color: #dc3545; }
.status-rezerve-edildi { background-color: #ffc107; color: #212529 !important; } /* Sarıya uygun metin rengi */
.status-beklemede { background-color: #17a2b8; }
.status-yayindan-kaldirildi, .status-pasif { background-color: #6c757d; }


.table-responsive {
    overflow-x: auto; /* Küçük ekranlarda tabloyu scroll edilebilir yap */
}

.pagination-controls {
  margin-top: 1.5rem; display: flex; justify-content: center;
  align-items: center; gap: 0.5rem;
}
.pagination-controls button {
  background-color: #fff; border: 1px solid #dee2e6; color: #007bff;
  padding: 0.5rem 0.75rem; border-radius: 0.25rem; cursor: pointer;
  transition: background-color 0.15s ease-in-out;
}
.pagination-controls button:hover:not(:disabled) { background-color: #e9ecef; }
.pagination-controls button:disabled { color: #6c757d; cursor: not-allowed; }
.pagination-controls span { margin: 0 0.75rem; font-weight: 500; color: #495057; }
</style>