import { defineStore } from 'pinia'
import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token') || null,
    isAuthenticated: !!localStorage.getItem('token')
  }),

  actions: {
    async login(email, password) {
      try {
        const response = await api.post('/auth/login', { email, password })
        this.token = response.data.data.token
        this.user = response.data.data.user
        localStorage.setItem('token', this.token)
        this.isAuthenticated = true
        return response.data
      } catch (error) {
        throw error.response?.data || error
      }
    },

    async register(name, email, password, tenantName) {
      try {
        const response = await api.post('/auth/register', {
          name,
          email,
          password,
          tenantName
        })
        this.token = response.data.data.token
        this.user = response.data.data.user
        localStorage.setItem('token', this.token)
        this.isAuthenticated = true
        return response.data
      } catch (error) {
        throw error.response?.data || error
      }
    },

    async fetchUser() {
      if (!this.token) return
      
      try {
        const response = await api.get('/auth/me')
        this.user = response.data.data
      } catch (error) {
        this.logout()
      }
    },

    logout() {
      this.user = null
      this.token = null
      this.isAuthenticated = false
      localStorage.removeItem('token')
    }
  }
})
