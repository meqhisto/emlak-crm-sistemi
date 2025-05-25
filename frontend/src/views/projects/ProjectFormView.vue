<template>
  <div class="project-form-view admin-page-container">
    <div class="page-header">
      <h2>{{ isEditMode ? 'Projeyi Düzenle' : 'Yeni Proje Ekle' }}</h2>
      <router-link :to="{ name: 'project-list' }" class="action-button cancel-button">
        <i class="fas fa-arrow-left"></i> Proje Listesine Dön
      </router-link>
    </div>

    <form @submit.prevent="handleSubmit" class="project-form card" novalidate>
      <div v-if="formSubmitError || (v$.$dirty && v$.$invalid)" class="error-message form-error-message">
        <p v-if="formSubmitError" v-html="formSubmitError.replace(/\n/g, '<br>')"></p>
        <p v-if="v$.$dirty && v$.$invalid && !formSubmitError">Lütfen formdaki işaretli hataları düzeltin.</p>
      </div>
      <p v-if="projectStore.status.successMessage && !formSubmitError && !projectStore.status.isSubmitting" class="success-message">
        {{ projectStore.status.successMessage }}
      </p>

      <!-- Proje Bilgileri -->
      <div class="form-section">
        <h3><i class="fas fa-clipboard-list"></i> Proje Temel Bilgileri</h3>
        <div class="form-grid two-columns">
          <div class="form-group" :class="{ error: v$.project.name.$errors.length }">
            <label for="projectName">Proje Adı (*):</label>
            <input type="text" id="projectName" v-model="v$.project.name.$model" @blur="v$.project.name.$touch()" />
            <div class="input-errors" v-for="error of v$.project.name.$errors" :key="error.$uid"><div class="error-msg">{{ error.$message }}</div></div>
          </div>

          <div class="form-group" :class="{ error: v$.project.status.$errors.length }">
            <label for="projectStatus">Proje Durumu (*):</label>
            <select id="projectStatus" v-model="v$.project.status.$model" @blur="v$.project.status.$touch()">
              <option :value="null" disabled>Seçiniz...</option>
              <option v-for="pstatus in projectStore.projectStatuses" :key="pstatus" :value="pstatus">{{ pstatus }}</option>
            </select>
            <div class="input-errors" v-for="error of v$.project.status.$errors" :key="error.$uid"><div class="error-msg">{{ error.$message }}</div></div>
          </div>

          <div class="form-group" :class="{ error: v$.project.project_genel_tipi.$errors.length }">
            <label for="projectGenelTipi">Proje Genel Tipi (*):</label>
<select id="projectGenelTipi" v-model="v$.project.project_genel_tipi.$model" >
  <option :value="null" disabled>Seçiniz...</option>
  <option v-for="pgtype in projectGenelTipList" :key="pgtype" :value="pgtype">{{ pgtype }}</option>
</select>
            <div class="input-errors" v-for="error of v$.project.project_genel_tipi.$errors" :key="error.$uid"><div class="error-msg">{{ error.$message }}</div></div>
          </div>

          <div class="form-group" :class="{ error: v$.project.developer_company.$errors.length }">
            <label for="developerCompany">Geliştirici Firma:</label>
            <input type="text" id="developerCompany" v-model="v$.project.developer_company.$model" @blur="v$.project.developer_company.$touch()" />
            <div class="input-errors" v-for="error of v$.project.developer_company.$errors" :key="error.$uid"><div class="error-msg">{{ error.$message }}</div></div>
          </div>
        </div>
        <div class="form-group" :class="{ error: v$.project.description.$errors.length }">
          <label for="projectDescription">Proje Açıklaması (Max 2000 karakter):</label>
          <textarea id="projectDescription" v-model="v$.project.description.$model" @blur="v$.project.description.$touch()" rows="4"></textarea>
          <div class="input-errors" v-for="error of v$.project.description.$errors" :key="error.$uid"><div class="error-msg">{{ error.$message }}</div></div>
        </div>
      </div>
<!-- Proje Bilgileri Bölümüne Eklenecekler -->
<div class="form-group" :class="{ error: v$.project.project_code.$errors.length }">
  <label for="projectCode">Proje Kodu / Referans No:</label>
  <input type="text" id="projectCode" v-model="v$.project.project_code.$model" @blur="v$.project.project_code.$touch()" />
  <div class="input-errors" v-for="error of v$.project.project_code.$errors" :key="error.$uid">
    <div class="error-msg">{{ error.$message }}</div>
  </div>
</div>

<div class="form-group" :class="{ error: v$.project.project_genel_tipi.$errors.length }">
  <label for="projectGenelTipi">Proje Kategorisi (Türü) (*):</label>
