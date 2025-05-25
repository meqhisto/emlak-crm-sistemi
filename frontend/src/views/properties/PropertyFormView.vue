<template>
  <div class="property-form-view admin-page-container">
    <div class="page-header">
      <h2>{{ isEditMode ? 'Portföyü Düzenle' : 'Yeni Portföy Ekle' }}</h2>
      <router-link :to="{ name: 'property-list' }" class="action-button cancel-button">
        <i class="fas fa-arrow-left"></i> Listeye Dön
      </router-link>
    </div>

    <form @submit.prevent="handleSubmit" class="property-form" novalidate>
      <!-- Genel Form Hataları -->
      <div v-if="formSubmitError || (v$.$dirty && v$.$invalid)" class="error-message form-error-message">
        <p v-if="formSubmitError" v-html="formSubmitError.replace(/\n/g, '<br>')"></p>
        <p v-if="v$.$dirty && v$.$invalid && !formSubmitError">Lütfen formdaki işaretli hataları düzeltin.</p>
      </div>
      <p v-if="propertyStore.status.successMessage && !formSubmitError" class="success-message">
        {{ propertyStore.status.successMessage }}
      </p>

      <!-- TKGM JSON Yükleme -->
      <div class="form-section card">
        <h3><i class="fas fa-file-code"></i> TKGM Parsel Sorgu JSON Verisi Yükle</h3>
        <div class="form-group">
          <label for="tkgmJsonFile">JSON Dosyası Seçin (Opsiyonel):</label>
          <input type="file" id="tkgmJsonFile" @change="handleTkgmJsonFileChange" accept=".json" class="form-control-file"/>
          <button type="button" @click="parseTkgmJson" :disabled="!tkgmJsonFile || tkgmParseLoading" class="action-button outlined mt-1">
            <i class="fas fa-cogs"></i> {{ tkgmParseLoading ? 'İşleniyor...' : 'Verileri Otomatik Doldur' }}
          </button>
          <p v-if="tkgmParseError" class="error-message small-error">{{ tkgmParseError }}</p>
        </div>
      </div>

      <!-- Temel Bilgiler -->
      <div class="form-section card">
        <h3><i class="fas fa-info-circle"></i> Temel Bilgiler</h3>
        <div class="form-grid two-columns">
          <div class="form-group" :class="{ error: v$.property.title.$errors.length }">
            <label for="title">İlan Başlığı (*):</label>
            <input type="text" id="title" v-model="v$.property.title.$model" @blur="v$.property.title.$touch()" />
            <div class="input-errors" v-for="error of v$.property.title.$errors" :key="error.$uid">
              <div class="error-msg">{{ error.$message }}</div>
            </div>
          </div>
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

      <!-- Fiyat Bilgileri -->
      <div class="form-section card">
        <h3><i class="fas fa-dollar-sign"></i> Fiyat Bilgileri</h3>
        <div class="form-grid three-columns">
          <div class="form-group" :class="{ error: v$.property.price.$errors.length }">
            <label for="price">Fiyat:</label>
            <input type="number" id="price" v-model.number="v$.property.price.$model" @blur="v$.property.price.$touch()" step="any" placeholder="Örn: 2500000"/>
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

      <!-- Konum Bilgileri -->
      <div class="form-section card">
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
            <input type="number" id="latitude" v-model.number="v$.property.latitude.$model" @blur="v$.property.latitude.$touch()" step="any" placeholder="Örn: 40.14705"/>
            <div class="input-errors" v-for="error of v$.property.latitude.$errors" :key="error.$uid"> <div class="error-msg">{{ error.$message }}</div> </div>
          </div>
          <div class="form-group" :class="{ error: v$.property.longitude.$errors.length }">
            <label for="longitude">Boylam (Longitude):</label>
            <input type="number" id="longitude" v-model.number="v$.property.longitude.$model" @blur="v$.property.longitude.$touch()" step="any" placeholder="Örn: 26.4456"/>
            <div class="input-errors" v-for="error of v$.property.longitude.$errors" :key="error.$uid"> <div class="error-msg">{{ error.$message }}</div> </div>
          </div>
        </div>
      </div>

      <!-- Alan Bilgileri -->
      <div class="form-section card">
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
<!-- Mevcut Alan Bilgileri Section'ından SONRA -->
<div class="form-section card" v-if="property.property_type === 'Arsa' || property.property_type === 'Tarla'">
  <h3><i class="fas fa-drafting-compass"></i> Emsal ve İnşaat Bilgileri</h3>
  <div class="form-grid three-columns">
    <div class="form-group" :class="{ error: v$.property.land_area_m2?.$errors.length }"> <!-- land_area_m2 artık burada daha anlamlı -->
      <label for="formLandArea">Arsa Alanı (m²)</label>
      <input type="number" id="formLandArea" v-model.number="v$.property.land_area_m2.$model" @blur="v$.property.land_area_m2?.$touch()" @input="calculateConstructionAreas" />
      <div class="input-errors" v-for="error of v$.property.land_area_m2.$errors" :key="error.$uid"><div class="error-msg">{{ error.$message }}</div></div>
    </div>
    <div class="form-group" :class="{ error: v$.property.kaks_emsal?.$errors.length }">
      <label for="kaksEmsal">KAKS (Emsal Oranı):</label>
      <input type="number" id="kaksEmsal" v-model.number="v$.property.kaks_emsal.$model" @blur="v$.property.kaks_emsal?.$touch()" step="0.01" placeholder="Örn: 1.5" @input="calculateConstructionAreas"/>
      <div class="input-errors" v-for="error of v$.property.kaks_emsal.$errors" :key="error.$uid"><div class="error-msg">{{ error.$message }}</div></div>
    </div>
    <div class="form-group" :class="{ error: v$.property.taks_emsal?.$errors.length }">
      <label for="taksEmsal">TAKS Oranı:</label>
      <input type="number" id="taksEmsal" v-model.number="v$.property.taks_emsal.$model" @blur="v$.property.taks_emsal?.$touch()" step="0.01" placeholder="Örn: 0.3" @input="calculateConstructionAreas"/>
      <div class="input-errors" v-for="error of v$.property.taks_emsal.$errors" :key="error.$uid"><div class="error-msg">{{ error.$message }}</div></div>
    </div>
    <div class="form-group">
      <label for="maxKatAdedi">Maks. Kat Adedi:</label>
      <input type="number" id="maxKatAdedi" v-model.number="property.max_kat_adedi" />
    </div>
    <div class="form-group">
      <label for="gabari">Gabari / Maks. Yükseklik (m):</label>
      <input type="number" id="gabari" v-model.number="property.gabari_max_yukseklik_metre" step="0.1" />
    </div>
    <div class="form-group">
      <label for="insaatNizami">İnşaat Nizamı:</label>
      <input type="text" id="insaatNizami" v-model="property.insaat_nizami" placeholder="Örn: Ayrık, Bitişik"/>
    </div>
  </div>
  <!-- Hesaplanan Alanlar (Sadece Gösterim) -->
  <div class="calculated-areas mt-1" v-if="property.land_area_m2 > 0">
      <p><strong>Tahmini Taban Oturumu:</strong> {{ calculatedBaseArea > 0 ? calculatedBaseArea.toFixed(2) + ' m²' : '-' }}</p>
      <p><strong>Tahmini Toplam İnşaat Alanı:</strong> {{ calculatedTotalConstructionArea > 0 ? calculatedTotalConstructionArea.toFixed(2) + ' m²' : '-' }}</p>
  </div>
