<template>
  <div class="about-view page-container">
    <h1>Emlak CRM Sistemi Hakkında</h1>
    <p>
      Bu uygulama, emlak danışmanları, brokerlar ve yöneticiler için kapsamlı bir Müşteri İlişkileri Yönetimi (CRM) çözümü sunmayı hedefler.
    </p>
    <p>
      Modern web teknolojileri kullanılarak geliştirilen bu sistem, kullanıcı dostu arayüzü ve güçlü backend altyapısıyla emlak profesyonellerinin günlük iş akışlarını optimize etmelerine yardımcı olacaktır.
    </p>
    <h2>Teknoloji Yığını</h2>
    <ul>
      <li><strong>Backend:</strong> Python (Flask Framework)</li>
      <li><strong>Frontend:</strong> JavaScript (Vue.js Framework)</li>
      <li><strong>Veritabanı:</strong> SQLite (Geliştirme) / PostgreSQL (Üretim Planı)</li>
      <li><strong>API:</strong> RESTful API</li>
      <li><strong>Kimlik Doğrulama:</strong> JWT (JSON Web Tokens)</li>
    </ul>
    <h2>Geliştirme Ekibi</h2>
    <p>Bu proje [Geliştirici Adı/Ekip Adı] tarafından geliştirilmektedir.</p>
  </div>
</template>

<script setup>
// About sayfası için özel bir script gerekmiyorsa boş bırakılabilir.
</script>

<style scoped>
.page-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}
.about-view h1, .about-view h2 {
  color: #333;
  margin-bottom: 1rem;
}
.about-view h1 {
  text-align: center;
  margin-bottom: 1.5rem;
}
.about-view p {
  line-height: 1.7;
  color: #555;
  margin-bottom: 1rem;
}
.about-view ul {
  list-style-type: disc;
  margin-left: 1.5rem;
  margin-bottom: 1rem;
  color: #555;
}
.about-view li {
  margin-bottom: 0.5rem;
}
</style>