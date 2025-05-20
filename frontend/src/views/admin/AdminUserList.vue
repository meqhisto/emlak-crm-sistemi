<template>
  <div class="admin-page-container">
    <h2>Kullanıcı Yönetimi (Admin)</h2>
    <!-- TODO: Yeni kullanıcı ekleme butonu/formu eklenebilir -->

    <div v-if="loading" class="loading-spinner">Kullanıcılar yükleniyor...</div>
    <div v-if="error" class="error-message">{{ error }}</div>

    <div v-if="!loading && !error && (!users || users.length === 0)" class="no-data-message">
      Kayıtlı kullanıcı bulunamadı.
    </div>

    <table v-if="!loading && users && users.length > 0">
      <thead>
        <tr>
          <th>K.Adı</th>
          <th>E-posta</th>
          <th>Rol</th>
          <th>Ofis</th>
          <th>Aktif</th>
          <th>İşlemler</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in users" :key="user.id">
          <td>{{ user.username }}</td>
          <td>{{ user.email }}</td>
          <td>{{ user.role }}</td>
          <td>{{ user.office ? user.office.name : '-' }}</td>
          <td>{{ user.is_active ? 'Evet' : 'Hayır' }}</td>
          <td class="table-actions">
            <button @click="openEditUserModal(user)" class="edit">Düzenle</button>
            <button @click="confirmDeleteUser(user.id)" class="delete">Sil</button>
          </td>
        </tr>
      </tbody>
    </table>
    <!-- TODO: Pagination eklenecek -->

    <!-- Kullanıcı Düzenleme Modal'ı -->
     <div v-if="showEditModal" class="modal-overlay" @click.self="closeEditUserModal">
      <div class="modal-content">
        <h3>Kullanıcıyı Düzenle: {{ userForm.username }}</h3>
        <form @submit.prevent="handleUpdateUser">
          <div class="form-group">
            <label for="editUsername">Kullanıcı Adı:</label>
            <input type="text" id="editUsername" v-model="userForm.username" required />
          </div>
          <div class="form-group">
            <label for="editEmail">E-posta:</label>
            <input type="email" id="editEmail" v-model="userForm.email" required />
          </div>
           <div class="form-group">
            <label for="editFirstName">Ad:</label>
            <input type="text" id="editFirstName" v-model="userForm.first_name" />
          </div>
          <div class="form-group">
            <label for="editLastName">Soyad:</label>
            <input type="text" id="editLastName" v-model="userForm.last_name" />
          </div>
          <div class="form-group">
            <label for="editRole">Rol:</label>
            <select id="editRole" v-model="userForm.role" required>
              <option value="danisman">Danışman</option>
              <option value="broker">Broker</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div class="form-group">
            <label for="editOffice">Ofis:</label>
            <select id="editOffice" v-model="userForm.office_id">
              <option :value="null">Ofis Yok</option>
              <option v-for="office in availableOffices" :key="office.id" :value="office.id">
                {{ office.name }}
              </option>
            </select>
          </div>
          <div class="form-group form-check">
            <input type="checkbox" id="editIsActive" v-model="userForm.is_active" />
            <label for="editIsActive" class="form-check-label">Aktif Kullanıcı</label>
          </div>
           <div class="form-group">
            <label for="editPassword">Yeni Şifre (Boş bırakırsanız değişmez):</label>
            <input type="password" id="editPassword" v-model="userForm.password" />
          </div>

          <div class="form-actions">
            <button type="submit" :disabled="formLoading" class="submit-button">
              {{ formLoading ? 'Kaydediliyor...' : 'Güncelle' }}
            </button>
            <button type="button" @click="closeEditUserModal" :disabled="formLoading" class="cancel-button">İptal</button>
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

const users = ref([]);
const loading = ref(true);
const error = ref(null);

const showEditModal = ref(false);
const formLoading = ref(false);
const formError = ref(null);
const editingUserId = ref(null);

const initialUserForm = {
  username: '', email: '', role: 'danisman', office_id: null,
  is_active: true, first_name: '', last_name: '', password: ''
};
const userForm = reactive({ ...initialUserForm });
const availableOffices = ref([]); // Ofisleri yüklemek için

const fetchUsers = async () => {
  loading.value = true; error.value = null;
  try {
    const response = await apiClient.get('/users'); // Pagination eklenebilir
    users.value = response.data.users;
  } catch (err) {
    error.value = err.response?.data?.msg || 'Kullanıcılar yüklenemedi.';
  } finally { loading.value = false; }
};

const fetchOffices = async () => {
    try {
        const response = await apiClient.get('/offices?per_page=100'); // Tüm ofisleri çekmek için per_page
        availableOffices.value = response.data.offices;
    } catch (err) {
        console.error("Ofisler yüklenemedi:", err);
        // Hata yönetimi eklenebilir
    }
};

onMounted(() => {
  fetchUsers();
  fetchOffices(); // Ofisleri de yükle
});

const resetUserForm = () => {
    Object.assign(userForm, initialUserForm);
    editingUserId.value = null;
    formError.value = null;
};

const openEditUserModal = (user) => {
  editingUserId.value = user.id;
  userForm.username = user.username;
  userForm.email = user.email;
  userForm.role = user.role;
  userForm.office_id = user.office_id || null;
  userForm.is_active = user.is_active;
  userForm.first_name = user.first_name || '';
  userForm.last_name = user.last_name || '';
  userForm.password = ''; // Şifre alanı boş başlar
  showEditModal.value = true;
  formError.value = null;
};

const closeEditUserModal = () => {
  showEditModal.value = false;
  resetUserForm();
};

const handleUpdateUser = async () => {
  if (!editingUserId.value) return;
  formLoading.value = true; formError.value = null;
  try {
    const payload = { ...userForm };
    if (!payload.password) { // Eğer şifre boşsa payload'dan çıkar
        delete payload.password;
    }
    await apiClient.put(`/users/${editingUserId.value}`, payload);
    fetchUsers(); // Listeyi yenile
    closeEditUserModal();
  } catch (err) {
    formError.value = err.response?.data?.msg || 'Kullanıcı güncellenemedi.';
  } finally { formLoading.value = false; }
};

const confirmDeleteUser = async (userId) => {
  if (confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) {
    try {
      await apiClient.delete(`/users/${userId}`);
      fetchUsers();
      alert('Kullanıcı başarıyla silindi.');
    } catch (err) {
      alert(`Kullanıcı silinemedi: ${err.response?.data?.msg || err.message}`);
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
/* Modal Stilleri */
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background-color: rgba(0,0,0,0.6); display: flex;
  justify-content: center; align-items: center; z-index: 1000;
}
.modal-content {
  background-color: white; padding: 2rem; border-radius: 8px;
  width: 90%; max-width: 550px; box-shadow: 0 5px 20px rgba(0,0,0,0.25);
  max-height: 90vh; overflow-y: auto; /* Uzun formlar için scroll */
}
.modal-content h3 { margin-top: 0; margin-bottom: 1.5rem; color: #333; }
.form-actions { margin-top: 1.5rem; display: flex; justify-content: flex-end; gap: 0.5rem;}
.cancel-button { background-color: #f0f0f0; color: #333; border: 1px solid #ccc; }
.cancel-button:hover { background-color: #e0e0e0; }
.form-check { display: flex; align-items: center; margin-top: 0.5rem;}
.form-check input[type="checkbox"] { margin-right: 0.5rem; width: auto; height: auto; }
.form-check-label { font-weight: normal; margin-bottom: 0;}
</style>