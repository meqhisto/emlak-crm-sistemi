<template>
  <div class="property-detail-view admin-page-container">
    <div v-if="isLoadingInitial" class="loading-spinner">
      <i class="fas fa-spinner fa-spin"></i> Portföy bilgileri yükleniyor...
    </div>
    <div v-if="!isLoadingInitial && fetchError" class="error-message">
      <p>{{ fetchError }}</p>
      <router-link :to="{ name: 'property-list' }" class="action-button">
        <i class="fas fa-arrow-left"></i> Portföy Listesine Dön
      </router-link>
    </div>

    <div v-if="property" class="property-details-layout">
      <!-- Sol Sütun: Ana Bilgiler ve Resimler (Resimler TODO) -->
      <div class="property-main-column">
        <div class="card property-image-card">
          <div class="image-placeholder">
            <i class="fas fa-image fa-5x"></i>
            <p>Portföy Resmi (TODO)</p>
          </div>
          <!-- TODO: Fotoğraf Galerisi buraya gelecek -->
        </div>

        <div class="card property-actions-card">
            <h3>Hızlı İşlemler</h3>
            <router-link
                v-if="canModifyProperty"
                :to="{ name: 'property-edit', params: { id: property.id } }"
                class="action-button edit full-width"
            >
                <i class="fas fa-edit"></i> Portföyü Düzenle
            </router-link>
             <button
                v-if="canModifyProperty"
                @click="confirmDeleteProperty(property.id)"
                class="action-button delete full-width"
                :disabled="isDeleting"
            >
                <i class="fas fa-trash-alt"></i> {{ isDeleting ? 'Siliniyor...' : 'Portföyü Sil' }}
            </button>
            <router-link :to="{ name: 'property-list' }" class="action-button cancel-button full-width">
                <i class="fas fa-list"></i> Listeye Dön
            </router-link>
        </div>
      </div>

      <!-- Sağ Sütun: Detaylar ve Etkileşimler -->
      <div class="property-info-column">
        <div class="page-header-detail">
          <h1>{{ property.title }}</h1>
          <div class="header-badges">
            <span :class="['status-badge', getStatusClass(property.status)]">{{ property.status }}</span>
            <span class="listing-type-badge">{{ property.listing_type }}</span>
          </div>
        </div>
        <h2 class="price">{{ formatPrice(property.price, property.currency) }}</h2>

        <div class="card details-section">
          <h4><i class="fas fa-info-circle"></i> Temel Bilgiler</h4>
          <div class="details-grid two-columns">
            <div class="detail-item"><strong>Portföy ID:</strong> {{ property.id.substring(0,8) }}...</div>
            <div class="detail-item"><strong>Gayrimenkul Tipi:</strong> {{ property.property_type }}</div>
            <div class="detail-item"><strong>İlan Tarihi:</strong> {{ formatDate(property.listing_date) }}</div>
            <div class="detail-item"><strong>Bitiş Tarihi:</strong> {{ property.expiry_date ? formatDate(property.expiry_date) : '-' }}</div>
            <div class="detail-item">
                <strong>Atanan Danışman:</strong>
                <span v-if="property.consultant">{{ property.consultant.full_name || property.consultant.username }}</span>
                <span v-else>-</span>
            </div>
            <div class="detail-item">
                <strong>Bağlı Ofis:</strong>
                <span v-if="property.office">{{ property.office.name }}</span>
                <span v-else>-</span>
            </div>
            <div class="detail-item"><strong>Sistemde Aktif:</strong> {{ property.is_active ? 'Evet' : 'Hayır' }}</div>
          </div>
        </div>

        <div v-if="property.description" class="card details-section">
            <h4><i class="fas fa-file-alt"></i> Açıklama</h4>
            <pre class="description-text">{{ property.description }}</pre>
        </div>

        <div class="card details-section">
          <h4><i class="fas fa-map-marker-alt"></i> Konum Bilgileri</h4>
          <div class="details-grid two-columns">
            <div class="detail-item full-width"><strong>Adres:</strong> {{ property.address_line1 || '-' }} {{ property.address_line2 || '' }}</div>
            <div class="detail-item"><strong>Şehir:</strong> {{ property.city || '-' }}</div>
            <div class="detail-item"><strong>İlçe:</strong> {{ property.district || '-' }}</div>
            <div class="detail-item"><strong>Mahalle:</strong> {{ property.neighborhood || '-' }}</div>
            <div class="detail-item"><strong>Posta Kodu:</strong> {{ property.postal_code || '-' }}</div>
            <!-- <div class="detail-item"><strong>Ülke:</strong> {{ property.country || '-' }}</div> -->
            <div class="detail-item"><strong>Enlem:</strong> {{ property.latitude || '-' }}</div>
            <div class="detail-item"><strong>Boylam:</strong> {{ property.longitude || '-' }}</div>
          </div>
          <!-- TODO: Harita Entegrasyonu -->
          <div class="map-placeholder mt-1"> <i class="fas fa-map-marked-alt"></i> Harita Alanı (TODO)</div>
        </div>

        <div class="card details-section">
          <h4><i class="fas fa-ruler-combined"></i> Alan Bilgileri</h4>
          <div class="details-grid three-columns">
            <div class="detail-item"><strong>Brüt m²:</strong> {{ property.area_m2_gross || '-' }}</div>
            <div class="detail-item"><strong>Net m²:</strong> {{ property.area_m2_net || '-' }}</div>
            <div class="detail-item"><strong>Arsa Alanı m²:</strong> {{ property.land_area_m2 || '-' }}</div>
          </div>
        </div>

        <div v-if="property.details && Object.keys(property.details).length > 0" class="card details-section">
          <h4><i class="fas fa-cogs"></i> Ek Detaylar ({{ property.property_type }})</h4>
          <div class="details-grid two-columns specific-details">
            <div v-for="(value, key) in property.details" :key="key" class="detail-item specific-detail-item">
              <strong>{{ formatDetailKey(key) }}:</strong>
              <span v-if="typeof value === 'boolean'">{{ value ? 'Evet' : 'Hayır' }}</span>
              <span v-else-if="value === null || value === ''">-</span>
              <span v-else>{{ value }}</span>
            </div>
          </div>
        </div>
         <div v-else-if="property.details === null || (typeof property.details === 'object' && Object.keys(property.details).length === 0)" class="card details-section">
            <h4><i class="fas fa-cogs"></i> Ek Detaylar</h4>
            <p class="no-data-message small">Bu portföy için ek detay girilmemiş.</p>
        </div>


        <div class="card details-section meta-info">
            <p><strong>Oluşturulma Tarihi:</strong> {{ formatDate(property.created_at) }}</p>
            <p><strong>Son Güncelleme:</strong> {{ formatDate(property.updated_at) }}</p>
        </div>

        <!-- TODO: Müşteri Etkileşimleri buraya eklenebilir (CustomerDetailView'deki gibi) -->
        <!-- Bu özellik, portföylerle doğrudan müşteri etkileşimi olup olmayacağına bağlı -->

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { usePropertyStore } from '../../store/modules/propertyStore';
import { useAuthStore } from '../../store/modules/auth';

const props = defineProps({
  id: { type: String, required: true },
});

const router = useRouter();
const propertyStore = usePropertyStore();
const authStore = useAuthStore();

const property = computed(() => propertyStore.currentProperty);
const isLoadingInitial = ref(true); // Sayfa ilk yüklenirken genel loading durumu
const fetchError = ref(null); // Veri çekme hatası
const isDeleting = ref(false); // Silme işlemi sırasında buton durumu için

const loadPropertyData = async () => {
  isLoadingInitial.value = true;
  fetchError.value = null;
  propertyStore.resetStatus(); // Önceki hataları temizle
  const fetchedProperty = await propertyStore.fetchPropertyById(props.id);
  if (!fetchedProperty && propertyStore.status.error) {
    fetchError.value = propertyStore.status.error;
  }
  isLoadingInitial.value = false;
};

onMounted(() => {
  loadPropertyData();
});

watch(() => props.id, (newId) => {
  if (newId) {
    loadPropertyData();
  }
});

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  try { return new Date(dateString).toLocaleDateString('tr-TR', options); }
  catch (e) { return dateString; }
};

