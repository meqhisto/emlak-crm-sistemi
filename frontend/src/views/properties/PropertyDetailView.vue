<template>
  <div class="property-detail-view admin-page-container">
    <div v-if="isLoadingInitial && !property" class="loading-spinner">
      <i class="fas fa-spinner fa-spin"></i> Portföy bilgileri yükleniyor...
    </div>
    <div v-if="!isLoadingInitial && fetchError && !property" class="error-message">
      <p>{{ fetchError }}</p>
      <router-link :to="{ name: 'property-list' }" class="action-button">
        <i class="fas fa-arrow-left"></i> Portföy Listesine Dön
      </router-link>
    </div>

    <div v-if="property" class="property-details-layout">
      <!-- Sol Sütun: Ana Bilgiler ve Medya -->
      <div class="property-main-column">
        <!-- Fotoğraf Galerisi -->
        <div class="card property-media-card">
          <h4><i class="fas fa-images"></i> Fotoğraflar</h4>
          <div v-if="photosLoading" class="loading-spinner small-spinner">Fotoğraflar yükleniyor...</div>
          <div v-if="!photosLoading && photos.length === 0" class="no-data-message small">Portföye ait fotoğraf bulunmuyor.</div>
          <div v-if="!photosLoading && photos.length > 0" class="photo-gallery">
            <div v-if="primaryPhoto" class="primary-photo-container">
              <img :src="getMediaUrl(primaryPhoto.url)" :alt="primaryPhoto.caption || property.title" @click="openLightbox(primaryPhoto, photos)" />
              <span v-if="primaryPhoto.caption" class="caption">{{ primaryPhoto.caption }}</span>
            </div>
            <div class="thumbnail-grid" v-if="otherPhotos.length > 0">
              <div v-for="photo in otherPhotos" :key="photo.id" class="thumbnail-item">
                <img :src="getMediaUrl(photo.url)" :alt="photo.caption || property.title" @click="openLightbox(photo, photos)" />
              </div>
            </div>
          </div>
           <div v-else-if="!photosLoading && photos.length === 0">
             <!-- Yeni ekleme modunda ve henüz fotoğraf yüklenmediyse bir mesaj veya yükleme alanı gösterilebilir -->
           </div>
        </div>

        <!-- Belge Listesi -->
        <div class="card property-media-card">
          <h4><i class="fas fa-folder-open"></i> Belgeler</h4>
          <div v-if="docsLoading" class="loading-spinner small-spinner">Belgeler yükleniyor...</div>
          <div v-if="!docsLoading && documents.length === 0" class="no-data-message small">Portföye ait belge bulunmuyor.</div>
          <ul v-if="!docsLoading && documents.length > 0" class="document-list">
            <li v-for="doc in documents" :key="doc.id" class="document-item">
              <a :href="getMediaUrl(doc.url)" target="_blank" :download="doc.original_file_name || 'belge'" class="document-link">
                <i :class="getDocumentIcon(doc.mime_type || doc.original_file_name)"></i>
                <span>{{ doc.original_file_name || 'Belge' }}</span>
                <small v-if="doc.document_type"> ({{ doc.document_type }})</small>
              </a>
              <p v-if="doc.description" class="doc-description">{{ doc.description }}</p>
            </li>
          </ul>
           <div v-else-if="!docsLoading && documents.length === 0">
             <!-- Yeni ekleme modunda ve henüz belge yüklenmediyse bir mesaj veya yükleme alanı gösterilebilir -->
           </div>
        </div>

         <div class="card property-actions-card">
            <h3><i class="fas fa-cogs"></i> Hızlı İşlemler</h3>
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

      <!-- Sağ Sütun: Detaylar -->
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
            <div class="detail-item"><strong>Portföy ID:</strong> {{ property.id ? property.id.substring(0,8) : '-' }}...</div>
            <div class="detail-item"><strong>Gayrimenkul Tipi:</strong> {{ property.property_type || '-' }}</div>
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
            <div class="detail-item"><strong>Enlem:</strong> {{ property.latitude || '-' }}</div>
            <div class="detail-item"><strong>Boylam:</strong> {{ property.longitude || '-' }}</div>
          </div>
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

        <!-- Emsal Bilgileri (Sadece Arsa veya Tarla ise) -->
        <div class="card details-section" v-if="property.property_type === 'Arsa' || property.property_type === 'Tarla'">
            <h4><i class="fas fa-drafting-compass"></i> Emsal ve İnşaat Bilgileri</h4>
            <div class="details-grid two-columns">
                <div class="detail-item"><strong>KAKS (Emsal):</strong> {{ property.kaks_emsal || '-' }}</div>
                <div class="detail-item"><strong>TAKS:</strong> {{ property.taks_emsal || '-' }}</div>
                <div class="detail-item"><strong>Maks. Kat Adedi:</strong> {{ property.max_kat_adedi || '-' }}</div>
                <div class="detail-item"><strong>Gabari (Maks. Yükseklik):</strong> {{ property.gabari_max_yukseklik_metre ? property.gabari_max_yukseklik_metre + ' m' : '-' }}</div>
                <div class="detail-item full-width"><strong>İnşaat Nizamı:</strong> {{ property.insaat_nizami || '-' }}</div>
                <div class="detail-item" v-if="calculatedBaseArea > 0">
                    <strong>Tahmini Taban Oturumu:</strong> {{ calculatedBaseArea.toFixed(2) }} m²
                </div>
                <div class="detail-item" v-if="calculatedTotalConstructionArea > 0">
                    <strong>Tahmini Toplam İnşaat Alanı:</strong> {{ calculatedTotalConstructionArea.toFixed(2) }} m²
                </div>
            </div>
        </div>


        <div v-if="property.details && Object.keys(property.details).length > 0" class="card details-section">
          <h4><i class="fas fa-cogs"></i> Ek Detaylar ({{ property.property_type }})</h4>
          <div class="details-grid two-columns specific-details">
            <div v-for="(value, key) in property.details" :key="key" class="detail-item specific-detail-item">
              <strong>{{ formatDetailKey(key) }}:</strong>
              <span v-if="value === null || value === undefined || value === ''">-</span>
              <span v-else-if="typeof value === 'boolean'">{{ value ? 'Evet' : 'Hayır' }}</span>
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
      </div>
    </div>

    <!-- Basit Lightbox Modal -->
    <div v-if="lightbox.isOpen" class="lightbox-overlay" @click.self="closeLightbox">
      <div class="lightbox-content">
        <button class="lightbox-close" @click="closeLightbox" title="Kapat"><i class="fas fa-times"></i></button>
        <button class="lightbox-nav prev" @click="prevLightboxImage" :disabled="lightbox.currentIndex === 0" title="Önceki"><i class="fas fa-chevron-left"></i></button>
        <img :src="getMediaUrl(lightbox.currentImage.url)" :alt="lightbox.currentImage.caption || 'Portföy Fotoğrafı'" />
        <button class="lightbox-nav next" @click="nextLightboxImage" :disabled="lightbox.currentIndex >= lightbox.images.length - 1" title="Sonraki"><i class="fas fa-chevron-right"></i></button>
        <p v-if="lightbox.currentImage.caption" class="lightbox-caption">{{ lightbox.currentImage.caption }}</p>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { usePropertyStore } from '../../store/modules/propertyStore';
