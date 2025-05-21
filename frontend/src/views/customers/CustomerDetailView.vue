<template>
  <div class="customer-detail-view admin-page-container">
    <div v-if="customerStore.status.isLoading && !customer" class="loading-spinner">
      Müşteri bilgileri yükleniyor...
    </div>
    <div v-if="!customerStore.status.isLoading && customerStore.status.error && !customer" class="error-message">
      {{ customerStore.status.error }}
      <p><router-link :to="{ name: 'customer-list' }">Müşteri Listesine Dön</router-link></p>
    </div>

    <div v-if="customer" class="customer-details-content">
      <div class="page-header">
        <h2>Müşteri Detayı: {{ customer.first_name }} {{ customer.last_name || '' }}</h2>
        <div>
          <router-link :to="{ name: 'customer-edit', params: { id: customer.id } }" class="action-button edit">
            Düzenle
          </router-link>
          <router-link :to="{ name: 'customer-list' }" class="action-button cancel-button" style="margin-left: 0.5rem;">
            Listeye Dön
          </router-link>
        </div>
      </div>

      <div class="details-grid">
        <div class="detail-item"><strong>Ad Soyad:</strong> {{ customer.first_name }} {{ customer.last_name || '' }}</div>
        <div class="detail-item"><strong>E-posta:</strong> {{ customer.email || '-' }}</div>
        <div class="detail-item"><strong>Birincil Telefon:</strong> {{ customer.phone_number_primary }}</div>
        <div class="detail-item"><strong>İkincil Telefon:</strong> {{ customer.phone_number_secondary || '-' }}</div>
        <div class="detail-item full-width"><strong>Adres:</strong> {{ customer.address || '-' }}</div>
        <div class="detail-item"><strong>Şehir:</strong> {{ customer.city || '-' }}</div>
        <div class="detail-item"><strong>Posta Kodu:</strong> {{ customer.postal_code || '-' }}</div>
        <div class="detail-item"><strong>Müşteri Tipi:</strong> {{ customer.customer_type || '-' }}</div>
        <div class="detail-item"><strong>Kaynak:</strong> {{ customer.lead_source || '-' }}</div>
        <div class="detail-item">
            <strong>Atanan Danışman:</strong>
            <span v-if="customer.consultant">{{ customer.consultant.full_name || customer.consultant.username }}</span>
            <span v-else>-</span>
        </div>
        <div class="detail-item"><strong>Aktif mi?:</strong> {{ customer.is_active ? 'Evet' : 'Hayır' }}</div>
        <div class="detail-item full-width"><strong>Notlar:</strong> <pre>{{ customer.notes || '-' }}</pre></div>
        <div class="detail-item"><strong>Oluşturulma T.:</strong> {{ formatDate(customer.created_at) }}</div>
        <div class="detail-item"><strong>Güncellenme T.:</strong> {{ formatDate(customer.updated_at) }}</div>
      </div>

      <hr class="section-divider">

      <div class="interactions-section">
        <h3>Müşteri Etkileşimleri</h3>
        <form @submit.prevent="handleAddInteraction" class="interaction-form">
          <h4>Yeni Etkileşim Ekle</h4>
          <div class="form-group">
            <label for="interactionType">Etkileşim Tipi (*):</label>
            <select id="interactionType" v-model="newInteraction.interaction_type" required>
              <option value="">Seçiniz...</option>
              <option value="Telefon Görüşmesi">Telefon Görüşmesi</option>
              <option value="E-posta">E-posta</option>
              <option value="Toplantı">Toplantı</option>
              <option value="Mesaj (SMS/WhatsApp)">Mesaj (SMS/WhatsApp)</option>
              <option value="Not">Genel Not</option>
              <option value="Diğer">Diğer</option>
            </select>
          </div>
          <div class="form-group">
            <label for="interactionSummary">Özet:</label>
            <input type="text" id="interactionSummary" v-model="newInteraction.summary" />
          </div>
          <div class="form-group">
            <label for="interactionNotes">Detaylı Notlar:</label>
            <textarea id="interactionNotes" v-model="newInteraction.notes" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label for="interactionOutcome">Sonuç/Sonraki Adım:</label>
            <input type="text" id="interactionOutcome" v-model="newInteraction.outcome" />
          </div>
          <button type="submit" :disabled="customerStore.status.isSubmitting" class="action-button submit-interaction">
            {{ customerStore.status.isSubmitting ? 'Ekleniyor...' : 'Etkileşim Ekle' }}
          </button>
          <p v-if="interactionFormError" class="error-message">{{ interactionFormError }}</p>
        </form>

        <div v-if="customerStore.status.isLoading && customerInteractions.length === 0" class="loading-spinner small">
          Etkileşimler yükleniyor...
        </div>
        <div v-if="!customerStore.status.isLoading && interactionError" class="error-message">
            {{ interactionError }}
        </div>
<ul v-if="customerInteractions.length > 0" class="interaction-list">
  <li v-for="interaction in customerInteractions" :key="interaction.id" class="interaction-item">
    <strong>{{ interaction.interaction_type }}</strong> - <em>{{ formatDate(interaction.interaction_date) }}</em>
    <span v-if="interaction.user"> (Ekleyen: {{ interaction.user.username }})</span>
    <p v-if="interaction.summary" class="summary"><strong>Özet:</strong> {{ interaction.summary }}</p>
    <!-- Notlar için değişiklik -->
    <div v-if="interaction.notes" class="notes">
      <strong>Notlar:</strong>
      <pre>{{ interaction.notes }}</pre>
    </div>
    <p v-if="interaction.outcome" class="outcome"><strong>Sonuç:</strong> {{ interaction.outcome }}</p>
  
            <!-- TODO: Etkileşim düzenleme/silme butonları eklenebilir -->
          </li>
        </ul>
        <p v-if="!customerStore.status.isLoading && !interactionError && customerInteractions.length === 0" class="no-data-message">
          Bu müşteri için henüz bir etkileşim kaydedilmemiş.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, reactive, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCustomerStore } from '../../store/modules/customerStore';

