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

import PropertyDetailView from '../views/properties/PropertyDetailView.vue';
import PropertyListView from '../views/properties/PropertyListView.vue';
import PropertyFormView from '../views/properties/PropertyFormView.vue';


import ProjectDetailView from '../views/projects/ProjectDetailView.vue'; // YENİ
import ProjectListView from '../views/projects/ProjectListView.vue';
import ProjectFormView from '../views/projects/ProjectFormView.vue';
import ProjectLayout from '../views/projects/ProjectLayout.vue'; // <<< YENİ IMPORT


import { useAuthStore } from '../store/modules/authStore';

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
    // Project Management Routes (YENİ EKLENDİ)
  // Project Management Routes
  {
path: '/projects',
    component: ProjectLayout, // <<< PARENT ROUTE İÇİN COMPONENT
    meta: { requiresAuth: true },
    children: [
        { path: '', name: 'project-list', component: ProjectListView }, // Default child: /projects
        { path: 'new', name: 'project-new', component: ProjectFormView, meta: { requiresAuth: true } }, // /projects/new
        { path: ':id', name: 'project-detail', component: ProjectDetailView, props: true, meta: { requiresAuth: true } }, // /projects/:id
        { path: ':id/edit', name: 'project-edit', component: ProjectFormView, props: true, meta: { requiresAuth: true } } // /projects/:id/edit
    ]
  },
  // ...



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
  const authStore = useAuthStore(); // Yine de store'u import edin
  console.log("Simplified Guard - Navigating to:", to.name, "Authenticated:", authStore.isAuthenticated);
  next(); // Her zaman geçişe izin ver
  console.log("Navigating to:", to.name, "Meta:", to.meta);
  console.log("User authenticated:", authStore.isAuthenticated, "isAdmin:", authStore.isAdmin, "isBroker:", authStore.isBroker);




  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    console.log("Redirecting to login (requiresAuth failed for", to.name, ")");
    next({ name: 'login', query: { redirect: to.fullPath } });
  } else if (to.meta.guestOnly && authStore.isAuthenticated) {
    console.log("Redirecting to home (guestOnly failed for", to.name, ")");
    next({ name: 'home' });
  } else if (to.meta.requiresAdmin && !authStore.isAdmin) {
    console.log("Redirecting to home (requiresAdmin failed for", to.name, ")");
    if (authStore.isAuthenticated) {
        next({ name: 'home' });
    } else {
        next({ name: 'login', query: { redirect: to.fullPath } });
    }
  }
  // YENİ KONTROL (Broker yetkisi için örnek):
  // Eğer project-new gibi sayfalar sadece Admin veya Broker tarafından erişilebilir olacaksa:
  else if ((to.name === 'project-new' || to.name === 'project-edit') && !(isAdmin || isBroker)) { // <<< BU KOŞUL ÖNEMLİ
     console.log("Redirecting to project-list (project-new/edit auth failed for current user role)");
     next({ name: 'project-list' }); // Broker veya Admin değilse proje listesine yönlendir
  }
  else {
    console.log("Proceeding to route:", to.name);
    next();
  }
});

export default router;