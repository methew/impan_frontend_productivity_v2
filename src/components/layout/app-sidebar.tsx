"use client"

import { Link } from "@tanstack/react-router"
import { useTranslation } from 'react-i18next'
import {
  FolderKanban,
  CheckSquare,
  LayoutDashboard,
  LogOut,
  Settings,
  Inbox,
  Flag,
  Clock,
  FolderOpen,
  Target,
  User,
  Loader2,
  ChevronUp,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { useActiveFocusMode } from "@/hooks"
import { useAuthUser, useLogout, getUserDisplayName, getUserInitials } from "@/hooks/useAuthUser"

// Navigation items using hooks
const useMainNavItems = () => {
  const { t } = useTranslation()
  return [
    { title: t('navigation.dashboard'), url: "/dashboard", icon: LayoutDashboard },
    { title: t('navigation.inbox'), url: "/tasks?filter=inbox", icon: Inbox },
    { title: t('navigation.flagged'), url: "/tasks?filter=flagged", icon: Flag },
    { title: t('navigation.today'), url: "/tasks?filter=today", icon: Clock },
    { title: t('navigation.projects'), url: "/projects", icon: FolderKanban },
    { title: t('common.tasks'), url: "/tasks", icon: CheckSquare },
  ]
}

const useSettingsNavItems = () => {
  const { t } = useTranslation()
  return [
    { title: t('common.folders') || 'Folders', url: "/folders", icon: FolderOpen },
    { title: t('navigation.settings'), url: "/settings", icon: Settings },
  ]
}

export function AppSidebar() {
  const { t } = useTranslation()
  const mainNavItems = useMainNavItems()
  const settingsNavItems = useSettingsNavItems()
  const { data: activeFocusMode } = useActiveFocusMode()
  const { data: user, isLoading: isLoadingUser } = useAuthUser()
  const logout = useLogout()

  const handleLogout = () => {
    logout.mutate()
  }

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/dashboard">
                <div 
                  className="flex aspect-square size-8 items-center justify-center rounded-lg text-sidebar-primary-foreground"
                  style={{ backgroundColor: 'oklch(0.696 0.17 162.48)' }}
                >
                  <Target className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{t('sidebar.appName')}</span>
                  <span className="truncate text-xs">{t('sidebar.appDescription')}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Focus Mode Indicator */}
        {activeFocusMode && (
          <SidebarGroup>
            <SidebarGroupLabel>{t('sidebar.focusMode')}</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="px-3 py-2 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-sm font-medium text-emerald-600">{activeFocusMode.name}</p>
                <p className="text-xs text-emerald-600/70">{t('sidebar.focusActive')}</p>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>{t('navigation.main')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t('navigation.organization')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {/* User Menu */}
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback 
                      className="rounded-lg text-sidebar-primary-foreground"
                      style={{ backgroundColor: 'oklch(0.696 0.17 162.48)' }}
                    >
                      {isLoadingUser ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        getUserInitials(user)
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    {isLoadingUser ? (
                      <>
                        <Skeleton className="h-4 w-20 mb-1" />
                        <Skeleton className="h-3 w-24" />
                      </>
                    ) : (
                      <>
                        <span className="truncate font-semibold">{getUserDisplayName(user)}</span>
                        <span className="truncate text-xs">{user?.email}</span>
                      </>
                    )}
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width]"
              >
                <DropdownMenuItem asChild>
                  <div className="flex items-center cursor-pointer">
                    <User className="mr-2 size-4" />
                    <span>{t('navigation.profile')}</span>
                  </div>
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
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
