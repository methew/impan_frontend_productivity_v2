import React, { useEffect, useCallback } from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { Toaster } from 'sonner'
import './index.css'
import './i18n'

// Import the generated route tree
import { routeTree } from './routeTree.gen'

// Import auth utilities
import { isAuthenticated, getRefreshToken, setTokens, clearTokens, TOKEN_REFRESH_INTERVAL } from '@/lib/auth'

// Get API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

/**
 * 刷新 Access Token
 * POST /api/v1/core/auth/token/refresh/
 */
const refreshAccessToken = async (): Promise<boolean> => {
  const refresh = getRefreshToken()
  if (!refresh) return false

  try {
    const response = await fetch(`${API_BASE_URL}/core/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    })

    if (!response.ok) throw new Error('Refresh failed')

    const data = await response.json()
    setTokens({ access: data.access, refresh })
    return true
  } catch (error) {
    clearTokens()
    return false
  }
}

// Token Refresh Component
function TokenRefreshProvider({ children }: { children: React.ReactNode }) {
  const doRefresh = useCallback(async () => {
    if (!isAuthenticated()) return
    await refreshAccessToken()
  }, [])

  useEffect(() => {
    // Initial refresh
    doRefresh()

    // Set up interval for token refresh (every 4 minutes)
    const intervalId = setInterval(doRefresh, TOKEN_REFRESH_INTERVAL)
    return () => clearInterval(intervalId)
  }, [doRefresh])

  return <>{children}</>
}

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// Create a new router instance
const router = createRouter({
  routeTree,
  context: {
    queryClient,
    auth: {
      isAuthenticated: isAuthenticated(),
    }
  },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
})

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// Render the app
const rootElement = document.getElementById('root')
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <TokenRefreshProvider>
          <Toaster position="top-right" richColors />
          <RouterProvider router={router} />
        </TokenRefreshProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </React.StrictMode>
  )
}
