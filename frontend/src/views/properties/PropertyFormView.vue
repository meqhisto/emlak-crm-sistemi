<template>
  <div class="property-form-view admin-page-container">
    <div class="page-header">
      <h2>{{ isEditMode ? 'Portföyü Düzenle' : 'Yeni Portföy Ekle' }}</h2>
      <router-link :to="{ name: 'property-list' }" class="action-button cancel-button">
        <i class="fas fa-arrow-left"></i> Listeye Dön
      </router-link>
    </div>

    <form @submit.prevent="handleSubmit" class="property-form" novalidate>
      <div v-if="formSubmitError || (v$.$dirty && v$.$invalid)" class="error-message form-error-message">
        <p v-if="formSubmitError">{{ formSubmitError }}</p>
        <p v-if="v$.$dirty && v$.$invalid">Lütfen formdaki işaretli hataları düzeltin.</p>
      </div>
      <p v-if="propertyStore.status.successMessage && !formSubmitError" class="success-message">
        {{ propertyStore.status.successMessage }}
      </p>

      <!-- TKGM JSON Yükleme -->
      <div class="form-section">
        <h3><i class="fas fa-file-code"></i> TKGM Parsel Sorgu JSON Verisi Yükle</h3>
        <div class="form-group">
          <label for="tkgmJsonFile">JSON Dosyası Seçin:</label>
          <input type="file" id="tkgmJsonFile" @change="handleTkgmJsonFileChange" accept=".json" class="form-control-file"/>
          <button type="button" @click="parseTkgmJson" :disabled="!tkgmJsonFile || tkgmParseLoading" class="action-button outlined mt-1">
            <i class="fas fa-cogs"></i> {{ tkgmParseLoading ? 'İşleniyor...' : 'Verileri Otomatik Doldur' }}
          </button>
          <p v-if="tkgmParseError" class="error-message small-error">{{ tkgmParseError }}</p>
        </div>
      </div>


      <div class="form-section">
        <h3><i class="fas fa-info-circle"></i> Temel Bilgiler</h3>
        <div class="form-grid two-columns">
          <div class="form-group" :class="{ error: v$.property.title.$errors.length }">
            <label for="title">İlan Başlığı (*):</label>
            <input type="text" id="title" v-model="v$.property.title.$model" @blur="v$.property.title.$touch()" />
            <div class="input-errors" v-for="error of v$.property.title.$errors" :key="error.$uid">
              <div class="error-msg">{{ error.$message }}</div>
            </div>
          </div>
          <!-- ... (PropertyFormView.vue'deki diğer Temel Bilgiler alanları aynı kalacak - Vuelidate ile) ... -->
           <div class="form-group" :class="{ error: v$.property.property_type.$errors.length }">
            <label for="propertyType">Gayrimenkul Tipi (*):</label>
            <select id="propertyType" v-model="v$.property.property_type.$model" @change="handlePropertyTypeChange">
              <option :value="null" disabled>Seçiniz...</option>
              <option v-for="ptype in propertyStore.propertyTypes" :key="ptype" :value="ptype">
                {{ ptype }}
              </option>
            </select>
            <div class="input-errors" v-for="error of v$.property.property_type.$errors" :key="error.$uid">
              <div class="error-msg">{{ error.$message }}</div>
            </div>
          </div>
          <div class="form-group" :class="{ error: v$.property.listing_type.$errors.length }">
            <label for="listingType">İlan Tipi (*):</label>
            <select id="listingType" v-model="v$.property.listing_type.$model" @blur="v$.property.listing_type.$touch()">
              <option value="Satılık">Satılık</option>
              <option value="Kiralık">Kiralık</option>
            </select>
             <div class="input-errors" v-for="error of v$.property.listing_type.$errors" :key="error.$uid">
              <div class="error-msg">{{ error.$message }}</div>
            </div>
          </div>
          <div class="form-group" :class="{ error: v$.property.status.$errors.length }">
            <label for="status">Durum (*):</label>
            <select id="status" v-model="v$.property.status.$model" @blur="v$.property.status.$touch()">
              <option v-for="pstatus in propertyStore.propertyStatuses" :key="pstatus" :value="pstatus">
                {{ pstatus }}
              </option>
            </select>
            <div class="input-errors" v-for="error of v$.property.status.$errors" :key="error.$uid">
              <div class="error-msg">{{ error.$message }}</div>
            </div>
          </div>
        </div>
        <div class="form-group" :class="{ error: v$.property.description.$errors.length }">
            <label for="description">Açıklama (Max 2000 karakter):</label>
            <textarea id="description" v-model="v$.property.description.$model" @blur="v$.property.description.$touch()" rows="5"></textarea>
            <div class="input-errors" v-for="error of v$.property.description.$errors" :key="error.$uid">
              <div class="error-msg">{{ error.$message }}</div>
            </div>
        </div>
      </div>

      <!-- ... (Fiyat, Konum, Alan Bölümleri - Vuelidate ile aynı kalacak) ... -->
      <div class="form-section">
        <h3><i class="fas fa-dollar-sign"></i> Fiyat Bilgileri</h3>
        <div class="form-grid three-columns">
          <div class="form-group" :class="{ error: v$.property.price.$errors.length }">
            <label for="price">Fiyat:</label>
            <input type="number" id="price" v-model.number="v$.property.price.$model" @blur="v$.property.price.$touch()" step="any" />
            <div class="input-errors" v-for="error of v$.property.price.$errors" :key="error.$uid">
              <div class="error-msg">{{ error.$message }}</div>
            </div>
          </div>
          <div class="form-group">
            <label for="currency">Para Birimi:</label>
            <select id="currency" v-model="property.currency">
              <option value="TRY">TRY</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </div>
      </div>

      <div class="form-section">
        <h3><i class="fas fa-map-marked-alt"></i> Konum Bilgileri</h3>
        <div class="form-grid two-columns">
          <div class="form-group"> <label for="addressLine1">Adres Satırı 1:</label> <input type="text" id="addressLine1" v-model="property.address_line1" /> </div>
          <div class="form-group"> <label for="addressLine2">Adres Satırı 2:</label> <input type="text" id="addressLine2" v-model="property.address_line2" /> </div>
          <div class="form-group" :class="{ error: v$.property.city.$errors.length }">
            <label for="city">Şehir:</label>
            <input type="text" id="city" v-model="v$.property.city.$model" @blur="v$.property.city.$touch()" />
             <div class="input-errors" v-for="error of v$.property.city.$errors" :key="error.$uid"> <div class="error-msg">{{ error.$message }}</div> </div>
          </div>
          <div class="form-group"> <label for="district">İlçe:</label> <input type="text" id="district" v-model="property.district" /> </div>
          <div class="form-group"> <label for="neighborhood">Mahalle/Köy:</label> <input type="text" id="neighborhood" v-model="property.neighborhood" /> </div>
          <div class="form-group"> <label for="postalCode">Posta Kodu:</label> <input type="text" id="postalCode" v-model="property.postal_code" /> </div>
          <div class="form-group" :class="{ error: v$.property.latitude.$errors.length }">
            <label for="latitude">Enlem (Latitude):</label>
            <input type="number" id="latitude" v-model.number="v$.property.latitude.$model" @blur="v$.property.latitude.$touch()" step="any" />
            <div class="input-errors" v-for="error of v$.property.latitude.$errors" :key="error.$uid"> <div class="error-msg">{{ error.$message }}</div> </div>
          </div>
          <div class="form-group" :class="{ error: v$.property.longitude.$errors.length }">
            <label for="longitude">Boylam (Longitude):</label>
            <input type="number" id="longitude" v-model.number="v$.property.longitude.$model" @blur="v$.property.longitude.$touch()" step="any" />
            <div class="input-errors" v-for="error of v$.property.longitude.$errors" :key="error.$uid"> <div class="error-msg">{{ error.$message }}</div> </div>
          </div>
        </div>
      </div>

      <div class="form-section">
        <h3> <i class="fas fa-ruler-combined"></i> Alan Bilgileri</h3>
        <div class="form-grid three-columns">
          <div class="form-group" :class="{ error: v$.property.area_m2_gross.$errors.length }">
            <label for="areaGross">Brüt m²:</label>
            <input type="number" id="areaGross" v-model.number="v$.property.area_m2_gross.$model" @blur="v$.property.area_m2_gross.$touch()" />
            <div class="input-errors" v-for="error of v$.property.area_m2_gross.$errors" :key="error.$uid"> <div class="error-msg">{{ error.$message }}</div> </div>
          </div>
          <div class="form-group" :class="{ error: v$.property.area_m2_net.$errors.length }">
            <label for="areaNet">Net m²:</label>
            <input type="number" id="areaNet" v-model.number="v$.property.area_m2_net.$model" @blur="v$.property.area_m2_net.$touch()" />
             <div class="input-errors" v-for="error of v$.property.area_m2_net.$errors" :key="error.$uid"> <div class="error-msg">{{ error.$message }}</div> </div>
          </div>
          <div class="form-group" :class="{ error: v$.property.land_area_m2.$errors.length }">
            <label for="landArea">Arsa Alanı m² (Arsa/Tarla için):</label>
            <input type="number" id="landArea" v-model.number="v$.property.land_area_m2.$model" @blur="v$.property.land_area_m2.$touch()" />
             <div class="input-errors" v-for="error of v$.property.land_area_m2.$errors" :key="error.$uid"> <div class="error-msg">{{ error.$message }}</div> </div>
          </div>
        </div>
      </div>


      <!-- Türe Özel Detaylar -->
      <div class="form-section">
        <h3><i class="fas fa-cogs"></i> Ek Detaylar ({{ property.property_type || 'Tip Seçilmedi' }})</h3>
        <div v-if="property.property_type === 'Konut'" class="form-grid two-columns">
          <div class="form-group" :class="{ error: v$.property.details.oda_sayisi?.$errors.length }"> <label for="detailOdaSayisi">Oda Sayısı (*):</label> <input type="text" id="detailOdaSayisi" v-model="v$.property.details.oda_sayisi.$model" @blur="v$.property.details.oda_sayisi.$touch()"/> <div class="input-errors" v-for="error of v$.property.details.oda_sayisi.$errors" :key="error.$uid"><div class="error-msg">{{ error.$message }}</div></div> </div>
          <div class="form-group" :class="{ error: v$.property.details.bina_yasi?.$errors.length }"> <label for="detailBinaYasi">Bina Yaşı:</label> <input type="number" id="detailBinaYasi" v-model.number="v$.property.details.bina_yasi.$model" @blur="v$.property.details.bina_yasi.$touch()"/> <div class="input-errors" v-for="error of v$.property.details.bina_yasi.$errors" :key="error.$uid"><div class="error-msg">{{ error.$message }}</div></div> </div>
          <div class="form-group"> <label for="detailKatNumarasi">Bulunduğu Kat:</label> <input type="number" id="detailKatNumarasi" v-model.number="property.details.kat_numarasi" /> </div>
          <div class="form-group"> <label for="detailBanyoSayisi">Banyo Sayısı:</label> <input type="number" id="detailBanyoSayisi" v-model.number="property.details.banyo_sayisi" /> </div>
          <div class="form-group form-check"> <input type="checkbox" id="detailBalkon" v-model="property.details.balkon_var_mi" /> <label for="detailBalkon" class="form-check-label">Balkon Var mı?</label> </div>
          <div class="form-group form-check"> <input type="checkbox" id="detailEsyali" v-model="property.details.esyali_mi" /> <label for="detailEsyali" class="form-check-label">Eşyalı mı?</label> </div>
        </div>
        <div v-else-if="property.property_type === 'Arsa' || property.property_type === 'Tarla'" class="form-grid two-columns">
          <div class="form-group" :class="{ error: v$.property.details.imar_durumu?.$errors.length }"> <label for="detailImarDurumu">İmar Durumu:</label> <input type="text" id="detailImarDurumu" v-model="v$.property.details.imar_durumu.$model" @blur="v$.property.details.imar_durumu.$touch()"/> <div class="input-errors" v-for="error of v$.property.details.imar_durumu.$errors" :key="error.$uid"><div class="error-msg">{{ error.$message }}</div></div> </div>
          <div class="form-group"> <label for="detailAdaNo">Ada No:</label> <input type="text" id="detailAdaNo" v-model="property.details.ada_no" /> </div>
          <div class="form-group"> <label for="detailParselNo">Parsel No:</label> <input type="text" id="detailParselNo" v-model="property.details.parsel_no" /> </div>
          <div class="form-group"> <label for="detailTapuDurumu">Tapu Durumu:</label> <input type="text" id="detailTapuDurumu" v-model="property.details.tapu_durumu" /> </div>
        </div>
         <div v-else-if="property.property_type === 'İşyeri'" class="form-grid two-columns">
          <div class="form-group"> <label for="detailKullanimAmaci">Kullanım Amacı:</label> <input type="text" id="detailKullanimAmaci" v-model="property.details.kullanim_amaci" /> </div>
          <div class="form-group"> <label for="detailCepheSayisi">Cephe Sayısı:</label> <input type="number" id="detailCepheSayisi" v-model.number="property.details.cephe_sayisi" /> </div>
        </div>
        <p v-else-if="property.property_type && property.property_type !== 'Diğer' && property.property_type !== null" class="info-text">
          Bu portföy tipi için özel detay alanları henüz tanımlanmamış.
        </p>
         <div class="form-group form-group-full" v-if="property.property_type === 'Diğer' || !property.property_type">
            <label for="detailGeneric">Diğer Detaylar (JSON formatında girmeniz önerilir):</label>
            <textarea id="detailGeneric" v-model="genericDetailsString" rows="4" placeholder='Örn: {"anahtar_ozellik": "değer", "ek_bilgi": "açıklama"}'></textarea>
            <small>Geçerli JSON formatı girerseniz, yapılandırılmış olarak saklanır. Aksi halde metin olarak saklanır.</small>
        </div>
      </div>

      <!-- Fotoğraf Yükleme -->
      <div class="form-section">
        <h3><i class="fas fa-images"></i> Fotoğraflar</h3>
        <div class="form-group">
          <label for="photos">Fotoğraf Yükle (Birden fazla seçebilirsiniz):</label>
          <input type="file" id="photos" @change="handlePhotoFilesChange" multiple accept="image/*" class="form-control-file"/>
        </div>
        <div v-if="photoPreviews.length > 0" class="photo-previews-grid">
          <div v-for="(preview, index) in photoPreviews" :key="index" class="photo-preview-item">
            <img :src="preview.url" :alt="preview.file.name" />
            <input type="text" v-model="preview.caption" placeholder="Alt yazı (opsiyonel)" class="caption-input"/>
            <div class="form-check">
              <input type="radio" :id="'isPrimary' + index" name="isPrimaryPhoto" :value="index" v-model="primaryPhotoIndex" />
              <label :for="'isPrimary' + index" class="form-check-label">Ana Fotoğraf</label>
            </div>
            <button type="button" @click="removePhotoPreview(index)" class="action-button delete small" title="Bu önizlemeyi kaldır">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
        <!-- Mevcut Fotoğraflar (Düzenleme Modunda) -->
        <div v-if="isEditMode && existingPhotos.length > 0" class="existing-files-grid">
          <h4>Mevcut Fotoğraflar:</h4>
          <div v-for="photo in existingPhotos" :key="photo.id" class="existing-file-item">
            <img :src="getMediaUrl(photo.url)" alt="Mevcut fotoğraf" />
            <span>{{ photo.original_file_name }} ({{ photo.is_primary ? 'Ana' : '' }})</span>
            <button type="button" @click="deleteExistingPhoto(photo.id)" class="action-button delete small" :disabled="photoDeleteLoading[photo.id]">
              <i class="fas fa-trash-alt"></i> {{ photoDeleteLoading[photo.id] ? 'Siliniyor...' : ''}}
            </button>
            <!-- TODO: Ana fotoğraf yapma butonu -->
          </div>
        </div>
        <div v-if="photoUploadLoading" class="loading-spinner small-spinner"><i class="fas fa-spinner fa-spin"></i> Fotoğraflar yükleniyor...</div>
        <p v-if="photoUploadError" class="error-message small-error">{{ photoUploadError }}</p>
      </div>

      <!-- Belge Yükleme -->
      <div class="form-section">
        <h3><i class="fas fa-folder-open"></i> Belgeler</h3>
        <div class="form-group">
          <label for="documents">Belge Yükle (Birden fazla seçebilirsiniz):</label>
          <input type="file" id="documents" @change="handleDocumentFilesChange" multiple class="form-control-file"/>
        </div>
         <div v-if="documentPreviews.length > 0" class="document-previews-list">
          <div v-for="(preview, index) in documentPreviews" :key="index" class="document-preview-item">
            <span><i class="fas fa-file-alt"></i> {{ preview.file.name }} ({{ (preview.file.size / 1024).toFixed(1) }} KB)</span>
            <input type="text" v-model="preview.document_type" placeholder="Belge Tipi (örn: Tapu)" class="caption-input small-input"/>
            <input type="text" v-model="preview.description" placeholder="Açıklama (opsiyonel)" class="caption-input"/>
            <button type="button" @click="removeDocumentPreview(index)" class="action-button delete small" title="Bu önizlemeyi kaldır">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
        <!-- Mevcut Belgeler (Düzenleme Modunda) -->
        <div v-if="isEditMode && existingDocuments.length > 0" class="existing-files-grid">
          <h4>Mevcut Belgeler:</h4>
          <div v-for="doc in existingDocuments" :key="doc.id" class="existing-file-item">
            <a :href="getMediaUrl(doc.url)" target="_blank" class="document-link">
                <i class="fas fa-file-alt"></i> {{ doc.original_file_name }}
            </a>
            <span>({{ doc.document_type || 'Belirsiz' }})</span>
            <button type="button" @click="deleteExistingDocument(doc.id)" class="action-button delete small" :disabled="docDeleteLoading[doc.id]">
              <i class="fas fa-trash-alt"></i> {{ docDeleteLoading[doc.id] ? 'Siliniyor...' : ''}}
            </button>
          </div>
        </div>
        <div v-if="documentUploadLoading" class="loading-spinner small-spinner"><i class="fas fa-spinner fa-spin"></i> Belgeler yükleniyor...</div>
        <p v-if="documentUploadError" class="error-message small-error">{{ documentUploadError }}</p>
      </div>


      <div class="form-section">
        <h3><i class="fas fa-cogs"></i> Yayın Bilgileri ve Atamalar</h3>
        <div class="form-grid two-columns">
          <div class="form-group">
            <label for="expiryDate">İlan Bitiş Tarihi:</label>
            <input type="date" id="expiryDate" v-model="expiry_date_input" />
          </div>
          <div class="form-group" v-if="canAssignConsultant">
            <label for="assignedConsultant">Atanan Danışman:</label>
            <select id="assignedConsultant" v-model="property.assigned_consultant_id">
              <option :value="null">Danışman Yok / Admin Portföyü</option>
              <option v-for="consultant in availableConsultants" :key="consultant.id" :value="consultant.id">
                {{ consultant.first_name }} {{ consultant.last_name }} ({{ consultant.username }})
              </option>
            </select>
          </div>
          <div class="form-group" v-if="canAssignConsultant">
            <label for="assignedOffice">Bağlı Ofis:</label>
            <select id="assignedOffice" v-model="property.office_id">
              <option :value="null">Ofis Yok</option>
              <option v-for="office in availableOffices" :key="office.id" :value="office.id">
                {{ office.name }}
              </option>
            </select>
          </div>
           <div class="form-group form-check" v-if="isEditMode">
              <input type="checkbox" id="propertyIsActiveSystem" v-model="property.is_active" />
              <label for="propertyIsActiveSystem" class="form-check-label">Sistemde Aktif Kayıt</label>
          </div>
        </div>
      </div>

      <div class="form-actions">
        <button type="submit" :disabled="isSubmittingOverall || v$.$invalid" class="action-button submit-button">
          <i :class="isSubmittingOverall ? 'fas fa-spinner fa-spin' : 'fas fa-save'"></i>
          {{ isSubmittingOverall ? 'Kaydediliyor...' : (isEditMode ? 'Portföyü Güncelle' : 'Portföy Ekle') }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { usePropertyStore } from '../../store/modules/propertyStore';
import { useAuthStore } from '../../store/modules/auth';
import apiClient from '../../services/apiClient';

import { useVuelidate } from '@vuelidate/core';
import { required, minValue, maxValue, maxLength, numeric, helpers } from '@vuelidate/validators';

const props = defineProps({ id: { type: String, required: false } });
const route = useRoute();
const router = useRouter();
const propertyStore = usePropertyStore();
const authStore = useAuthStore();

const propertyId = ref(props.id || null);
const isEditMode = computed(() => !!propertyId.value);
const formSubmitError = ref(null);

const initialPropertyData = { /* ... (önceki gibi) ... */
  title: '', description: '', property_type: null, status: 'Aktif', listing_type: 'Satılık',
  price: null, currency: 'TRY', address_line1: '', address_line2: '', city: '', district: '',
  neighborhood: '', postal_code: '', country: 'Türkiye', latitude: null, longitude: null,
  area_m2_gross: null, area_m2_net: null, land_area_m2: null,
  details: {}, expiry_date: null, assigned_consultant_id: null, office_id: null, is_active: true,
};
const property = reactive({ ...initialPropertyData });
const expiry_date_input = ref(''); // YYYY-MM-DD formatı için
const availableConsultants = ref([]);
const availableOffices = ref([]);
const genericDetailsString = ref('');

// Dosya Yükleme State'leri
const tkgmJsonFile = ref(null);
const tkgmParseLoading = ref(false);
const tkgmParseError = ref(null);

const photoFilesToUpload = ref([]); // Yüklenecek fotoğrafların File nesneleri
const photoPreviews = ref([]); // Fotoğraf önizlemeleri (url, file, caption, is_primary)
const primaryPhotoIndex = ref(0); // Seçilen ana fotoğrafın indeksi
const existingPhotos = ref([]); // Düzenleme modunda mevcut fotoğraflar
const photoUploadLoading = ref(false);
const photoUploadError = ref(null);
const photoDeleteLoading = reactive({}); // Her fotoğraf için ayrı loading

const documentFilesToUpload = ref([]);
const documentPreviews = ref([]); // (file, document_type, description)
const existingDocuments = ref([]);
const documentUploadLoading = ref(false);
const documentUploadError = ref(null);
const docDeleteLoading = reactive({});

const isSubmittingOverall = computed(() =>
    propertyStore.status.isSubmitting || photoUploadLoading.value || documentUploadLoading.value
);


// Vuelidate Kuralları
const rules = computed(() => { /* ... (önceki gibi, daha detaylı) ... */
  const R_details = {};
  if (property.property_type === 'Konut') {
    R_details.oda_sayisi = { required: helpers.withMessage('Oda sayısı konut için zorunludur.', required), maxLength: maxLength(20) };
    R_details.bina_yasi = { numeric: helpers.withMessage('Sayısal değer girin.', numeric), minValue: minValue(0), maxValue: maxValue(200) };
  } else if (property.property_type === 'Arsa' || property.property_type === 'Tarla') {
    R_details.imar_durumu = { maxLength: maxLength(100) };
  }
  // Diğer tipler için de kurallar eklenebilir.

  return {
    property: {
      title: { required: helpers.withMessage('İlan başlığı zorunludur.', required), maxLength: helpers.withMessage('En fazla 255 karakter.', maxLength(255)) },
      property_type: { required: helpers.withMessage('Gayrimenkul tipi seçimi zorunludur.', required) },
      listing_type: { required: helpers.withMessage('İlan tipi seçimi zorunludur.', required) },
      status: { required: helpers.withMessage('Durum seçimi zorunludur.', required) },
      description: { maxLength: helpers.withMessage('En fazla 2000 karakter.', maxLength(2000))},
      price: { numeric: helpers.withMessage('Geçerli bir fiyat girin.', numeric), minValue: helpers.withMessage('Fiyat negatif olamaz.', minValue(0)) },
      city: { maxLength: maxLength(100) },
      latitude: { numeric, minValue: minValue(-90), maxValue: maxValue(90) },
      longitude: { numeric, minValue: minValue(-180), maxValue: maxValue(180) },
      area_m2_gross: { numeric, minValue: helpers.withMessage('Pozitif değer girin.', minValue(0)) },
      area_m2_net: { numeric, minValue: helpers.withMessage('Pozitif değer girin.', minValue(0)), 
        maxValue: helpers.withMessage('Net alan brüt alandan büyük olamaz.', maxValue(property.area_m2_gross || Number.MAX_SAFE_INTEGER))
      },
      land_area_m2: { numeric, minValue: helpers.withMessage('Pozitif değer girin.', minValue(0)) },
      details: R_details,
    }
  };
});
const v$ = useVuelidate(rules, { property }, { $autoDirty: true });

// --- Watchers ---
watch(expiry_date_input, (newVal) => {
    property.expiry_date = newVal ? new Date(newVal).toISOString() : null;
});
watch(() => property.expiry_date, (newVal) => {
    if (newVal) { expiry_date_input.value = new Date(newVal).toISOString().split('T')[0]; }
    else { expiry_date_input.value = ''; }
}, { immediate: true });

watch(() => props.id, (newId) => {
    propertyId.value = newId || null;
    loadPropertyForEdit();
});

// --- Computed Properties ---
const canAssignConsultant = computed(() => authStore.isAdmin || authStore.isBroker);

// --- Methods ---
const fetchDropdownOptions = async () => { /* ... (önceki gibi) ... */
  await propertyStore.fetchPropertyTypes();
  await propertyStore.fetchPropertyStatuses();
  if (canAssignConsultant.value) {
    try {
      const usersPromise = apiClient.get('/users', { params: { per_page: 500 } });
      const officesPromise = apiClient.get('/offices', { params: { per_page: 500 } });
      const [usersResponse, officesResponse] = await Promise.all([usersPromise, officesPromise]);
      availableConsultants.value = usersResponse.data.users.filter(u => u.role === 'danisman' || u.role === 'broker');
      availableOffices.value = officesResponse.data.offices;
    } catch (error) {
      console.error("Danışman/Ofis seçenekleri yüklenirken hata:", error);
      formSubmitError.value = "Danışman/Ofis listesi yüklenemedi.";
    }
  }
};

const loadPropertyForEdit = async () => { /* ... (önceki gibi, v$.$reset() eklendi) ... */
  v$.value.$reset();
  formSubmitError.value = null;
  propertyStore.resetStatus();
  photoPreviews.value = []; photoFilesToUpload.value = []; existingPhotos.value = []; photoUploadError.value = null;
  documentPreviews.value = []; documentFilesToUpload.value = []; existingDocuments.value = []; documentUploadError.value = null;


  if (isEditMode.value) {
    const fetchedProperty = await propertyStore.fetchPropertyById(propertyId.value);
    if (fetchedProperty) {
      Object.keys(initialPropertyData).forEach(key => {
        if (key === 'details') {
          property.details = typeof fetchedProperty.details === 'object' && fetchedProperty.details !== null ? { ...fetchedProperty.details } : {};
          if (fetchedProperty.property_type === 'Diğer') {
            genericDetailsString.value = (typeof fetchedProperty.details === 'object') ? JSON.stringify(fetchedProperty.details, null, 2) : (fetchedProperty.details || '');
          }
        } else if (key === 'price' && fetchedProperty[key] !== null) {
            property[key] = parseFloat(fetchedProperty[key]);
        } else if (fetchedProperty[key] !== undefined) {
          property[key] = fetchedProperty[key];
        }
      });
      // Mevcut fotoğraf ve belgeleri yükle
      fetchExistingMedia();
    } else {
      router.push({ name: 'property-list' });
    }
  } else { // Yeni ekleme modu
    Object.assign(property, initialPropertyData);
    property.details = {};
    genericDetailsString.value = '';
    if (authStore.currentUser && authStore.currentUser.role === 'danisman') {
      property.assigned_consultant_id = authStore.currentUser.id;
      if (authStore.currentUser.office_id) {
        property.office_id = authStore.currentUser.office_id;
      }
    }
  }
};

const fetchExistingMedia = async () => {
    if (!propertyId.value) return;
    try {
        const [photosRes, docsRes] = await Promise.all([
            apiClient.get(`/properties/${propertyId.value}/photos`),
            apiClient.get(`/properties/${propertyId.value}/documents`)
        ]);
        existingPhotos.value = photosRes.data || [];
        const primary = existingPhotos.value.find(p => p.is_primary);
        if (primary) {
            // Ana fotoğrafı önizlemelerde seçili hale getirme mantığı eklenebilir (gerekirse)
        }
        existingDocuments.value = docsRes.data || [];
    } catch (error) {
        console.error("Mevcut medya yüklenirken hata:", error);
        formSubmitError.value = "Mevcut fotoğraf/belgeler yüklenemedi.";
    }
};


const handlePropertyTypeChange = () => { /* ... (önceki gibi) ... */
    property.details = {};
    genericDetailsString.value = '';
    v$.value.property.details.$reset();
};

onMounted(async () => {
  await fetchDropdownOptions();
  await loadPropertyForEdit();
});

const getMediaUrl = (relativePath) => { // Backend'den gelen relative path'i tam URL'ye çevir
    // relativePath örnek: /uploads/properties/<prop_id>/photos/<filename>
    // apiClient.defaults.baseURL örnek: http://localhost:5000/api
    // Bizim dosya sunma endpoint'imiz /api/properties/serve-file/...
    if (!relativePath) return '';
    // Modeldeki to_dict url'i /uploads/... şeklinde, serve_property_file ise /api/properties/serve-file/... bekliyor.
    // Bu URL'ler tutarlı olmalı. Şimdilik PropertyPhoto/Document to_dict() metodundaki URL'in
    // /api/properties/serve-file/properties/... şeklinde olduğunu varsayalım.
    // Ya da apiClient.defaults.baseURL'den /api kısmını çıkarıp birleştirelim.
    // Örnek: return `http://localhost:5000${relativePath}`;
    // VEYA apiClient ile çağırmak yerine doğrudan src'ye verilebilir.
    // Şimdilik, to_dict()'in tam URL verdiğini varsayalım veya base ile birleştirelim.

    // Eğer to_dict() /api/properties/serve-file/... gibi bir URL üretiyorsa:
    // return `${apiClient.defaults.baseURL.replace('/api','')}${relativePath}`;

    // Eğer to_dict() sadece dosya yolunu veriyorsa (örn: properties/uuid/photos/img.jpg)
    // ve serve endpoint'imiz /api/properties/serve-file/<yol> ise:
    return `${apiClient.defaults.baseURL}/properties/serve-file/${relativePath.replace(/^\/uploads\//, '')}`;
    // Bu kısım dosya sunma stratejinize göre ayarlanmalı!
    // Mevcut PropertyPhoto/Document.to_dict() /uploads/... şeklinde bir URL üretiyor.
    // Ve properties/routes.py'deki serve_property_file /uploads/<path:filepath> alıyor.
    // Bu durumda, apiClient.defaults.baseURL'den /api'yi çıkarıp /uploads ile birleştirmek doğru olur.
    // Örneğin, baseURL http://localhost:5000/api ise, sonuç http://localhost:5000/uploads/... olmalı.
    const base = apiClient.defaults.baseURL.substring(0, apiClient.defaults.baseURL.lastIndexOf('/api'));
    return `${base}${relativePath}`;
};


// --- TKGM JSON İşleme ---
const handleTkgmJsonFileChange = (event) => {
  tkgmJsonFile.value = event.target.files[0];
  tkgmParseError.value = null;
};
const parseTkgmJson = async () => {
  if (!tkgmJsonFile.value) {
    tkgmParseError.value = "Lütfen bir JSON dosyası seçin.";
    return;
  }
  tkgmParseLoading.value = true;
  tkgmParseError.value = null;
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const jsonData = JSON.parse(e.target.result);
      const response = await apiClient.post('/properties/parse-tkgm-json', jsonData);
      const parsedData = response.data;
      // Formu doldur
      property.title = parsedData.title || property.title;
      property.property_type = parsedData.property_type || property.property_type;
      property.listing_type = parsedData.listing_type || property.listing_type;
      property.address_line1 = parsedData.address_line1 || property.address_line1;
      property.address_line2 = parsedData.address_line2 || property.address_line2;
      property.city = parsedData.city || property.city;
      property.district = parsedData.district || property.district;
      property.neighborhood = parsedData.neighborhood || property.neighborhood;
      property.latitude = parsedData.latitude !== null ? parsedData.latitude : property.latitude;
      property.longitude = parsedData.longitude !== null ? parsedData.longitude : property.longitude;
      property.land_area_m2 = parsedData.land_area_m2 !== null ? parsedData.land_area_m2 : property.land_area_m2;
      property.area_m2_gross = parsedData.area_m2_gross !== null ? parsedData.area_m2_gross : property.area_m2_gross;

      if (typeof parsedData.details === 'object' && parsedData.details !== null) {
        property.details = { ...property.details, ...parsedData.details };
        if (parsedData.property_type === 'Diğer') {
             genericDetailsString.value = JSON.stringify(property.details, null, 2);
        }
      }
      v$.value.$reset(); // JSON'dan sonra validasyonları sıfırla
      alert("Veriler form alanlarına aktarıldı. Lütfen kontrol edip kaydedin.");
    } catch (error) {
      console.error("TKGM JSON parse/API hatası:", error);
      tkgmParseError.value = error.response?.data?.msg || "JSON verisi işlenirken bir hata oluştu.";
    } finally {
      tkgmParseLoading.value = false;
      tkgmJsonFile.value = null; // Input'u temizle
      if (document.getElementById('tkgmJsonFile')) { // DOM'da varsa inputu sıfırla
            document.getElementById('tkgmJsonFile').value = '';
      }
    }
  };
  reader.onerror = () => {
    tkgmParseError.value = "Dosya okunurken bir hata oluştu.";
    tkgmParseLoading.value = false;
  };
  reader.readAsText(tkgmJsonFile.value);
};