</div>
      <!-- Türe Özel Detaylar -->
      <div class="form-section card">
        <h3><i class="fas fa-cogs"></i> Ek Detaylar ({{ property.property_type || 'Tip Seçilmedi' }})</h3>
        <div v-if="property.property_type === 'Konut'" class="form-grid two-columns">
          <div class="form-group" :class="{ error: v$.property.details.oda_sayisi?.$errors.length }"> <label for="detailOdaSayisi">Oda Sayısı (*):</label> <input type="text" id="detailOdaSayisi" v-model="v$.property.details.oda_sayisi.$model" @blur="v$.property.details.oda_sayisi?.$touch()"/> <div class="input-errors" v-for="error of v$.property.details.oda_sayisi.$errors" :key="error.$uid"><div class="error-msg">{{ error.$message }}</div></div> </div>
          <div class="form-group" :class="{ error: v$.property.details.bina_yasi?.$errors.length }"> <label for="detailBinaYasi">Bina Yaşı:</label> <input type="number" id="detailBinaYasi" v-model.number="v$.property.details.bina_yasi.$model" @blur="v$.property.details.bina_yasi?.$touch()"/> <div class="input-errors" v-for="error of v$.property.details.bina_yasi.$errors" :key="error.$uid"><div class="error-msg">{{ error.$message }}</div></div> </div>
          <div class="form-group"> <label for="detailKatNumarasi">Bulunduğu Kat:</label> <input type="number" id="detailKatNumarasi" v-model.number="property.details.kat_numarasi" /> </div>
          <div class="form-group"> <label for="detailBanyoSayisi">Banyo Sayısı:</label> <input type="number" id="detailBanyoSayisi" v-model.number="property.details.banyo_sayisi" /> </div>
          <div class="form-group form-check"> <input type="checkbox" id="detailBalkon" v-model="property.details.balkon_var_mi" /> <label for="detailBalkon" class="form-check-label">Balkon Var mı?</label> </div>
          <div class="form-group form-check"> <input type="checkbox" id="detailEsyali" v-model="property.details.esyali_mi" /> <label for="detailEsyali" class="form-check-label">Eşyalı mı?</label> </div>
        </div>
        <div v-else-if="property.property_type === 'Arsa' || property.property_type === 'Tarla'" class="form-grid two-columns">
          <div class="form-group" :class="{ error: v$.property.details.imar_durumu?.$errors.length }"> <label for="detailImarDurumu">İmar Durumu:</label> <input type="text" id="detailImarDurumu" v-model="v$.property.details.imar_durumu.$model" @blur="v$.property.details.imar_durumu?.$touch()"/> <div class="input-errors" v-for="error of v$.property.details.imar_durumu.$errors" :key="error.$uid"><div class="error-msg">{{ error.$message }}</div></div> </div>
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
      <div class="form-section card">
        <h3><i class="fas fa-images"></i> Fotoğraflar</h3>
        <div class="form-group">
          <label for="photos">Yeni Fotoğraf Yükle (Max 5MB, PNG, JPG, GIF, WEBP):</label>
          <input type="file" id="photos" @change="handlePhotoFilesChange" multiple accept="image/png, image/jpeg, image/gif, image/webp" class="form-control-file"/>
        </div>
        <div v-if="photoPreviews.length > 0" class="photo-previews-grid">
          <div v-for="(preview, index) in photoPreviews" :key="`preview-${index}`" class="photo-preview-item">
            <img :src="preview.url" :alt="preview.file.name" />
            <input type="text" v-model="preview.caption" placeholder="Alt yazı (opsiyonel)" class="caption-input"/>
            <div class="form-check">
              <input type="radio" :id="'isPrimaryPreview' + index" name="isPrimaryPhotoCandidate" :value="index" v-model="primaryPhotoCandidateIndex" />
              <label :for="'isPrimaryPreview' + index" class="form-check-label">Ana Fotoğraf</label>
            </div>
            <button type="button" @click="removePhotoPreview(index)" class="action-button delete small" title="Bu önizlemeyi kaldır">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
        <div v-if="isEditMode && existingPhotos.length > 0" class="existing-files-grid photos">
          <h4>Mevcut Fotoğraflar:</h4>
          <div v-for="photo in existingPhotos" :key="photo.id" class="existing-file-item photo">
            <img :src="getMediaUrl(photo.url)" :alt="photo.original_file_name || 'Mevcut fotoğraf'" />
            <p class="filename" :title="photo.original_file_name">{{ photo.original_file_name }}</p>
            <p v-if="photo.caption" class="caption-text"><em>{{photo.caption}}</em></p>
            <div class="form-check">
              <input type="radio" :id="'isPrimaryExisting' + photo.id" name="isPrimaryPhotoExisting" :value="photo.id" v-model="primaryExistingPhotoId" @change="setExistingAsPrimary(photo.id)"/>
              <label :for="'isPrimaryExisting' + photo.id" class="form-check-label">Ana Fotoğraf</label>
            </div>
            <button type="button" @click="deleteExistingPhoto(photo.id)" class="action-button delete small" :disabled="photoDeleteLoading[photo.id]" title="Bu fotoğrafı sil">
              <i class="fas fa-trash-alt"></i> {{ photoDeleteLoading[photo.id] ? 'Siliniyor...' : ''}}
            </button>
          </div>
        </div>
        <div v-if="photoUploadLoading" class="loading-spinner small-spinner"><i class="fas fa-spinner fa-spin"></i> Fotoğraflar yükleniyor...</div>
        <p v-if="photoUploadError" class="error-message small-error">{{ photoUploadError }}</p>
      </div>

      <!-- Belge Yükleme -->
      <div class="form-section card">
        <h3><i class="fas fa-folder-open"></i> Belgeler</h3>
        <div class="form-group">
          <label for="documents">Yeni Belge Yükle (Max 10MB):</label>
          <input type="file" id="documents" @change="handleDocumentFilesChange" multiple class="form-control-file"/>
        </div>
         <div v-if="documentPreviews.length > 0" class="document-previews-list">
          <h4>Yüklenecek Belgeler:</h4>
          <div v-for="(preview, index) in documentPreviews" :key="`doc-preview-${index}`" class="document-preview-item">
            <span><i class="fas fa-file-alt"></i> {{ preview.file.name }} ({{ (preview.file.size / 1024).toFixed(1) }} KB)</span>
            <input type="text" v-model="preview.document_type" placeholder="Belge Tipi (örn: Tapu)" class="caption-input small-input"/>
            <input type="text" v-model="preview.description" placeholder="Açıklama (opsiyonel)" class="caption-input"/>
            <button type="button" @click="removeDocumentPreview(index)" class="action-button delete small" title="Bu önizlemeyi kaldır">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
        <div v-if="isEditMode && existingDocuments.length > 0" class="existing-files-grid documents">
          <h4>Mevcut Belgeler:</h4>
          <div v-for="doc in existingDocuments" :key="doc.id" class="existing-file-item document">
            <a :href="getMediaUrl(doc.url)" target="_blank" class="document-link" :title="doc.description || doc.original_file_name">
                <i :class="getDocumentIcon(doc.mime_type || doc.original_file_name)"></i> {{ doc.original_file_name }}
            </a>
            <span class="doc-type">({{ doc.document_type || 'Belirsiz' }})</span>
            <button type="button" @click="deleteExistingDocument(doc.id)" class="action-button delete small" :disabled="docDeleteLoading[doc.id]" title="Bu belgeyi sil">
              <i class="fas fa-trash-alt"></i> {{ docDeleteLoading[doc.id] ? 'Siliniyor...' : ''}}
            </button>
          </div>
        </div>
        <div v-if="documentUploadLoading" class="loading-spinner small-spinner"><i class="fas fa-spinner fa-spin"></i> Belgeler yükleniyor...</div>
        <p v-if="documentUploadError" class="error-message small-error">{{ documentUploadError }}</p>
      </div>

      <!-- Yayın Bilgileri ve Atamalar -->
      <div class="form-section card">
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