<select id="projectGenelTipi" v-model="v$.project.project_genel_tipi.$model" @blur="v$.project.project_genel_tipi.$touch()">
  <option :value="null" disabled>Seçiniz...</option>
  <option v-for="pgtype in projectStore.projectGenelTipList" :key="pgtype" :value="pgtype">
    {{ pgtype }}
  </option>
</select>
  <div class="input-errors" v-for="error of v$.project.project_genel_tipi.$errors" :key="error.$uid">
    <div class="error-msg">{{ error.$message }}</div>
  </div>
</div>

<!-- Proje Alt Kategorisi (details içinde saklanacak, dinamik) -->
<div class="form-group" v-if="showAltKategori">
    <label for="projectAltKategori">Proje Alt Kategorisi:</label>
    <select id="projectAltKategori" v-model="project.details.alt_kategori">
        <option :value="null">Seçiniz...</option>
        <option v-for="subCat in currentSubCategories" :key="subCat" :value="subCat">{{ subCat }}</option>
    </select>
</div>


<div class="form-group" :class="{ error: v$.project.short_description.$errors.length }">
  <label for="projectShortDescription">Kısa Açıklama (Max 300 karakter):</label>
  <textarea id="projectShortDescription" v-model="v$.project.short_description.$model" @blur="v$.project.short_description.$touch()" rows="2"></textarea>
  <div class="input-errors" v-for="error of v$.project.short_description.$errors" :key="error.$uid">
    <div class="error-msg">{{ error.$message }}</div>
  </div>
</div>

<!-- Ayrıntılı Açıklama (description) zaten vardı -->

<div class="form-group" :class="{ error: v$.project.tags.$errors.length }">
  <label for="projectTags">Etiketler (virgülle ayırarak girin):</label>
  <input type="text" id="projectTags" v-model="tagsInput" @blur="v$.project.tags.$touch()" placeholder="örn: Yatırıma Uygun, Aile Projesi"/>
   <!-- Veya bir tag input bileşeni kullanılabilir -->
  <div class="input-errors" v-for="error of v$.project.tags.$errors" :key="error.$uid">
    <div class="error-msg">{{ error.$message }}</div>
  </div>
  <div class="tags-preview mt-1" v-if="project.tags && project.tags.length > 0">
      <span v-for="tag in project.tags" :key="tag" class="tag-badge">{{ tag }}</span>
  </div>
</div>
      <!-- Konum Bilgileri -->
      <div class="form-section">
        <h3><i class="fas fa-map-marked-alt"></i> Konum Bilgileri</h3>
        <div class="form-grid two-columns">
          <div class="form-group"><label for="projectLocationAddress">Proje Adresi:</label><input type="text" id="projectLocationAddress" v-model="project.location_address"/></div>
          <div class="form-group" :class="{ error: v$.project.city.$errors.length }"><label for="projectCity">Şehir:</label><input type="text" id="projectCity" v-model="v$.project.city.$model" @blur="v$.project.city.$touch()"/><div class="input-errors" v-for="error of v$.project.city.$errors" :key="error.$uid"><div class="error-msg">{{ error.$message }}</div></div></div>
          <div class="form-group"><label for="projectDistrict">İlçe:</label><input type="text" id="projectDistrict" v-model="project.district"/></div>
        </div>
      </div>
<div v-if="project.project_genel_tipi === 'Kooperatif Projesi'" class="form-grid two-columns">
    <div class="form-group" :class="{ error: v$.project.details.kooperatif_uye_sayisi?.$errors.length }">
        <label for="detailKoopUye">Kooperatif Üye Sayısı:</label>
        <input type="number" id="detailKoopUye" v-model.number="v$.project.details.kooperatif_uye_sayisi.$model" @blur="v$.project.details.kooperatif_uye_sayisi?.$touch()"/>
        <div class="input-errors" v-for="error of v$.project.details.kooperatif_uye_sayisi.$errors" :key="error.$uid"><div class="error-msg">{{ error.$message }}</div></div>
    </div>
    <div class="form-group">
        <label for="detailKoopAidat">Tahmini Aidat:</label>
        <input type="text" id="detailKoopAidat" v-model="project.details.tahmini_aidat_bilgisi"/>
    </div>