// --- Fotoğraf İşlemleri ---
const handlePhotoFilesChange = (event) => {
  const files = Array.from(event.target.files);
  photoUploadError.value = null;
  files.forEach(file => {
    if (!file.type.startsWith('image/')) {
        photoUploadError.value = "Sadece resim dosyaları yüklenebilir.";
        return;
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
        photoUploadError.value = `Dosya boyutu çok büyük: ${file.name} (Max 5MB).`;
        return;
    }
    photoFilesToUpload.value.push(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      photoPreviews.value.push({ url: e.target.result, file, caption: '', is_primary: photoPreviews.value.length === 0 && !isEditMode.value }); // İlk eklenen ana fotoğraf olsun (yeni eklemede)
      if(photoPreviews.value.length === 1 && !isEditMode.value) primaryPhotoIndex.value = 0; // Otomatik seç
    };
    reader.readAsDataURL(file);
  });
  event.target.value = ''; // Aynı dosyayı tekrar seçebilmek için inputu sıfırla
};
const removePhotoPreview = (index) => {
  photoFilesToUpload.value.splice(index, 1);
  photoPreviews.value.splice(index, 1);
  if(primaryPhotoIndex.value === index) primaryPhotoIndex.value = photoPreviews.value.length > 0 ? 0 : null;
  else if (primaryPhotoIndex.value > index) primaryPhotoIndex.value--;
};
const deleteExistingPhoto = async (photoId) => {
    if (!propertyId.value) return;
    if (confirm("Bu fotoğrafı kalıcı olarak silmek istediğinizden emin misiniz?")) {
        photoDeleteLoading[photoId] = true;
        try {
            await apiClient.delete(`/properties/${propertyId.value}/photos/${photoId}`);
            existingPhotos.value = existingPhotos.value.filter(p => p.id !== photoId);
        } catch (error) {
            console.error("Fotoğraf silinirken hata:", error);
            alert(`Fotoğraf silinemedi: ${error.response?.data?.msg || 'Bilinmeyen hata'}`);
        } finally {
            photoDeleteLoading[photoId] = false;
        }
    }
};