const props = defineProps({
  id: { // route'dan gelen :id parametresi (düzenleme modu için)
    type: String,
    required: false, // Yeni ekleme modunda olmayacak
  },
});

const route = useRoute();
const router = useRouter();
const propertyStore = usePropertyStore();
const authStore = useAuthStore();

const propertyId = ref(props.id || null);
const isEditMode = computed(() => !!propertyId.value);
const formSubmitError = ref(null); // API dışı genel form hataları için

const initialPropertyData = {
  title: '',
  description: '',
  property_type: null,
  status: 'Aktif', // Varsayılan durum
  listing_type: 'Satılık', // Varsayılan ilan tipi
  price: null,
  currency: 'TRY',
  address_line1: '',
  address_line2: '',
  city: '',
  district: '',
  neighborhood: '',
  postal_code: '',
  country: 'Türkiye',
  latitude: null,
  longitude: null,
  area_m2_gross: null,
  area_m2_net: null,
  land_area_m2: null,
  kaks_emsal: null,
  taks_emsal: null,
  gabari_max_yukseklik_metre: null,
  max_kat_adedi: null,
  insaat_nizami: '',
  details: {}, // Başlangıçta boş bir obje
  expiry_date: null, // ISO string olarak saklanacak
  assigned_consultant_id: null,
  office_id: null,
  is_active: true, // Kaydın sistemdeki aktifliği
};
const property = reactive({ ...initialPropertyData });

// expiry_date için ayrı bir ref (HTML date input'u YYYY-MM-DD formatında değer alır)
const expiry_date_input = ref('');

const availableConsultants = ref([]);
const availableOffices = ref([]);
const genericDetailsString = ref(''); // "Diğer" tipi için veya JSON olmayan girişler için

// Dosya Yükleme State'leri
const tkgmJsonFile = ref(null);
const tkgmParseLoading = ref(false);
const tkgmParseError = ref(null);

const photoFilesToUpload = ref([]); // Yüklenecek fotoğrafların File nesneleri
const photoPreviews = ref([]); // Fotoğraf önizlemeleri (url, file, caption)
const primaryPhotoCandidateIndex = ref(null); // Yüklenecekler arasından ana fotoğrafın index'i
const primaryExistingPhotoId = ref(null); // Mevcut fotolardan ana olanın ID'si
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
    propertyStore.status.isSubmitting || // Ana form için store'un kendi submitting'i
    photoUploadLoading.value ||
    documentUploadLoading.value ||
    Object.values(photoDeleteLoading).some(loading => loading) ||
    Object.values(docDeleteLoading).some(loading => loading)
);


