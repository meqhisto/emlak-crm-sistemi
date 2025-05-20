<template>
  <div class="not-found-view page-container">
    <h1>404 - Sayfa Bulunamadı</h1>
    <p>Aradığınız sayfa mevcut değil veya taşınmış olabilir.</p>
    <router-link to="/" class="action-button">Ana Sayfaya Dön</router-link>
  </div>
</template>

<script setup>
</script>

<style scoped>
.page-container {
  max-width: 600px;
  margin: 2rem auto;
  padding: 3rem;
  text-align: center;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}
.not-found-view h1 {
  font-size: 2.5rem;
  color: #dc3545;
  margin-bottom: 1rem;
}
.not-found-view p {
  font-size: 1.1rem;
  color: #555;
  margin-bottom: 2rem;
}
.action-button {
    display: inline-block;
    text-decoration: none;
}
</style>