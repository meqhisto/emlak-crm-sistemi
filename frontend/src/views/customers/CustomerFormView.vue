<template>
  <div class="customer-form-view admin-page-container">
    <div class="page-header">
      <h2>{{ isEditMode ? 'Müşteriyi Düzenle' : 'Yeni Müşteri Ekle' }}</h2>
      <router-link :to="{ name: 'customer-list' }" class="action-button cancel-button">
        Listeye Dön
      </router-link>
    </div>

    <form @submit.prevent="handleSubmit" class="customer-form">
      <div class="form-grid">
        <div class="form-group">
          <label for="firstName">Ad (*):</label>
          <input type="text" id="firstName" v-model="customer.first_name" required />
        </div>

        <div class="form-group">
          <label for="lastName">Soyad:</label>
          <input type="text" id="lastName" v-model="customer.last_name" />
        </div>

        <div class="form-group">
          <label for="email">E-posta:</label>
          <input type="email" id="email" v-model="customer.email" />
        </div>

        <div class="form-group">
          <label for="phonePrimary">Birincil Telefon (*):</label>
          <input type="tel" id="phonePrimary" v-model="customer.phone_number_primary" required />
        </div>

        <div class="form-group">
          <label for="phoneSecondary">İkincil Telefon:</label>
          <input type="tel" id="phoneSecondary" v-model="customer.phone_number_secondary" />
        </div>

        <div class="form-group">
          <label for="address">Adres:</label>
          <input type="text" id="address" v-model="customer.address" />
        </div>

        <div class="form-group">
          <label for="city">Şehir:</label>
          <input type="text" id="city" v-model="customer.city" />
        </div>
         <div class="form-group">
          <label for="postalCode">Posta Kodu:</label>
          <input type="text" id="postalCode" v-model="customer.postal_code" />
        </div>

        <div class="form-group">
          <label for="customerType">Müşteri Tipi:</label>
          <select id="customerType" v-model="customer.customer_type">
            <option :value="null">Seçiniz...</option>
            <option value="Alıcı Adayı">Alıcı Adayı</option>
            <option value="Satıcı Adayı">Satıcı Adayı</option>
            <option value="Kiracı Adayı">Kiracı Adayı</option>
            <option value="Ev Sahibi">Ev Sahibi</option>
            <option value="Yatırımcı">Yatırımcı</option>
            <option value="Diğer">Diğer</option>
          </select>
        </div>

        <div class="form-group">
          <label for="leadSource">Kaynak:</label>
           <select id="leadSource" v-model="customer.lead_source">
            <option :value="null">Seçiniz...</option>
            <option value="Web Sitesi">Web Sitesi</option>
            <option value="Sosyal Medya">Sosyal Medya</option>
            <option value="Referans">Referans</option>
            <option value="Emlak Portalı">Emlak Portalı</option>
            <option value="Doğrudan Arama">Doğrudan Arama</option>
            <option value="Etkinlik">Etkinlik</option>
            <option value="Diğer">Diğer</option>
          </select>
        </div>

        <div class="form-group" v-if="authStore.isAdmin || authStore.isBroker">
          <label for="assignedConsultant">Atanan Danışman:</label>
          <select id="assignedConsultant" v-model="customer.assigned_consultant_id">
            <option :value="null">Danışman Yok</option>
            <option v-for="consultant in availableConsultants" :key="consultant.id" :value="consultant.id">
              {{ consultant.first_name }} {{ consultant.last_name }} ({{ consultant.username }})
            </option>
          </select>
        </div>

        <div class="form-group form-group-full">
          <label for="notes">Notlar:</label>
          <textarea id="notes" v-model="customer.notes" rows="4"></textarea>
        </div>

         <div class="form-group form-check" v-if="isEditMode">
            <input type="checkbox" id="customerIsActive" v-model="customer.is_active" />
            <label for="customerIsActive" class="form-check-label">Aktif Müşteri</label>
        </div>
      </div>

      <div class="form-actions">
        <button type="submit" :disabled="customerStore.status.isSubmitting" class="action-button submit-button">
          {{ customerStore.status.isSubmitting ? 'Kaydediliyor...' : (isEditMode ? 'Güncelle' : 'Müşteriyi Ekle') }}
        </button>
      </div>
      <p v-if="customerStore.status.error" class="error-message">{{ customerStore.status.error }}</p>
      <!-- <p v-if="customerStore.status.successMessage" class="success-message">{{ customerStore.status.successMessage }}</p> -->
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCustomerStore } from '../../store/modules/customerStore';
import { useAuthStore } from '../../store/modules/auth';
import apiClient from '../../services/apiClient';

const route = useRoute();
const router = useRouter();
const customerStore = useCustomerStore();
const authStore = useAuthStore();

const customerId = ref(route.params.id || null);
const isEditMode = computed(() => !!customerId.value);

