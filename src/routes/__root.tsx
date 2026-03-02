import { createRootRoute, Link, Outlet, redirect } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { 
  User, 
  LogOut, 
  Settings, 
  ChevronDown,
  Loader2
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { isAuthenticated } from '@/lib/auth'
import { useAuthUser, useLogout, getUserDisplayName, getUserInitials } from '@/hooks/useAuthUser'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'

// Top navigation component
function TopNavigation() {
  const { t } = useTranslation()
  const { data: user, isLoading: isLoadingUser } = useAuthUser()
  const logout = useLogout()

  const handleLogout = () => {
    logout.mutate()
  }

  // Not logged in state
  if (!isAuthenticated()) {
    return (
      <div className="p-2 flex gap-2 items-center">
        <Link to="/" className="[&.active]:font-bold">
          {t('navigation.home')}
        </Link>
        <Link to="/dashboard" className="[&.active]:font-bold">
          {t('navigation.dashboard')}
        </Link>
        <div className="flex-1" />
        <Link to="/login" className="[&.active]:font-bold">
          {t('navigation.login')}
        </Link>
      </div>
    )
  }

  // Logged in state
  return (
    <div className="p-2 flex gap-2 items-center">
      <Link to="/" className="[&.active]:font-bold">
        {t('navigation.home')}
      </Link>
      <Link to="/dashboard" className="[&.active]:font-bold">
        {t('navigation.dashboard')}
      </Link>
      
      <div className="flex-1" />

      {/* User Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback 
                className="text-xs text-primary-foreground"
                style={{ backgroundColor: 'oklch(0.696 0.17 162.48)' }}
              >
                {isLoadingUser ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  getUserInitials(user)
                )}
              </AvatarFallback>
            </Avatar>
            {isLoadingUser ? (
              <Skeleton className="h-4 w-16" />
            ) : (
              <span className="max-w-[100px] truncate hidden sm:inline">
                {getUserDisplayName(user)}
              </span>
            )}
            <ChevronDown className="size-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium">{getUserDisplayName(user)}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/settings">
              <User className="mr-2 size-4" />
              {t('navigation.profile')}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/settings">
              <Settings className="mr-2 size-4" />
              {t('navigation.settings')}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={handleLogout}
            disabled={logout.isPending}
            className="text-red-600 focus:text-red-600"
          >
            {logout.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <LogOut className="mr-2 size-4" />
            )}
            {t('navigation.logout')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export const Route = createRootRoute({
  beforeLoad: ({ location }) => {
    // Allow access to login page
    if (location.pathname === '/login') {
      return
    }
    // Redirect to login if not authenticated
    if (!isAuthenticated()) {
      throw redirect({ to: '/login' })
    }
  },
  component: () => (
    <>
      <TopNavigation />
      <hr />
      <Outlet />
      <TanStackRouterDevtools />
    </>
  ),
})
