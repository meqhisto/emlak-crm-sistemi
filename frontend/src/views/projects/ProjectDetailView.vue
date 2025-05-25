<template <div class="project-detail-view admin-page-container">
  <div v-if="projectStore.status.isLoading && !project" class="loading-spinner">
    <i class="fas fa-spinner fa-spin"></i> Proje bilgileri yükleniyor...
  </div>
  <div v-if="!projectStore.status.isLoading && projectStore.status.error && !project" class="error-message">
    <p>{{ projectStore.status.error }}</p>
    <router-link :to="{ name: 'project-list' }" class="action-button">
      <i class="fas fa-arrow-left"></i> Proje Listesine Dön
    </router-link>
  </div>

  <!-- Projeye Ait Birimler Bölümü -->
  <div class="card units-section">
    <div class="section-header">
      <h4><i class="fas fa-th-large"></i> Proje Birimleri ({{ units.length || 0 }} adet)</h4>
      <div class="header-actions"> <!-- Butonları gruplamak için -->
        <button @click="openUnitTemplateModal" class="action-button primary-alt small-button" v-if="canModifyProject">
          <i class="fas fa-layer-group"></i> Şablondan Birim Ekle
        </button>
        <button @click="openUnitFormModal()" class="action-button add-new-button small-button" v-if="canModifyProject"
          style="margin-left: 0.5rem;">
          <i class="fas fa-plus"></i> Tek Birim Ekle
        </button>
      </div>
    </div>
    <!-- ... (mevcut birim listesi tablosu) ... -->
  </div>

  <!-- Tek Birim Ekleme/Düzenleme Modal'ı (Mevcut) -->
  <div v-if="showUnitModal" class="modal-overlay" @click.self="closeUnitFormModal">
    <!-- ... (mevcut tek birim modal içeriği) ... -->
  </div>

  <!-- YENİ: Birim Şablonu ve Çoğaltma Modal'ı -->
  <div v-if="showUnitTemplateModal" class="modal-overlay" @click.self="closeUnitTemplateModal">
    <div class="modal-content unit-modal-content"> <!-- Aynı stili kullanabiliriz -->
      <h3><i class="fas fa-layer-group"></i> Şablondan Toplu Birim Ekle</h3>
      <form @submit.prevent="handleUnitTemplateSubmit" novalidate>
        <div v-if="unitTemplateFormError" class="error-message form-error-message small-error">{{ unitTemplateFormError
          }}</div>

        <div class="form-grid two-columns">
          <div class="form-group" :class="{ error: v_template$.templateForm.unit_type.$errors.length }">
            <label for="templateUnitType">Birim Tipi (*):</label>
            <select id="templateUnitType" v-model="v_template$.templateForm.unit_type.$model"
              @blur="v_template$.templateForm.unit_type.$touch()">
              <option :value="null" disabled>Seçiniz...</option>
              <option v-for="utype in projectStore.unitTypes" :key="utype" :value="utype">{{ utype }}</option>
            </select>
            <div class="input-errors" v-for="error of v_template$.templateForm.unit_type.$errors" :key="error.$uid">
              <div class="error-msg">{{ error.$message }}</div>
            </div>
          </div>

          <div class="form-group" :class="{ error: v_template$.templateForm.count.$errors.length }">
            <label for="templateUnitCount">Adet (*):</label>
            <input type="number" id="templateUnitCount" v-model.number="v_template$.templateForm.count.$model"
              @blur="v_template$.templateForm.count.$touch()" min="1" />
            <div class="input-errors" v-for="error of v_template$.templateForm.count.$errors" :key="error.$uid">
              <div class="error-msg">{{ error.$message }}</div>
            </div>
          </div>

          <div class="form-group">
            <label for="templateIdentifierPrefix">Birim Adı/No Ön Eki (Opsiyonel):</label>
            <input type="text" id="templateIdentifierPrefix" v-model="templateForm.identifier_prefix"
              placeholder="Örn: A Blok Daire " />
          </div>
          <div class="form-group">
            <label for="templateStartNumber">Başlangıç Numarası (Opsiyonel):</label>
            <input type="number" id="templateStartNumber" v-model.number="templateForm.start_number" min="1"
              placeholder="1" />
          </div>

          <div class="form-group"> <label for="templateBuildingBlock">Blok (Ortak):</label> <input type="text"
              id="templateBuildingBlock" v-model="templateForm.building_block" /> </div>
          <div class="form-group"> <label for="templateFloorNumber">Kat Aralığı (Ortak, Opsiyonel):</label> <input
              type="text" id="templateFloorNumber" v-model="templateForm.floor_number_range"
              placeholder="Örn: 1-5 veya 3" /> </div>
          <div class="form-group"> <label for="templateRooms">Oda Sayısı (Ortak):</label> <input type="text"
              id="templateRooms" v-model="templateForm.number_of_rooms" placeholder="Örn: 2+1" /> </div>
          <div class="form-group"> <label for="templateBathrooms">Banyo Sayısı (Ortak):</label> <input type="number"
              id="templateBathrooms" v-model.number="templateForm.number_of_bathrooms" /> </div>
          <div class="form-group"> <label for="templateAreaNet">Ort. Net m² (Ortak):</label> <input type="number"
              id="templateAreaNet" v-model.number="templateForm.area_m2_net" /> </div>
          <div class="form-group"> <label for="templateAreaGross">Ort. Brüt m² (Ortak):</label> <input type="number"
              id="templateAreaGross" v-model.number="templateForm.area_m2_gross" /> </div>
          <div class="form-group"> <label for="templatePrice">Ort. Fiyat (Ortak):</label> <input type="number"
              id="templatePrice" v-model.number="templateForm.price" step="any" /> </div>
          <div class="form-group"> <label for="templateCurrency">Para Birimi (Ortak):</label>
            <select id="templateCurrency" v-model="templateForm.currency">
              <option value="TRY">TRY</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
          <div class="form-group" :class="{ error: v_template$.templateForm.sale_status.$errors.length }">
            <label for="templateSaleStatus">Satış Durumu (Ortak) (*):</label>
            <select id="templateSaleStatus" v-model="v_template$.templateForm.sale_status.$model"
              @blur="v_template$.templateForm.sale_status.$touch()">
              <option :value="null" disabled>Seçiniz...</option>
              <option v-for="ustatus in projectStore.unitSaleStatuses" :key="ustatus" :value="ustatus">{{ ustatus }}
              </option>
            </select>
            <div class="input-errors" v-for="error of v_template$.templateForm.sale_status.$errors" :key="error.$uid">
              <div class="error-msg">{{ error.$message }}</div>
            </div>
          </div>
          <div class="form-group" v-if="canAssignConsultantToUnit">
            <label for="templateAssignedConsultant">Atanacak Danışman (Tümüne Ortak):</label>
            <select id="templateAssignedConsultant" v-model="templateForm.assigned_consultant_id">
              <option :value="null">Danışman Atama</option>
              <option v-for="consultant in availableConsultantsForUnit" :key="consultant.id" :value="consultant.id">
                {{ consultant.first_name }} {{ consultant.last_name }}
              </option>
            </select>
          </div>
        </div>
        <div class="form-group form-group-full">
          <label for="templateNotes">Ortak Notlar:</label>
          <textarea id="templateNotes" v-model="templateForm.notes" rows="2"></textarea>
        </div>
        <div class="form-actions">
          <button type="submit" :disabled="unitTemplateFormSubmitting || v_template$.$invalid"
            class="action-button submit-button">
            <i :class="unitTemplateFormSubmitting ? 'fas fa-spinner fa-spin' : 'fas fa-plus-circle'"></i>
            {{ unitTemplateFormSubmitting ? `${unitsCreatedCount} / ${templateForm.count} Oluşturuluyor...` :
              `${templateForm.count || 0} Adet Birim Oluştur` }}
          </button>
          <button type="button" @click="closeUnitTemplateModal" :disabled="unitTemplateFormSubmitting"
            class="action-button cancel-button">İptal</button>
        </div>
      </form>
    </div>
  </div> <!-- End Unit Template Modal -->



  <div v-if="project" class="project-details-content">
    <div class="page-header">
      <h1>{{ project.name }}</h1>
      <div>
        <router-link v-if="canModifyProject" :to="{ name: 'project-edit', params: { id: project.id } }"
          class="action-button edit">
          <i class="fas fa-edit"></i> Projeyi Düzenle
        </router-link>
        <router-link :to="{ name: 'project-list' }" class="action-button cancel-button" style="margin-left: 0.5rem;">
          <i class="fas fa-list"></i> Listeye Dön
        </router-link>
      </div>
    </div>

    <div class="project-summary-grid">
      <div class="summary-item card">
        <div class="icon"><i class="fas fa-info-circle"></i></div>
        <div class="text">
          <strong>Durum:</strong>
          <span :class="['status-badge', getProjectStatusClass(project.status)]">{{ project.status }}</span>
        </div>
      </div>
      <div class="summary-item card">
        <div class="icon"><i class="fas fa-building"></i></div>
        <div class="text"><strong>Geliştirici:</strong> {{ project.developer_company || '-' }}</div>
      </div>
      <div class="summary-item card">
        <div class="icon"><i class="fas fa-map-marker-alt"></i></div>
        <div class="text"><strong>Konum:</strong> {{ project.city || '-' }}{{ project.district ? ` /
          ${project.district}` : '' }}</div>
      </div>
      <div class="summary-item card">
        <div class="icon"><i class="fas fa-door-open"></i></div>
        <div class="text">
          <strong>Birimler (T/S/R/K):</strong>
          <span title="Tanımlı / Satılan / Rezerve / Kalan">
            {{ project.units_summary?.total_defined || 0 }} /
            <span class="text-success">{{ project.units_summary?.sold || 0 }}</span> /
            <span class="text-warning">{{ project.units_summary?.reserved || 0 }}</span> /
            <span class="text-info">{{ project.units_summary?.available || 0 }}</span>
          </span>
        </div>
      </div>
    </div>

    <div class="card details-section">
      <h4><i class="fas fa-align-left"></i> Proje Açıklaması</h4>
      <pre v-if="project.description" class="description-text">{{ project.description }}</pre>
      <p v-else class="no-data-message small">Bu proje için bir açıklama girilmemiş.</p>
    </div>

    <div class="card details-section">
      <h4><i class="fas fa-calendar-alt"></i> Tarih Bilgileri</h4>
      <div class="details-grid two-columns">
        <div class="detail-item"><strong>Başlangıç Tarihi:</strong> {{ formatDate(project.start_date) }}</div>
        <div class="detail-item"><strong>Tahmini Bitiş Tarihi:</strong> {{ formatDate(project.estimated_completion_date)
          }}</div>
        <div class="detail-item"><strong>Gerçekleşen Bitiş Tarihi:</strong> {{
          formatDate(project.actual_completion_date) }}</div>
      </div>
    </div>

    <div v-if="project.project_brochure_url" class="card details-section">
      <h4><i class="fas fa-file-pdf"></i> Proje Broşürü</h4>
      <p><a :href="project.project_brochure_url" target="_blank" class="document-link"><i
            class="fas fa-external-link-alt"></i> Broşürü Görüntüle/İndir</a></p>
    </div>

    <!-- Projeye Ait Birimler Bölümü -->
    <div class="card units-section">
      <div class="section-header">
        <h4><i class="fas fa-th-large"></i> Proje Birimleri ({{ units.length || 0 }} adet)</h4>
        <button @click="openUnitFormModal()" class="action-button add-new-button small-button" v-if="canModifyProject">
          <i class="fas fa-plus"></i> Yeni Birim Ekle
        </button>
      </div>

      <div v-if="unitsLoading" class="loading-spinner small-spinner">Birimler yükleniyor...</div>
      <div v-if="!unitsLoading && unitsFetchError" class="error-message small-error">
        Birimler yüklenirken hata oluştu: {{ unitsFetchError }}
      </div>
      <div v-if="!unitsLoading && units.length === 0 && !unitsFetchError" class="no-data-message small">
        Bu projeye henüz birim eklenmemiş.
      </div>

      <div v-if="!unitsLoading && units.length > 0" class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Birim No/Adı</th>
              <th>Tip</th>
              <th>Kat</th>
              <th>Blok</th>
              <th>Net m²</th>
              <th>Oda Sayısı</th>
              <th>Fiyat</th>
              <th>Durum</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="unit in units" :key="unit.id">
              <td>{{ unit.unit_identifier }}</td>
              <td>{{ unit.unit_type }}</td>
              <td>{{ unit.floor_number || '-' }}</td>
              <td>{{ unit.building_block || '-' }}</td>
              <td>{{ unit.area_m2_net || '-' }}</td>
              <td>{{ unit.number_of_rooms || '-' }}</td>
              <td>{{ formatPrice(unit.price, unit.currency) }}</td>
              <td><span :class="['status-badge', getUnitSaleStatusClass(unit.sale_status)]">{{ unit.sale_status
              }}</span></td>
              <td class="table-actions">
                <button @click="openUnitFormModal(unit)" class="action-button edit small" title="Birimi Düzenle"
                  v-if="canModifyProject">
                  <i class="fas fa-edit"></i>
                </button>
                <button @click="confirmDeleteUnit(unit.id)" class="action-button delete small" title="Birimi Sil"
                  v-if="canModifyProject" :disabled="unitDeleteLoading[unit.id]">
                  <i class="fas fa-trash-alt"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Birim Ekleme/Düzenleme Modal'ı -->
    <div v-if="showUnitModal" class="modal-overlay" @click.self="closeUnitFormModal">
      <div class="modal-content unit-modal-content">
        <h3>{{ editingUnit ? 'Birimi Düzenle' : 'Yeni Birim Ekle' }}</h3>
        <form @submit.prevent="handleUnitSubmit" novalidate>
          <div v-if="unitFormError || (v_unit$.$dirty && v_unit$.$invalid)"
            class="error-message form-error-message small-error">
            <p v-if="unitFormError">{{ unitFormError }}</p>
            <p v-if="v_unit$.$dirty && v_unit$.$invalid && !unitFormError">Lütfen birim formundaki hataları düzeltin.
            </p>
          </div>
          <div class="form-grid two-columns">
            <div class="form-group" :class="{ error: v_unit$.unitForm.unit_identifier.$errors.length }">
              <label for="unitIdentifier">Birim No/Adı (*):</label>
              <input type="text" id="unitIdentifier" v-model="v_unit$.unitForm.unit_identifier.$model"
                @blur="v_unit$.unitForm.unit_identifier.$touch()" />
              <div class="input-errors" v-for="error of v_unit$.unitForm.unit_identifier.$errors" :key="error.$uid">
                <div class="error-msg">{{ error.$message }}</div>
              </div>
            </div>
            <div class="form-group" :class="{ error: v_unit$.unitForm.unit_type.$errors.length }">
              <label for="unitType">Birim Tipi (*):</label>
              <select id="unitType" v-model="v_unit$.unitForm.unit_type.$model"
                @blur="v_unit$.unitForm.unit_type.$touch()">
                <option :value="null" disabled>Seçiniz...</option>
                <option v-for="utype in projectStore.unitTypes" :key="utype" :value="utype">{{ utype }}</option>
              </select>
              <div class="input-errors" v-for="error of v_unit$.unitForm.unit_type.$errors" :key="error.$uid">
                <div class="error-msg">{{ error.$message }}</div>
              </div>
            </div>
            <div class="form-group"> <label for="unitBuildingBlock">Blok:</label> <input type="text"
                id="unitBuildingBlock" v-model="unitForm.building_block" /> </div>
            <div class="form-group"> <label for="unitFloorNumber">Kat Numarası:</label> <input type="number"
                id="unitFloorNumber" v-model.number="unitForm.floor_number" /> </div>
            <div class="form-group"> <label for="unitRooms">Oda Sayısı:</label> <input type="text" id="unitRooms"
                v-model="unitForm.number_of_rooms" placeholder="Örn: 2+1" /> </div>
            <div class="form-group"> <label for="unitBathrooms">Banyo Sayısı:</label> <input type="number"
                id="unitBathrooms" v-model.number="unitForm.number_of_bathrooms" /> </div>
            <div class="form-group"> <label for="unitAreaNet">Net m²:</label> <input type="number" id="unitAreaNet"
                v-model.number="unitForm.area_m2_net" /> </div>
            <div class="form-group"> <label for="unitAreaGross">Brüt m²:</label> <input type="number" id="unitAreaGross"
                v-model.number="unitForm.area_m2_gross" /> </div>
            <div class="form-group" :class="{ error: v_unit$.unitForm.price.$errors.length }">
              <label for="unitPrice">Fiyat:</label>
              <input type="number" id="unitPrice" v-model.number="v_unit$.unitForm.price.$model"
                @blur="v_unit$.unitForm.price.$touch()" step="any" />
              <div class="input-errors" v-for="error of v_unit$.unitForm.price.$errors" :key="error.$uid">
                <div class="error-msg">{{ error.$message }}</div>
              </div>
            </div>
            <div class="form-group"> <label for="unitCurrency">Para Birimi:</label>
              <select id="unitCurrency" v-model="unitForm.currency">
                <option value="TRY">TRY</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            <div class="form-group" :class="{ error: v_unit$.unitForm.sale_status.$errors.length }">
              <label for="unitSaleStatus">Satış Durumu (*):</label>
              <select id="unitSaleStatus" v-model="v_unit$.unitForm.sale_status.$model"
                @blur="v_unit$.unitForm.sale_status.$touch()">
                <option :value="null" disabled>Seçiniz...</option>
                <option v-for="ustatus in projectStore.unitSaleStatuses" :key="ustatus" :value="ustatus">{{ ustatus }}
                </option>
              </select>
              <div class="input-errors" v-for="error of v_unit$.unitForm.sale_status.$errors" :key="error.$uid">
                <div class="error-msg">{{ error.$message }}</div>
              </div>
            </div>
            <div class="form-group" v-if="canAssignConsultantToUnit">
              <label for="unitAssignedConsultant">Atanan Danışman (Birim):</label>
              <select id="unitAssignedConsultant" v-model="unitForm.assigned_consultant_id">
                <option :value="null">Danışman Yok</option>
                <option v-for="consultant in availableConsultantsForUnit" :key="consultant.id" :value="consultant.id">
                  {{ consultant.first_name }} {{ consultant.last_name }} ({{ consultant.username }})
                </option>
              </select>
            </div>
          </div>
          <div class="form-group form-group-full">
            <label for="unitNotes">Birim Notları:</label>
            <textarea id="unitNotes" v-model="unitForm.notes" rows="3"></textarea>
          </div>
          <div class="form-actions">
            <button type="submit" :disabled="unitFormSubmitting || v_unit$.$invalid"
              class="action-button submit-button">
              <i :class="unitFormSubmitting ? 'fas fa-spinner fa-spin' : 'fas fa-save'"></i>
              {{ unitFormSubmitting ? 'Kaydediliyor...' : (editingUnit ? 'Birimi Güncelle' : 'Birim Ekle') }}
            </button>
            <button type="button" @click="closeUnitFormModal" :disabled="unitFormSubmitting"
              class="action-button cancel-button">İptal</button>
          </div>
        </form>
      </div>
    </div>

  </div>