// Vuelidate Kuralları
const rules = computed(() => {
  const R_details = {}; // property.details için kurallar (dinamik)
  if (property.property_type === 'Konut') {
    R_details.oda_sayisi = { required: helpers.withMessage('Oda sayısı konut için zorunludur.', required), maxLength: maxLength(20) };
    R_details.bina_yasi = { numeric: helpers.withMessage('Sayısal değer girin.', numeric), minValue: helpers.withMessage('Bina yaşı pozitif olmalı.', minValue(0)), maxValue: helpers.withMessage('Bina yaşı çok yüksek.', maxValue(200)) };
  } else if (property.property_type === 'Arsa' || property.property_type === 'Tarla') {
    R_details.imar_durumu = { maxLength: maxLength(100) };
  }
  // Diğer tipler için de `details` altındaki alanlara kurallar eklenebilir.

  return {
    property: {
      title: { required: helpers.withMessage('İlan başlığı zorunludur.', required), maxLength: helpers.withMessage('Başlık en fazla 255 karakter olabilir.', maxLength(255)) },
      property_type: { required: helpers.withMessage('Gayrimenkul tipi seçimi zorunludur.', required) },
      listing_type: { required: helpers.withMessage('İlan tipi seçimi zorunludur.', required) },
      status: { required: helpers.withMessage('Durum seçimi zorunludur.', required) },
      description: { maxLength: helpers.withMessage('Açıklama en fazla 2000 karakter olabilir.', maxLength(2000))},
      price: { numeric: helpers.withMessage('Geçerli bir fiyat girin.', numeric), minValue: helpers.withMessage('Fiyat negatif olamaz.', minValue(0)) },
      city: { maxLength: helpers.withMessage('Şehir en fazla 100 karakter olabilir.', maxLength(100)) },
      latitude: { numeric, minValue: helpers.withMessage('Geçerli bir enlem girin (-90 ile 90 arası).', minValue(-90)), maxValue: helpers.withMessage('Geçerli bir enlem girin (-90 ile 90 arası).', maxValue(90)) },
      longitude: { numeric, minValue: helpers.withMessage('Geçerli bir boylam girin (-180 ile 180 arası).', minValue(-180)), maxValue: helpers.withMessage('Geçerli bir boylam girin (-180 ile 180 arası).', maxValue(180)) },
      area_m2_gross: { numeric: helpers.withMessage('Sayısal değer girin.', numeric), minValue: helpers.withMessage('Alan pozitif olmalı.', minValue(0)) },
      area_m2_net: {
        numeric: helpers.withMessage('Sayısal değer girin.', numeric),
        minValue: helpers.withMessage('Alan pozitif olmalı.', minValue(0)),
        // maxValue: helpers.withMessage('Net alan brüt alandan büyük olamaz.', maxValue(property.area_m2_gross || Number.MAX_SAFE_INTEGER))
        // Yukarıdaki maxValue, property.area_m2_gross null ise sorun çıkarabilir. Daha iyi bir kontrol:
        customNetAreaValidation: helpers.withMessage('Net alan brüt alandan büyük olamaz.', (value) => {
            if (property.area_m2_gross === null || property.area_m2_gross === undefined || value === null || value === undefined) return true; // Eğer brüt alan girilmemişse veya net alan girilmemişse bu validasyonu atla
            return parseFloat(value) <= parseFloat(property.area_m2_gross);
        })
      },
      land_area_m2: { numeric: helpers.withMessage('Sayısal değer girin.', numeric), minValue: helpers.withMessage('Alan pozitif olmalı.', minValue(0)) },
      kaks_emsal: { numeric, minValue: minValue(0), maxValue: maxValue(10) },
      taks_emsal: { numeric, minValue: minValue(0), maxValue: maxValue(1) },
      max_kat_adedi: { numeric, minValue: minValue(0), maxValue: maxValue(100) },
      gabari_max_yukseklik_metre: { numeric, minValue: minValue(0), maxValue: maxValue(300) },
      details: R_details,
    }
  };
});

// Vuelidate instance
const v$ = useVuelidate(rules, { property }, { $autoDirty: true });


// --- Watchers ---
watch(expiry_date_input, (newVal) => {
    property.expiry_date = newVal ? new Date(newVal).toISOString() : null;
});
watch(() => property.expiry_date, (newVal) => {
    if (newVal) {
        try {
            expiry_date_input.value = new Date(newVal).toISOString().split('T')[0];
        } catch (e) {
            expiry_date_input.value = ''; // Hatalı tarih formatı gelirse inputu boşalt
        }
    } else {
        expiry_date_input.value = '';
    }
}, { immediate: true });

watch(() => props.id, (newId) => {
    propertyId.value = newId || null;
    loadInitialFormState();
});

// --- Computed Properties ---
const canAssignConsultant = computed(() => authStore.isAdmin || authStore.isBroker);

const calculatedBaseArea = computed(() => {
  const landArea = parseFloat(property.land_area_m2);
  const taks = parseFloat(property.taks_emsal);
  if (!isNaN(landArea) && landArea > 0 && !isNaN(taks) && taks > 0) {
    return landArea * taks;
  }
  return 0;
});

const calculatedTotalConstructionArea = computed(() => {
  const landArea = parseFloat(property.land_area_m2);
  const kaks = parseFloat(property.kaks_emsal);
  if (!isNaN(landArea) && landArea > 0 && !isNaN(kaks) && kaks > 0) {
    return landArea * kaks;
  }
  return 0;
});

// --- Methods ---
const fetchDropdownOptions = async () => {
  await propertyStore.fetchPropertyTypes();
  await propertyStore.fetchPropertyStatuses();
  if (canAssignConsultant.value) {
    try {
      const usersPromise = apiClient.get('/users', { params: { per_page: 500 } }); // Rol filtresi backend'de olmalı
      const officesPromise = apiClient.get('/offices', { params: { per_page: 500 } });
      const [usersResponse, officesResponse] = await Promise.all([usersPromise, officesPromise]);
      availableConsultants.value = usersResponse.data.users.filter(u => u.role === 'danisman' || u.role === 'broker');
      availableOffices.value = officesResponse.data.offices;
    } catch (error) {
      console.error("Danışman/Ofis seçenekleri yüklenirken hata:", error);
      formSubmitError.value = "Form için gerekli bazı veriler (Danışman/Ofis listesi) yüklenemedi.";
    }
  }
};

const resetFormAndState = () => {
    Object.assign(property, JSON.parse(JSON.stringify(initialPropertyData))); // Derin kopyalama ile sıfırlama
    property.details = {}; // details'ı ayrıca boş obje yap
    genericDetailsString.value = '';
    expiry_date_input.value = ''; // Bu, property.expiry_date watch'ını tetikleyerek onu da null yapar.
    v$.value.$reset();
    formSubmitError.value = null;
    propertyStore.resetStatus();

    tkgmJsonFile.value = null; tkgmParseLoading.value = false; tkgmParseError.value = null;
    photoFilesToUpload.value = []; photoPreviews.value = []; primaryPhotoCandidateIndex.value = null;
    existingPhotos.value = []; photoUploadError.value = null; Object.keys(photoDeleteLoading).forEach(k => delete photoDeleteLoading[k]);
    documentFilesToUpload.value = []; documentPreviews.value = [];
    existingDocuments.value = []; documentUploadError.value = null; Object.keys(docDeleteLoading).forEach(k => delete docDeleteLoading[k]);
    primaryExistingPhotoId.value = null;
};