import { useAuthStore } from '../../store/modules/auth';
import apiClient from '../../services/apiClient'; // Gerekirse (örn: getMediaUrl için base URL)

// Font Awesome (main.js'de global olarak import edildiğini varsayıyoruz)
// import '@fortawesome/fontawesome-free/css/all.css';

const props = defineProps({
  id: { type: String, required: true },
});

const router = useRouter();
const propertyStore = usePropertyStore();
const authStore = useAuthStore();

const property = computed(() => propertyStore.currentProperty);
const photos = computed(() => propertyStore.currentPropertyPhotos);
const documents = computed(() => propertyStore.currentPropertyDocuments);

const isLoadingInitial = ref(true);
const fetchError = ref(null);
const isDeleting = ref(false);
const photosLoading = ref(false);
const docsLoading = ref(false);

const primaryPhoto = computed(() => {
    if (!photos.value || photos.value.length === 0) return null;
    return photos.value.find(p => p.is_primary) || photos.value[0];
});
const otherPhotos = computed(() => {
    if (!photos.value || !primaryPhoto.value) return photos.value || [];
    return photos.value.filter(p => p.id !== primaryPhoto.value.id);
});

// Lightbox state
const lightbox = reactive({
    isOpen: false,
    images: [],
    currentIndex: 0,
    currentImage: null
});

