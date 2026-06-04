// apps/dashboard/src/services/api.ts
// Copy this same file to apps/customer/src/services/api.ts
// and apps/b2b/lib/api.ts

import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env['VITE_API_URL'] ?? 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pv_token')
  if (token) config.headers['Authorization'] = `Bearer ${token}`
  return config
})

// Handle 401 globally — redirect to login
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('pv_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
