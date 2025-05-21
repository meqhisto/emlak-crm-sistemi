import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import AboutView from '../views/AboutView.vue';
import NotFoundView from '../views/NotFoundView.vue';

import LoginPage from '../views/auth/LoginPage.vue';
import RegisterPage from '../views/auth/RegisterPage.vue';

import AdminUserList from '../views/admin/AdminUserList.vue';
import AdminOfficeList from '../views/admin/AdminOfficeList.vue';

import CustomerListView from '../views/customers/CustomerListView.vue';
import CustomerDetailView from '../views/customers/CustomerDetailView.vue';
import CustomerFormView from '../views/customers/CustomerFormView.vue';

import PropertyListView from '../views/properties/PropertyListView.vue';   // YENİ
import PropertyDetailView from '../views/properties/PropertyDetailView.vue'; // YENİ
import PropertyFormView from '../views/properties/PropertyFormView.vue';   // YENİ

import { useAuthStore } from '../store/modules/auth';

const routes = [
  { path: '/', name: 'home', component: HomeView, meta: { requiresAuth: false } },
  { path: '/about', name: 'about', component: AboutView, meta: { requiresAuth: false } },

  // Auth Routes
  { path: '/login', name: 'login', component: LoginPage, meta: { guestOnly: true } },
  { path: '/register', name: 'register', component: RegisterPage, meta: { guestOnly: true } },
  // TODO: Şifremi unuttum route'u eklenecek

  // Admin Panel Routes
  {
    path: '/admin',
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      { path: 'users', name: 'admin-users', component: AdminUserList },
      { path: 'offices', name: 'admin-offices', component: AdminOfficeList },
      { path: '', redirect: { name: 'admin-users' } } // /admin için varsayılan
    ]
  },

  // Customer Management Routes
  {
    path: '/customers',
    meta: { requiresAuth: true }, // Genel yetkilendirme, detaylar component içinde veya daha spesifik meta ile
    children: [
        { path: '', name: 'customer-list', component: CustomerListView },
        { path: 'new', name: 'customer-new', component: CustomerFormView },
        { path: ':id', name: 'customer-detail', component: CustomerDetailView, props: true },
        { path: ':id/edit', name: 'customer-edit', component: CustomerFormView, props: true },
    ]
  },

  // Property Management Routes (YENİ EKLENDİ)
  {
    path: '/properties',
    meta: { requiresAuth: true }, // Genel yetkilendirme
    children: [
        { path: '', name: 'property-list', component: PropertyListView },
        { path: 'new', name: 'property-new', component: PropertyFormView },
        { path: ':id', name: 'property-detail', component: PropertyDetailView, props: true },
        { path: ':id/edit', name: 'property-edit', component: PropertyFormView, props: true },
    ]
  },

  // NotFound Route (En sonda olmalı)
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFoundView }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // Sayfa geçişlerinde en üste scroll et
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  },
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  // authStore.checkAuthStatus(); // Bu main.js veya App.vue onMounted'da yapılıyor.

  const isAuthenticated = authStore.isAuthenticated;
  const isAdmin = authStore.isAdmin;

  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } });
  } else if (to.meta.guestOnly && isAuthenticated) {
    next({ name: 'home' });
  } else if (to.meta.requiresAdmin && !isAdmin) {
    if (isAuthenticated) {
        // Kullanıcı giriş yapmış ama admin değilse
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