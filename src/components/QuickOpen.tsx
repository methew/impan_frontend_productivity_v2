import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Search, X, Inbox, FolderKanban, Tags, Calendar, Flag, MapPin, RefreshCw, ListTodo } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useFolders } from '@/hooks/useFolders'
import { useProjects } from '@/hooks/useProjects'
import { useTags } from '@/hooks/useTags'
import { useInboxTasks, useFlaggedTasks } from '@/hooks/useTasks'

interface QuickOpenItem {
  id: string
  type: 'perspective' | 'folder' | 'project' | 'tag' | 'task'
  title: string
  subtitle?: string
  icon: React.ReactNode
  path: string
  color?: string
}

export function QuickOpen() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const navigate = useNavigate()

  // Fetch data
  const { data: foldersData } = useFolders()
  const { data: projectsData } = useProjects()
  const { data: tagsData } = useTags()
  const { data: inboxTasks } = useInboxTasks()
  const { data: flaggedTasks } = useFlaggedTasks()

  // Build search items
  const items = useMemo<QuickOpenItem[]>(() => {
    const list: QuickOpenItem[] = []

    // Perspectives (always available)
    list.push(
      { id: 'inbox', type: 'perspective', title: t('navigation.inbox'), icon: <Inbox className="w-4 h-4" />, path: '/inbox', color: 'text-blue-500' },
      { id: 'projects', type: 'perspective', title: t('navigation.projects'), icon: <FolderKanban className="w-4 h-4" />, path: '/projects', color: 'text-green-500' },
      { id: 'tags', type: 'perspective', title: t('navigation.tags'), icon: <Tags className="w-4 h-4" />, path: '/tags', color: 'text-orange-500' },
      { id: 'forecast', type: 'perspective', title: t('navigation.forecast'), icon: <Calendar className="w-4 h-4" />, path: '/forecast', color: 'text-purple-500' },
      { id: 'flagged', type: 'perspective', title: t('navigation.flagged'), icon: <Flag className="w-4 h-4" />, path: '/flagged', color: 'text-red-500' },
      { id: 'location', type: 'perspective', title: t('navigation.location'), icon: <MapPin className="w-4 h-4" />, path: '/location', color: 'text-teal-500' },
      { id: 'review', type: 'perspective', title: t('navigation.review'), icon: <RefreshCw className="w-4 h-4" />, path: '/review', color: 'text-indigo-500' },
    )

    // Folders
    foldersData?.results.forEach((folder) => {
      list.push({
        id: `folder-${folder.id}`,
        type: 'folder',
        title: folder.name,
        icon: <FolderKanban className="w-4 h-4" />,
        path: '/projects',
        color: 'text-blue-400',
      })
    })

    // Projects
    projectsData?.results.forEach((project) => {
      list.push({
        id: `project-${project.id}`,
        type: 'project',
        title: project.title,
        subtitle: project.folder_name || undefined,
        icon: <ListTodo className="w-4 h-4" />,
        path: '/projects',
        color: 'text-green-400',
      })
    })

    // Tags
    tagsData?.results.forEach((tag) => {
      list.push({
        id: `tag-${tag.id}`,
        type: 'tag',
        title: tag.title_zh || tag.title,
        icon: <Tags className="w-4 h-4" />,
        path: '/tags',
        color: 'text-orange-400',
      })
    })

    // Inbox Tasks
    inboxTasks?.results.forEach((task) => {
      list.push({
        id: `task-${task.id}`,
        type: 'task',
        title: task.title,
        subtitle: 'Inbox',
        icon: <Inbox className="w-4 h-4" />,
        path: '/inbox',
        color: 'text-blue-400',
      })
    })

    // Flagged Tasks
    flaggedTasks?.results.forEach((task) => {
      list.push({
        id: `flagged-${task.id}`,
        type: 'task',
        title: task.title,
        subtitle: task.project_name || 'Flagged',
        icon: <Flag className="w-4 h-4" />,
        path: '/flagged',
        color: 'text-red-400',
      })
    })

    return list
  }, [foldersData, projectsData, tagsData, inboxTasks, flaggedTasks, t])

  // Filter items
  const filteredItems = useMemo(() => {
    if (!query.trim()) return items.slice(0, 10)
    const q = query.toLowerCase()
    return items.filter((item) => 
      item.title.toLowerCase().includes(q) ||
      item.subtitle?.toLowerCase().includes(q)
    ).slice(0, 15)
  }, [items, query])

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, filteredItems.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && filteredItems[selectedIndex]) {
      e.preventDefault()
      handleSelect(filteredItems[selectedIndex])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const handleSelect = (item: QuickOpenItem) => {
    navigate({ to: item.path })
    setOpen(false)
    setQuery('')
    setSelectedIndex(0)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 gap-0 max-w-lg">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <Search className="w-5 h-5 text-muted-foreground" />
          <Input
            placeholder={t('quickOpen.placeholder')}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="p-1 hover:bg-muted rounded"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto py-2">
          {filteredItems.length === 0 ? (
            <div className="px-4 py-8 text-center text-muted-foreground text-sm">
              {t('quickOpen.noResults')}
            </div>
          ) : (
            <div className="space-y-1 px-2">
              {filteredItems.map((item, index) => (
                <button
                  key={item.id}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded text-left transition-colors',
                    index === selectedIndex 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-muted'
                  )}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <span className={cn(
                    'flex-shrink-0',
                    index === selectedIndex ? 'text-primary-foreground' : item.color
                  )}>
                    {item.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{item.title}</div>
                    {item.subtitle && (
                      <div className={cn(
                        'text-xs truncate',
                        index === selectedIndex ? 'text-primary-foreground/80' : 'text-muted-foreground'
                      )}>
                        {item.subtitle}
                      </div>
                    )}
                  </div>
                  <span className={cn(
                    'text-xs capitalize',
                    index === selectedIndex ? 'text-primary-foreground/60' : 'text-muted-foreground'
                  )}>
                    {t(`quickOpen.types.${item.type}`)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/50 text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>↑↓ {t('quickOpen.navigate')}</span>
            <span>↵ {t('quickOpen.select')}</span>
            <span>Esc {t('quickOpen.close')}</span>
          </div>
          <span>{t('quickOpen.shortcut')}</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
