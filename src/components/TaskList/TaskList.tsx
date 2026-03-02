import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from '@/i18n'
import { ChevronRight, ChevronDown, Flag } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Task, TaskTreeNode } from '@/types'

interface TaskListProps {
  tasks: Task[] | TaskTreeNode[]
  onComplete?: (taskId: string) => void
  onToggleFlag?: (taskId: string) => void
  onSelect?: (task: Task | TaskTreeNode) => void
  selectedId?: string | null
  showProject?: boolean
  emptyMessage?: string
}

export function TaskList({
  tasks,
  onComplete,
  onToggleFlag,
  onSelect,
  selectedId,
  showProject = true,
  emptyMessage,
}: TaskListProps) {
  const { t } = useTranslation()
  const finalEmptyMessage = emptyMessage || t('taskList.empty')
  
  if (!tasks || tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <div className="w-16 h-16 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center mb-3">
          <svg className="w-8 h-8 text-muted-foreground/40" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" strokeWidth="2" />
          </svg>
        </div>
        <p className="text-sm">{finalEmptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="space-y-0.5">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          level={0}
          onComplete={onComplete}
          onToggleFlag={onToggleFlag}
          onSelect={onSelect}
          selectedId={selectedId}
          showProject={showProject}
        />
      ))}
    </div>
  )
}

interface TaskItemProps {
  task: Task | TaskTreeNode
  level?: number
  onComplete?: (taskId: string) => void
  onToggleFlag?: (taskId: string) => void
  onSelect?: (task: Task | TaskTreeNode) => void
  onOpenInspector?: (task: Task) => void
  selectedId?: string | null
  showProject?: boolean
}

