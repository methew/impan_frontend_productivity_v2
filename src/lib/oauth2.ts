/**
 * OAuth 2.0 客户端 SDK
 * 符合 RFC 6749 和 RFC 7636 (PKCE)
 * 
 * 流程:
 * 1. 生成 PKCE 参数 (code_verifier, code_challenge)
 * 2. 重定向到授权端点 /authorize
 * 3. 用户登录并授权
 * 4. 后端重定向回 callback?code=xxx&state=xxx
 * 5. 用 code + code_verifier 换取 access_token
 * 6. 将 token 设置到 Cookie
 */

import { config } from './auth'

// ==================== PKCE 工具 ====================

/**
 * 生成随机字符串
 */
function generateRandomString(length: number = 32): string {
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return base64URLEncode(array)
}

/**
 * Base64URL 编码
 */
function base64URLEncode(buffer: Uint8Array): string {
  return btoa(String.fromCharCode(...buffer))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

/**
 * 生成 PKCE 参数对
 * @returns {codeVerifier, codeChallenge}
 */
async function generatePKCE(): Promise<{ codeVerifier: string; codeChallenge: string }> {
  const codeVerifier = generateRandomString(32)
  
  const encoder = new TextEncoder()
  const data = encoder.encode(codeVerifier)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = new Uint8Array(hashBuffer)
  const codeChallenge = base64URLEncode(hashArray)
  
  return { codeVerifier, codeChallenge }
}

// ==================== 存储管理 ====================

const STORAGE_KEY = 'oauth2_session'

interface OAuthSession {
  state: string
  codeVerifier: string
  redirectPath: string
  appId: string
  createdAt: number
}

/**
 * 保存 OAuth 会话
 */
function saveSession(session: OAuthSession) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

/**
 * 获取并清除 OAuth 会话
 */
function getSession(): OAuthSession | null {
  const data = sessionStorage.getItem(STORAGE_KEY)
  if (data) {
    sessionStorage.removeItem(STORAGE_KEY)
    return JSON.parse(data)
  }
  return null
}

// ==================== OAuth 2.0 流程 ====================

/**
 * 启动 OAuth 2.0 登录流程
 * 
 * @param options 登录选项
 * @param options.redirectPath 登录成功后跳转路径，默认为当前路径
 */
export async function startOAuth2Login(options: { redirectPath?: string } = {}): Promise<void> {
  // 默认跳转到当前路径，但排除登录相关页面避免死循环
  const currentPath = window.location.pathname
  const isAuthPage = currentPath === '/login' || currentPath.startsWith('/oauth/')
  const defaultRedirect = isAuthPage ? '/' : currentPath
  const { redirectPath = defaultRedirect } = options
  
  // 1. 生成 PKCE 参数
  const { codeVerifier, codeChallenge } = await generatePKCE()
  
  // 2. 生成 state
  const state = generateRandomString(16)
  
  // 3. 保存会话
  saveSession({
    state,
    codeVerifier,
    redirectPath,
    appId: config.appId,
    createdAt: Date.now(),
  })
  
  // 4. 构建授权 URL
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.appId,  // bill
    redirect_uri: `${config.appUrl}/oauth/callback`,
    scope: '',
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  })
  
  const authUrl = `${config.authCenterUrl}/authorize/?${params.toString()}`
  
  // 5. 重定向到授权端点
  window.location.href = authUrl
}

/**
 * 检查当前 URL 是否是 OAuth 回调
 */
export function isOAuth2Callback(url: string = window.location.href): boolean {
  return url.includes('code=') && url.includes('state=')
}

/**
 * 处理 OAuth 2.0 回调
 * 
 * @param url 回调 URL，默认为当前 URL
 * @returns 处理结果
 */
export async function handleOAuth2Callback(
  url: string = window.location.href
): Promise<{ success: boolean; error?: string; redirectPath?: string }> {
  const urlObj = new URL(url)
  const params = urlObj.searchParams
  
  const code = params.get('code')
  const state = params.get('state')
  const error = params.get('error')
  const errorDescription = params.get('error_description')
  
  // 检查错误
  if (error) {
    return { success: false, error: errorDescription || error }
  }
  
  if (!code || !state) {
    return { success: false, error: 'Missing authorization code or state' }
  }
  
  // 获取会话
  const session = getSession()
  if (!session) {
    return { success: false, error: 'Session expired or invalid' }
  }
  
  // 验证 state
  if (session.state !== state) {
    return { success: false, error: 'Invalid state parameter' }
  }
  
  // 检查会话是否过期（10分钟）
  if (Date.now() - session.createdAt > 10 * 60 * 1000) {
    return { success: false, error: 'Session expired' }
  }
  
  // 用 code 换取 token
  // 强制使用相对路径走 Vite 代理，避免 CORS 问题
  const apiBasePath = '/api/v1/core/auth/center'
  console.log('[OAuth2] Using apiBasePath:', apiBasePath)
  try {
    const tokenUrl = `${apiBasePath}/token/`
    console.log('[OAuth2] Fetching token from:', tokenUrl)
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        client_id: config.appId,
        redirect_uri: `${config.appUrl}/oauth/callback`,
        code_verifier: session.codeVerifier,
      }),
      credentials: 'include',
    })
    
    console.log('[OAuth2] Token response status:', tokenResponse.status)
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('[OAuth2] Token exchange failed:', errorText)
      try {
        const errorData = JSON.parse(errorText)
        return { 
          success: false, 
          error: errorData.error_description || 'Token exchange failed' 
        }
      } catch {
        return { success: false, error: 'Token exchange failed: ' + errorText }
      }
    }
    
    const tokenData = await tokenResponse.json()
    console.log('[OAuth2] Token exchange success, got access_token')
    
    // 将 token 设置到 Cookie
    const cookieUrl = `${apiBasePath}/token/cookie/`
    console.log('[OAuth2] Setting cookie at:', cookieUrl)
    const cookieResponse = await fetch(cookieUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        client_id: config.appId,
      }),
      credentials: 'include',
    })
    
    console.log('[OAuth2] Set cookie response:', cookieResponse.status, cookieResponse.statusText)
    
    if (!cookieResponse.ok) {
      const errorText = await cookieResponse.text()
      console.error('[OAuth2] Set cookie failed:', errorText)
      return { success: false, error: 'Failed to set authentication cookie: ' + errorText }
    }
    
    return {
      success: true,
      redirectPath: session.redirectPath,
    }
  } catch (error) {
    console.error('[OAuth2] Exception during callback:', error)
    return { success: false, error: 'Network error: ' + (error instanceof Error ? error.message : String(error)) }
  }
}

/**
 * 清除 OAuth 相关存储
 */
export function clearOAuth2Storage(): void {
  sessionStorage.removeItem(STORAGE_KEY)
}

// ==================== 兼容旧 API ====================

/**
 * 重定向到登录（使用 OAuth 2.0）
 * 兼容旧的 redirectToLogin 函数
 */
export function redirectToLogin(redirectPath?: string): void {
  startOAuth2Login({ redirectPath })
}

/**
 * 检查认证状态
 */
export async function checkAuth(): Promise<boolean> {
  try {
    const response = await fetch(`${config.apiBaseUrl}/core/auth/center/me/`, {
      credentials: 'include',
    })
    return response.ok
  } catch {
    return false
  }
}