const loadInitialFormState = async () => {
  resetFormAndState();
  if (isEditMode.value) {
    const fetchedProperty = await propertyStore.fetchPropertyById(propertyId.value);
    if (fetchedProperty) {
      Object.keys(initialPropertyData).forEach(key => {
        if (key === 'details') {
          property.details = typeof fetchedProperty.details === 'object' && fetchedProperty.details !== null ? { ...fetchedProperty.details } : {};
          if (fetchedProperty.property_type === 'Diğer') {
            genericDetailsString.value = (typeof fetchedProperty.details === 'object') ? JSON.stringify(fetchedProperty.details, null, 2) : (fetchedProperty.details || '');
          }
        } else if (key === 'price' && fetchedProperty[key] !== null && fetchedProperty[key] !== undefined) {
            property[key] = parseFloat(fetchedProperty[key]);
        } else if (key === 'expiry_date') { // expiry_date watch'ı tetikleyecek
            property[key] = fetchedProperty[key];
        } else if (fetchedProperty[key] !== undefined) {
          property[key] = fetchedProperty[key];
        }
      });
      await fetchExistingMedia();
      v$.value.$reset(); // Veri yüklendikten sonra validasyon durumunu sıfırla
    } else {
      formSubmitError.value = "Portföy bulunamadı veya yüklenirken bir hata oluştu. Listeye yönlendiriliyorsunuz.";
      // setTimeout(() => router.push({ name: 'property-list' }), 3000);
    }
  } else {
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
    // propertyStore.status.isLoading = true; // Bu ana form loading'ini etkileyebilir, ayrı loading state'ler daha iyi
    try {
        const [photosRes, docsRes] = await Promise.all([
            apiClient.get(`/properties/${propertyId.value}/photos`),
            apiClient.get(`/properties/${propertyId.value}/documents`)
        ]);
        existingPhotos.value = photosRes.data || [];
        const primary = existingPhotos.value.find(p => p.is_primary);
        primaryExistingPhotoId.value = primary ? primary.id : null;
        existingDocuments.value = docsRes.data || [];
    } catch (error) {
        console.error("Mevcut medya yüklenirken hata:", error);
        formSubmitError.value = (formSubmitError.value ? formSubmitError.value + "\n" : "") + "Mevcut fotoğraf/belgeler yüklenemedi.";
    } finally {
        // propertyStore.status.isLoading = false;
    }
};

const handlePropertyTypeChange = () => {
    property.details = {};
    genericDetailsString.value = '';
    // İlgili details alanları için Vuelidate'i sıfırla (eğer $each veya dinamik kurallar varsa)
    if (v$.value.property.details) {
        v$.value.property.details.$reset();
    }
};

onMounted(async () => {
  await fetchDropdownOptions(); // Önce dropdown'lar
  await loadInitialFormState(); // Sonra form verisi
});

const getMediaUrl = (relativePath) => {
    if (!relativePath) return '#'; // Geçersiz yol için placeholder
    // Backend'den gelen URL'nin /uploads/ ile başladığını varsayıyoruz
    // (PropertyPhoto ve PropertyDocument to_dict() metodlarına göre)
    // ve Flask app'imiz /uploads/ altında UPLOAD_FOLDER'dan dosya sunuyor.
    // (Bu, app/__init__.py veya ayrı bir blueprint'te ayarlanmış olmalı)
    // VEYA serve_property_file endpoint'ini kullanıyoruz.
    // Mevcut `serve_property_file` endpoint'i /api/properties/serve-file/... şeklinde
    // `PropertyPhoto/Document.to_dict()` metodundaki URL'ler buna göre güncellenmeli.
    // Şimdilik, to_dict()'in tam ve erişilebilir bir URL döndürdüğünü varsayalım.
    // Eğer to_dict /uploads/... döndürüyorsa ve serve_property_file /api/properties/serve-file/... ise
    // bu URL'leri eşleştirmek gerekir.
    // Örnek olarak, to_dict() içindeki URL'leri şöyle güncelleyebiliriz:
    // 'url': f"/api/properties/serve-file/properties/{str(self.property_id)}/photos/{self.file_name}"
    // Bu durumda getMediaUrl'e gerek kalmaz, doğrudan photo.url kullanılabilir.
    // Geçici olarak, apiClient.defaults.baseURL'den /api'yi çıkarıp birleştirelim:
    const base = apiClient.defaults.baseURL.substring(0, apiClient.defaults.baseURL.lastIndexOf('/api'));
    if (relativePath && relativePath.startsWith('/uploads/')) {
        return `${base}${relativePath}`;
    }
    return relativePath || '#'; // Eğer tam URL geliyorsa veya hata varsa
};


const handleTkgmJsonFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
      if (file.type !== "application/json") {
          tkgmParseError.value = "Lütfen geçerli bir JSON dosyası seçin (.json).";
          event.target.value = ''; // Input'u temizle
          return;
      }
      tkgmJsonFile.value = file;
      tkgmParseError.value = null;
  } else {
      tkgmJsonFile.value = null;
  }
};
const parseTkgmJson = async () => {
  if (!tkgmJsonFile.value) { tkgmParseError.value = "Lütfen bir JSON dosyası seçin."; return; }
  tkgmParseLoading.value = true; tkgmParseError.value = null; formSubmitError.value = null;
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const jsonData = JSON.parse(e.target.result);
      const response = await apiClient.post('/properties/parse-tkgm-json', jsonData);
      const parsedData = response.data;
      
      // Formu doldururken, sadece backend'den gelen ve property objesinde olan alanları güncelle
      Object.keys(property).forEach(key => {
        if (parsedData.hasOwnProperty(key) && parsedData[key] !== undefined) {
          if (key === 'details' && typeof parsedData.details === 'object' && parsedData.details !== null) {
            property.details = { ...parsedData.details }; // Gelen detayları mevcutla birleştirme, direkt ata
            if (parsedData.property_type === 'Diğer' || !parsedData.property_type) { // Eğer tip "Diğer" veya tanımsızsa
               genericDetailsString.value = JSON.stringify(property.details, null, 2);
            } else {
               genericDetailsString.value = ''; // Diğer tipler için temizle
            }
          } else if (key === 'price' || key === 'latitude' || key === 'longitude' || key === 'area_m2_gross' || key === 'area_m2_net' || key === 'land_area_m2' || key === 'kaks_emsal' || key === 'taks_emsal' || key === 'gabari_max_yukseklik_metre' || key === 'max_kat_adedi') {
            property[key] = parsedData[key] !== null ? parseFloat(parsedData[key]) : null;
          } else {
            property[key] = parsedData[key];
          }
        }
      });
      // property_type değiştiyse detayları ayrıca ele al
       if (parsedData.property_type && property.property_type !== parsedData.property_type) {
          property.property_type = parsedData.property_type;
          // handlePropertyTypeChange(); // Bu, detayları sıfırlayabilir, yukarıda zaten atanıyor.
      }


      v$.value.$reset(); // Validasyonları sıfırla
      alert("Veriler form alanlarına aktarıldı. Lütfen kontrol edin ve eksik/yanlış bilgileri düzeltin.");
    } catch (error) {
      tkgmParseError.value = error.response?.data?.msg || "JSON verisi işlenirken bir hata oluştu. Dosya formatını kontrol edin.";
    } finally {
      tkgmParseLoading.value = false; tkgmJsonFile.value = null;
      const fileInput = document.getElementById('tkgmJsonFile');
      if (fileInput) fileInput.value = '';
    }
  };
  reader.onerror = () => { tkgmParseError.value = "Dosya okunurken bir hata oluştu."; tkgmParseLoading.value = false; };
  reader.readAsText(tkgmJsonFile.value);
};

