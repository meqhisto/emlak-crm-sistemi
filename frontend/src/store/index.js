import { defineStore } from 'pinia';
// import apiClient from '../../services/apiClient'; // Sprint 1'de kullanılacak

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('authToken') || null,
    isAuthenticated: !!localStorage.getItem('authToken'),
    // loading: false,
    // error: null
  }),
  getters: {
    // currentUser: (state) => state.user,
    // isLoggedIn: (state) => !!state.token,
  },
  actions: {
    // async login(credentials) { /* ... Sprint 1 ... */ },
    // async register(userData) { /* ... Sprint 1 ... */ },
    // async logout() { /* ... Sprint 1 ... */ },
    // async fetchUser() { /* ... Sprint 1 ... */ }
  }
});