export function TaskItem({
  task,
  level = 0,
  onComplete,
  onToggleFlag,
  onSelect,
  onOpenInspector,
  selectedId,
  showProject = true,
}: TaskItemProps) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(true)
  const isSelected = selectedId === task.id
  
  // Check if it's a TaskTreeNode (has children property)
  const hasChildren = 'children' in task && task.children && task.children.length > 0
  
  // Status determination
  const isCompleted = 'is_completed' in task ? task.is_completed : task.status === 'completed'
  const isDropped = 'status' in task && task.status === 'dropped'
  const isFlagged = 'flagged' in task ? task.flagged : 'flag' in task && task.flag === 'flagged'
  
  // Metadata
  const projectName = 'project_name' in task ? task.project_name : null
  const dueDate = task.due_date
  const hasDueDate = !!dueDate
  
  // Calculate time status
  const now = new Date()
  const due = dueDate ? new Date(dueDate) : null
  const isOverdue = hasDueDate && due! < now && !isCompleted
  const isDueSoon = hasDueDate && !isOverdue && !isCompleted && due!.getTime() - now.getTime() < 24 * 60 * 60 * 1000
  
  // Get status circle style based on priority
  const getStatusCircleClass = () => {
    if (isCompleted) return 'task-status-completed'
    if (isDropped) return 'task-status-dropped'
    if (isOverdue) return 'task-status-overdue'  // 🔴 Red
    if (isDueSoon) return 'task-status-due-soon' // 🟡 Yellow
    if (isFlagged) return 'task-status-flagged'  // 🟠 Orange
    return 'task-status-active'                   // ⭕ Gray
  }

  const handleComplete = () => {
    if (onComplete) {
      onComplete(task.id)
    }
  }

  const handleFlagToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onToggleFlag) {
      onToggleFlag(task.id)
    }
  }

  return (
    <div>
      <div
        className={cn(
          'task-item group',
          isSelected && 'task-item-selected'
        )}
        style={{ paddingLeft: `${level * 24 + 8}px` }}
        onClick={() => onSelect?.(task)}
        onDoubleClick={() => onOpenInspector?.(task as Task)}
      >
        {/* Expand/Collapse button */}
        {hasChildren ? (
          <button
            className="task-expand-btn"
            onClick={(e) => {
              e.stopPropagation()
              setExpanded(!expanded)
            }}
          >
            {expanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        ) : (
          <span className="w-6" />
        )}

        {/* Status Circle - OmniFocus Style with multiple indicators */}
        <div
          className={cn('task-status-circle', getStatusCircleClass())}
          onClick={(e) => {
            e.stopPropagation()
            handleComplete()
          }}
          title={t('taskList.tooltip')}
        >
          {isCompleted && (
            <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
              <path
                d="M2 6L5 9L10 3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
          {/* Repeating indicator - three dots */}
          {'recurrence_rule' in task && task.recurrence_rule && !isCompleted && (
            <span className="text-[8px] leading-none">⋯</span>
          )}
        </div>
        
        {/* Flag indicator outside circle for overdue/duesoon + flagged */}
        {!isCompleted && isFlagged && (isOverdue || isDueSoon) && (
          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 flex items-center justify-center">
            <span className="text-[10px] text-amber-500">⚑</span>
          </div>
        )}

        {/* Content */}
        <div className="task-content flex-1 min-w-0">
          {/* Title Row */}
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'task-title',
                isCompleted && 'task-title-completed',
                isDropped && 'task-title-dropped',
                isOverdue && 'task-title-overdue'
              )}
            >
              {task.title}
            </span>
            
            {/* Status badges */}
            {!isCompleted && (
              <>
                {isOverdue && (
                  <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-600 text-[10px] font-medium">
                    {t('taskList.overdue')}
                  </span>
                )}
                {isDueSoon && !isOverdue && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-600 text-[10px] font-medium">
                    {t('taskList.dueSoon')}
                  </span>
                )}
                {/* Flag icon - show only if not showing as status circle color */}
                {isFlagged && !isOverdue && !isDueSoon && (
                  <button
                    className="task-flag task-flag-active"
                    onClick={handleFlagToggle}
                  >
                    <Flag className="w-3.5 h-3.5 fill-current" />
                  </button>
                )}
              </>
            )}
          </div>

          {/* Metadata Row */}
          <div className="task-metadata">
            {/* Project */}
            {showProject && projectName && (
              <span className="task-project">
                {projectName}
              </span>
            )}
            
            {/* Tags */}
            {'tags_list' in task && task.tags_list && task.tags_list.length > 0 && (
              <>
                {task.tags_list.map((tag) => (
                  <span key={tag.id} className="task-tag">
                    {tag.name}
                  </span>
                ))}
              </>
            )}

            {/* Due Date */}
            {dueDate && (
              <span className={cn(
                'task-due-date',
                isOverdue && 'task-due-date-overdue'
              )}>
                {formatDueDate(dueDate)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Children */}
      {expanded && hasChildren && 'children' in task && task.children && (
        <div>
          {task.children.map((child) => (
            <TaskItem
              key={child.id}
              task={child}
              level={level + 1}
              onComplete={onComplete}
              onToggleFlag={onToggleFlag}
              onSelect={onSelect}
              onOpenInspector={onOpenInspector}
              selectedId={selectedId}
              showProject={false} // Don't show project for subtasks
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Format due date like OmniFocus
function formatDueDate(dateString: string): string {
  const date = new Date(dateString)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const dateWithoutTime = new Date(date)
  dateWithoutTime.setHours(0, 0, 0, 0)
  
  if (dateWithoutTime.getTime() === today.getTime()) {
    return i18n.t('common.today')
  } else if (dateWithoutTime.getTime() === tomorrow.getTime()) {
    return i18n.t('common.tomorrow')
  } else {
    return date.toLocaleDateString(i18n.language === 'zh' ? 'zh-CN' : i18n.language === 'ja' ? 'ja-JP' : 'en-US', { month: 'short', day: 'numeric' })
  }
}

// CSS styles for OmniFocus-like appearance
export const taskListStyles = `
  .task-item {
    @apply flex items-start gap-1.5 py-2 pr-3 rounded-lg cursor-pointer
           transition-colors duration-150
           hover:bg-slate-100 dark:hover:bg-slate-800;
  }
  
  .task-item-selected {
    @apply bg-slate-100 dark:bg-slate-800;
  }
  
  .task-expand-btn {
    @apply w-6 h-6 flex items-center justify-center rounded
           text-slate-400 hover:text-slate-600 dark:hover:text-slate-300
           hover:bg-slate-200 dark:hover:bg-slate-700
           transition-colors;
  }
  
  .task-status-circle {
    @apply relative w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5
           flex items-center justify-center cursor-pointer
           transition-all duration-150;
  }
  
  .task-status-active {
    @apply border-slate-400 bg-transparent
           hover:border-slate-500;
  }
  
  .task-status-completed {
    @apply border-emerald-500 bg-emerald-500 text-white;
  }
  
  .task-status-dropped {
    @apply border-slate-300 bg-slate-200 text-slate-400
           dark:border-slate-600 dark:bg-slate-700 dark:text-slate-500;
  }
  
  .task-status-flagged {
    @apply border-amber-400 bg-amber-50
           dark:border-amber-500 dark:bg-amber-950/30;
  }
  
  .task-status-due-soon {
    @apply border-amber-400 bg-amber-100
           dark:border-amber-500 dark:bg-amber-900/30;
  }
  
  .task-status-overdue {
    @apply border-red-500 bg-red-50
           dark:border-red-500 dark:bg-red-900/30;
  }
  
  .task-content {
    @apply flex flex-col gap-0.5 min-w-0;
  }
  
  .task-title {
    @apply text-sm font-medium text-slate-900 dark:text-slate-100
           truncate leading-tight;
  }
  
  .task-title-completed {
    @apply text-slate-400 dark:text-slate-500 line-through;
  }
  
  .task-title-dropped {
    @apply text-slate-400 dark:text-slate-500 line-through;
  }
  
  .task-title-overdue {
    @apply text-red-600 dark:text-red-400;
  }
  
  .task-flag {
    @apply text-amber-500 hover:text-amber-600
           transition-colors p-0.5 rounded;
  }
  
  .task-flag-active {
    @apply text-amber-500;
  }
  
  .task-metadata {
    @apply flex items-center gap-2 flex-wrap text-xs;
  }
  
  .task-project {
    @apply text-slate-500 dark:text-slate-400
           before:content-[''] before:inline-block before:w-1.5 before:h-1.5
           before:rounded-full before:bg-slate-400 before:mr-1.5;
  }
  
  .task-tag {
    @apply px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700
           text-slate-600 dark:text-slate-300
           text-[10px] uppercase tracking-wide;
  }
  
  .task-due-date {
    @apply text-slate-500 dark:text-slate-400;
  }
  
  .task-due-date-overdue {
    @apply text-red-500 font-medium;
  }
`