</template>

<script setup>import { ref, onMounted, computed, watch, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useProjectStore } from '../../store/modules/projectStore';
import { useAuthStore } from '../../store/modules/authStore';
import apiClient from '../../services/apiClient';

import { useVuelidate } from '@vuelidate/core'; // Birim formu için
import { required, maxLength, numeric, minValue, maxValue, helpers } from '@vuelidate/validators'; // Birim formu için

const props = defineProps({ id: { type: String, required: true } });

const router = useRouter();
const projectStore = useProjectStore();
const authStore = useAuthStore();

const project = computed(() => projectStore.currentProject);
const units = computed(() => projectStore.currentProjectUnits);
const projectDocuments = computed(() => projectStore.currentProjectDocuments); // Proje belgeleri için

const isLoadingInitial = ref(true);
const fetchError = ref(null);
const isDeleting = ref(false); // Proje silme için
const unitsLoading = ref(false);
const unitsFetchError = ref(null);
const projectDocsLoading = ref(false); // Proje belgeleri yükleme durumu
// --- Birim Şablonu Modal State'leri ---
const showUnitTemplateModal = ref(false);
const unitTemplateFormSubmitting = ref(false);
const unitTemplateFormError = ref(null);
const unitsCreatedCount = ref(0); // Oluşturulan birim sayısını takip etmek için