const handlePhotoFilesChange = (event) => {
  const files = Array.from(event.target.files);
  photoUploadError.value = null;
  const currentTotalPhotos = existingPhotos.value.length + photoPreviews.value.length;
  const maxPhotos = 10; // Örneğin en fazla 10 fotoğraf

  files.forEach(file => {
    if (currentTotalPhotos + photoFilesToUpload.value.length >= maxPhotos) {
        photoUploadError.value = `En fazla ${maxPhotos} fotoğraf yükleyebilirsiniz.`;
        return; // Limiti aşanları ekleme
    }
    if (!file.type.startsWith('image/')) { photoUploadError.value = "Sadece resim dosyaları (.jpg, .png, .gif, .webp)."; return; }
    if (file.size > 5 * 1024 * 1024) { photoUploadError.value = `Max 5MB: ${file.name}.`; return; }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const newIndexInPreview = photoPreviews.value.length;
      photoPreviews.value.push({ url: e.target.result, file, caption: file.name.split('.')[0] }); // Varsayılan caption
      // Eğer hiç ana fotoğraf yoksa (ne mevcut ne de yeni aday) ve bu ilk yeni eklenen ise onu ana aday yap
      if (primaryExistingPhotoId.value === null && primaryPhotoCandidateIndex.value === null && newIndexInPreview === 0) {
          primaryPhotoCandidateIndex.value = newIndexInPreview;
      }
    };
    reader.readAsDataURL(file);
    photoFilesToUpload.value.push(file);
  });
  event.target.value = ''; // Input'u sıfırla
};
const removePhotoPreview = (index) => {
  photoFilesToUpload.value.splice(index, 1);
  photoPreviews.value.splice(index, 1);
  if (primaryPhotoCandidateIndex.value === index) {
    primaryPhotoCandidateIndex.value = photoPreviews.value.length > 0 ? 0 : null;
  } else if (primaryPhotoCandidateIndex.value !== null && primaryPhotoCandidateIndex.value > index) {
    primaryPhotoCandidateIndex.value--;
  }
};
const deleteExistingPhoto = async (photoId) => {
    if (!propertyId.value) return;
    if (confirm("Bu fotoğrafı kalıcı olarak silmek istediğinizden emin misiniz?")) {
        photoDeleteLoading[photoId] = true;
        try {
            await apiClient.delete(`/properties/${propertyId.value}/photos/${photoId}`);
            existingPhotos.value = existingPhotos.value.filter(p => p.id !== photoId);
            if(primaryExistingPhotoId.value === photoId) { // Silinen ana fotoğrafsa
                primaryExistingPhotoId.value = existingPhotos.value.length > 0 ? existingPhotos.value[0].id : null; // Varsa ilkini ana yap
                if (primaryExistingPhotoId.value) await setExistingAsPrimary(primaryExistingPhotoId.value, true); // Backend'i de güncelle
            }
        } catch (error) {
            photoUploadError.value = error.response?.data?.msg || 'Fotoğraf silinemedi.';
        } finally {
            photoDeleteLoading[photoId] = false;
        }
    }
};
const setExistingAsPrimary = async (photoId, skipConfirm = false) => {
    if (!propertyId.value) return;
    if (skipConfirm || confirm("Bu fotoğrafı ana fotoğraf olarak ayarlamak istediğinizden emin misiniz?")) {
        // TODO: Backend'de `/properties/{propId}/photos/{photoId}/set-primary` gibi bir endpoint oluşturulmalı.
        // Bu endpoint seçilen fotoğrafı is_primary=true yapıp diğerlerini false yapmalı.
        console.warn(`setExistingAsPrimary çağrıldı (photoId: ${photoId}), backend endpoint'i gereklidir.`);
        // Şimdilik frontend'de görsel olarak ayarla, backend entegrasyonu sonra.
        primaryExistingPhotoId.value = photoId;
        primaryPhotoCandidateIndex.value = null; // Yeni eklenecekler arasından ana seçimi kaldır
        // existingPhotos.value.forEach(p => p.is_primary = (p.id === photoId)); // Bu satır, backend'den veri tekrar çekildiğinde ezilir.
        // Backend'den sonra listeyi yenilemek daha doğru olur.
        // Örnek API çağrısı:
        try {
            // await apiClient.put(`/properties/${propertyId.value}/photos/${photoId}/set-primary`);
            await fetchExistingMedia(); // Backend güncelledikten sonra listeyi yenile
            propertyStore.status.successMessage = "Ana fotoğraf güncellendi (backend entegrasyonu gerekiyor).";
        } catch (err) {
            console.error("Ana fotoğraf ayarlanamadı (API hatası):", err);
            propertyStore.status.error = "Ana fotoğraf ayarlanamadı.";
        }
    }
};


