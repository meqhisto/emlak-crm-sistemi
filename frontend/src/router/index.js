import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginPage from '../views/auth/LoginPage.vue' // Sprint 1'de oluşturulacak
// import RegisterPage from '../views/auth/RegisterPage.vue' // Sprint 1'de oluşturulacak

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: { requiresAuth: false } // Örnek meta bilgisi
  },
  {
    path: '/login', // Sprint 1 için
    name: 'login',
    component: LoginPage,
    meta: { guestOnly: true } // Sadece giriş yapmamışlar için
  },
  // { // Sprint 1 için
  //   path: '/register',
  //   name: 'register',
  //   component: RegisterPage,
  //   meta: { guestOnly: true }
  // },
  {
    path: '/about', // Örnek
    name: 'about',
    component: () => import('../views/AboutView.vue'), // Lazy loading
    meta: { requiresAuth: false }
  }
  // Diğer route'lar buraya eklenecek
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL), // Vite için doğru BASE_URL kullanımı
  routes
})

// İleride eklenecek Navigation Guards (Yetkilendirme kontrolü)
// router.beforeEach((to, from, next) => {
//   const isAuthenticated = !!localStorage.getItem('authToken'); // Basit kontrol, Pinia store kullanılmalı
//
//   if (to.meta.requiresAuth && !isAuthenticated) {
//     next({ name: 'login' });
//   } else if (to.meta.guestOnly && isAuthenticated) {
//     next({ name: 'home' }); // Veya bir dashboard'a yönlendir
//   } else {
//     next();
//   }
// });

export default router