const initialTemplateFormData = {
  unit_type: null,
  count: 1,
  identifier_prefix: '',
  start_number: 1,
  building_block: '',
  floor_number_range: '', // Kullanıcı "1-5" veya "3" gibi girebilir, bunu parse edeceğiz
  number_of_rooms: '',
  number_of_bathrooms: null,
  area_m2_net: null,
  area_m2_gross: null,
  price: null,
  currency: 'TRY',
  sale_status: null,
  notes: '',
  assigned_consultant_id: null,
};
const templateForm = reactive({ ...initialTemplateFormData });

// Birim Şablonu Formu için Vuelidate Kuralları
const templateRules = computed(() => ({
    templateForm: {
        unit_type: { required: helpers.withMessage("Birim tipi zorunludur.", required) },
        count: { required: helpers.withMessage("Adet zorunludur.", required), numeric, minValue: helpers.withMessage("En az 1 adet olmalı.", minValue(1)), maxValue: helpers.withMessage("Tek seferde en fazla 100 birim eklenebilir.", maxValue(100)) }, // Makul bir limit
        sale_status: { required: helpers.withMessage("Satış durumu zorunludur.", required) },
        // Diğer opsiyonel alanlar için de kurallar eklenebilir
    }
}));
const v_template$ = useVuelidate(templateRules, { templateForm });


