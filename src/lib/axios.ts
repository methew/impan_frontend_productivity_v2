import axios from 'axios'
import { 
  getAccessToken, 
  getRefreshToken, 
  clearTokens,
  isTokenExpired,
  refreshTokenApi 
} from './auth'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1/productivity',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

// Global flag to prevent concurrent token refresh
let isRefreshing = false
let refreshSubscribers: Array<(token: string | null) => void> = []

function subscribeTokenRefresh(callback: (token: string | null) => void) {
  refreshSubscribers.push(callback)
}

function onTokenRefreshed(newToken: string | null) {
  refreshSubscribers.forEach((callback) => callback(newToken))
  refreshSubscribers = []
}

apiClient.interceptors.request.use(
  async (config) => {
    // Check if token is about to expire and refresh proactively
    if (isTokenExpired()) {
      const refreshToken = getRefreshToken()
      if (refreshToken) {
        try {
          const response = await refreshTokenApi(refreshToken)
          config.headers.Authorization = `Bearer ${response.access}`
          return config
        } catch {
          // Continue with current token
        }
      }
    }
    
    const token = getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Flag to prevent multiple redirects
let isRedirecting = false

apiClient.interceptors.response.use(
  (response) => {
    // Debug: log projects API response
    if (response.config.url?.includes('/projects/') && !response.config.url?.includes('/projects/\\d')) {
      console.log('API Response [projects]:', response.config.url, response.data)
    }
    return response
  },
  async (error) => {
    console.error('API Error:', error.response?.status, error.response?.data)
    
    const originalRequest = error.config
    
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }
    
    originalRequest._retry = true
    
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((newToken: string | null) => {
          if (newToken) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`
            resolve(apiClient(originalRequest))
          } else {
            reject(new Error('Token refresh failed'))
          }
        })
      })
    }
    
    isRefreshing = true
    
    try {
      const refreshToken = getRefreshToken()
      if (!refreshToken) {
        throw new Error('No refresh token')
      }
      
      const response = await refreshTokenApi(refreshToken)
      onTokenRefreshed(response.access)
      
      originalRequest.headers.Authorization = `Bearer ${response.access}`
      return apiClient(originalRequest)
    } catch (refreshError) {
      onTokenRefreshed(null)
      clearTokens()
      
      const currentPath = window.location.pathname
      if (currentPath !== '/login' && !isRedirecting) {
        isRedirecting = true
        setTimeout(() => {
          window.location.href = '/login'
          setTimeout(() => { isRedirecting = false }, 500)
        }, 100)
      }
      
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export default apiClient
