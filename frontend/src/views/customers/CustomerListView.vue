<template>
  <div class="customer-list-view admin-page-container">
    <div class="page-header">
      <h2>Müşteri Listesi</h2>
      <router-link :to="{ name: 'customer-new' }" class="action-button add-new-button">
        Yeni Müşteri Ekle
      </router-link>
    </div>

    <div class="filters-container">
      <input
        type="text"
        v-model="searchTerm"
        placeholder="Müşteri Ara (Ad, E-posta, Telefon)..."
        @keyup.enter="applyFilters"
        class="search-input"
      />
      <select v-if="authStore.isAdmin || authStore.isBroker" v-model="selectedConsultantId" @change="applyFilters" class="filter-select">
        <option :value="null">Tüm Danışmanlar</option>
        <option v-for="consultant in availableConsultants" :key="consultant.id" :value="consultant.id">
          {{ consultant.first_name }} {{ consultant.last_name }} ({{ consultant.username }})
        </option>
      </select>
      <button @click="applyFilters" class="action-button filter-button">Filtrele/Ara</button>
      <button @click="resetFilters" class="action-button reset-button">Sıfırla</button>
    </div>

    <div v-if="customerStore.status.isLoading" class="loading-spinner">Müşteriler yükleniyor...</div>
    <div v-if="customerStore.status.error" class="error-message">{{ customerStore.status.error }}</div>
    <div v-if="!customerStore.status.isLoading && !customerStore.status.error && (!customerStore.customers || customerStore.customers.length === 0)" class="no-data-message">
      Filtrelere uygun müşteri bulunamadı veya hiç müşteri kaydı yok.
    </div>

    <table v-if="!customerStore.status.isLoading && customerStore.customers && customerStore.customers.length > 0">
      <thead>
        <tr>
          <th>Ad Soyad</th>
          <th>E-posta</th>
          <th>Telefon</th>
          <th>Danışman</th>
          <th>Müşteri Tipi</th>
          <th>Kaynak</th>
          <th>İşlemler</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="customer in customerStore.customers" :key="customer.id">
          <td>
            <router-link :to="{ name: 'customer-detail', params: { id: customer.id } }">
              {{ customer.first_name }} {{ customer.last_name || '' }}
            </router-link>
          </td>
          <td>{{ customer.email || '-' }}</td>
          <td>{{ customer.phone_number_primary }}</td>
          <td>
            <span v-if="customer.consultant">{{ customer.consultant.full_name || customer.consultant.username }}</span>
            <span v-else>-</span>
          </td>
          <td>{{ customer.customer_type || '-' }}</td>
          <td>{{ customer.lead_source || '-' }}</td>
          <td class="table-actions">
            <router-link :to="{ name: 'customer-edit', params: { id: customer.id } }" class="action-button edit small">
              Düzenle
            </router-link>
            <button
              v-if="authStore.isAdmin || authStore.isBroker || (authStore.currentUser && authStore.currentUser.id === customer.assigned_consultant_id)"
              @click="confirmDeleteCustomer(customer.id)"
              class="action-button delete small"
            >
              Sil
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Pagination -->
    <div v-if="customerStore.pagination.pages > 1" class="pagination-controls">
      <button
        @click="changePage(customerStore.pagination.currentPage - 1)"
        :disabled="customerStore.pagination.currentPage <= 1"
      >
        « Önceki
      </button>
      <span>Sayfa {{ customerStore.pagination.currentPage }} / {{ customerStore.pagination.pages }}</span>
      <button
        @click="changePage(customerStore.pagination.currentPage + 1)"
        :disabled="customerStore.pagination.currentPage >= customerStore.pagination.pages"
      >
        Sonraki »
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useCustomerStore } from '../../store/modules/customerStore';
import { useAuthStore } from '../../store/modules/authStore';
import apiClient from '../../services/apiClient'; // Danışmanları çekmek için

const customerStore = useCustomerStore();
const authStore = useAuthStore();

const searchTerm = ref('');
const selectedConsultantId = ref(null);
const availableConsultants = ref([]); // Admin/Broker için danışman listesi

const perPage = ref(customerStore.pagination.perPage || 10); // Store'dan veya varsayılan

const loadCustomers = (page = 1) => {
  const params = {
    page: page,
    per_page: perPage.value,
    search: searchTerm.value || null, // Boşsa null gönder, backend ona göre davransın
    consultant_id: selectedConsultantId.value || null,
  };
  // Boş veya null olan parametreleri sil (backend'e gereksiz query param gitmesin)
  Object.keys(params).forEach(key => (params[key] == null || params[key] === '') && delete params[key]);
  customerStore.fetchCustomers(params);
};

