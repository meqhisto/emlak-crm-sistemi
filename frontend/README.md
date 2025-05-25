# Emlak CRM Projesi - v1.0.2

Bu proje, kapsamlı bir Emlak Müşteri İlişkileri Yönetimi (CRM) sistemi geliştirmeyi amaçlamaktadır. Python Flask backend ve Vue.js frontend teknolojileri kullanılarak modern, modüler ve ölçeklenebilir bir yapı hedeflenmektedir.

## Mevcut Özellikler (v1.0.2 İtibarıyla)

### Backend API
- **Kimlik Doğrulama:** JWT tabanlı kullanıcı girişi, kayıt ve token yenileme.
- **Kullanıcı Yönetimi:** Rol tabanlı erişim (Admin, Broker, Danışman), kullanıcı CRUD işlemleri (Admin).
- **Ofis Yönetimi:** Ofis CRUD işlemleri (Admin).
- **Müşteri Yönetimi:** Müşteri CRUD, arama, filtreleme, etkileşim kaydı.
- **Portföy Yönetimi:**
    - Gayrimenkul (Property) CRUD, gelişmiş arama ve filtreleme.
    - Farklı portföy tipleri (Konut, Arsa, İşyeri vb.) ve durumları.
    - Türe özel detayların JSON olarak saklanması.
    - Fotoğraf ve belge yükleme, listeleme, silme ve sunma altyapısı.
    - TKGM Parsel Sorgu JSON verisini parse etme ve forma önerme.
- **Proje Yönetimi (Temel):**
    - İnşaat Projesi (Project) CRUD, listeleme, filtreleme.
    - Projeye bağlı Birim (Unit - Daire, Dükkan vb.) CRUD, listeleme.
    - Proje ve birimler için farklı tip ve durum tanımları.
    - Proje dosyaları (belgeler) için yükleme, listeleme, silme altyapısı.
- **Veritabanı:** MSSQL ile entegrasyon ve Alembic ile migrasyon yönetimi.
- **Yardımcı Endpoint'ler:** Dropdown'lar için portföy/proje/birim tipleri ve durumları.

### Frontend Arayüzü (Vue.js)
- **Genel Yapı:** Vue Router ile sayfa yönlendirme, Pinia ile state yönetimi.
- **Kimlik Doğrulama:** Login ve Register sayfaları. Navigasyon korumaları.
- **Admin Paneli (Temel):** Kullanıcı ve Ofis listeleme/yönetim arayüzleri.
- **Müşteri Yönetimi:** Müşteri listeleme, ekleme/düzenleme formu, detay sayfası.
- **Portföy Yönetimi:**
    - Portföy listeleme (arama, filtreleme, sayfalama).
    - Kapsamlı portföy ekleme/düzenleme formu (Vuelidate ile doğrulama, TKGM JSON yükleme, fotoğraf/belge yükleme arayüzü, emsal bilgileri).
    - Portföy detay sayfası (fotoğraf galerisi, belge listesi, tüm detaylar).
- **Proje Yönetimi (Temel):**
    - Proje listeleme (arama, filtreleme, sayfalama).
    - Proje ekleme/düzenleme formu (Vuelidate ile doğrulama, yeni proje alanları, proje dosyaları yükleme arayüzü).
    - Proje detay sayfası (proje bilgileri, birim listesi, birim ekleme/düzenleme modalı).
- **Genel UX:** Temel loading göstergeleri ve hata mesajları.

## Kurulum ve Çalıştırma

### Ön Gereksinimler
- Python 3.9+
- Node.js (LTS) ve npm/yarn
- MSSQL Server
- MSSQL ODBC Sürücüsü
- Docker ve Docker Compose (Önerilen)

### Backend Kurulumu
1. `cd backend`
2. Sanal ortam oluşturun: `python -m venv .venv` (veya `venv`)
3. Aktifleştirin: `.\.venv\Scripts\Activate.ps1` (Windows) veya `source .venv/bin/activate` (Linux/macOS)
4. Bağımlılıkları kurun: `pip install -r requirements.txt`
5. `.env.example` dosyasını `.env` olarak kopyalayın ve MSSQL bağlantı bilgilerinizi, `SECRET_KEY`, `JWT_SECRET_KEY` gibi ayarları girin.
6. `UPLOAD_FOLDER` için `config.py`'de belirtilen `uploads_data` klasörünün `backend` dizininde olduğundan emin olun (veya oluşturun).
7. Veritabanını oluşturun ve migrasyonları çalıştırın:
   - MSSQL sunucunuzda `emlak_crm_db` (veya `.env`'de belirttiğiniz) adında boş bir veritabanı oluşturun.
   - `flask db init` (sadece ilk kurulumda ve `migrations` klasörü yoksa)
   - `flask db migrate -m "Initial database setup"`
   - `flask db upgrade`
8. Çalıştırın: `flask run`

### Frontend Kurulumu
1. `cd frontend`
2. Bağımlılıkları kurun: `npm install` (veya `yarn install`)
3. `.env.example` dosyasını `.env` olarak kopyalayın (gerekirse `VITE_API_BASE_URL`'i ayarlayın, Vite proxy kullanılıyorsa `/api` kalabilir).
4. Çalıştırın: `npm run dev`

### Docker ile Çalıştırma (Önerilen)
Proje ana dizininde:
1. `backend/.env` dosyasını oluşturup MSSQL bağlantı bilgilerinizi (Docker içindeki MSSQL servisine göre, örn: `DATABASE_URL=mssql+pyodbc://sa:YourStrongPassword12!@mssql_db/emlak_crm_db?driver=ODBC+Driver+18+for+SQL+Server&TrustServerCertificate=yes`) ve diğer key'leri girin.
2. `docker-compose.yml` dosyasındaki `mssql_db` servisinin `SA_PASSWORD`'ünü `.env`'deki şifrenizle eşleştirin.
3. `docker-compose up --build -d`
4. Backend migrasyonlarını çalıştırmak için (ilk kurulumda):
   `docker-compose exec backend flask db init` (gerekirse)
   `docker-compose exec backend flask db migrate -m "Initial setup"`
   `docker-compose exec backend flask db upgrade`

Backend API `http://localhost:5000` adresinde, frontend ise `http://localhost:5173` adresinde çalışacaktır.

## Sonraki Adımlar ve Geliştirmeler
- Görev Takibi Modülü
- Raporlama Modülü
- Detaylı UX iyileştirmeleri ve bildirim sistemi
- Harita entegrasyonları
- Portföy ve Proje modüllerine daha gelişmiş özellikler (fotoğraf/belge yönetimi detayları, ana fotoğraf seçimi vb.)

## Katkıda Bulunma
Katkıda bulunmak isterseniz lütfen bir issue açın veya pull request gönderin.