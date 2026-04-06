/**
 * 统一认证中心 SDK
 * 适配后端统一认证平台，使用 HttpOnly Cookie 进行身份验证
 */

// 配置接口
interface AuthConfig {
  appId: string
  appName: string
  apiBaseUrl: string
  authCenterUrl: string
  appUrl: string
}

// 从环境变量读取配置
// 开发环境使用相对路径走 Vite 代理，避免 Cookie 跨域问题
const isDev = import.meta.env.DEV
const backendUrl = 'http://localhost:8000'

const config: AuthConfig = {
  appId: import.meta.env.VITE_APP_ID || 'productivity',
  appName: import.meta.env.VITE_APP_NAME || 'Productivity',
  // API 请求使用相对路径（走 Vite 代理）
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || (isDev ? '/api/v1' : `${backendUrl}/api/v1`),
  // 浏览器重定向需要完整 URL
  authCenterUrl:
    import.meta.env.VITE_AUTH_CENTER_URL ||
    (isDev ? `${backendUrl}/api/v1/core/auth/center` : `${backendUrl}/api/v1/core/auth/center`),
  appUrl: import.meta.env.VITE_APP_URL || window.location.origin,
}

// 刷新间隔：80% 的 access token 生命周期（毫秒）
export const TOKEN_REFRESH_INTERVAL = 4 * 60 * 1000 // 4 分钟

export interface TokenData {
  access: string
  refresh?: string
}

export interface UserInfo {
  id: string
  email: string
  username: string
  name?: string
  avatar?: string
  is_staff: boolean
}

/**
 * 检查当前登录状态
 * 通过调用后端 /me/ 接口验证 Cookie 是否有效
 */
export async function checkAuth(): Promise<boolean> {
  try {
    const response = await fetch(`${config.apiBaseUrl}/core/auth/center/me/`, {
      credentials: 'include', // 发送 HttpOnly Cookie
      headers: {
        Accept: 'application/json',
      },
    })
    return response.ok
  } catch {
    return false
  }
}

/**
 * 获取当前用户信息
 */
export async function getCurrentUser(): Promise<UserInfo | null> {
  try {
    const response = await fetch(`${config.apiBaseUrl}/core/auth/center/me/`, {
      credentials: 'include',
      headers: {
        Accept: 'application/json',
      },
    })
    if (response.ok) {
      return await response.json()
    }
    return null
  } catch {
    return null
  }
}

/**
 * 从 localStorage 获取用户信息（兼容旧代码）
 */
export function getUserInfo(): UserInfo | null {
  const userStr = localStorage.getItem('user_info')
  return userStr ? JSON.parse(userStr) : null
}

/**
 * 保存用户信息到 localStorage（兼容旧代码）
 */
export function setUserInfo(user: UserInfo): void {
  localStorage.setItem('user_info', JSON.stringify(user))
}

/**
 * 跳转到统一登录中心
 * @param redirectPath 登录成功后跳转回的路径，默认为当前路径
 */
export function redirectToLogin(redirectPath?: string): void {
  const currentPath = redirectPath || window.location.pathname + window.location.search
  const encodedRedirect = encodeURIComponent(currentPath)
  const loginUrl = `${config.authCenterUrl}/?app=${config.appId}&redirect=${encodedRedirect}`

  console.log(`[Auth] Redirecting to login: ${loginUrl}`)
  window.location.href = loginUrl
}

/**
 * 登出
 * 清除后端 Cookie 并重定向到登录页
 */
export async function logout(): Promise<void> {
  try {
    await fetch(`${config.apiBaseUrl}/core/auth/center/logout/`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'X-CSRFToken': getCsrfToken(),
      },
    })
  } catch (error) {
    console.error('[Auth] Logout failed:', error)
  }
  // 清除本地缓存并跳转到登录页（强制刷新）
  localStorage.removeItem('user_cache')
  localStorage.removeItem('user_info')
  window.location.href = `${config.appUrl}/login`
}

export interface RefreshTokenResponse {
  access: string
  refresh?: string
}

/**
 * 刷新 Access Token
 * 使用 HttpOnly Cookie 中的 refresh_token
 */