const handleDocumentFilesChange = (event) => {
  const files = Array.from(event.target.files);
  documentUploadError.value = null;
  const maxDocs = 5; // Örneğin en fazla 5 belge
  if (existingDocuments.value.length + documentPreviews.value.length + files.length > maxDocs) {
      documentUploadError.value = `En fazla ${maxDocs} belge yükleyebilirsiniz.`;
      event.target.value = '';
      return;
  }
  files.forEach(file => {
    if (file.size > 10 * 1024 * 1024) { documentUploadError.value = `Max 10MB: ${file.name}.`; return; }
    documentFilesToUpload.value.push(file);
    documentPreviews.value.push({ file, document_type: '', description: file.name.split('.')[0] });
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
            documentUploadError.value = error.response?.data?.msg || 'Belge silinemedi.';
        } finally {
            docDeleteLoading[docId] = false;
        }
    }
};
const getDocumentIcon = (mimeOrFilename) => { /* ... (önceki gibi) ... */
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

const uploadPhotosInternal = async (targetPropertyId) => {
    if (photoFilesToUpload.value.length === 0) return true;
    photoUploadLoading.value = true; photoUploadError.value = null;
    const uploads = photoFilesToUpload.value.map((file, index) => {
        const formData = new FormData();
        formData.append('photo', file);
        if (photoPreviews.value[index]?.caption) formData.append('caption', photoPreviews.value[index].caption);
        // Ana fotoğraf adayı seçilmişse onu gönder
        if (primaryPhotoCandidateIndex.value !== null && index === primaryPhotoCandidateIndex.value) {
            formData.append('is_primary', 'true');
        } else {
            formData.append('is_primary', 'false');
        }
        return apiClient.post(`/properties/${targetPropertyId}/photos`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }).catch(err => { // Her bir yükleme için hata yakala
            console.error(`Fotoğraf yükleme hatası (${file.name}):`, err);
            throw err; // Promise.all'un yakalaması için hatayı tekrar fırlat
        });
    });
    try {
        await Promise.all(uploads);
        photoFilesToUpload.value = []; photoPreviews.value = []; primaryPhotoCandidateIndex.value = null;
        return true;
    } catch (error) {
        // Promise.all'dan gelen ilk hatayı al
        photoUploadError.value = error.response?.data?.msg || "Bir veya daha fazla fotoğraf yüklenirken hata oluştu.";
        return false;
    } finally { photoUploadLoading.value = false; }
};
const uploadDocumentsInternal = async (targetPropertyId) => {
    if (documentFilesToUpload.value.length === 0) return true;
    documentUploadLoading.value = true; documentUploadError.value = null;
    const uploads = documentFilesToUpload.value.map((previewItem) => { // Artık previewItem üzerinden gidiyoruz
        const formData = new FormData();
        formData.append('document', previewItem.file);
        if(previewItem.document_type) formData.append('document_type', previewItem.document_type);
        if(previewItem.description) formData.append('description', previewItem.description);
        return apiClient.post(`/properties/${targetPropertyId}/documents`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }).catch(err => {
            console.error(`Belge yükleme hatası (${previewItem.file.name}):`, err);
            throw err;
        });
    });
    try {
        await Promise.all(uploads);
        documentFilesToUpload.value = []; documentPreviews.value = [];
        return true;
    } catch (error) {
        documentUploadError.value = error.response?.data?.msg || "Bir veya daha fazla belge yüklenirken hata oluştu.";
        return false;
    } finally { documentUploadLoading.value = false; }
};

const handleSubmit = async () => {
  formSubmitError.value = null; propertyStore.resetStatus();
  v$.value.$validate();
  if (v$.value.$invalid) {
    formSubmitError.value = "Lütfen formdaki tüm zorunlu alanları doğru bir şekilde doldurun.";
    const firstErrorElement = document.querySelector('.form-group.error input, .form-group.error select, .form-group.error textarea');
    if (firstErrorElement) { firstErrorElement.focus({ preventScroll: true }); firstErrorElement.scrollIntoView({behavior: 'smooth', block: 'center'}); }
    return;
  }

  let finalDetails = { ...property.details };
  if ((property.property_type === 'Diğer' || !property.property_type) && genericDetailsString.value) {
      try { finalDetails = JSON.parse(genericDetailsString.value); }
      catch (e) { finalDetails = genericDetailsString.value; }
  }

  const payload = { ...property, details: finalDetails, expiry_date: property.expiry_date };
  const numericFields = ['price', 'latitude', 'longitude', 'area_m2_gross', 'area_m2_net', 'land_area_m2', 'kaks_emsal', 'taks_emsal', 'gabari_max_yukseklik_metre', 'max_kat_adedi'];
  numericFields.forEach(field => {
      if (payload[field] === '' || payload[field] === undefined || payload[field] === null || isNaN(parseFloat(payload[field]))) {
           payload[field] = null;
      } else { payload[field] = parseFloat(payload[field]); }
  });
  if (payload.assigned_consultant_id === '') payload.assigned_consultant_id = null;
  if (payload.office_id === '') payload.office_id = null;

  propertyStore.status.isSubmitting = true;
  let targetPropertyId = propertyId.value;

  try {
    if (isEditMode.value) {
      await propertyStore.updateProperty(propertyId.value, payload);
    } else {
      const createdProp = await propertyStore.createProperty(payload);
      if (createdProp && createdProp.id) {
        targetPropertyId = createdProp.id;
      } else {
        throw new Error("Yeni portföy ID'si alınamadı, medya yüklenemiyor.");
      }
    }

    if (targetPropertyId) {
      const photosUploaded = await uploadPhotosInternal(targetPropertyId);
      const documentsUploaded = await uploadDocumentsInternal(targetPropertyId);

      if (photosUploaded && documentsUploaded) {
        propertyStore._setSuccess(isEditMode.value ? 'Portföy ve medyalar başarıyla güncellendi.' : 'Portföy ve medyalar başarıyla eklendi.');
        if (!isEditMode.value) {
            router.push({ name: 'property-detail', params: { id: targetPropertyId } });
        } else {
            await loadInitialFormState(); // Formu ve medyaları yeniden yükle
            // Başarı mesajı zaten store'da set edildi, template'te gösterilecek.
        }
      } else {
        // Medya yüklemede hata olduysa, ana portföy işlemi başarılı olsa bile hata mesajı göster
        const mediaError = photoUploadError.value || documentUploadError.value || "Medyalar yüklenirken bir sorun oluştu.";
        formSubmitError.value = (isEditMode.value ? "Portföy güncellendi ancak " : "Portföy eklendi ancak ") + mediaError;
        propertyStore.status.error = formSubmitError.value; // Store'a da hata bilgisini yansıt
         if (isEditMode.value) await fetchExistingMedia(); // Başarısız medya yüklemesinden sonra bile mevcutları yenile
      }
    }
  } catch (error) { // createProperty veya updateProperty'den gelen hata
    formSubmitError.value = propertyStore.status.error || "Bir hata oluştu, lütfen tekrar deneyin.";
  } finally {
      propertyStore.status.isSubmitting = false;
  }
};
</script>

<style scoped>
/* Bir önceki mesajdaki tüm PropertyFormView stilleri buraya gelecek.
   Özellikle .card, .form-section h3 i, .photo-previews-grid, .document-previews-list,
   .existing-files-grid, .action-button.delete.small, .info-text, .form-control-file
   gibi yeni eklenen veya güncellenen stiller önemli.
*/
@import '@fortawesome/fontawesome-free/css/all.min.css';