const props = defineProps({
  id: { // Route'dan gelen :id parametresi
    type: String,
    required: true,
  },
});

const route = useRoute();
const router = useRouter();
const customerStore = useCustomerStore();

// customer state'i store.currentCustomer'a bağlanabilir veya ayrı bir ref olabilir.
// Store'u doğrudan kullanmak daha basit olabilir.
const customer = computed(() => customerStore.currentCustomer);
const customerInteractions = computed(() => customerStore.customerInteractions); // Store'dan etkileşimleri al

const interactionFormError = ref(null);
const interactionError = ref(null); // Etkileşim listeleme hatası için

const initialInteraction = {
  interaction_type: '',
  summary: '',
  notes: '',
  outcome: '',
};
const newInteraction = reactive({ ...initialInteraction });

const loadCustomerData = async () => {
  await customerStore.fetchCustomerById(props.id);
  // fetchCustomerById içinde etkileşimler de geliyorsa, ayrı bir fetch'e gerek yok.
  // Eğer ayrı bir endpoint ise: await customerStore.fetchCustomerInteractions(props.id);
  if (customerStore.status.error && !customerStore.currentCustomer) {
      // Hata varsa ve müşteri yüklenememişse (örn: 404), listeye yönlendirebiliriz
      // router.push({ name: 'customer-list' });
  }
  // Etkileşimleri listelerken oluşan hata için (eğer fetchCustomerInteractions ayrı çağrılıyorsa)
  // interactionError.value = customerStore.status.error;
};

onMounted(() => {
  customerStore.resetStatus();
  loadCustomerData();
});

// Route ID'si değişirse veriyi yeniden yükle (çok nadir bir durum ama iyi bir pratik)
watch(() => props.id, (newId) => {
  if (newId) {
    loadCustomerData();
  }
});

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(dateString).toLocaleDateString('tr-TR', options);
};

const handleAddInteraction = async () => {
  interactionFormError.value = null;
  if (!newInteraction.interaction_type) {
    interactionFormError.value = "Etkileşim tipi zorunludur.";
    return;
  }
  try {
    await customerStore.addInteraction(props.id, { ...newInteraction });
    Object.assign(newInteraction, initialInteraction); // Formu sıfırla
    // Başarı mesajı store'da set ediliyor
  } catch (error) {
    // Hata store'da set ediliyor, ama form özelinde de gösterebiliriz.
    interactionFormError.value = customerStore.status.error || "Etkileşim eklenirken bir hata oluştu.";
  }
};

</script>

<style scoped>
.customer-detail-view {
  max-width: 900px; /* Biraz daha geniş */
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
.action-button.edit { background-color: #1890ff; }
.action-button.edit:hover { background-color: #096dd9; }


.customer-details-content {
  background-color: #fff;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem 1.5rem; /* Satır ve sütun boşlukları */
  margin-bottom: 2rem;
}
.detail-item {
  padding: 0.5rem 0;
  border-bottom: 1px solid #f0f0f0;
}
.detail-item:last-child {
    border-bottom: none;
}
.detail-item strong {
  color: #555;
  margin-right: 0.5rem;
  display: block; /* Başlıkları ayrı satıra al */
  margin-bottom: 0.25rem;
}
.detail-item.full-width {
  grid-column: 1 / -1;
}
.detail-item pre { /* Notlar için preformat */
    white-space: pre-wrap; /* Uzun notların taşmasını engelle */
    word-break: break-word;
    font-family: inherit; /* Ana fontu kullan */
    margin: 0;
    font-size: 0.95rem;
    color: #333;
}

.section-divider {
  margin: 2rem 0;
  border: 0;
  border-top: 1px solid #e0e0e0;
}

.interactions-section h3 {
  margin-bottom: 1rem;
  color: #444;
}
.interaction-form {
  background-color: #f9f9f9;
  padding: 1.5rem;
  border-radius: 6px;
  margin-bottom: 2rem;
  border: 1px solid #eee;
}
.interaction-form h4 {
    margin-top: 0;
    margin-bottom: 1rem;
}
.submit-interaction {
    margin-top: 0.5rem;
}

.interaction-list {
  list-style-type: none;
  padding-left: 0;
}
.interaction-item {
  background-color: #fdfdfd;
  border: 1px solid #eee;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}
.interaction-item strong {
  color: #007bff; /* Etkileşim tipini vurgula */
}
.interaction-item em {
  color: #6c757d;
  font-size: 0.9em;
}
.interaction-item p {
  margin: 0.5rem 0 0 0;
  font-size: 0.95rem;
  line-height: 1.5;
}
.interaction-item p.summary strong,
.interaction-item p.notes strong,
.interaction-item p.outcome strong {
    display: inline; /* "Özet:" gibi başlıklar aynı satırda kalsın */
    margin-right: 0.3em;
    color: #555;
}
.interaction-item pre { /* Etkileşim notları için */
    white-space: pre-wrap;
    word-break: break-word;
    font-family: inherit;
    margin: 0;
    font-size: 0.95rem;
}
.loading-spinner.small {
    font-size: 0.9em;
    padding: 1rem;
}
</style>