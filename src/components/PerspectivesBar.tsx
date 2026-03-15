/**
 * OmniFocus 4.8.5-style Perspectives Bar
 * Based on: https://support.omnigroup.com/documentation/omnifocus/universal/4.8.5/en/perspectives
 */
import { Link, useRouterState, useNavigate } from '@tanstack/react-router'
import { 
  Inbox, 
  FolderKanban,
  Tags,
  Calendar,
  Flag,
  RefreshCw,
  CheckCircle2,
  Settings,
  LogOut,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getUserInfo, clearTokens } from '@/lib/auth'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/packages/ui/components/dropdown-menu'

import { toast } from 'sonner'

interface PerspectiveItem {
  id: string
  label: string
  icon: React.ElementType
  to: string
  color: string
  badge?: number
}

const PERSPECTIVES: PerspectiveItem[] = [
  { id: 'inbox', label: '收件箱', icon: Inbox, to: '/inbox', color: '#6366f1' },
  { id: 'projects', label: '项目', icon: FolderKanban, to: '/projects', color: '#8b5cf6' },
  { id: 'tags', label: '标签', icon: Tags, to: '/tags', color: '#ec4899' },
  { id: 'forecast', label: '预测', icon: Calendar, to: '/forecast', color: '#10b981' },
  { id: 'flagged', label: '已标记', icon: Flag, to: '/flagged', color: '#f59e0b' },
  { id: 'review', label: '回顾', icon: RefreshCw, to: '/review', color: '#8b5cf6' },
  { id: 'completed', label: '已完成', icon: CheckCircle2, to: '/completed', color: '#10b981' },
]

interface PerspectivesBarProps {
  className?: string
  isAuthenticated?: boolean
}

export function PerspectivesBar({ className, isAuthenticated = false }: PerspectivesBarProps) {
  const routerState = useRouterState()
  const navigate = useNavigate()
  const currentPath = routerState.location.pathname
  const userInfo = isAuthenticated ? getUserInfo() : null

  const handleLogout = () => {
    clearTokens()
    toast.success('已退出登录')
    navigate({ to: '/login' })
  }

  // Get user display name
  const getUserDisplayName = () => {
    if (userInfo?.name) return userInfo.name
    if (userInfo?.email) {
      // Use email prefix as name
      return userInfo.email.split('@')[0]
    }
    return '用户'
  }

  // Get avatar initials
  const getAvatarInitials = () => {
    const name = getUserDisplayName()
    return name.charAt(0).toUpperCase()
  }

  return (
    <div className={cn("flex flex-col h-full bg-card border-r", className)}>
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          透视
        </h2>
      </div>

      {/* Perspectives List */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {PERSPECTIVES.map(perspective => (
          <PerspectiveTab
            key={perspective.id}
            perspective={perspective}
            isActive={currentPath === perspective.to}
          />
        ))}
      </nav>

      {/* Footer - User Info & Settings (only for authenticated users) */}
      {isAuthenticated && (
        <div className="p-2 border-t space-y-1">
          {/* Perspective Settings */}
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent transition-colors">
            <Settings className="h-4 w-4" />
            <span>透视设置</span>
          </button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-accent transition-colors group">
                {/* Avatar */}
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium border border-primary/20">
                  {userInfo?.avatar ? (
                    <img 
                      src={userInfo.avatar} 
                      alt={getUserDisplayName()}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    getAvatarInitials()
                  )}
                </div>
                
                {/* User Name */}
                <span className="flex-1 text-left truncate font-medium text-foreground">
                  {getUserDisplayName()}
                </span>
                
                {/* Chevron */}
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
                {userInfo?.email || ''}
              </div>
              <DropdownMenuSeparator />

              <DropdownMenuItem 
                onClick={handleLogout}
                className="text-red-600 focus:text-red-600"
              >
                <LogOut className="h-4 w-4 mr-2" />
                退出登录
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  )
}

interface PerspectiveTabProps {
  perspective: PerspectiveItem
  isActive: boolean
}

function PerspectiveTab({ perspective, isActive }: PerspectiveTabProps) {
  const Icon = perspective.icon

  return (
    <Link
      to={perspective.to}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
        isActive 
          ? "bg-primary/10 text-primary shadow-sm" 
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      <div 
        className="w-5 h-5 rounded flex items-center justify-center"
        style={{ 
          backgroundColor: isActive ? `${perspective.color}20` : 'transparent',
          color: isActive ? perspective.color : 'currentColor'
        }}
      >
        <Icon className="h-4 w-4" />
      </div>
      <span className="flex-1">{perspective.label}</span>
      {perspective.badge !== undefined && perspective.badge > 0 && (
        <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
          {perspective.badge}
        </span>
      )}
    </Link>
  )
}

export default PerspectivesBar