.property-form-view { max-width: 1000px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.page-header h2 { margin: 0; font-size: 1.6rem; }
.action-button i { margin-right: 0.4em; }
.cancel-button { background-color: #6c757d; border-color: #6c757d; }
.cancel-button:hover { background-color: #5a6268; border-color: #545b62;}

.property-form { background-color: #fff; padding: 0; border-radius: 8px; box-shadow: none; }
.form-section.card {
  background-color: #fff;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.07);
  margin-bottom: 1.5rem;
}
.form-section:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0;}
.form-section h3 { margin-top: 0; margin-bottom: 1.5rem; color: #343a40; font-size: 1.1rem; border-bottom: 1px solid #e9ecef; padding-bottom: 0.75rem;}
.form-section h3 i { margin-right: 0.6em; color: #007bff; font-size: 0.9em; }

.form-grid { display: grid; gap: 1rem 1.5rem; }
.form-grid.two-columns { grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }
.form-grid.three-columns { grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); }

.form-group-full { grid-column: 1 / -1; }
.form-actions { margin-top: 2rem; text-align: right; padding: 1.5rem; background-color: #f8f9fa; border-top: 1px solid #e0e0e0; margin-left: -2rem; margin-right: -2rem; margin-bottom:-2rem; border-radius: 0 0 8px 8px;}
.form-check { display: flex; align-items: center; margin-top: 0.5rem;}
.form-check input[type="checkbox"] { margin-right: 0.5rem; width: auto; height: auto; }
.form-check-label { font-weight: normal !important; margin-bottom: 0 !important;}

.form-error-message { margin-bottom: 1.5rem; }
.form-error-message ul { list-style-type: none; padding-left: 0; margin-top: 0.5rem; }
.form-error-message ul li { margin-bottom: 0.25rem; }

.form-group.error input,
.form-group.error select,
.form-group.error textarea {
  border-color: #dc3545;
  background-color: #fbeeed;
}
.input-errors { margin-top: 0.25rem; }
.error-msg { color: #dc3545; font-size: 0.8em; }
small { display: block; margin-top: 0.25rem; font-size: 0.8em; color: #6c757d; }

.info-text {
    font-size: 0.9em; color: #6c757d; margin-top: 0.5rem;
    padding: 0.75rem; background-color: #f8f9fa;
    border-left: 3px solid #17a2b8; border-radius: 0 4px 4px 0;
}

.form-control-file {
    display: block; width: 100%; padding: .375rem .75rem;
    font-size: 1rem; font-weight: 400; line-height: 1.5; color: #495057;
    background-color: #fff; background-clip: padding-box;
    border: 1px solid #ced4da; border-radius: .25rem;
    transition: border-color .15s ease-in-out,box-shadow .15s ease-in-out;
}
.form-control-file:focus {
    border-color: #80bdff; outline: 0;
    box-shadow: 0 0 0 .2rem rgba(0,123,255,.25);
}
.form-control-file::file-selector-button {
    padding: .375rem .75rem; margin: -.375rem -.75rem;
    margin-inline-end: .75rem; color: #495057; background-color: #e9ecef;
    pointer-events: none; border-color: inherit; border-style: solid;
    border-width: 0; border-inline-end-width: 1px; border-radius: 0;
    transition: color .15s ease-in-out,background-color .15s ease-in-out,border-color .15s ease-in-out,box-shadow .15s ease-in-out;
}
.form-control-file:hover:not(:disabled):not([readonly])::file-selector-button { background-color: #dde0e3; }

.mt-1 { margin-top: 0.5rem !important; }
.action-button.outlined {
    background-color: transparent; color: #007bff; border: 1px solid #007bff;
}
.action-button.outlined:hover { background-color: #007bff; color: white; }
.action-button.outlined i { margin-right: 0.3em; }

.small-error { font-size: 0.85em; margin-top: 0.5rem; color: #dc3545; }

.photo-previews-grid, .existing-files-grid.photos {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 1rem; margin-top: 1rem;
}
.photo-preview-item, .existing-file-item.photo {
    border: 1px solid #e0e0e0; padding: 0.75rem; border-radius: 6px;
    text-align: center; position: relative; background-color: #fdfdfd;
    display: flex; flex-direction: column; align-items: center;
}
.photo-preview-item img, .existing-file-item.photo img {
    width: 100%; height: 100px; object-fit: cover;
    margin-bottom: 0.75rem; border-radius: 4px; border: 1px solid #eee;
}
.photo-preview-item .filename, .existing-file-item.photo .filename {
    font-size: 0.8em; color: #555; margin-bottom: 0.3rem;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%;
}
.photo-preview-item .caption-text, .existing-file-item.photo .caption-text {
    font-size: 0.75em; color: #777; font-style: italic; margin-bottom: 0.5rem;
}
.caption-input {
    width: calc(100% - 1rem); margin-top: 0.5rem; padding: 0.4rem;
    font-size: 0.85em; border: 1px solid #ccc; border-radius: 3px; box-sizing: border-box;
}
.photo-preview-item .form-check { margin-top: 0.5rem; }

.document-previews-list, .existing-files-grid.documents {
    margin-top: 1rem; display: flex; flex-direction: column; gap: 0.75rem;
}
.document-preview-item, .existing-file-item.document {
    display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem;
    border: 1px solid #e0e0e0; border-radius: 6px; background-color: #f9f9f9;
}
.document-preview-item span:first-child, .existing-file-item.document .document-link {
    flex-grow: 1; font-size: 0.9em; word-break: break-all; color: #333;
}
.existing-file-item.document .doc-type { font-size: 0.8em; color: #6c757d; margin-left: 0.5rem;}
.document-preview-item .caption-input { flex-basis: 180px; flex-grow: 0; margin-left: 0.5rem; }

.action-button.delete.small {
    padding: 0.2rem 0.4rem !important; line-height: 1 !important; font-size: 0.75rem !important;
}
.photo-preview-item .action-button.delete.small,
.existing-file-item.photo .action-button.delete.small {
    position: absolute; top: 8px; right: 8px;
}
.document-preview-item .action-button.delete.small,
.existing-file-item.document .action-button.delete.small {
    position: static; margin-left: auto;
}
.small-spinner { font-size: 0.9em; padding: 0.5rem; text-align: left;}
</style>