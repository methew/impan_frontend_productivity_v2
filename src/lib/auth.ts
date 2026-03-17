const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'

export interface TokenData {
  access: string
  refresh: string
  user?: {
    id: string
    email: string
    name?: string
  }
}

export const setTokens = (data: TokenData): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, data.access)
  localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh)
}

export const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  } catch {
    return null
  }
}

export const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  } catch {
    return null
  }
}

export const clearTokens = (): void => {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  } catch {
    // ignore
  }
}

export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false
  try {
    return !!localStorage.getItem(ACCESS_TOKEN_KEY)
  } catch {
    return false
  }
}

export interface UserInfo {
  id: string
  email: string
  name?: string
  avatar?: string
}

export const getUserInfo = (): UserInfo | null => {
  if (typeof window === 'undefined') return null
  try {
    const userStr = localStorage.getItem('user_info')
    if (userStr) {
      return JSON.parse(userStr)
    }
    return null
  } catch {
    return null
  }
}

export const setUserInfo = (user: UserInfo): void => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('user_info', JSON.stringify(user))
  } catch {
    // ignore
  }
}

// Get API base URL
// Extracts the base /api/v1 path from VITE_API_BASE_URL, removing any module-specific suffix
const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'
  // If URL contains /api/v1/, extract just up to /api/v1 (remove module suffix like /accounting, /writing, etc.)
  const match = envUrl.match(/^(.*?\/api\/v1)/)
  return match ? match[1] : 'http://localhost:8000/api/v1'
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
export const refreshTokenApi = async (refresh: string): Promise<{ access: string }> => {
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