// --- Birim Şablonu Modal Metodları ---
const openUnitTemplateModal = () => {
    unitTemplateFormError.value = null;
    v_template$.value.$reset();
    Object.assign(templateForm, initialTemplateFormData); // Formu sıfırla
    if (projectStore.unitTypes.length > 0) templateForm.unit_type = projectStore.unitTypes[0];
    if (projectStore.unitSaleStatuses.length > 0) templateForm.sale_status = projectStore.unitSaleStatuses[0];
    unitsCreatedCount.value = 0;
    showUnitTemplateModal.value = true;
};
const closeUnitTemplateModal = () => {
    showUnitTemplateModal.value = false;
};

const handleUnitTemplateSubmit = async () => {
    unitTemplateFormError.value = null;
    v_template$.value.$validate();
    if (v_template$.value.$invalid) {
        unitTemplateFormError.value = "Lütfen şablon formundaki hataları düzeltin.";
        return;
    }

    unitTemplateFormSubmitting.value = true;
    unitsCreatedCount.value = 0;
    const totalToCreate = templateForm.count;
    let successCount = 0;
    let lastError = null;

    const floorNumbers = parseFloorRange(templateForm.floor_number_range);

    for (let i = 0; i < totalToCreate; i++) {
        const unitIdentifier = `${templateForm.identifier_prefix || templateForm.unit_type || 'Birim'} ${templateForm.start_number + i}`;
        
        let currentFloor = null;
        if (floorNumbers.length > 0) {
            currentFloor = floorNumbers[i % floorNumbers.length]; // Döngüsel olarak kat ata
        }

        const unitData = {
            unit_identifier: unitIdentifier,
            unit_type: templateForm.unit_type,
            building_block: templateForm.building_block || null,
            floor_number: currentFloor,
            number_of_rooms: templateForm.number_of_rooms || null,
            number_of_bathrooms: templateForm.number_of_bathrooms,
            area_m2_net: templateForm.area_m2_net,
            area_m2_gross: templateForm.area_m2_gross,
            price: templateForm.price,
            currency: templateForm.currency,
            sale_status: templateForm.sale_status,
            notes: templateForm.notes,
            assigned_consultant_id: templateForm.assigned_consultant_id || null,
        };

        try {
            // projectStore.createUnit zaten _setSubmitting(true/false) yapıyor,
            // ama biz genel bir submitting state (unitTemplateFormSubmitting) kullanıyoruz.
            await projectStore.createUnit(props.id, unitData);
            successCount++;
            unitsCreatedCount.value = successCount;
        } catch (error) {
            lastError = projectStore.status.error || "Birim oluşturulurken bilinmeyen bir hata oluştu.";
            console.error(`Birim ${unitIdentifier} oluşturulurken hata:`, error);
            // Opsiyonel: Bir hata oluşursa döngüyü durdurabiliriz.
            // break;
        }
    }
    unitTemplateFormSubmitting.value = false;
    await projectStore.fetchProjectById(props.id); // Tüm birimler eklendikten sonra proje özetini ve listeyi güncelle

    if (successCount === totalToCreate) {
        projectStore._setSuccess(`${successCount} adet birim başarıyla eklendi.`); // Store'a genel başarı mesajı
        closeUnitTemplateModal();
    } else {
        unitTemplateFormError.value = `${successCount} adet birim eklendi. ${totalToCreate - successCount} adet eklenirken hata oluştu. Son hata: ${lastError}`;
    }
};

