/**
 * OmniFocus 4.8.5-style Toolbar
 * Based on: https://support.omnigroup.com/documentation/omnifocus/universal/4.8.5/en/toolbar
 */
import { 
  Plus,
  Search,
  Settings,
  Flag,
  CheckCircle2,
  Trash2,
  Share2,
  Eye,
  Layout,
  MoreHorizontal,
  Sidebar,
  RotateCcw
} from 'lucide-react'
import { Button } from '@/packages/ui/components/button'
import { Input } from '@/packages/ui/components/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/packages/ui/components/dropdown-menu'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

interface ToolbarProps {
  perspectiveName: string
  itemCount: number
  onNewAction?: () => void
  onToggleSidebar?: () => void
  onSearch?: (query: string) => void
  showSidebar?: boolean
  className?: string
}

export function Toolbar({
  perspectiveName,
  itemCount,
  onNewAction,
  onToggleSidebar,
  onSearch,
  showSidebar = true,
  className,
}: ToolbarProps) {
  const { t } = useTranslation()
  return (
    <div className={cn(
      "h-14 border-b bg-card flex items-center px-4 gap-3",
      className
    )}>
      {/* Left: Sidebar Toggle & Perspective Name */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-9 w-9",
            !showSidebar && "text-muted-foreground"
          )}
          onClick={onToggleSidebar}
          title={t('toolbar.toggleSidebar')}
        >
          <Sidebar className="h-5 w-5" />
        </Button>
        
        <div className="flex items-baseline gap-2">
          <h1 className="text-lg font-semibold">{perspectiveName}</h1>
          <span className="text-sm text-muted-foreground">
            {t('toolbar.itemCount', { count: itemCount })}
          </span>
        </div>
      </div>

      {/* Center: Search */}
      <div className="flex-1 max-w-md mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('toolbar.searchPlaceholder')}
            className="pl-9 h-9"
            onChange={(e) => onSearch?.(e.target.value)}
          />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        {/* New Action */}
        <Button
          size="sm"
          className="gap-1.5"
          onClick={onNewAction}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">{t('toolbar.newAction')}</span>
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* View Options */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Eye className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {t('toolbar.showAvailable')}
            </DropdownMenuItem>
            <DropdownMenuItem>
              <RotateCcw className="h-4 w-4 mr-2" />
              {t('toolbar.showRemaining')}
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Layout className="h-4 w-4 mr-2" />
              {t('toolbar.showAll')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Settings className="h-4 w-4 mr-2" />
              {t('toolbar.viewOptions')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* More Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Flag className="h-4 w-4 mr-2" />
              {t('toolbar.flag')}
            </DropdownMenuItem>
            <DropdownMenuItem>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {t('toolbar.complete')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Share2 className="h-4 w-4 mr-2" />
              {t('toolbar.share')}
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">
              <Trash2 className="h-4 w-4 mr-2" />
              {t('toolbar.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export default Toolbar
