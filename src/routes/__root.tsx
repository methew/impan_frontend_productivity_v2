import { createRootRoute, Outlet, useRouterState, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { checkAuth } from '@/lib/auth'
import { PerspectivesBar } from '@/components/PerspectivesBar'
import { Toolbar } from '@/components/Toolbar'
import { NewTaskDialog } from '@/components/NewTaskDialog'
import { TaskPaperDialog } from '@/components/TaskPaperDialog'
import { useCreateTask } from '@/hooks/useTasks'
import { SearchProvider } from '@/hooks/useSearch'
import { toast } from 'sonner'
import { APP_VERSION } from '@/version'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  const { t } = useTranslation()
  const [isAuth, setIsAuth] = useState<boolean | null>(null)
  const [showSidebar, setShowSidebar] = useState(true)
  const [showNewTaskDialog, setShowNewTaskDialog] = useState(false)
  const [showTaskPaperDialog, setShowTaskPaperDialog] = useState(false)
  const [currentProjectId, setCurrentProjectId] = useState<string | undefined>(undefined)
  const [isClient, setIsClient] = useState(false)
  const routerState = useRouterState()
  const navigate = useNavigate()
  const currentPath = routerState.location.pathname
  const createTask = useCreateTask()

  // Client-side only initialization
  useEffect(() => {
    setIsClient(true)
    
    // Check auth status
    const check = async () => {
      const auth = await checkAuth()
      setIsAuth(auth)
    }
    check()
    
    // Get current project from URL
    const searchParams = new URLSearchParams(window.location.search)
    setCurrentProjectId(searchParams.get('project') || undefined)
  }, [])

  // Handle auth redirects in separate effect
  useEffect(() => {
    if (!isClient || isAuth === null) return
    
    // 排除登录相关路由的认证检查
    const isAuthPage = currentPath === '/login' || currentPath.startsWith('/oauth/')
    
    // Only redirect if we're sure about the auth state
    if (!isAuth && !isAuthPage) {
      // Use navigate for client-side navigation
      navigate({ to: '/login' })
    }
  }, [isAuth, isClient, currentPath, navigate])

  // Get perspective name from path
  const getPerspectiveName = () => {
    const names: Record<string, string> = {
      '/': t('nav.home'),
      '/inbox': t('nav.inbox'),
      '/projects': t('nav.projects'),
      '/tags': t('nav.tags'),
      '/forecast': t('nav.forecast'),
      '/review': t('nav.review'),
      '/flagged': t('nav.flagged'),
      '/completed': t('nav.completed'),
      '/settings': t('nav.settings'),
    }
    return names[currentPath] || 'ToDo'
  }
  
  // Handle new action button click
  const handleNewAction = () => {
    if (currentPath === '/inbox') {
      // In inbox: create inbox task directly with prompt for quick add
      const title = prompt(t('inbox.addAction') + ':')
      if (!title) return
      
      createTask.mutateAsync({
        title,
        task_type: 'inbox',
      }).then(() => {
        toast.success(t('inbox.actionAdded'))
      }).catch(() => {
        toast.error(t('inbox.addFailed'))
      })
    } else if (currentPath === '/projects' && currentProjectId) {
      // In projects with selected project: open dialog for project task
      setShowNewTaskDialog(true)
    } else {
      // Other views: open new task dialog
      setShowNewTaskDialog(true)
    }
  }

  // Show loading during SSR and initial client render
  if (!isClient || isAuth === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Login page and OAuth callback - render without layout
  if (currentPath === '/login' || currentPath.startsWith('/oauth/')) {
    return <Outlet />
  }

  // Not authenticated - this should be handled by the effect, but as fallback
  if (!isAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Main app layout
  return (
    <SearchProvider>
    <div className="h-screen w-screen flex overflow-hidden bg-background">
      {/* Perspectives Bar - Left Sidebar */}
      {showSidebar && (
        <PerspectivesBar 
          className="w-56 flex-shrink-0 h-full" 
          isAuthenticated={isAuth} 
          onTaskPaperClick={() => setShowTaskPaperDialog(true)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Toolbar */}
        <Toolbar
          perspectiveName={getPerspectiveName()}
          itemCount={0}
          onNewAction={handleNewAction}
          onToggleSidebar={() => setShowSidebar(!showSidebar)}
          showSidebar={showSidebar}
        />

        {/* Content with Outlet */}
        <div className="overflow-hidden min-h-0 relative">
          <Outlet />
          <div className="fixed bottom-2 right-2 text-[10px] text-muted-foreground/60 pointer-events-none select-none z-50">
            {APP_VERSION}
          </div>
        </div>
      </div>
      
      {/* New Task Dialog */}
      <NewTaskDialog
        open={showNewTaskDialog}
        onOpenChange={setShowNewTaskDialog}
        defaultProjectId={currentProjectId}
      />
      
      {/* TaskPaper Quick Input Dialog */}
      <TaskPaperDialog
        open={showTaskPaperDialog}
        onOpenChange={setShowTaskPaperDialog}
      />
    </div>
    </SearchProvider>
  )
}

export default RootLayout