// Kat aralığı parse etmek için yardımcı fonksiyon (örn: "1-5" -> [1,2,3,4,5] veya "3" -> [3])
const parseFloorRange = (rangeStr) => {
    if (!rangeStr || typeof rangeStr !== 'string') return [];
    const floors = [];
    const parts = rangeStr.split(',');
    parts.forEach(part => {
        part = part.trim();
        if (part.includes('-')) {
            const [start, end] = part.split('-').map(n => parseInt(n.trim(), 10));
            if (!isNaN(start) && !isNaN(end) && start <= end) {
                for (let i = start; i <= end; i++) {
                    floors.push(i);
                }
            }
        } else {
            const floorNum = parseInt(part, 10);
            if (!isNaN(floorNum)) {
                floors.push(floorNum);
            }
        }
    });
    return floors.filter((value, index, self) => self.indexOf(value) === index).sort((a,b) => a-b); // Benzersiz ve sıralı
};
// Birim Formu State'leri
const showUnitModal = ref(false);
const editingUnit = ref(null);
const unitFormSubmitting = ref(false);
const unitFormError = ref(null);
const availableConsultantsForUnit = ref([]);

const initialUnitFormData = {
  unit_identifier: '', unit_type: null, floor_number: null, building_block: '',
  area_m2_gross: null, area_m2_net: null, number_of_rooms: '', number_of_bathrooms: null,
  price: null, currency: 'TRY', sale_status: null, notes: '', assigned_consultant_id: null,
};
const unitForm = reactive({ ...initialUnitFormData });