</div>

      <!-- Yapı ve Birim Bilgileri -->
      <div class="form-section">
        <h3><i class="fas fa-building"></i> Yapı ve Birim Bilgileri</h3>
        <div class="form-grid three-columns">
          <div class="form-group" :class="{ error: v$.project.toplam_blok_sayisi.$errors.length }"><label for="toplamBlokSayisi">Toplam Blok Sayısı:</label><input type="number" id="toplamBlokSayisi" v-model.number="v$.project.toplam_blok_sayisi.$model" @blur="v$.project.toplam_blok_sayisi.$touch()"/><div class="input-errors" v-for="error of v$.project.toplam_blok_sayisi.$errors" :key="error.$uid"><div class="error-msg">{{ error.$message }}</div></div></div>
          <div class="form-group" :class="{ error: v$.project.ortalama_kat_sayisi.$errors.length }"><label for="ortalamaKatSayisi">Ort. Kat Sayısı (Blok Başına):</label><input type="number" id="ortalamaKatSayisi" v-model.number="v$.project.ortalama_kat_sayisi.$model" @blur="v$.project.ortalama_kat_sayisi.$touch()"/><div class="input-errors" v-for="error of v$.project.ortalama_kat_sayisi.$errors" :key="error.$uid"><div class="error-msg">{{ error.$message }}</div></div></div>
          <div class="form-group" :class="{ error: v$.project.total_units.$errors.length }"><label for="totalUnits">Toplam Birim Sayısı (Tahmini):</label><input type="number" id="totalUnits" v-model.number="v$.project.total_units.$model" @blur="v$.project.total_units.$touch()"/><div class="input-errors" v-for="error of v$.project.total_units.$errors" :key="error.$uid"><div class="error-msg">{{ error.$message }}</div></div></div>
          <div class="form-group" :class="{ error: v$.project.toplam_insaat_alani_m2.$errors.length }"><label for="toplamInsaatAlani">Toplam İnşaat Alanı (m²):</label><input type="number" id="toplamInsaatAlani" v-model.number="v$.project.toplam_insaat_alani_m2.$model" @blur="v$.project.toplam_insaat_alani_m2.$touch()" step="any"/><div class="input-errors" v-for="error of v$.project.toplam_insaat_alani_m2.$errors" :key="error.$uid"><div class="error-msg">{{ error.$message }}</div></div></div>
        </div>
      </div>

      <!-- Proje Tipine Özel Detaylar -->
      <div class="form-section">
        <h3><i class="fas fa-cogs"></i> Proje Özel Detayları ({{ project.project_genel_tipi || 'Tip Seçilmedi' }})</h3>
        <div v-if="project.project_genel_tipi === 'Kooperatif Projesi'" class="form-grid two-columns">
          <div class="form-group"><label for="detailUyeSayisi">Toplam Üye Sayısı:</label><input type="number" id="detailUyeSayisi" v-model.number="project.details.uye_sayisi"/></div>
          <div class="form-group"><label for="detailAidat">Aylık Aidat (TRY):</label><input type="number" id="detailAidat" v-model.number="project.details.aylik_aidat" step="any"/></div>
        </div>
        <div v-else-if="project.project_genel_tipi === 'Villa Projesi'" class="form-grid two-columns">
          <div class="form-group"><label for="detailVillaTipi">Villa Tipleri:</label><input type="text" id="detailVillaTipi" v-model="project.details.villa_tipleri" placeholder="Örn: 4+1, 5+2 Müstakil"/></div>
          <div class="form-group form-check"><input type="checkbox" id="detailOzelHavuz" v-model="project.details.ozel_havuz_var_mi"/><label for="detailOzelHavuz" class="form-check-label">Her Villada Özel Havuz Var mı?</label></div>
        </div>
        <div v-else-if="project.project_genel_tipi === 'Karma Proje (Konut + Ticari)'" class="form-grid two-columns">
          <div class="form-group"><label for="detailKonutSayisi">Toplam Konut Sayısı:</label><input type="number" id="detailKonutSayisi" v-model.number="project.details.konut_sayisi"/></div>
          <div class="form-group"><label for="detailTicariAlanSayisi">Toplam Ticari Alan Sayısı:</label><input type="number" id="detailTicariAlanSayisi" v-model.number="project.details.ticari_alan_sayisi"/></div>
        </div>
        <p v-else-if="project.project_genel_tipi && project.project_genel_tipi !== 'Diğer' && project.project_genel_tipi !== null" class="info-text">
          Bu proje tipi için özel detay alanları henüz tanımlanmamış. Aşağıdaki "Diğer Detaylar" alanını kullanabilirsiniz.
        </p>
        <div class="form-group form-group-full">
          <label for="detailGenericProject">Diğer Detaylar (JSON formatında veya serbest metin):</label>
          <textarea id="detailGenericProject" v-model="genericProjectDetailsString" rows="4" placeholder='Örn: {"sosyal_alanlar": ["Çocuk Parkı", "Yürüyüş Yolu"], "otopark_kapasitesi": 150}'></textarea>
          <small>Geçerli JSON formatı girerseniz, yapılandırılmış olarak saklanır.</small>
        </div>
      </div>

      <!-- Proje Dosyaları Yükleme -->
      <div class="form-section card">
  <h3><i class="fas fa-folder-open"></i> Proje Dosyaları (Ruhsat, Vaziyet Planı, Katalog vb.)</h3>
        <div class="form-group">
          <label for="projectDocuments">Yeni Dosya Yükle (Max 10MB):</label>
          <input type="file" id="projectDocuments" @change="handleProjectDocumentFilesChange" multiple class="form-control-file"/>
        </div>
         <div v-if="projectDocumentPreviews.length > 0" class="document-previews-list">
          <h4>Yüklenecek Dosyalar:</h4>
          <div v-for="(preview, index) in projectDocumentPreviews" :key="`proj-doc-preview-${index}`" class="document-preview-item">
            <span><i :class="getDocumentIcon(preview.file.name)"></i> {{ preview.file.name }} ({{ (preview.file.size / 1024).toFixed(1) }} KB)</span>
            <input type="text" v-model="preview.document_type" placeholder="Dosya Tipi (örn: Ruhsat)" class="caption-input small-input"/>
            <input type="text" v-model="preview.description" placeholder="Açıklama" class="caption-input"/>
            <button type="button" @click="removeProjectDocumentPreview(index)" class="action-button delete small" title="Bu önizlemeyi kaldır"><i class="fas fa-times"></i></button>
          </div>
        </div>
        <div v-if="isEditMode && existingProjectDocuments.length > 0" class="existing-files-grid documents">
          <h4>Mevcut Proje Dosyaları:</h4>
          <div v-for="doc in existingProjectDocuments" :key="doc.id" class="existing-file-item document">
            <a :href="getMediaUrl(doc.url)" target="_blank" class="document-link" :title="doc.description || doc.original_file_name">
                <i :class="getDocumentIcon(doc.mime_type || doc.original_file_name)"></i> {{ doc.original_file_name }}
            </a>
            <span class="doc-type">({{ doc.document_type || 'Belirsiz' }})</span>
            <button type="button" @click="deleteExistingProjectDocument(doc.id)" class="action-button delete small" :disabled="projectDocDeleteLoading[doc.id]" title="Bu dosyayı sil">
              <i class="fas fa-trash-alt"></i> {{ projectDocDeleteLoading[doc.id] ? 'Siliniyor...' : ''}}
            </button>
          </div>
        </div>
        <div v-if="projectDocumentUploadLoading" class="loading-spinner small-spinner"><i class="fas fa-spinner fa-spin"></i> Dosyalar yükleniyor...</div>
        <p v-if="projectDocumentUploadError" class="error-message small-error">{{ projectDocumentUploadError }}</p>
      </div>


      <!-- Tarih ve Diğer Bilgiler -->
      <div class="form-section card">
        <h3><i class="fas fa-calendar-check"></i> Tarihler ve Ek Bilgiler</h3>
        <div class="form-grid two-columns">
            <div class="form-group">
                <label for="startDate">Başlangıç Tarihi:</label>
                <input type="date" id="startDate" v-model="startDateInput" />
            </div>
            <div class="form-group">
                <label for="estimatedCompletionDate">Tahmini Bitiş Tarihi:</label>
                <input type="date" id="estimatedCompletionDate" v-model="estimatedCompletionDateInput" />
            </div>
            <div class="form-group" v-if="isEditMode">
                <label for="actualCompletionDate">Gerçekleşen Bitiş Tarihi:</label>
                <input type="date" id="actualCompletionDate" v-model="actualCompletionDateInput" />
            </div>
            <div class="form-group" :class="{ error: v$.project.project_brochure_url.$errors.length }">
                <label for="projectBrochure">Proje Broşür URL:</label>
                <input type="url" id="projectBrochure" v-model="v$.project.project_brochure_url.$model" @blur="v$.project.project_brochure_url.$touch()" placeholder="https://..."/>
                <div class="input-errors" v-for="error of v$.project.project_brochure_url.$errors" :key="error.$uid"><div class="error-msg">{{ error.$message }}</div></div>
            </div>
        </div>
      </div>


      <div class="form-actions">
        <!-- YENİ -->
        <button type="submit" :disabled="isSubmittingOverallProject || v$.$invalid" class="action-button submit-button">
          <i :class="isSubmittingOverallProject ? 'fas fa-spinner fa-spin' : 'fas fa-save'"></i>
          {{ isSubmittingOverallProject ? 'Kaydediliyor...' : (isEditMode ? 'Projeyi Güncelle' : 'Proje Ekle') }}
        </button>
      </div>
    </form>
  </div>
