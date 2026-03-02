import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import {
  Inbox,
  FolderKanban,
  Tags,
  Calendar,
  Flag,
  MapPin,
  RefreshCw,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { QuickOpen } from '@/components/QuickOpen'

// Side navigation items hook
const useNavItems = () => {
  const { t } = useTranslation()
  return [
    { to: '/inbox', label: t('navigation.inbox'), icon: Inbox },
    { to: '/projects', label: t('navigation.projects'), icon: FolderKanban },
    { to: '/tags', label: t('navigation.tags'), icon: Tags },
    { to: '/forecast', label: t('navigation.forecast'), icon: Calendar },
    { to: '/flagged', label: t('navigation.flagged'), icon: Flag },
    { to: '/location', label: t('navigation.location'), icon: MapPin },
    { to: '/review', label: t('navigation.review'), icon: RefreshCw },
  ]
}

// Side navigation component
function SideNavigation({ collapsed, setCollapsed }: { collapsed: boolean; setCollapsed: (v: boolean) => void }) {
  const { t } = useTranslation()
  const navItems = useNavItems()
  return (
    <div
      className={cn(
        'flex flex-col border-r bg-sidebar transition-all duration-300',
        collapsed ? 'w-14' : 'w-56'
      )}
    >
      {/* Collapse toggle */}
      <div className="flex items-center justify-end p-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              '[&.active]:bg-sidebar-accent [&.active]:text-sidebar-accent-foreground',
              collapsed && 'justify-center px-2'
            )}
            title={collapsed ? item.label : undefined}
          aria-label={item.label}
          >
            <item.icon className="h-4 w-4 flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* Settings link */}
      <div className="border-t p-2">
        <Link
          to="/settings"
          className={cn(
            'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            '[&.active]:bg-sidebar-accent [&.active]:text-sidebar-accent-foreground',
            collapsed && 'justify-center px-2'
          )}
          title={collapsed ? t('navigation.settings') : undefined}
          aria-label={t('navigation.settings')}
        >
          <Settings className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>{t('navigation.settings')}</span>}
        </Link>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/_app')({
  beforeLoad: () => {
    // Authentication check is done in __root.tsx
  },
  component: function AppLayout() {
    const [collapsed, setCollapsed] = useState(false)

    return (
      <div className="flex h-[calc(100vh-40px)]">
        <SideNavigation collapsed={collapsed} setCollapsed={setCollapsed} />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
        <QuickOpen />
      </div>
    )
  },
})