const unitRules = computed(() => ({ /* ... (önceki gibi) ... */
  unitForm: {
    unit_identifier: { required: helpers.withMessage("Birim adı/no zorunludur.", required), maxLength: maxLength(100) },
    unit_type: { required: helpers.withMessage("Birim tipi zorunludur.", required) },
    sale_status: { required: helpers.withMessage("Satış durumu zorunludur.", required) },
    price: { numeric: helpers.withMessage('Geçerli bir fiyat girin.', numeric), minValue: helpers.withMessage('Fiyat negatif olamaz.', minValue(0)) },
    area_m2_net: { numeric: helpers.withMessage('Sayısal değer girin.', numeric), minValue: helpers.withMessage('Alan pozitif olmalı.', minValue(0)) },
  }
}));
const v_unit$ = useVuelidate(unitRules, { unitForm }, { $autoDirty: true });

const loadProjectDetails = async () => {
  isLoadingInitial.value = true; fetchError.value = null;
  unitsLoading.value = true; unitsFetchError.value = null;
  projectDocsLoading.value = true; // Proje belgeleri için
  projectStore.resetStatus();

  const fetchedProject = await projectStore.fetchProjectById(props.id); // Bu birimleri ve belgeleri de çekiyor
  if (!fetchedProject && projectStore.status.error) {
    fetchError.value = projectStore.status.error;
  }
  unitsLoading.value = false; // fetchProjectById bittiğinde birimler gelmiş olmalı
  projectDocsLoading.value = false; // fetchProjectById bittiğinde belgeler gelmiş olmalı
  isLoadingInitial.value = false;
};

const fetchConsultantsForUnitAssignment = async () => { /* ... (ProjectFormView'deki gibi) ... */
  if (authStore.isAdmin || authStore.isBroker) {
    try {
      const response = await apiClient.get('/users', { params: { per_page: 500 } });
      availableConsultantsForUnit.value = response.data.users.filter(
        u => u.role === 'danisman' || u.role === 'broker'
      );
    } catch (error) { unitFormError.value = "Danışman listesi yüklenemedi."; }
  }
};

onMounted(async () => {
  if (projectStore.projectStatuses.length === 0) await projectStore.fetchProjectStatuses();
  if (projectStore.unitTypes.length === 0) await projectStore.fetchUnitTypes();
  if (projectStore.unitSaleStatuses.length === 0) await projectStore.fetchUnitSaleStatuses();
  await fetchConsultantsForUnitAssignment();
  await loadProjectDetails();
});

watch(() => props.id, (newId) => {
  if (newId && newId !== projectStore.currentProject?.id) {
    loadProjectDetails();
  }
});