</template>


<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useProjectStore } from '../../store/modules/projectStore';
import { useAuthStore } from '../../store/modules/authStore';
import apiClient from '../../services/apiClient';

import { useVuelidate } from '@vuelidate/core';
import { required, maxLength, numeric, minValue, maxValue, url, helpers } from '@vuelidate/validators'; // <<< maxValue EKLENDİconst props = defineProps({ id: { type: String, required: false } });
const route = useRoute();
const router = useRouter();
const projectStore = useProjectStore();
const authStore = useAuthStore();
const props = defineProps({
  id: {
    type: String,
    required: false,
  },
});
const projectId = ref(props.id || null);
const isEditMode = computed(() => !!projectId.value);
const formSubmitError = ref(null);
const projectGenelTipList = computed(() => projectStore.projectGenelTipList); // Store'dan al
const initialProjectData = {
  project_code: '', name: '', project_genel_tipi: null, short_description: '',
  description: '', tags: [], status: null, developer_company: '',
  location_address: '', city: '', district: '', start_date: null,
  estimated_completion_date: null, actual_completion_date: null,
  total_units: null, toplam_blok_sayisi: null, ortalama_kat_sayisi: null,
  toplam_insaat_alani_m2: null, project_brochure_url: '', details: {},
};
const project = reactive({ ...initialProjectData });

