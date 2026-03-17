/**
 * OmniFocus 4.8.5-style Outline
 * Based on: https://support.omnigroup.com/documentation/omnifocus/universal/4.8.5/en/outline
 */
import { useState } from 'react'
import { 
  ChevronRight, 
  ChevronDown,
  Flag,
  FileText,
  Calendar,
  Clock,
  FolderKanban
} from 'lucide-react'
import { cn, formatRelativeDate } from '@/lib/utils'
import type { Tag } from '@/types'
import { useTranslation } from 'react-i18next'

// ============================================================================
// Types
// ============================================================================

export interface OutlineItem {
  id: string
  title: string
  type: 'task' | 'project' | 'group' | 'inbox'
  status?: 'active' | 'on_hold' | 'completed' | 'dropped'
  project_type?: 'sequential' | 'parallel' | 'single_action'
  completed?: boolean
  flagged?: boolean
  due_date?: string | null
  defer_date?: string | null
  planned_date?: string | null
  has_note?: boolean
  has_attachments?: boolean
  tags?: Tag[]
  project_title?: string
  estimated_duration?: number
  children?: OutlineItem[]
  expanded?: boolean
  level?: number
}

interface OutlineProps {
  items: OutlineItem[]
  onItemClick?: (item: OutlineItem) => void
  onItemComplete?: (item: OutlineItem) => void
  onItemFlag?: (item: OutlineItem) => void
  onItemExpand?: (item: OutlineItem, expanded: boolean) => void
  selectedItemId?: string | null
  className?: string
}

// ============================================================================
// Main Outline Component
// ============================================================================