const formatPrice = (price, currency = 'TRY') => {
  if (price == null || isNaN(price)) return 'Belirtilmemiş';
  try { return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price); }
  catch (e) { return `${price} ${currency}`; }
};

const formatDetailKey = (key) => {
  if (!key) return '';
  return key.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
};

const getStatusClass = (status) => { // PropertyListView'deki ile aynı
  if (!status) return '';
  return `status-${status.toLowerCase().replace(/ /g, '-').replace(/ı/g, 'i').replace(/İ/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c')}`;
};

const canModifyProperty = computed(() => {
    if (!authStore.currentUser || !property.value) return false;
    if (authStore.isAdmin || authStore.isBroker) return true;
    return authStore.currentUser.id === property.value.assigned_consultant_id;
});

const confirmDeleteProperty = async (propertyId) => {
  if (confirm('Bu portföyü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
    isDeleting.value = true;
    const success = await propertyStore.deleteProperty(propertyId);
    if (success) {
      alert('Portföy başarıyla silindi.');
      router.push({ name: 'property-list' });
    } else {
      alert(`Portföy silinemedi: ${propertyStore.status.error || 'Bilinmeyen bir hata oluştu.'}`);
    }
    isDeleting.value = false;
  }
};

</script>

<style scoped>
/* admin-page-container, page-header, action-button, status-badge stilleri App.vue ve PropertyListView'den miras alınabilir/uyarlanabilir */
.property-detail-view { max-width: 1200px; /* Daha geniş bir layout için */ }

.property-details-layout {
  display: flex;
  gap: 2rem; /* Sütunlar arası boşluk */
  align-items: flex-start; /* Sütunları yukarıdan hizala */
}

.property-main-column {
  flex: 0 0 300px; /* Sabit genişlikli sol sütun */
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.property-info-column {
  flex: 1; /* Sağ sütun kalan alanı kaplasın */
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.card { /* Genel kart stili */
  background-color: #fff;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.07);
}

.property-image-card .image-placeholder {
  height: 250px;
  background-color: #e9ecef;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #adb5bd;
  border-radius: 6px;
}
.property-image-card .image-placeholder i {
  margin-bottom: 0.5rem;
}

.property-actions-card h3 {
    margin-top: 0;
    margin-bottom: 1rem;
    font-size: 1.1rem;
    color: #333;
}
.action-button.full-width {
    width: 100%;
    display: block; /* Tam genişlik için */
    text-align: center;
    margin-bottom: 0.75rem;
}
.action-button.full-width:last-child { margin-bottom: 0; }
.action-button.edit { background-color: #17a2b8; }
.action-button.edit:hover { background-color: #117a8b; }
.action-button.delete { background-color: #dc3545; }
.action-button.delete:hover { background-color: #c82333; }
.cancel-button { background-color: #6c757d; }
.cancel-button:hover { background-color: #5a6268; }
.action-button i { margin-right: 0.5em; }


.page-header-detail {
  /* display: flex; */
  /* justify-content: space-between; */
  /* align-items: flex-start; */
  margin-bottom: 0.5rem; /* Fiyat ile arasına boşluk */
  padding-bottom: 1rem;
  border-bottom: 1px solid #e9ecef;
}
.page-header-detail h1 {
  margin: 0 0 0.5rem 0;
  color: #212529;
  font-size: 2rem;
  font-weight: 600;
  line-height: 1.3;
}
.header-badges {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    margin-top: 0.5rem;
}
.listing-type-badge { /* PropertyListView ile aynı */
    padding: 0.3em 0.7em; font-size: 0.9em; font-weight: 500;
    border-radius: 0.25rem; background-color: #e9ecef; color: #495057;
}
.status-badge { /* PropertyListView ile aynı */
    padding: 0.3em 0.7em; font-size: 0.9em; font-weight: 600;
    border-radius: 0.25rem; color: #fff; text-transform: capitalize;
    white-space: nowrap;
}
/* Durum badge renkleri PropertyListView'deki gibi */
.status-aktif { background-color: #28a745; }
.status-satildi, .status-kiralandi { background-color: #dc3545; }
.status-rezerve-edildi { background-color: #ffc107; color: #212529 !important; }
.status-beklemede { background-color: #17a2b8; }
.status-yayindan-kaldirildi, .status-pasif { background-color: #6c757d; }


.price {
  font-size: 2.2rem;
  font-weight: 700;
  color: #007bff;
  margin: 0 0 1.5rem 0;
}

.details-section h4 {
  font-size: 1.2rem; /* Biraz daha büyük başlık */
  color: #343a40;
  margin-top: 0; /* Kart içindeki ilk başlığın üst boşluğunu al */
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
}
.details-section h4 i {
    margin-right: 0.6em;
    color: #007bff; /* Başlık ikon rengi */
}

.details-grid { display: grid; gap: 0.75rem 1.5rem; }
.details-grid.two-columns { grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); }
.details-grid.three-columns { grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }

.detail-item { font-size: 0.95rem; color: #212529; line-height: 1.6; padding: 0.4rem 0;}
.detail-item strong { font-weight: 600; color: #495057; margin-right: 0.5rem; }
.detail-item.full-width { grid-column: 1 / -1; }

.description-text {
  white-space: pre-wrap; word-break: break-word; font-family: inherit;
  font-size: 1rem; color: #343a40; line-height: 1.7;
  background-color: #f8f9fa; padding: 1rem; border-radius: 4px;
  border: 1px solid #e9ecef;
}
.specific-details .detail-item {
    background-color: #f8f9fa; padding: 0.6rem 0.8rem; border-radius: 4px;
    border: 1px solid #eef0f2;
}

.map-placeholder {
    height: 200px; background-color: #e9ecef; display: flex;
    justify-content: center; align-items: center; color: #adb5bd;
    border-radius: 4px; text-align: center;
}
.map-placeholder i { margin-right: 0.5rem; }


.meta-info {
    background-color: transparent; /* Kart görünümü olmasın */
    padding: 0;
    box-shadow: none;
    border-top: 1px solid #e9ecef;
    margin-top: 1.5rem;
    padding-top: 1.5rem;
}
.meta-info p { font-size: 0.8em; color: #6c757d; margin-bottom: 0.25rem; }
.meta-info p strong { color: #495057; }

.mt-1 { margin-top: 1rem; }
</style>