const startDateInput = ref('');
const estimatedCompletionDateInput = ref('');
const actualCompletionDateInput = ref('');
const tagsInput = ref('');
const genericProjectDetailsString = ref('');

const projectDocumentFilesToUpload = ref([]);
const projectDocumentPreviews = ref([]);
const existingProjectDocuments = ref([]);
const projectDocumentUploadLoading = ref(false);
const projectDocumentUploadError = ref(null);
const projectDocDeleteLoading = reactive({});
// ProjectFormView.vue -> <script setup>
const isOverallSubmitting = computed(() => // isSubmittingOverallProject'in içeriğini buraya taşıyın
    projectStore.status.isSubmitting ||
    projectDocumentUploadLoading.value ||
    Object.values(projectDocDeleteLoading).some(loading => loading)
);
const isSubmittingOverallProject = computed(() =>
    projectStore.status.isSubmitting || projectDocumentUploadLoading.value ||
    Object.values(projectDocDeleteLoading).some(loading => loading)
);

const subCategories = {
    "Konut Projesi": ["Lüks Konut", "Orta Segment Konut", "Sosyal Konut", "Rezidans Daireleri"],
    "Ticari Proje": ["Cadde Mağazaları", "AVM İçi Dükkanlar", "Ofis Blokları", "Plaza Katları"],
    "Karma Proje (Konut + Ticari)": ["Karma Yaşam Alanı", "Rezidans + Ofis Katları"],
    "Villa Projesi": ["Müstakil Villalar", "Site İçi Villalar", "İkiz Villalar", "Denize Sıfır Villalar"],
    "Kooperatif Projesi": ["Yapı Kooperatifi", "Arsa Kooperatifi"],
};
const currentSubCategories = computed(() => project.project_genel_tipi ? (subCategories[project.project_genel_tipi] || []) : []);
const showAltKategori = computed(() => project.project_genel_tipi && currentSubCategories.value.length > 0);

const rules = computed(() => {
  const R_project_details = {};
  if (project.project_genel_tipi === 'Kooperatif Projesi') {
    R_project_details.kooperatif_uye_sayisi = { numeric: helpers.withMessage('Sayısal değer girin.', numeric), minValue: helpers.withMessage('En az 1 üye olmalı.',minValue(1)) };
  }
  return {
    project: {
      name: { required: helpers.withMessage('Proje adı zorunludur.', required), maxLength: maxLength(255) },
      project_code: { maxLength: maxLength(50) },
      project_genel_tipi: { required: helpers.withMessage('Proje kategorisi zorunludur.', required) },
      short_description: { maxLength: maxLength(300) },
      description: { maxLength: maxLength(5000) },
      tags: {},
      status: { required: helpers.withMessage('Proje durumu seçimi zorunludur.', required) },
      developer_company: { maxLength: maxLength(255) },
      city: { maxLength: maxLength(100) },
      total_units: { numeric, maxValue: maxValue(10000), minValue: minValue(0) },
      toplam_blok_sayisi: { numeric, maxValue: maxValue(100), minValue: minValue(0) },
      ortalama_kat_sayisi: { numeric, maxValue: maxValue(100), minValue: minValue(0) },
      toplam_insaat_alani_m2: { numeric, maxValue: maxValue(1000000), minValue: minValue(0) },
      project_brochure_url: { url: helpers.withMessage('Geçerli bir URL girin.', url), maxLength: maxLength(512) },
      details: R_project_details,
    }
  };
});
const v$ = useVuelidate(rules, { project }, { $autoDirty: true });

