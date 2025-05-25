<template>
  <div class="project-layout">
    <!-- Bu layout'a özel bir başlık veya navigasyon eklenebilir (opsiyonel) -->
    <!-- <h2>Proje Yönetimi</h2> -->
    <!-- <nav>
      <router-link :to="{ name: 'project-list' }">Proje Listesi</router-link> |
      <router-link :to="{ name: 'project-new' }">Yeni Proje</router-link>
    </nav> -->
    <!-- <hr /> -->
    <router-view /> <!-- Child route'lar (ProjectListView, ProjectFormView vb.) burada render edilecek -->
  </div>
</template>

<script setup>
// Bu layout için özel bir script gerekmiyorsa boş kalabilir.
// Örneğin, bu layout'a girildiğinde bir API isteği yapılabilir.
</script>

<style scoped>
.project-layout {
  /* Layout'a özel stiller eklenebilir */
  padding-top: 1rem; /* Örnek */
}
</style>