const initialCustomerData = {
  first_name: '',
  last_name: '',
  email: '',
  phone_number_primary: '',
  phone_number_secondary: '',
  address: '',
  city: '',
  country: '', // Varsayılan eklenebilir
  postal_code: '',
  customer_type: null,
  lead_source: null,
  notes: '',
  is_active: true,
  assigned_consultant_id: null,
};

const customer = reactive({ ...initialCustomerData });
const availableConsultants = ref([]);

const fetchConsultants = async () => {
  if (authStore.isAdmin || authStore.isBroker) {
    try {
      const response = await apiClient.get('/users', { params: { per_page: 200 }}); // Rol filtrelemesi backend'de yapılmalı
      availableConsultants.value = response.data.users.filter(
        user => user.role === 'danisman' || user.role === 'broker'
      );
    } catch (error) {
      console.error("Danışmanlar yüklenirken hata:", error);
      customerStore.status.error = "Danışman listesi yüklenemedi.";
    }
  }
};

const loadCustomerForEdit = async () => {
  if (isEditMode.value) {
    // customerStore.fetchCustomerById action'ı zaten currentCustomer'ı güncelliyor
    // Ama form için ayrı bir kopya kullanmak daha iyi olabilir.
    const fetchedCustomer = await customerStore.fetchCustomerById(customerId.value);
    if (fetchedCustomer) {
      Object.assign(customer, { // Gelen verilerle formu doldur
        first_name: fetchedCustomer.first_name || '',
        last_name: fetchedCustomer.last_name || '',
        email: fetchedCustomer.email || '',
        phone_number_primary: fetchedCustomer.phone_number_primary || '',
        phone_number_secondary: fetchedCustomer.phone_number_secondary || '',
        address: fetchedCustomer.address || '',
        city: fetchedCustomer.city || '',
        country: fetchedCustomer.country || '',
        postal_code: fetchedCustomer.postal_code || '',
        customer_type: fetchedCustomer.customer_type || null,
        lead_source: fetchedCustomer.lead_source || null,
        notes: fetchedCustomer.notes || '',
        is_active: fetchedCustomer.is_active,
        assigned_consultant_id: fetchedCustomer.assigned_consultant_id || null,
      });
    } else {
      // Müşteri bulunamadı, listeye yönlendir
      router.push({ name: 'customer-list' });
    }
  } else {
    // Yeni müşteri modu, formu sıfırla (gerçi initialCustomerData ile zaten öyle)
    Object.assign(customer, initialCustomerData);
    // Yeni müşteri eklenirken, eğer kullanıcı danışmansa kendini ata
    if (authStore.currentUser && authStore.currentUser.role === 'danisman') {
        customer.assigned_consultant_id = authStore.currentUser.id;
    }
  }
};

onMounted(async () => {
  customerStore.resetStatus();
  await fetchConsultants(); // Önce danışmanları çek
  await loadCustomerForEdit(); // Sonra müşteri verisini (eğer düzenleme modundaysa)
});

// Eğer route ID'si değişirse (pek olası değil ama) formu yeniden yükle
watch(() => route.params.id, (newId) => {
  customerId.value = newId || null;
  loadCustomerForEdit();
});


const handleSubmit = async () => {
  // Temel frontend doğrulaması (backend zaten yapıyor ama kullanıcı deneyimi için)
  if (!customer.first_name || !customer.phone_number_primary) {
    customerStore.status.error = "Ad ve Birincil Telefon alanları zorunludur.";
    return;
  }

  try {
    let savedCustomer;
    if (isEditMode.value) {
      savedCustomer = await customerStore.updateCustomer(customerId.value, { ...customer });
    } else {
      savedCustomer = await customerStore.createCustomer({ ...customer });
    }
    if (savedCustomer) {
      // Başarı mesajı store'da set ediliyor, burada bir şey yapmaya gerek yok.
      // İsteğe bağlı: Kullanıcıyı detay sayfasına veya listeye yönlendir.
      router.push({ name: 'customer-detail', params: { id: savedCustomer.id } });
    }
  } catch (error) {
    // Hata zaten store'da set ediliyor. Burada ek bir şey yapmaya gerek yok.
    console.error("Form submit error:", error);
  }
};

</script>

<style scoped>
/* admin-page-container, page-header, action-button gibi stiller App.vue'den gelebilir */
.customer-form-view {
  max-width: 900px; /* Form için biraz daha geniş alan */
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}
.page-header h2 { margin: 0; color: #333; }
.cancel-button { background-color: #6c757d; }
.cancel-button:hover { background-color: #5a6268; }

.customer-form {
  background-color: #fff;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); /* Responsive grid */
  gap: 1.5rem;
}
.form-group-full {
  grid-column: 1 / -1; /* Tam satır kaplasın */
}
.form-actions {
  margin-top: 2rem;
  text-align: right;
}
.form-check { display: flex; align-items: center; margin-top: 0.5rem;}
.form-check input[type="checkbox"] { margin-right: 0.5rem; width: auto; height: auto; }
.form-check-label { font-weight: normal; margin-bottom: 0;}
</style>