const setupDateWatcher = (inputRef, projectFieldKey) => {
    watch(inputRef, (newVal) => { project[projectFieldKey] = newVal ? new Date(newVal).toISOString() : null; });
    watch(() => project[projectFieldKey], (newVal) => {
        if (newVal) { try { inputRef.value = new Date(newVal).toISOString().split('T')[0]; } catch (e) { inputRef.value = ''; } }
        else { inputRef.value = ''; }
    }, { immediate: true });
};
setupDateWatcher(startDateInput, 'start_date');
setupDateWatcher(estimatedCompletionDateInput, 'estimated_completion_date');
setupDateWatcher(actualCompletionDateInput, 'actual_completion_date');

watch(() => props.id, (newId) => { projectId.value = newId || null; loadInitialProjectFormState(); });
watch(() => project.project_genel_tipi, (newType, oldType) => { if (newType !== oldType) handleProjectGenelTipiChange(); });

const fetchFormDropdowns = async () => {
  console.log("Fetching dropdown options...");
  if (projectStore.projectGenelTipList.length === 0) {
    await projectStore.fetchProjectGenelTipleri();
    console.log("Project Genel Tipleri (Store):", JSON.parse(JSON.stringify(projectStore.projectGenelTipList)));
  }
  if (projectStore.projectStatuses.length === 0) {
    await projectStore.fetchProjectStatuses();
    console.log("Project Statuses (Store):", JSON.parse(JSON.stringify(projectStore.projectStatuses)));
  }
  console.log("Dropdown options fetched.");
  // ... (danışman ve ofisler)
};

const resetFormAndState = () => {
    Object.assign(project, JSON.parse(JSON.stringify(initialProjectData)));
    project.details = {}; tagsInput.value = ''; genericProjectDetailsString.value = '';
    startDateInput.value = ''; estimatedCompletionDateInput.value = ''; actualCompletionDateInput.value = '';
    v$.value.$reset(); formSubmitError.value = null; projectStore.resetStatus();
    projectDocumentFilesToUpload.value = []; projectDocumentPreviews.value = [];
    existingProjectDocuments.value = []; projectDocumentUploadError.value = null;
    Object.keys(projectDocDeleteLoading).forEach(k => delete projectDocDeleteLoading[k]);
};

const loadInitialProjectFormState = async () => {
  resetFormAndState();
  if (isEditMode.value) {
    const fetchedProject = await projectStore.fetchProjectById(projectId.value); // Bu belgeleri de çeker
    if (fetchedProject) {
      Object.keys(initialProjectData).forEach(key => {
        if (key === 'tags' && fetchedProject.tags && Array.isArray(fetchedProject.tags)) {
          project.tags = [...fetchedProject.tags]; tagsInput.value = fetchedProject.tags.join(', ');
        } else if (key.endsWith('_date')) { project[key] = fetchedProject[key]; }
        else if (key === 'details') {
          project.details = typeof fetchedProject.details === 'object' && fetchedProject.details !== null ? { ...fetchedProject.details } : {};
          if (fetchedProject.project_genel_tipi === 'Diğer' || !fetchedProject.project_genel_tipi) {
            genericProjectDetailsString.value = (typeof fetchedProject.details === 'object') ? JSON.stringify(fetchedProject.details, null, 2) : (fetchedProject.details || '');
          }
        } else if (fetchedProject[key] !== undefined) { project[key] = fetchedProject[key]; }
      });
      existingProjectDocuments.value = [...projectStore.currentProjectDocuments]; // Store'dan al
      if (!project.project_genel_tipi && projectStore.projectGenelTipList.length > 0) project.project_genel_tipi = projectStore.projectGenelTipList[0];
      if (!project.status && projectStore.projectStatuses.length > 0) project.status = projectStore.projectStatuses[0];
    } else { formSubmitError.value = "Proje bulunamadı."; }
  } else {
    if (projectStore.projectGenelTipList.length > 0) project.project_genel_tipi = projectStore.projectGenelTipList[0];
    if (projectStore.projectStatuses.length > 0) project.status = projectStore.projectStatuses[0];
  }
  v$.value.$reset();
};

const handleProjectGenelTipiChange = () => {
    project.details = {}; genericProjectDetailsString.value = '';
    if (v$.value.project.details) v$.value.project.details.$reset();
};

onMounted(async () => { await fetchFormDropdowns(); await loadInitialProjectFormState(); });