const fetchConsultantsForFilter = async () => {
  if (authStore.isAdmin || authStore.isBroker) {
    try {
      // Tüm danışman ve brokerları çek (rol bazlı filtreleme backend'de yapılabilir veya burada)
      const response = await apiClient.get('/users', { params: { per_page: 200 } }); // Rol filtrelemesi için backend'e parametre eklenebilir
      availableConsultants.value = response.data.users.filter(
        user => user.role === 'danisman' || user.role === 'broker'
      );
    } catch (error) {
      console.error("Danışmanlar yüklenirken hata:", error);
      // Hata mesajı kullanıcıya gösterilebilir
    }
  }
};

onMounted(() => {
  customerStore.resetStatus(); // Sayfa yüklendiğinde önceki hataları temizle
  loadCustomers(1);
  if (authStore.isAdmin || authStore.isBroker) {
    fetchConsultantsForFilter();
  }
});

const applyFilters = () => {
  loadCustomers(1); // Filtreler değiştiğinde ilk sayfadan başla
};

const resetFilters = () => {
  searchTerm.value = '';
  selectedConsultantId.value = null;
  loadCustomers(1);
};

const changePage = (page) => {
  if (page >= 1 && page <= customerStore.pagination.pages) {
    loadCustomers(page);
  }
};

const confirmDeleteCustomer = async (customerId) => {
  if (confirm('Bu müşteriyi silmek istediğinizden emin misiniz?')) {
    const success = await customerStore.deleteCustomer(customerId);
    if (success) {
      // Eğer silinen müşteri mevcut sayfadaki son müşteri ise ve birden fazla sayfa varsa,
      // bir önceki sayfaya gitmeyi düşünebiliriz veya listeyi yeniden yükleyebiliriz.
      // Şimdilik basitçe listeyi yeniden yükleyelim (veya store zaten bunu yapıyor).
      if (customerStore.customers.length === 0 && customerStore.pagination.currentPage > 1) {
        loadCustomers(customerStore.pagination.currentPage - 1);
      } else {
        // Mevcut sayfayı yeniden yükle veya store'un tepkisel olmasını bekle
        loadCustomers(customerStore.pagination.currentPage);
      }
      // alert('Müşteri başarıyla silindi.'); // Store'dan successMessage gösterilebilir
    }
    // Hata durumunda store zaten error state'ini güncelliyor.
  }
};

// Store'daki hata veya başarı mesajlarını izleyip kullanıcıya göstermek için (opsiyonel)
watch(() => customerStore.status.error, (newError) => {
  if (newError) {
    // alert(`Hata: ${newError}`); // Veya daha iyi bir bildirim sistemi
  }
});
watch(() => customerStore.status.successMessage, (newMessage) => {
  if (newMessage) {
    // alert(newMessage);
    // customerStore.resetStatus(); // Mesaj gösterildikten sonra sıfırla
  }
});

</script>

<style scoped>
/* admin-page-container stilleri App.vue'den geliyor olabilir */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}
.page-header h2 {
  margin: 0;
  color: #333;
}
.add-new-button {
    padding: 0.6rem 1.2rem; /* Biraz daha büyük */
}

.filters-container {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: #f9f9f9;
  border-radius: 6px;
  align-items: center;
}
.search-input {
  flex-grow: 1;
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.filter-select {
    padding: 0.75rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    min-width: 200px; /* Danışman isimleri sığsın */
}
.filter-button, .reset-button {
    padding: 0.75rem 1rem;
}
.reset-button {
    background-color: #6c757d;
}
.reset-button:hover {
    background-color: #5a6268;
}

/* Tablo ve pagination stilleri App.vue'deki genel stillerden miras alabilir veya burada özelleştirilebilir */
.table-actions .action-button.small {
    padding: 0.25rem 0.5rem;
    font-size: 0.8rem;
}
.pagination-controls {
  margin-top: 1.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
}
.pagination-controls button {
  padding: 0.5rem 1rem;
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
}
.pagination-controls button:disabled {
  background-color: #e9ecef;
  cursor: not-allowed;
  opacity: 0.7;
}
.pagination-controls span {
  margin: 0 0.5rem;
  font-weight: 500;
}
</style>