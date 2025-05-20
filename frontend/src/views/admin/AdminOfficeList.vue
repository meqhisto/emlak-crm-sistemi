<template>
  <div class="admin-page-container">
    <h2>Ofis Yönetimi (Admin)</h2>

    <button @click="openCreateModal" class="action-button add-new-button">
      Yeni Ofis Ekle
    </button>

    <div v-if="loading" class="loading-spinner">Ofisler yükleniyor...</div>
    <div v-if="error" class="error-message">{{ error }}</div>
    <div v-if="!loading && !error && (!offices || offices.length === 0)" class="no-data-message">
      Kayıtlı ofis bulunamadı.
    </div>

    <table v-if="!loading && offices && offices.length > 0">
      <thead>
        <tr>
          <th>Ofis Adı</th>
          <th>E-posta</th>
          <th>Telefon</th>
          <th>Aktif</th>
          <th>K. Sayısı</th>
          <th>İşlemler</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="office in offices" :key="office.id">
          <td>{{ office.name }}</td>
          <td>{{ office.email || '-' }}</td>
          <td>{{ office.phone_number || '-' }}</td>
          <td>{{ office.is_active ? 'Evet' : 'Hayır' }}</td>
          <td>{{ office.user_count }}</td>
          <td class="table-actions">
            <button @click="openEditModal(office)" class="edit">Düzenle</button>
            <button @click="confirmDeleteOffice(office.id)" class="delete">Sil</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Yeni Ofis Ekleme / Düzenleme Modal'ı -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <h3>{{ editingOffice ? 'Ofisi Düzenle' : 'Yeni Ofis Ekle' }}</h3>
        <form @submit.prevent="editingOffice ? handleUpdateOffice() : handleAddOffice()">
          <div class="form-group">
            <label for="officeName">Ofis Adı:</label>
            <input type="text" id="officeName" v-model="officeForm.name" required />
          </div>
          <div class="form-group">
            <label for="officeEmail">E-posta:</label>
            <input type="email" id="officeEmail" v-model="officeForm.email" />
          </div>
          <div class="form-group">
            <label for="officePhone">Telefon:</label>
            <input type="tel" id="officePhone" v-model="officeForm.phone_number" />
          </div>
          <div class="form-group">
            <label for="officeAddress">Adres:</label>
            <textarea id="officeAddress" v-model="officeForm.address"></textarea>
          </div>
          <div class="form-group form-check" v-if="editingOffice"> <!-- Sadece düzenlemede göster -->
            <input type="checkbox" id="officeIsActive" v-model="officeForm.is_active" />
            <label for="officeIsActive" class="form-check-label">Aktif Ofis</label>
          </div>
          <div class="form-actions">
            <button type="submit" :disabled="formLoading" class="submit-button">
              {{ formLoading ? 'Kaydediliyor...' : (editingOffice ? 'Güncelle' : 'Ekle') }}
            </button>
            <button type="button" @click="closeModal" :disabled="formLoading" class="cancel-button">İptal</button>
          </div>
          <p v-if="formError" class="error-message">{{ formError }}</p>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import apiClient from '../../services/apiClient';

const offices = ref([]);
const loading = ref(true);
const error = ref(null);

const showModal = ref(false);
const editingOffice = ref(null);
const formLoading = ref(false);
const formError = ref(null);

const initialOfficeForm = {
  name: '', email: '', phone_number: '', address: '', is_active: true,
};
const officeForm = reactive({ ...initialOfficeForm });

const fetchOffices = async () => {
  loading.value = true; error.value = null;
  try {
    const response = await apiClient.get('/offices');
    offices.value = response.data.offices;
  } catch (err) {
    error.value = err.response?.data?.msg || 'Ofisler yüklenemedi.';
  } finally { loading.value = false; }
};

onMounted(fetchOffices);

const resetForm = () => {
  Object.assign(officeForm, initialOfficeForm);
  formError.value = null; formLoading.value = false;
};

const openCreateModal = () => {
    resetForm();
    editingOffice.value = null;
    showModal.value = true;
};

const openEditModal = (office) => {
  editingOffice.value = office;
  officeForm.name = office.name;
  officeForm.email = office.email || '';
  officeForm.phone_number = office.phone_number || '';
  officeForm.address = office.address || '';
  officeForm.is_active = office.is_active;
  showModal.value = true;
  formError.value = null;
};

const closeModal = () => {
  showModal.value = false;
  editingOffice.value = null;
  resetForm();
};

const handleAddOffice = async () => {
  formLoading.value = true; formError.value = null;
  try {
    const payload = { ...officeForm };
    // Yeni eklemede is_active her zaman true (veya backend default)
    delete payload.is_active; // Backend default'u kullansın
    await apiClient.post('/offices', payload);
    fetchOffices(); closeModal();
  } catch (err) {
    formError.value = err.response?.data?.msg || 'Ofis eklenemedi.';
  } finally { formLoading.value = false; }
};

const handleUpdateOffice = async () => {
  if (!editingOffice.value) return;
  formLoading.value = true; formError.value = null;
  try {
    await apiClient.put(`/offices/${editingOffice.value.id}`, officeForm);
    fetchOffices(); closeModal();
  } catch (err) {
    formError.value = err.response?.data?.msg || 'Ofis güncellenemedi.';
  } finally { formLoading.value = false; }
};

const confirmDeleteOffice = async (officeId) => {
  if (confirm('Bu ofisi silmek istediğinizden emin misiniz? Ofise bağlı kullanıcılar varsa silme işlemi başarısız olabilir.')) {
    try {
      await apiClient.delete(`/offices/${officeId}`);
      fetchOffices();
      alert('Ofis başarıyla silindi.');
    } catch (err) {
      alert(`Ofis silinemedi: ${err.response?.data?.msg || err.message}`);
    }
  }
};
</script>

<style scoped>
.admin-page-container {
  padding: 1rem;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}
.admin-page-container h2 {
    margin-bottom: 1.5rem;
    color: #333;
}
.add-new-button {
    margin-bottom: 1rem;
}
/* Modal Stilleri AdminUserList ile benzer */
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background-color: rgba(0,0,0,0.6); display: flex;
  justify-content: center; align-items: center; z-index: 1000;
}
.modal-content {
  background-color: white; padding: 2rem; border-radius: 8px;
  width: 90%; max-width: 550px; box-shadow: 0 5px 20px rgba(0,0,0,0.25);
  max-height: 90vh; overflow-y: auto;
}
.modal-content h3 { margin-top: 0; margin-bottom: 1.5rem; color: #333;}
.form-actions { margin-top: 1.5rem; display: flex; justify-content: flex-end; gap: 0.5rem;}
.cancel-button { background-color: #f0f0f0; color: #333; border: 1px solid #ccc; }
.cancel-button:hover { background-color: #e0e0e0; }
.form-check { display: flex; align-items: center; margin-top: 0.5rem;}
.form-check input[type="checkbox"] { margin-right: 0.5rem; width: auto; height: auto; }
.form-check-label { font-weight: normal; margin-bottom: 0;}
</style>