const getDocumentIcon = (mimeOrFilename) => { /* ... (önceki gibi) ... */
    if (!mimeOrFilename) return 'fas fa-file';
    const name = typeof mimeOrFilename === 'string' ? mimeOrFilename.toLowerCase() : '';
    if (name.includes('pdf')) return 'fas fa-file-pdf text-danger';
    if (name.includes('doc')) return 'fas fa-file-word text-primary';
    if (name.includes('xls')) return 'fas fa-file-excel text-success';
    if (name.includes('ppt')) return 'fas fa-file-powerpoint text-warning';
    if (name.includes('zip') || name.includes('rar')) return 'fas fa-file-archive text-secondary';
    if (name.includes('jpg') || name.includes('jpeg') || name.includes('png') || name.includes('gif') || name.includes('webp')) return 'fas fa-file-image text-info';
    if (name.includes('txt')) return 'fas fa-file-alt text-muted';
    return 'fas fa-file';
};
const getMediaUrl = (relativePath) => { /* ... (PropertyDetailView'deki gibi) ... */
    if (!relativePath) return '#';
    if (relativePath.startsWith('/api/')) {
        const domain = apiClient.defaults.baseURL.substring(0, apiClient.defaults.baseURL.indexOf('/', 8));
        return `${domain}${relativePath}`;
    }
    if (relativePath.startsWith('/uploads/')) {
        const domain = apiClient.defaults.baseURL.substring(0, apiClient.defaults.baseURL.indexOf('/', 8));
        return `${domain}${relativePath}`;
    }
    return relativePath;
};

// --- Proje Belge İşlemleri ---
const handleProjectDocumentFilesChange = (event) => { /* ... (önceki gibi) ... */
  const files = Array.from(event.target.files);
  projectDocumentUploadError.value = null;
  const maxDocs = 5;
  if (existingProjectDocuments.value.length + projectDocumentPreviews.value.length + files.length > maxDocs) {
      projectDocumentUploadError.value = `En fazla ${maxDocs} proje belgesi yükleyebilirsiniz.`;
      event.target.value = ''; return;
  }
  files.forEach(file => {
    if (file.size > 10 * 1024 * 1024) { projectDocumentUploadError.value = `Max 10MB: ${file.name}.`; return; }
    projectDocumentFilesToUpload.value.push(file);
    projectDocumentPreviews.value.push({ file, document_type: '', description: file.name.split('.')[0] });
  });
  event.target.value = '';
};
const removeProjectDocumentPreview = (index) => { /* ... (önceki gibi) ... */
  projectDocumentFilesToUpload.value.splice(index, 1);
  projectDocumentPreviews.value.splice(index, 1);
};
const deleteExistingProjectDocument = async (docId) => { /* ... (önceki gibi) ... */
    if (!projectId.value) return;
     if (confirm("Bu proje belgesini kalıcı olarak silmek istediğinizden emin misiniz?")) {
        projectDocDeleteLoading[docId] = true;
        try {
            await apiClient.delete(`/projects/${projectId.value}/documents/${docId}`);
            existingProjectDocuments.value = existingProjectDocuments.value.filter(d => d.id !== docId);
            projectStore.status.successMessage = "Proje belgesi başarıyla silindi."; // Store'a taşı
            setTimeout(() => projectStore.resetStatus(), 3000);
        } catch (error) {
            projectDocumentUploadError.value = error.response?.data?.msg || 'Proje belgesi silinemedi.';
        } finally {
            projectDocDeleteLoading[docId] = false;
        }
    }
};
const uploadProjectDocumentsInternal = async (targetProjectId) => { /* ... (önceki gibi) ... */
    if (projectDocumentFilesToUpload.value.length === 0) return true;
    projectDocumentUploadLoading.value = true; projectDocumentUploadError.value = null;
    const uploads = projectDocumentFilesToUpload.value.map((previewItem) => {
        const formData = new FormData();
        formData.append('document', previewItem.file);
        if(previewItem.document_type) formData.append('document_type', previewItem.document_type);
        if(previewItem.description) formData.append('description', previewItem.description);
        return apiClient.post(`/projects/${targetProjectId}/documents`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }).catch(err => { throw err; });
    });
    try {
        await Promise.all(uploads);
        projectDocumentFilesToUpload.value = []; projectDocumentPreviews.value = [];
        return true;
    } catch (error) {
        projectDocumentUploadError.value = error.response?.data?.msg || "Bir veya daha fazla proje belgesi yüklenirken hata oluştu.";
        return false;
    } finally { projectDocumentUploadLoading.value = false; }
};