// --- Belge İşlemleri ---
const handleDocumentFilesChange = (event) => {
  const files = Array.from(event.target.files);
  documentUploadError.value = null;
  files.forEach(file => {
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
        documentUploadError.value = `Dosya boyutu çok büyük: ${file.name} (Max 10MB).`;
        return;
    }
    documentFilesToUpload.value.push(file);
    documentPreviews.value.push({ file, document_type: '', description: '' });
  });
  event.target.value = '';
};
const removeDocumentPreview = (index) => {
  documentFilesToUpload.value.splice(index, 1);
  documentPreviews.value.splice(index, 1);
};
const deleteExistingDocument = async (docId) => {
    if (!propertyId.value) return;
     if (confirm("Bu belgeyi kalıcı olarak silmek istediğinizden emin misiniz?")) {
        docDeleteLoading[docId] = true;
        try {
            await apiClient.delete(`/properties/${propertyId.value}/documents/${docId}`);
            existingDocuments.value = existingDocuments.value.filter(d => d.id !== docId);
        } catch (error) {
            console.error("Belge silinirken hata:", error);
            alert(`Belge silinemedi: ${error.response?.data?.msg || 'Bilinmeyen hata'}`);
        } finally {
            docDeleteLoading[docId] = false;
        }
    }
};

