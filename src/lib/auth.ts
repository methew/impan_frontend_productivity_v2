// Token management utilities
const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'
const TOKEN_EXPIRES_KEY = 'token_expires_at'

// 4 minutes in milliseconds (token refresh interval)
export const TOKEN_REFRESH_INTERVAL = 4 * 60 * 1000

export interface TokenData {
  access: string
  refresh: string
  access_expires?: string
  refresh_expires?: string
}

export const setTokens = (data: TokenData): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, data.access)
  localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh)
  // Set expiration time (access token typically expires in 5 minutes)
  const expiresAt = Date.now() + 5 * 60 * 1000
  localStorage.setItem(TOKEN_EXPIRES_KEY, expiresAt.toString())
}

export const getAccessToken = (): string | null => {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export const getRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export const clearTokens = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(TOKEN_EXPIRES_KEY)
}

export const isTokenExpired = (): boolean => {
  const expiresAt = localStorage.getItem(TOKEN_EXPIRES_KEY)
  if (!expiresAt) return true
  // Token is considered expired 30 seconds before actual expiration
  return Date.now() > parseInt(expiresAt) - 30000
}

export const isAuthenticated = (): boolean => {
  return !!getAccessToken() && !!getRefreshToken()
}

// Get API base URL
const getApiBaseUrl = (): string => {
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'
}

/**
 * 用户登录
 * POST /api/v1/core/auth/token/
 * 返回完整的 access 和 refresh token
 */
export const loginApi = async (email: string, password: string): Promise<TokenData> => {
  const API_BASE_URL = getApiBaseUrl()
  
  const response = await fetch(`${API_BASE_URL}/core/auth/token/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || 'Login failed')
  }

  return response.json()
}

/**
 * 刷新 Token
 * POST /api/v1/core/auth/token/refresh/
 * 支持从请求体传递 refresh token
 */
export const refreshTokenApi = async (refresh: string): Promise<{ access: string; access_expires?: string }> => {
  const API_BASE_URL = getApiBaseUrl()
  
  const response = await fetch(`${API_BASE_URL}/core/auth/token/refresh/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh }),
  })

  if (!response.ok) {
    throw new Error('Token refresh failed')
  }

  return response.json()
}

/**
 * 用户登出
 * POST /api/v1/core/auth/token/blacklist/
 * 将 refresh token 加入黑名单
 */
export const logoutApi = async (refresh: string): Promise<void> => {
  const API_BASE_URL = getApiBaseUrl()
  
  await fetch(`${API_BASE_URL}/core/auth/token/blacklist/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh }),
  })
}

/**
 * 获取当前用户信息
 * GET /api/v1/core/auth/me/
 */
export const getMeApi = async (accessToken: string): Promise<{
  id: number
  username: string
  email: string
  is_staff: boolean
  is_superuser: boolean
  date_joined: string
}> => {
  const API_BASE_URL = getApiBaseUrl()
  
  const response = await fetch(`${API_BASE_URL}/core/auth/me/`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to get user info')
  }

  return response.json()
}