const handleSubmit = async () => {
  formSubmitError.value = null; projectStore.resetStatus();
  v$.value.$validate();
  if (v$.value.$invalid) {
    formSubmitError.value = "Lütfen formdaki tüm zorunlu alanları doğru bir şekilde doldurun.";
    const firstErrorElement = document.querySelector('.form-group.error input, .form-group.error select, .form-group.error textarea');
    if (firstErrorElement) { firstErrorElement.focus({ preventScroll: true }); firstErrorElement.scrollIntoView({behavior: 'smooth', block: 'center'}); }
    return;
  }

  if (tagsInput.value) {
    project.tags = tagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag);
  } else {
    project.tags = [];
  }

  let finalDetails = { ...project.details };
  if ((project.project_genel_tipi === 'Diğer' || !project.project_genel_tipi) && genericProjectDetailsString.value) {
      try { finalDetails = JSON.parse(genericProjectDetailsString.value); }
      catch (e) { finalDetails = genericProjectDetailsString.value; }
  }

  const payload = { ...project, tags: project.tags.length > 0 ? project.tags.join(',') : null, details: finalDetails };
  ['total_units', 'toplam_blok_sayisi', 'ortalama_kat_sayisi', 'toplam_insaat_alani_m2'].forEach(field => {
      if (payload[field] === '' || payload[field] === undefined || payload[field] === null || isNaN(parseInt(payload[field]))) {
           payload[field] = null;
      } else { payload[field] = parseInt(payload[field]); }
  });
  if (payload.project_brochure_url === '') payload.project_brochure_url = null;

  projectStore.status.isSubmitting = true;
  let savedProjectIdForMedia = projectId.value;

  try {
    let savedProjectResponse;
    if (isEditMode.value) {
      savedProjectResponse = await projectStore.updateProject(projectId.value, payload);
    } else {
      savedProjectResponse = await projectStore.createProject(payload);
      if (savedProjectResponse && savedProjectResponse.id) {
        savedProjectIdForMedia = savedProjectResponse.id;
      } else { throw new Error("Yeni proje ID'si alınamadı, belgeler yüklenemiyor."); }
    }

    if (savedProjectIdForMedia) {
      const documentsUploaded = await uploadProjectDocumentsInternal(savedProjectIdForMedia);
      if (documentsUploaded) {
        projectStore._setSuccess(isEditMode.value ? 'Proje ve belgeler başarıyla güncellendi.' : 'Proje ve belgeler başarıyla eklendi.');
        if (isEditMode.value) {
            await loadInitialProjectFormState();
        } else {
            router.push({ name: 'project-detail', params: { id: savedProjectIdForMedia } });
        }
      } else {
        const mediaError = projectDocumentUploadError.value || "Proje kaydedildi ancak belgeler yüklenirken bir sorun oluştu.";
        formSubmitError.value = (isEditMode.value ? "Proje güncellendi ancak " : "Proje eklendi ancak ") + mediaError;
        projectStore.status.error = formSubmitError.value;
        if (isEditMode.value) await loadInitialProjectFormState(); // Hata olsa bile ana veriyi ve mevcut medyayı yenile
      }
    }
  } catch (error) {
    formSubmitError.value = projectStore.status.error || "Bir hata oluştu, lütfen tekrar deneyin.";
  } finally {
      projectStore.status.isSubmitting = false;
  }
};
</script>
<style scoped>
/* Bir önceki PropertyFormView stillerini ve eklemeleri kullanın */
@import '@fortawesome/fontawesome-free/css/all.min.css';

.project-form-view { max-width: 1000px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.page-header h2 { margin: 0; font-size: 1.6rem; }
.action-button i { margin-right: 0.4em; }
.cancel-button { background-color: #6c757d; border-color: #6c757d; }
.cancel-button:hover { background-color: #5a6268; border-color: #545b62;}

.project-form.card { padding: 0; box-shadow: none;} /* Kart stilini section'lara taşıdık */
.form-section {
  background-color: #fff;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.07);
  margin-bottom: 1.5rem;
}
.form-section:last-child { margin-bottom: 0; }
.form-section h3 { margin-top: 0; margin-bottom: 1.5rem; color: #343a40; font-size: 1.1rem; border-bottom: 1px solid #e9ecef; padding-bottom: 0.75rem;}
.form-section h3 i { margin-right: 0.6em; color: #007bff; font-size: 0.9em; }


.form-grid { display: grid; gap: 1rem 1.5rem; }
.form-grid.two-columns { grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }
.form-grid.three-columns { grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); }

.form-group-full { grid-column: 1 / -1; }
.form-actions { margin-top: 2rem; text-align: right; padding: 1.5rem; background-color: #f8f9fa; border-top: 1px solid #e0e0e0; border-radius: 0 0 8px 8px;}
.form-check { display: flex; align-items: center; margin-top: 0.5rem;}
.form-check input[type="checkbox"] { margin-right: 0.5rem; width: auto; height: auto; }
.form-check-label { font-weight: normal !important; margin-bottom: 0 !important;}

.form-error-message { margin-bottom: 1.5rem; }
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
.document-preview-item .action-button.delete.small,
.existing-file-item.document .action-button.delete.small {
    position: static; margin-left: auto;
}
.small-spinner { font-size: 0.9em; padding: 0.5rem; text-align: left;}
</style>