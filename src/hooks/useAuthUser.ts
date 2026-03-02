import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { 
  getMeApi, 
  getAccessToken, 
  clearTokens, 
  logoutApi, 
  getRefreshToken
} from '@/lib/auth'

export interface User {
  id: number
  username: string
  email: string
  is_staff: boolean
  is_superuser: boolean
  date_joined: string
}

const USER_CACHE_KEY = 'user_cache'

// 从 localStorage 获取缓存的用户
function getCachedUser(): User | null {
  try {
    const cached = localStorage.getItem(USER_CACHE_KEY)
    return cached ? JSON.parse(cached) : null
  } catch {
    return null
  }
}

// 缓存用户到 localStorage
export function cacheUser(user: User | null) {
  if (user) {
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user))
  } else {
    localStorage.removeItem(USER_CACHE_KEY)
  }
}

// 获取当前用户信息
export function useAuthUser() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const token = getAccessToken()
      if (!token) {
        throw new Error('No access token')
      }
      const user = await getMeApi(token)
      // 更新缓存
      cacheUser(user)
      return user
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    // 使用缓存的用户作为初始数据，避免加载闪烁
    initialData: () => {
      const cached = getCachedUser()
      return cached || undefined
    },
  })
}

// 登出
export function useLogout() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const refreshToken = getRefreshToken()
      if (refreshToken) {
        try {
          await logoutApi(refreshToken)
        } catch (error) {
          // 即使黑名单失败也继续清除本地 token
          console.error('Logout API failed:', error)
        }
      }
      clearTokens()
      // 清除用户缓存
      cacheUser(null)
    },
    onSuccess: () => {
      // 清除所有缓存
      queryClient.clear()
      toast.success('Logged out successfully')
      navigate({ to: '/login' })
    },
    onError: () => {
      // 即使失败也清除本地状态
      clearTokens()
      cacheUser(null)
      queryClient.clear()
      navigate({ to: '/login' })
    },
  })
}

// 获取用户显示名称
export function getUserDisplayName(user: User | undefined): string {
  if (!user) return 'User'
  return user.username || user.email.split('@')[0]
}

// 获取用户首字母
export function getUserInitials(user: User | undefined): string {
  if (!user) return 'U'
  if (user.username) {
    return user.username.slice(0, 2).toUpperCase()
  }
  return user.email.slice(0, 2).toUpperCase()
}