export function Outline({
  items,
  onItemClick,
  onItemComplete,
  onItemFlag,
  onItemExpand,
  selectedItemId,
  className,
}: OutlineProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const toggleExpand = (item: OutlineItem) => {
    const newSet = new Set(expandedItems)
    if (newSet.has(item.id)) {
      newSet.delete(item.id)
    } else {
      newSet.add(item.id)
    }
    setExpandedItems(newSet)
    onItemExpand?.(item, !expandedItems.has(item.id))
  }

  return (
    <div className={cn("flex-1 overflow-y-auto", className)}>
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <FolderKanban className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <p className="text-lg font-medium">暂无项目</p>
          <p className="text-sm mt-1">点击上方按钮添加新动作</p>
        </div>
      ) : (
        <div className="py-2">
          {items.map(item => (
            <OutlineRow
              key={item.id}
              item={item}
              depth={0}
              isExpanded={expandedItems.has(item.id)}
              isSelected={selectedItemId === item.id}
              onToggleExpand={() => toggleExpand(item)}
              onClick={() => onItemClick?.(item)}
              onComplete={() => onItemComplete?.(item)}
              onFlag={() => onItemFlag?.(item)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Outline Row Component
// ============================================================================

interface OutlineRowProps {
  item: OutlineItem
  depth: number
  isExpanded: boolean
  isSelected: boolean
  onToggleExpand: () => void
  onClick: () => void
  onComplete: () => void
  onFlag: () => void
}

function OutlineRow({
  item,
  depth,
  isExpanded,
  isSelected,
  onToggleExpand,
  onClick,
  onComplete,
  onFlag,
}: OutlineRowProps) {
  const { t } = useTranslation()
  const hasChildren = item.children && item.children.length > 0
  
  // Calculate status indicators
  const isOverdue = item.due_date && new Date(item.due_date) < new Date() && !item.completed
  const isDueSoon = item.due_date && !isOverdue && !item.completed && 
    new Date(item.due_date).getTime() - Date.now() < 24 * 60 * 60 * 1000
  const isBlocked = item.defer_date && new Date(item.defer_date) > new Date()
  const isDropped = item.status === 'dropped'

  // Determine text color
  const getTextColor = () => {
    if (item.completed) return 'text-muted-foreground line-through'
    if (isDropped) return 'text-muted-foreground line-through'
    if (isBlocked || item.status === 'on_hold') return 'text-muted-foreground'
    if (isOverdue) return 'text-red-600'
    return 'text-foreground'
  }

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-2 px-4 py-2.5 cursor-pointer hover:bg-accent/50 transition-colors",
          isSelected && "bg-accent",
          item.completed && "opacity-60"
        )}
        style={{ paddingLeft: `${16 + depth * 20}px` }}
        onClick={onClick}
      >
        {/* Expand/Collapse Triangle */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleExpand()
            }}
            className="p-0.5 hover:bg-muted rounded flex-shrink-0"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        ) : (
          <div className="w-5 flex-shrink-0" />
        )}

        {/* Project Type Icon (for projects) */}
        {item.type === 'project' && (
          <ProjectTypeIcon type={item.project_type} />
        )}

        {/* Status Circle */}
        <StatusCircle
          status={item.status || 'active'}
          completed={item.completed || false}
          flagged={item.flagged || false}
          isOverdue={!!isOverdue}
          isDueSoon={!!isDueSoon}
          isRepeating={!!item.children?.length}
          onClick={(e) => {
            e.stopPropagation()
            onComplete()
          }}
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className="flex items-center gap-2">
            <span className={cn('font-medium truncate', getTextColor())}>
              {item.title}
            </span>
          </div>

          {/* Meta Row */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            {/* Project */}
            {item.project_title && (
              <span className="truncate max-w-[150px] text-muted-foreground/70">
                {item.project_title}
              </span>
            )}

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <div className="flex items-center gap-1">
                {item.tags.slice(0, 2).map(tag => (
                  <span
                    key={tag.id}
                    className="px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground text-[10px]"
                  >
                    {tag.name}
                  </span>
                ))}
                {item.tags.length > 2 && (
                  <span className="text-[10px]">+{item.tags.length - 2}</span>
                )}
              </div>
            )}

            {/* Dates */}
            {item.due_date && (
              <span className={cn(
                'flex items-center gap-0.5',
                isOverdue && 'text-red-500 font-medium',
                isDueSoon && 'text-yellow-600'
              )}>
                <Calendar className="h-3 w-3" />
                {formatRelativeDate(item.due_date, t)}
              </span>
            )}

            {item.defer_date && !item.due_date && (
              <span className="flex items-center gap-0.5">
                <Clock className="h-3 w-3" />
                {t('inspector.date.deferTo')} {formatRelativeDate(item.defer_date, t)}
              </span>
            )}

            {/* Duration */}
            {item.estimated_duration && (
              <span>{t('common.minutes', { count: item.estimated_duration })}</span>
            )}
          </div>
        </div>

        {/* Right Side: Icons on hover/select */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Note Icon */}
          {(item.has_note || item.has_attachments) && (
            <FileText className="h-4 w-4 text-muted-foreground/60" />
          )}

          {/* Flag Icon */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onFlag()
            }}
            className={cn(
              'p-1 rounded hover:bg-muted',
              item.flagged ? 'text-orange-500' : 'text-muted-foreground/40'
            )}
          >
            <Flag className={cn('h-4 w-4', item.flagged && 'fill-orange-500')} />
          </button>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {item.children!.map(child => (
            <OutlineRow
              key={child.id}
              item={child}
              depth={depth + 1}
              isExpanded={false}
              isSelected={false}
              onToggleExpand={() => {}}
              onClick={() => {}}
              onComplete={() => {}}
              onFlag={() => {}}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Status Circle Component
// ============================================================================

interface StatusCircleProps {
  status: 'active' | 'on_hold' | 'completed' | 'dropped'
  completed: boolean
  flagged: boolean
  isOverdue: boolean
  isDueSoon: boolean
  isRepeating: boolean
  onClick: (e: React.MouseEvent) => void
}

function StatusCircle({
  status,
  completed,
  flagged,
  isOverdue,
  isDueSoon,
  isRepeating,
  onClick,
}: StatusCircleProps) {
  const getCircleStyles = () => {
    // Base classes
    const base = 'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all hover:scale-110 flex-shrink-0'
    
    if (completed) {
      return `${base} bg-green-500 border-green-500`
    }
    if (status === 'dropped') {
      return `${base} border-gray-400`
    }
    if (isOverdue) {
      return `${base} border-red-500`
    }
    if (isDueSoon) {
      return `${base} border-yellow-500`
    }
    if (flagged) {
      return `${base} border-orange-500`
    }
    return `${base} border-primary`
  }

  return (
    <button
      onClick={onClick}
      className={getCircleStyles()}
    >
      {/* Completed checkmark */}
      {completed && (
        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      )}
      
      {/* Dropped dash */}
      {status === 'dropped' && !completed && (
        <div className="w-3 h-0.5 bg-gray-400" />
      )}
      
      {/* Repeating ellipsis */}
      {isRepeating && !completed && (
        <div className="flex gap-0.5">
          <div className="w-0.5 h-0.5 rounded-full bg-current" />
          <div className="w-0.5 h-0.5 rounded-full bg-current" />
          <div className="w-0.5 h-0.5 rounded-full bg-current" />
        </div>
      )}
    </button>
  )
}

// ============================================================================
// Project Type Icon
// ============================================================================

interface ProjectTypeIconProps {
  type?: 'sequential' | 'parallel' | 'single_action'
}

function ProjectTypeIcon({ type }: ProjectTypeIconProps) {
  if (type === 'sequential') {
    return (
      <div className="flex flex-col gap-0.5 flex-shrink-0">
        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
        <div className="w-1.5 h-1.5 rounded-full bg-blue-500/30" />
        <div className="w-1.5 h-1.5 rounded-full bg-blue-500/30" />
      </div>
    )
  }
  if (type === 'parallel') {
    return (
      <div className="flex gap-0.5 flex-shrink-0">
        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
      </div>
    )
  }
  return (
    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
  )
}

// ============================================================================


export default Outline