// --- Ana Form Gönderme ---
const uploadPhotos = async (targetPropertyId) => {
    if (photoFilesToUpload.value.length === 0) return true; // Yüklenecek fotoğraf yoksa başarılı say
    photoUploadLoading.value = true;
    photoUploadError.value = null;
    const uploads = photoFilesToUpload.value.map((file, index) => {
        const formData = new FormData();
        formData.append('photo', file);
        if (photoPreviews.value[index]?.caption) {
            formData.append('caption', photoPreviews.value[index].caption);
        }
        if (index === primaryPhotoIndex.value) {
            formData.append('is_primary', 'true');
        }
        return apiClient.post(`/properties/${targetPropertyId}/photos`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    });
    try {
        await Promise.all(uploads);
        photoFilesToUpload.value = [];
        photoPreviews.value = [];
        primaryPhotoIndex.value = 0;
        return true;
    } catch (error) {
        console.error("Fotoğraf yükleme hatası:", error);
        photoUploadError.value = error.response?.data?.msg || "Fotoğraflar yüklenirken bir hata oluştu.";
        return false;
    } finally {
        photoUploadLoading.value = false;
    }
};
const uploadDocuments = async (targetPropertyId) => {
    if (documentFilesToUpload.value.length === 0) return true;
    documentUploadLoading.value = true;
    documentUploadError.value = null;
    const uploads = documentFilesToUpload.value.map((file, index) => {
        const formData = new FormData();
        formData.append('document', file);
        if(documentPreviews.value[index]?.document_type) formData.append('document_type', documentPreviews.value[index].document_type);
        if(documentPreviews.value[index]?.description) formData.append('description', documentPreviews.value[index].description);
        return apiClient.post(`/properties/${targetPropertyId}/documents`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    });
    try {
        await Promise.all(uploads);
        documentFilesToUpload.value = [];
        documentPreviews.value = [];
        return true;
    } catch (error) {
        console.error("Belge yükleme hatası:", error);
        documentUploadError.value = error.response?.data?.msg || "Belgeler yüklenirken bir hata oluştu.";
        return false;
    } finally {
        documentUploadLoading.value = false;
    }
};

const handleSubmit = async () => {
  formSubmitError.value = null;
  propertyStore.resetStatus();
  v$.value.$validate();

  if (v$.value.$invalid) {
    formSubmitError.value = "Lütfen formdaki tüm zorunlu alanları doğru bir şekilde doldurun.";
    return;
  }

  let finalDetails = { ...property.details };
  if (property.property_type === 'Diğer' && genericDetailsString.value) {
      try { finalDetails = JSON.parse(genericDetailsString.value); }
      catch (e) { finalDetails = genericDetailsString.value; }
  }

  const payload = { ...property, details: finalDetails, expiry_date: property.expiry_date };
  // ... (numericFields ve boş stringleri null yapma kısmı aynı)
  const numericFields = ['price', 'latitude', 'longitude', 'area_m2_gross', 'area_m2_net', 'land_area_m2'];
  numericFields.forEach(field => {
      if (payload[field] === '' || payload[field] === undefined || isNaN(parseFloat(payload[field]))) {
           payload[field] = null;
      } else {
          payload[field] = parseFloat(payload[field]);
      }
  });
  if (payload.assigned_consultant_id === '') payload.assigned_consultant_id = null;
  if (payload.office_id === '') payload.office_id = null;


  propertyStore.status.isSubmitting = true; // Genel submitting state'ini elle yönet

  try {
    let savedProperty;
    if (isEditMode.value) {
      savedProperty = await propertyStore.updateProperty(propertyId.value, payload);
    } else {
      savedProperty = await propertyStore.createProperty(payload);
    }

    if (savedProperty && savedProperty.id) {
      // Fotoğraf ve belgeleri kaydet/güncelle
      const photosUploaded = await uploadPhotos(savedProperty.id);
      const documentsUploaded = await uploadDocuments(savedProperty.id);

      if (photosUploaded && documentsUploaded) {
        propertyStore._setSuccess(isEditMode.value ? 'Portföy ve medyalar başarıyla güncellendi.' : 'Portföy ve medyalar başarıyla eklendi.');
        router.push({ name: 'property-detail', params: { id: savedProperty.id } });
      } else {
        // Medya yüklemede hata olduysa, ana portföy işlemi başarılı olsa bile hata mesajı göster
        formSubmitError.value = photoUploadError.value || documentUploadError.value || "Medyalar yüklenirken bir sorun oluştu.";
      }
    }
  } catch (error) { // createProperty veya updateProperty'den gelen hata
    formSubmitError.value = propertyStore.status.error || "Bir hata oluştu, lütfen tekrar deneyin.";
    console.error("Portföy formu gönderilirken hata (catch block):", error);
  } finally {
      propertyStore.status.isSubmitting = false; // Genel submitting state'ini sıfırla
  }
};

</script>

<style scoped>
/* ... (önceki stiller) ... */
.form-control-file {
    padding: 0.5rem;
    border: 1px solid #ced4da;
    border-radius: 4px;
    display: block;
    width: 100%;
}
.mt-1 { margin-top: 0.5rem; }
.action-button.outlined {
    background-color: transparent;
    color: #007bff;
    border: 1px solid #007bff;
}
.action-button.outlined:hover {
    background-color: #007bff;
    color: white;
}
.small-error { font-size: 0.85em; margin-top: 0.5rem; }
.photo-previews-grid, .existing-files-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
}
.photo-preview-item, .existing-file-item {
    border: 1px solid #eee;
    padding: 0.5rem;
    border-radius: 4px;
    text-align: center;
    position: relative;
}
.photo-preview-item img, .existing-file-item img {
    max-width: 100%;
    height: 100px;
    object-fit: cover;
    margin-bottom: 0.5rem;
    border-radius: 3px;
}
.caption-input {
    width: calc(100% - 1rem); /* Padding'i hesaba kat */
    margin-top: 0.5rem;
    padding: 0.3rem;
    font-size: 0.8em;
    border: 1px solid #ccc;
    border-radius: 3px;
}
.caption-input.small-input {
    margin-bottom: 0.3rem;
}
.photo-preview-item .action-button.delete,
.existing-file-item .action-button.delete {
    position: absolute;
    top: 5px;
    right: 5px;
    padding: 0.1rem 0.3rem; /* Daha küçük */
    line-height: 1; /* İkonu ortalamak için */
}
.document-previews-list, .existing-files-grid {
    margin-top: 1rem;
}
.document-preview-item, .existing-file-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    border: 1px solid #eee;
    border-radius: 4px;
    margin-bottom: 0.5rem;
    background-color: #f9f9f9;
}
.document-preview-item span, .existing-file-item span {
    flex-grow: 1;
    font-size: 0.9em;
    word-break: break-all;
}
.document-preview-item .caption-input {
    flex-basis: 150px; /* Sabit genişlik */
    flex-grow: 0;
}
.document-link {
    color: #007bff;
    text-decoration: none;
    font-weight: 500;
}
.document-link:hover {
    text-decoration: underline;
}
.document-link i, .existing-file-item i.fa-file-alt { margin-right: 0.3em;}
.small-spinner { font-size: 0.9em; padding: 0.5rem; text-align: left;}

.info-text {
    font-size: 0.9em;
    color: #6c757d;
    margin-top: 0.5rem;
    padding: 0.5rem;
    background-color: #f8f9fa;
    border-left: 3px solid #17a2b8;
}
</style>