const openLightbox = (selectedPhotoOrIndex, allPhotosArray) => {
    lightbox.images = allPhotosArray || photos.value; // Eğer parametre gelmezse store'daki fotoları kullan
    if (typeof selectedPhotoOrIndex === 'number') { // Eğer index gelirse
        lightbox.currentIndex = selectedPhotoOrIndex;
        lightbox.currentImage = lightbox.images[selectedPhotoOrIndex];
    } else { // Eğer fotoğraf objesi gelirse
        lightbox.currentIndex = lightbox.images.findIndex(p => p.id === selectedPhotoOrIndex.id);
        lightbox.currentImage = selectedPhotoOrIndex;
    }
    lightbox.isOpen = true;
};
const closeLightbox = () => { lightbox.isOpen = false; };
const prevLightboxImage = () => {
    if (lightbox.currentIndex > 0) {
        lightbox.currentIndex--;
        lightbox.currentImage = lightbox.images[lightbox.currentIndex];
    }
};
const nextLightboxImage = () => {
    if (lightbox.currentIndex < lightbox.images.length - 1) {
        lightbox.currentIndex++;
        lightbox.currentImage = lightbox.images[lightbox.currentIndex];
    }
};

// <script setup> devamı...

const calculatedBaseArea = computed(() => {
  const landArea = parseFloat(property.value?.land_area_m2);
  const taks = parseFloat(property.value?.taks_emsal);
  if (!isNaN(landArea) && landArea > 0 && !isNaN(taks) && taks > 0) {
    return landArea * taks;
  }
  return 0;
});

const calculatedTotalConstructionArea = computed(() => {
  const landArea = parseFloat(property.value?.land_area_m2);
  const kaks = parseFloat(property.value?.kaks_emsal);
  if (!isNaN(landArea) && landArea > 0 && !isNaN(kaks) && kaks > 0) {
    return landArea * kaks;
  }
  return 0;
});


const loadPropertyData = async () => {
  isLoadingInitial.value = true;
  fetchError.value = null;
  photosLoading.value = true;
  docsLoading.value = true;
  propertyStore.resetStatus();

  const fetchedProperty = await propertyStore.fetchPropertyById(props.id);

  if (!fetchedProperty && propertyStore.status.error) {
    fetchError.value = propertyStore.status.error;
  }
  // fetchPropertyById store'da fotoğrafları ve belgeleri de yüklüyor
  photosLoading.value = false; // Store action'ları kendi loading'lerini yönetebilir veya burada genel ayarlanır
  docsLoading.value = false;
  isLoadingInitial.value = false;
};

onMounted(() => {
  loadPropertyData();
});

