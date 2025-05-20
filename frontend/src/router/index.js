import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import LoginPage from '../views/auth/LoginPage.vue';
import RegisterPage from '../views/auth/RegisterPage.vue';
import AdminUserList from '../views/admin/AdminUserList.vue';
import AdminOfficeList from '../views/admin/AdminOfficeList.vue';
import AboutView from '../views/AboutView.vue'; // Import AboutView
import { useAuthStore } from '../store/modules/auth';
import CustomerListView from '../views/customers/CustomerListView.vue'; // Yeni
// import CustomerDetailView from '../views/customers/CustomerDetailView.vue'; // Yeni
// import CustomerFormView from '../views/customers/CustomerFormView.vue'; // Yeni


const routes = [
  { path: '/', name: 'home', component: HomeView, meta: { requiresAuth: false } },
  { path: '/login', name: 'login', component: LoginPage, meta: { guestOnly: true } },
  { path: '/register', name: 'register', component: RegisterPage, meta: { guestOnly: true } },
  { path: '/about', name: 'about', component: AboutView, meta: { requiresAuth: false } }, // About route
  // Admin Paneli Route'ları
  {
    path: '/admin',
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      { path: 'users', name: 'admin-users', component: AdminUserList },
      { path: 'offices', name: 'admin-offices', component: AdminOfficeList },
      // Diğer admin route'ları buraya eklenebilir
      { path: '', redirect: { name: 'admin-users' } } // /admin için varsayılan yönlendirme
    ]
  },
  {
    path: '/customers',
    name: 'customer-list',
    component: CustomerListView,
    meta: { requiresAuth: true } // Müşteri listesini görmek için giriş yapmış olmak yeterli (şimdilik)
                                 // Rol bazlı kısıtlama (örn: sadece danışmanlar) eklenebilir.
  },{
    path: '/customers/new',
    name: 'customer-new',
    component: CustomerFormView, // Yeni müşteri ekleme için aynı formu kullanacağız
    meta: { requiresAuth: true }
  },
  {
    path: '/customers/:id', // Dinamik route parametresi
    name: 'customer-detail',
    component: CustomerDetailView,
    props: true, // Route parametresini component'e prop olarak geçirir (id)
    meta: { requiresAuth: true }
  },
  {
    path: '/customers/:id/edit',
    name: 'customer-edit',
    component: CustomerFormView, // Müşteri düzenleme için aynı formu kullanacağız
    props: true,
    meta: { requiresAuth: true }
  },

  // ... (NotFound route en sonda kalmalı)
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import('../views/NotFoundView.vue') }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

// router.beforeEach navigation guard'ı aynı kalabilir veya müşteri route'ları için
// özel kontroller eklenebilir (örn: danışmanın sadece kendi müşterisini görmesi gibi,
// bu kontrol daha çok backend ve component içinde yapılır).

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  // authStore.checkAuthStatus(); // Bu main.js'de veya App.vue onMounted'da yapılıyor. Burada tekrar gerek yok.

  const isAuthenticated = authStore.isAuthenticated;
  const isAdmin = authStore.isAdmin;

  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } });
  } else if (to.meta.guestOnly && isAuthenticated) {
    next({ name: 'home' });
  } else if (to.meta.requiresAdmin && !isAdmin) { // requiresAdmin ama kullanıcı admin değilse
    // Kullanıcı giriş yapmış ama admin değilse
    if (isAuthenticated) {
        // Uygun bir "Yetkisiz Erişim" sayfasına yönlendirilebilir veya ana sayfaya
        next({ name: 'home' }); // Şimdilik ana sayfaya
    } else {
        // Giriş yapmamışsa zaten yukarıdaki requiresAuth bloğu login'e yönlendirecektir.
        next({ name: 'login', query: { redirect: to.fullPath } });
    }
  }
  else {
    next();
  }
});

export default router;