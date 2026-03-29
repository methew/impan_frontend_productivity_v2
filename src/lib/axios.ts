import axios, { AxiosError } from 'axios'
import { refreshToken, redirectToLogin, getCsrfToken, config } from './auth'

const apiClient = axios.create({
  baseURL: config.apiBaseUrl,
  withCredentials: true, // 关键：跨域携带 Cookie
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 30000,
})

// 请求拦截器：添加 CSRF Token（用于 POST/PUT/DELETE）
apiClient.interceptors.request.use((config) => {
  if (
    ['post', 'put', 'patch', 'delete'].includes(
      config.method?.toLowerCase() || ''
    )
  ) {
    const csrfToken = getCsrfToken()
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken
    }
  }
  return config
})

// 响应拦截器：处理 401 自动刷新
let isRefreshing = false
let refreshSubscribers: ((success: boolean) => void)[] = []

function subscribeTokenRefresh(callback: (success: boolean) => void) {
  refreshSubscribers.push(callback)
}

function onTokenRefreshed(success: boolean) {
  refreshSubscribers.forEach((callback) => callback(success))
  refreshSubscribers = []
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any & { _retry?: boolean }

    // 401 未授权处理
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      // 登录相关接口 401 直接跳转登录页
      if (originalRequest.url?.includes('/auth/')) {
        redirectToLogin()
        return Promise.reject(error)
      }

      if (isRefreshing) {
        // 正在刷新，等待结果
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((success) => {
            if (success) {
              resolve(apiClient(originalRequest))
            } else {
              reject(error)
            }
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const newToken = await refreshToken()
        if (newToken) {
          onTokenRefreshed(true)
          isRefreshing = false
          return apiClient(originalRequest)
        }
      } catch (refreshError) {
        console.error('[Auth] Token refresh failed:', refreshError)
      }

      isRefreshing = false
      onTokenRefreshed(false)

      // 刷新失败，跳转登录
      redirectToLogin()
      return Promise.reject(error)
    }

    return Promise.reject(error)
  }
)

export default apiClient