watch(() => props.id, (newId) => {
  if (newId && newId !== propertyStore.currentProperty?.id) { // Sadece ID gerçekten değiştiyse yükle
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
  return key
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const getStatusClass = (status) => {
  if (!status) return '';
  return `status-${status.toLowerCase().replace(/ /g, '-').replace(/[ıİ]/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c')}`;
};

const getMediaUrl = (relativePathFromServer) => {
    if (!relativePathFromServer) return '#'; // Veya bir placeholder resim URL'si

    // relativePathFromServer örneği: "/uploads/properties/UUID/photos/FILENAME.jpg"
    // apiClient.defaults.baseURL örneği: "http://localhost:5000/api"

    // Eğer gelen yol zaten tam bir URL ise (pek olası değil ama kontrol)
    if (relativePathFromServer.startsWith('http://') || relativePathFromServer.startsWith('https://')) {
        return relativePathFromServer;
    }

    // baseURL'den domain kısmını al (örn: "http://localhost:5000")
    let domain = '';
    if (apiClient.defaults.baseURL) {
        const urlParts = apiClient.defaults.baseURL.split('/'); // ["http:", "", "localhost:5000", "api"]
        if (urlParts.length >= 3) {
            domain = `${urlParts[0]}//${urlParts[2]}`;
        }
    }
    if (!domain) { // Fallback, eğer baseURL parse edilemezse
        domain = window.location.origin; // Mevcut sayfanın domain'i
        console.warn("apiClient.defaults.baseURL parse edilemedi, window.location.origin kullanılıyor.");
    }
    
    const finalUrl = `${domain}${relativePathFromServer}`;
    // console.log("getMediaUrl input:", relativePathFromServer, "output:", finalUrl);
    return finalUrl;
};
const getDocumentIcon = (mimeOrFilename) => {
    if (!mimeOrFilename) return 'fas fa-file';
    const name = typeof mimeOrFilename === 'string' ? mimeOrFilename.toLowerCase() : '';
    if (name.includes('pdf')) return 'fas fa-file-pdf';
    if (name.includes('doc')) return 'fas fa-file-word';
    if (name.includes('xls')) return 'fas fa-file-excel';
    if (name.includes('ppt')) return 'fas fa-file-powerpoint';
    if (name.includes('zip') || name.includes('rar')) return 'fas fa-file-archive';
    if (name.includes('jpg') || name.includes('jpeg') || name.includes('png') || name.includes('gif') || name.includes('webp')) return 'fas fa-file-image';
    if (name.includes('txt')) return 'fas fa-file-alt';
    return 'fas fa-file';
};

const canModifyProperty = computed(() => {
    if (!authStore.currentUser || !property.value) return false;
    if (authStore.isAdmin || authStore.isBroker) return true;
    return authStore.currentUser.id === property.value.assigned_consultant_id;
});

const confirmDeleteProperty = async (propertyIdToDelete) => {
  if (confirm('Bu portföyü ve ilişkili tüm medya dosyalarını kalıcı olarak silmek istediğinizden emin misiniz?')) {
    isDeleting.value = true;
    const success = await propertyStore.deleteProperty(propertyIdToDelete);
    if (success) {
      // alert('Portföy başarıyla silindi.'); // Store'dan mesaj gösterilebilir
      router.push({ name: 'property-list' });
    } else {
      alert(`Portföy silinemedi: ${propertyStore.status.error || 'Bilinmeyen bir hata oluştu.'}`);
    }
    isDeleting.value = false;
  }
};

</script>

<style scoped>
@import '@fortawesome/fontawesome-free/css/all.min.css'; /* İkonlar için */

.property-detail-view { max-width: 1200px; }

.property-details-layout {
  display: grid;
  grid-template-columns: 320px 1fr; /* Sol: 320px, Sağ: kalan alan */
  gap: 2rem;
  align-items: flex-start;
}
@media (max-width: 992px) {
  .property-details-layout { grid-template-columns: 1fr; }
  .property-main-column { order: 1; }
  .property-info-column { order: 2; }
}

.property-main-column, .property-info-column {
  display: flex; flex-direction: column; gap: 1.5rem;
}

.card {
  background-color: #fff; padding: 1.5rem; border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.07);
}

.property-media-card h4, .property-actions-card h3 {
  margin-top: 0; margin-bottom: 1rem; font-size: 1.1rem; color: #333;
  display: flex; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 0.5rem;
}
.property-media-card h4 i, .property-actions-card h3 i { margin-right: 0.6em; color: #007bff; }

.image-placeholder {
  height: 280px; background-color: #e9ecef; display: flex; flex-direction: column;
  justify-content: center; align-items: center; color: #adb5bd; border-radius: 6px;
}
.image-placeholder i { margin-bottom: 0.5rem; }

.photo-gallery { margin-top: 0.5rem; }
.primary-photo-container { margin-bottom: 1rem; text-align: center; border: 1px solid #eee; padding: 0.5rem; border-radius: 6px; }
.primary-photo-container img {
  max-width: 100%; max-height: 300px; object-fit: contain;
  border-radius: 4px; cursor: pointer; display: block; margin: 0 auto 0.5rem auto;
}
.primary-photo-container .caption { display: block; font-size: 0.85em; color: #555; font-style: italic; }

.thumbnail-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 0.5rem; }
.thumbnail-item img {
  width: 100%; height: 70px; object-fit: cover; border-radius: 4px;
  cursor: pointer; border: 1px solid #ddd; transition: transform 0.2s ease, border-color 0.2s ease;
}
.thumbnail-item img:hover { transform: scale(1.05); border-color: #007bff; }

.document-list { list-style: none; padding-left: 0; margin-top: 0.5rem;}
.document-item { display: flex; align-items: center; padding: 0.6rem 0; border-bottom: 1px solid #f0f0f0; }
.document-item:last-child { border-bottom: none; }
.document-link {
  color: #007bff; text-decoration: none; font-weight: 500;
  display: flex; align-items: center; flex-grow: 1;
}
.document-link:hover { text-decoration: underline; }
.document-link i { margin-right: 0.75em; font-size: 1.2em; width: 20px; text-align: center;}
.document-link small { margin-left: 0.5em; color: #6c757d; font-weight: normal;}
.doc-description { font-size: 0.85em; color: #555; margin-left: 2.2em; margin-top: 0.2em;}

.action-button.full-width { width: 100%; display: block; text-align: center; margin-bottom: 0.75rem; }
.action-button.full-width:last-child { margin-bottom: 0; }
.action-button.edit { background-color: #17a2b8; border-color: #17a2b8;}
.action-button.edit:hover { background-color: #117a8b; border-color: #10707f;}
.action-button.delete { background-color: #dc3545; border-color: #dc3545;}
.action-button.delete:hover { background-color: #c82333; border-color: #bd2130;}
.cancel-button { background-color: #6c757d; border-color: #6c757d;}
.cancel-button:hover { background-color: #5a6268; border-color: #545b62;}
.action-button i { margin-right: 0.5em; }

.page-header-detail { margin-bottom: 0.5rem; padding-bottom: 1rem; border-bottom: 1px solid #e9ecef; }
.page-header-detail h1 { margin: 0 0 0.5rem 0; color: #212529; font-size: 1.8rem; font-weight: 600; line-height: 1.3;}
.header-badges { display: flex; gap: 0.75rem; align-items: center; margin-top: 0.5rem; }
.listing-type-badge { padding: 0.3em 0.7em; font-size: 0.9em; font-weight: 500; border-radius: 0.25rem; background-color: #e9ecef; color: #495057; }
/* status-badge renkleri PropertyListView'deki ile aynı */
.status-badge { padding: 0.3em 0.7em; font-size: 0.9em; font-weight: 600; border-radius: 0.25rem; color: #fff; text-transform: capitalize; white-space: nowrap; }
.status-aktif { background-color: #28a745; }
.status-satildi, .status-kiralandi { background-color: #dc3545; }
.status-rezerve-edildi { background-color: #ffc107; color: #212529 !important; }
.status-beklemede { background-color: #17a2b8; }
.status-yayindan-kaldirildi, .status-pasif { background-color: #6c757d; }

.price { font-size: 2rem; font-weight: 700; color: #007bff; margin: 0 0 1.5rem 0; }

.details-section h4 { font-size: 1.1rem; color: #495057; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid #f0f0f0; display: flex; align-items: center; }
.details-section h4 i { margin-right: 0.6em; color: #007bff; }

.details-grid { display: grid; gap: 0.75rem 1.5rem; }
.details-grid.two-columns { grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
.details-grid.three-columns { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
.detail-item { font-size: 0.95rem; color: #212529; line-height: 1.6; padding: 0.4rem 0;}
.detail-item strong { font-weight: 600; color: #495057; margin-right: 0.5rem; }
.detail-item.full-width { grid-column: 1 / -1; }

.description-text { white-space: pre-wrap; word-break: break-word; font-family: inherit; font-size: 1rem; color: #343a40; line-height: 1.7; background-color: #f8f9fa; padding: 1rem; border-radius: 4px; border: 1px solid #e9ecef; }
.specific-details .detail-item { background-color: #f8f9fa; padding: 0.6rem 0.8rem; border-radius: 4px; border: 1px solid #eef0f2;}

.map-placeholder { height: 200px; background-color: #e9ecef; display: flex; justify-content: center; align-items: center; color: #adb5bd; border-radius: 4px; text-align: center; margin-top: 1rem;}
.map-placeholder i { margin-right: 0.5rem; }

.meta-info { background-color: transparent; padding: 0; box-shadow: none; border-top: 1px solid #e9ecef; margin-top: 1.5rem; padding-top: 1.5rem; }
.meta-info p { font-size: 0.8em; color: #6c757d; margin-bottom: 0.25rem; }
.meta-info p strong { color: #495057; }

.loading-spinner.small-spinner, .no-data-message.small { font-size: 0.9em; padding: 1rem;}

/* Lightbox Stilleri */
.lightbox-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.85); display: flex; justify-content: center; align-items: center; z-index: 2000; }
.lightbox-content { position: relative; max-width: 90vw; max-height: 90vh; }
.lightbox-content img { display: block; max-width: 100%; max-height: 85vh; object-fit: contain; border-radius: 4px; box-shadow: 0 5px 20px rgba(0,0,0,0.3); }
.lightbox-close, .lightbox-nav { position: absolute; background-color: rgba(30,30,30,0.7); color: white; border: none; border-radius: 50%; cursor: pointer; width: 44px; height: 44px; font-size: 1.3rem; display: flex; justify-content: center; align-items: center; transition: background-color 0.2s ease; }
.lightbox-close:hover, .lightbox-nav:hover { background-color: rgba(0,0,0,0.9); }
.lightbox-close { top: 10px; right: 10px; }
.lightbox-nav.prev { left: 10px; top: 50%; transform: translateY(-50%); }
.lightbox-nav.next { right: 10px; top: 50%; transform: translateY(-50%); }
.lightbox-nav:disabled { opacity: 0.3; cursor: default; }
.lightbox-caption { text-align: center; color: #eee; margin-top: 0.75rem; font-size: 0.9em; padding: 0.5rem; background-color: rgba(0,0,0,0.5); border-radius: 0 0 4px 4px; }

.mt-1 { margin-top: 1rem !important; }
</style>