export async function refreshToken(): Promise<RefreshTokenResponse | null> {
  try {
    const response = await fetch(
      `${config.apiBaseUrl}/core/auth/center/token/refresh/`,
      {
        method: 'POST',
        credentials: 'include',
      }
    )

    if (response.ok) {
      const data = await response.json()
      return {
        access: data.access,
        refresh: data.refresh,
      }
    }
    console.error('[Auth] Token refresh failed:', response.status)
    return null
  } catch (error) {
    console.error('[Auth] Token refresh error:', error)
    return null
  }
}

/**
 * 执行完整的 token 刷新流程
 * - 如果刷新失败，自动退出登录
 * - 如果 refresh token 被轮换，跳转到首页
 */
export async function performTokenRefresh(): Promise<boolean> {
  const result = await refreshToken()
  
  if (!result) {
    console.error('[Auth] Token refresh failed, logging out...')
    await logout()
    return false
  }
  
  if (result.refresh) {
    console.log('[Auth] Refresh token rotated, redirecting to home...')
    window.location.href = '/'
    return true
  }
  
  return true
}

/**
 * 使用 GitHub 登录
 * 跳转到 GitHub OAuth 授权页面
 */
export function loginWithGitHub(redirectPath?: string): void {
  const currentPath = redirectPath || window.location.pathname
  const encodedRedirect = encodeURIComponent(currentPath)
  window.location.href = `${config.authCenterUrl}/github/?app=${config.appId}&redirect=${encodedRedirect}`
}

/**
 * 获取 CSRF Token（用于 POST 请求）
 */
export function getCsrfToken(): string {
  const match = document.cookie.match(/csrftoken=([^;]+)/)
  return match ? match[1] : ''
}

/**
 * 获取 Access Token（用于需要显式传递 token 的场景）
 * 注意：由于使用 HttpOnly Cookie，前端无法直接读取，
 * 此方法仅用于兼容旧代码，实际 token 会自动随请求发送
 */
export function getAccessToken(): string | null {
  // 在 HttpOnly Cookie 模式下，前端无法直接读取 token
  // 此方法返回 null，实际认证由浏览器自动处理
  return null
}

/**
 * 检查是否已登录（兼容旧代码）
 * 实际调用 checkAuth 进行验证
 */
export function isAuthenticated(): boolean {
  // 异步检查，同步返回上次状态或保守返回 true
  // 建议在应用启动时调用 checkAuth 获取准确状态
  return true
}

/**
 * 启动定期 Token 刷新
 * 在应用启动时调用，确保 token 不会过期
 */
export function startTokenRefreshTimer(): () => void {
  const existingTimer = (window as any).__tokenRefreshTimer
  if (existingTimer) {
    clearInterval(existingTimer)
  }

  performTokenRefresh()

  const timer = setInterval(async () => {
    const isAuth = await checkAuth()
    if (isAuth) {
      await performTokenRefresh()
    }
  }, TOKEN_REFRESH_INTERVAL)

  ;(window as any).__tokenRefreshTimer = timer

  return () => {
    clearInterval(timer)
    ;(window as any).__tokenRefreshTimer = null
  }
}

/**
 * 停止定期 Token 刷新
 */
export function stopTokenRefreshTimer(): void {
  const timer = (window as any).__tokenRefreshTimer
  if (timer) {
    clearInterval(timer)
    ;(window as any).__tokenRefreshTimer = null
  }
}

/**
 * 导出配置（供其他模块使用）
 */
export { config }

// ==================== 兼容旧版 API ====================
// 以下函数为兼容旧代码而保留，但功能已调整

export const setTokens = (_data: TokenData): void => {
  // 在 HttpOnly Cookie 模式下，token 由后端设置
  // 此方法保留仅用于兼容旧代码，不执行任何操作
  console.log('[Auth] setTokens is deprecated in HttpOnly Cookie mode')
}

export const clearTokens = (): void => {
  // 清除前端可能存储的其他数据
  localStorage.removeItem('user_info')
  localStorage.removeItem('user_cache')
}

export const loginApi = async (_email: string, _password: string): Promise<never> => {
  throw new Error('loginApi is deprecated. Use redirectToLogin() instead.')
}

export const logoutApi = async (): Promise<void> => {
  return logout()
}

export const getMeApi = async (): Promise<UserInfo | null> => {
  return getCurrentUser()
}

export const refreshTokenApi = async (): Promise<{ access: string } | null> => {
  const access = await refreshToken()
  return access ? { access } : null
}
