const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'

export interface TokenData {
  access: string
  refresh: string
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
