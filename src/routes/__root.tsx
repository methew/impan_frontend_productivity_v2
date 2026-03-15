import { createRootRoute, Outlet, useRouterState, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { isAuthenticated } from '@/lib/auth'
import { PerspectivesBar } from '@/components/PerspectivesBar'
import { Toolbar } from '@/components/Toolbar'
import { NewTaskDialog } from '@/components/NewTaskDialog'
import { useCreateTask } from '@/hooks/useTasks'
import { toast } from 'sonner'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  const [isAuth, setIsAuth] = useState<boolean | null>(null)
  const [showSidebar, setShowSidebar] = useState(true)
  const [showNewTaskDialog, setShowNewTaskDialog] = useState(false)
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
    const auth = isAuthenticated()
    setIsAuth(auth)
    
    // Get current project from URL
    const searchParams = new URLSearchParams(window.location.search)
    setCurrentProjectId(searchParams.get('project') || undefined)
  }, [])

  // Handle auth redirects in separate effect
  useEffect(() => {
    if (!isClient || isAuth === null) return
    
    // Only redirect if we're sure about the auth state
    if (!isAuth && currentPath !== '/login') {
      // Use navigate for client-side navigation
      navigate({ to: '/login' })
    }
  }, [isAuth, isClient, currentPath, navigate])

  // Get perspective name from path
  const getPerspectiveName = () => {
    const names: Record<string, string> = {
      '/': '主页',
      '/inbox': '收件箱',
      '/projects': '项目',
      '/tags': '标签',
      '/forecast': '预测',
      '/review': '回顾',
      '/flagged': '已标记',
      '/completed': '已完成',
    }
    return names[currentPath] || 'OmniFocus'
  }
  
  // Handle new action button click
  const handleNewAction = () => {
    if (currentPath === '/inbox') {
      // In inbox: create inbox task directly with prompt for quick add
      const title = prompt('输入新动作标题:')
      if (!title) return
      
      createTask.mutateAsync({
        title,
        task_type: 'inbox',
      }).then(() => {
        toast.success('动作已添加')
      }).catch(() => {
        toast.error('添加失败')
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

  // Login page - render without layout
  if (currentPath === '/login') {
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
    <div className="h-screen w-screen flex overflow-hidden bg-background">
      {/* Perspectives Bar - Left Sidebar */}
      {showSidebar && (
        <PerspectivesBar className="w-56 flex-shrink-0 h-full" isAuthenticated={isAuth} />
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
        <div className="overflow-hidden min-h-0">
          <Outlet />
        </div>
      </div>
      
      {/* New Task Dialog */}
      <NewTaskDialog
        open={showNewTaskDialog}
        onOpenChange={setShowNewTaskDialog}
        defaultProjectId={currentProjectId}
      />
    </div>
  )
}

export default RootLayout
