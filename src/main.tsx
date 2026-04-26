import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { routeTree } from './routeTree.gen'
import './i18n'
import './styles.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
})

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  scrollRestoration: true,
  context: { queryClient },
})

// 恢复上次访问的路由
const savedPath = sessionStorage.getItem('last_route')
const currentPath = window.location.pathname
const isAuthPage = currentPath === '/login' || currentPath.startsWith('/oauth/')
const isHomePage = currentPath === '/'
if (savedPath && !isAuthPage && isHomePage && savedPath !== currentPath) {
  void router.navigate({ to: savedPath, replace: true })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('app')!

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster position="top-center" />
    </QueryClientProvider>
  )
}