const formatDate = (dateString) => { /* ... (önceki gibi) ... */
  if (!dateString) return '-';
  try { return new Date(dateString).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' }); }
  catch (e) { return dateString; }
};
const formatPrice = (price, currency = 'TRY') => { /* ... (önceki gibi) ... */
  if (price == null || isNaN(price)) return 'Belirtilmemiş';
  try { return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price); }
  catch (e) { return `${price} ${currency}`; }
};
const getProjectStatusClass = (status) => { /* ... (önceki gibi) ... */
  if (!status) return 'status-default';
  const normalized = status.toLowerCase().replace(/ /g, '-').replace(/[ıİ]/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c');
  return `status-project-${normalized}`;
};
const getUnitSaleStatusClass = (status) => { /* ... (önceki gibi) ... */
  if (!status) return 'status-unit-default';
  const normalized = status.toLowerCase().replace(/ /g, '-').replace(/[ıİ]/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c');
  if (['satilik', 'kiralanabilir'].includes(normalized)) return 'status-unit-available';
  if (['satildi', 'kiralandi'].includes(normalized)) return 'status-unit-sold';
  if (normalized === 'rezerve-edildi') return 'status-unit-reserved';
  return 'status-unit-default';
};
const getDocumentIcon = (mimeOrFilename) => { /* ... (PropertyFormView'deki gibi) ... */
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
const getMediaUrl = (relativePathFromServer) => { /* ... (PropertyDetailView'deki gibi, backend URL yapınıza göre ayarlayın) ... */
  if (!relativePathFromServer) return '#';
  if (relativePathFromServer.startsWith('http')) return relativePathFromServer;
  // Varsayım: relativePathFromServer /uploads/ ile başlıyor
  const domain = apiClient.defaults.baseURL.substring(0, apiClient.defaults.baseURL.indexOf('/', 8) === -1 ? apiClient.defaults.baseURL.length : apiClient.defaults.baseURL.indexOf('/', 8)); // http://localhost:5000
  if (relativePathFromServer.startsWith('/uploads/')) {
    return `${domain}${relativePathFromServer}`;
  }
  // Veya backend /api/projects/serve-file/ gibi bir yol döndürüyorsa:
  // if (relativePathFromServer.startsWith('/api/projects/serve-file/')) {
  //    return `${domain}${relativePathFromServer}`;
  // }
  console.warn("ProjectDetailView getMediaUrl: Beklenmedik URL formatı:", relativePathFromServer);
  return relativePathFromServer;
};


const canModifyProject = computed(() => authStore.isAdmin || authStore.isBroker);
const confirmDeleteProject = async (projectIdToDelete) => { /* ... (önceki gibi) ... */
  if (confirm('Bu projeyi ve tüm birimlerini kalıcı olarak silmek istediğinizden emin misiniz?')) {
    isDeleting.value = true;
    const success = await projectStore.deleteProject(projectIdToDelete);
    if (success) { router.push({ name: 'project-list' }); }
    else { alert(`Proje silinemedi: ${projectStore.status.error || 'Bilinmeyen hata.'}`); }
    isDeleting.value = false;
  }
};

// Birim Formu Metodları
const openUnitFormModal = (unitToEdit = null) => { /* ... (önceki gibi) ... */
  unitFormError.value = null; v_unit$.value.$reset();
  if (unitToEdit) {
    editingUnit.value = { ...unitToEdit }; Object.assign(unitForm, unitToEdit);
    unitForm.price = unitToEdit.price !== null ? parseFloat(unitToEdit.price) : null;
    // ... diğer sayısal ve özel alanlar için parse/format ...
  } else {
    editingUnit.value = null; Object.assign(unitForm, initialUnitFormData);
    if (projectStore.unitTypes.length > 0 && !unitForm.unit_type) unitForm.unit_type = projectStore.unitTypes[0];
    if (projectStore.unitSaleStatuses.length > 0 && !unitForm.sale_status) unitForm.sale_status = projectStore.unitSaleStatuses[0];
  }
  showUnitModal.value = true;
};
const closeUnitFormModal = () => { showUnitModal.value = false; editingUnit.value = null; };
const handleUnitSubmit = async () => { /* ... (önceki gibi) ... */
  unitFormError.value = null; v_unit$.value.$validate();
  if (v_unit$.value.$invalid) { unitFormError.value = "Lütfen birim formundaki zorunlu alanları doldurun."; return; }
  unitFormSubmitting.value = true;
  try {
    const payload = { ...unitForm };
    ['price', 'floor_number', 'area_m2_gross', 'area_m2_net', 'number_of_bathrooms'].forEach(field => {
      if (payload[field] === '' || payload[field] === undefined || isNaN(parseFloat(payload[field]))) payload[field] = null;
      else payload[field] = field === 'price' ? parseFloat(payload[field]) : parseInt(payload[field]);
    });
    if (payload.assigned_consultant_id === '') payload.assigned_consultant_id = null;

    if (editingUnit.value && editingUnit.value.id) {
      await projectStore.updateUnit(editingUnit.value.id, payload);
    } else {
      await projectStore.createUnit(props.id, payload);
    }
    await projectStore.fetchProjectById(props.id); // Proje özetini ve birim listesini güncelle
    closeUnitFormModal();
  } catch (error) {
    unitFormError.value = projectStore.status.error || "Birim kaydedilirken bir hata oluştu.";
  } finally { unitFormSubmitting.value = false; }
};

const unitDeleteLoading = reactive({});
const confirmDeleteUnit = async (unitId) => { /* ... (önceki gibi) ... */
  if (confirm("Bu birimi kalıcı olarak silmek istediğinizden emin misiniz?")) {
    unitDeleteLoading[unitId] = true;
    const success = await projectStore.deleteUnit(unitId);
    if (success) {
      await projectStore.fetchProjectById(props.id);
    } else {
      alert(`Birim silinemedi: ${projectStore.status.error || 'Bilinmeyen hata.'}`);
    }
    unitDeleteLoading[unitId] = false;
  }
};

</script>
<style scoped>
/* admin-page-container, page-header, action-button, card, details-section, details-grid, detail-item, status-badge, vb.
   gibi genel stiller App.vue veya PropertyDetailView/ListView'den miras alınabilir/uyarlanabilir. */
.project-detail-view {
  max-width: 1200px;
}

.project-details-layout {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.page-header h1 {
  margin: 0;
  color: #212529;
  font-size: 1.8rem;
  font-weight: 600;
}

.action-button i {
  margin-right: 0.5em;
}

.cancel-button {
  background-color: #6c757d;
}

.action-button.edit {
  background-color: #17a2b8;
}

.project-summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  /* 4'lü veya 2'li grid */
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.summary-item.card {
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.summary-item .icon i {
  font-size: 1.8em;
  color: #007bff;
  width: 30px;
  text-align: center;
}

.summary-item .text strong {
  display: block;
  font-size: 0.8em;
  color: #6c757d;
  margin-bottom: 0.25rem;
  text-transform: uppercase;
}

.summary-item .text span,
.summary-item .text {
  font-size: 0.95em;
  color: #343a40;
}

.summary-item .text .status-badge {
  font-size: 0.9em;
  vertical-align: middle;
}

/* Badge'i biraz küçült */


.header-badges {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  margin-top: 0.5rem;
}

.header-actions { /* Butonları yan yana getirmek için */
    display: flex;
    gap: 0.5rem;
}
.action-button.primary-alt { /* Şablon butonu için farklı bir renk */
    background-color: #17a2b8; /* Veya farklı bir info rengi */
    border-color: #17a2b8;
}
.action-button.primary-alt:hover {
    background-color: #117a8b;
    border-color: #10707f;
}
.unit-modal-content { /* Modal içeriği için max yükseklik ve scroll */
    max-height: 85vh;
    overflow-y: auto;
}
.small-input {
    font-size: 0.85em; /* Belge tipi ve açıklama inputları için */
}
.info-text { /* Proje formu için olanı kopyalayabilirsiniz */
    font-size: 0.9em; color: #6c757d; margin-top: 0.5rem;
    padding: 0.75rem; background-color: #f8f9fa;
    border-left: 3px solid #17a2b8; border-radius: 0 4px 4px 0;
}

/* Proje Durum Renkleri */
.status-project-planlama-asamasinda {
  background-color: #17a2b8;
}

.status-project-insaat-halinde {
  background-color: #ffc107;
  color: #212529 !important;
}

.status-project-satista {
  background-color: #28a745;
}

.status-project-tamamlandi {
  background-color: #007bff;
}

.status-project-iptal-edildi {
  background-color: #dc3545;
}

.status-project-default {
  background-color: #6c757d;
}

/* Birim Satış Durum Renkleri */
.status-unit-available {
  background-color: #28a745;
}

.status-unit-sold,
.status-unit-kiralandi {
  background-color: #dc3545;
}

.status-unit-reserved {
  background-color: #ffc107;
  color: #212529 !important;
}

.status-unit-default,
.status-unit-satistan-cekildi {
  background-color: #6c757d;
}


.price {
  font-size: 2rem;
  font-weight: 700;
  color: #007bff;
  margin: 0.5rem 0 1.5rem 0;
}

/* Proje için fiyat olmayabilir, opsiyonel */

.details-section h4 {
  font-size: 1.1rem;
  color: #495057;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
}

.details-section h4 i {
  margin-right: 0.6em;
  color: #007bff;
}

.description-text {
  white-space: pre-wrap;
  /* ... (PropertyDetailView'deki gibi) ... */
}

.no-data-message.small {
  font-size: 0.9em;
  padding: 1rem;
  text-align: center;
}

.units-section .section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  /* h4 zaten margin-bottom: 1rem; alıyor */
}

.units-section .section-header h4 {
  margin-bottom: 0;
  border-bottom: none;
  padding-bottom: 0;
}

.action-button.small-button {
  padding: 0.4rem 0.8rem;
  font-size: 0.85rem;
}

.action-button.small-button i {
  margin-right: 0.3em;
}

.table-responsive {
  overflow-x: auto;
}

/* Tablo stilleri App.vue'den gelebilir */
.table-actions button.small i,
.table-actions a.small i {
  margin-right: 0 !important;
}

/* Sadece ikon kalsın */


.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content.unit-modal-content {
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  width: 90%;
  max-width: 700px;
  /* Birim modalı biraz daha geniş */
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.25);
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content h3 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: #333;
}

.form-actions {
  margin-top: 1.5rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.cancel-button {
  background-color: #f0f0f0;
  color: #333;
  border: 1px solid #ccc;
}

.cancel-button:hover {
  background-color: #e0e0e0;
}

.input-errors {
  margin-top: 0.25rem;
}

.error-msg {
  color: #dc3545;
  font-size: 0.8em;
}

.form-error-message.small-error {
  font-size: 0.9em;
  margin-top: 0.5rem;
  margin-bottom: 1rem;
  padding: 0.5rem;
}

.small-spinner {
  font-size: 0.9em;
  padding: 1rem;
}
</style>