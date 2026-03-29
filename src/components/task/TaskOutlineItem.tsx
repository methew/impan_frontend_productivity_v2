/**
 * Task Outline Item - 动作大纲项
 * 
 * 格式：
 * isImportant｜isUrgent ｜ title
 * 推迟到日期 - 截止日期 ｜ #tag1 #tag2...
 * 备注
 */

import { cn } from '@/lib/utils'
import { TaskFlagIcons } from './TaskFlagIcons'
import type { Task } from '@/types'

interface TaskOutlineItemProps {
  task: Task
  onClick?: () => void
  className?: string
  selected?: boolean
}

// 格式化日期显示
function formatDateDisplay(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  // 如果是今天
  if (date.toDateString() === today.toDateString()) {
    return '今天'
  }
  // 如果是明天
  if (date.toDateString() === tomorrow.toDateString()) {
    return '明天'
  }
  
  // 否则显示 MM-DD
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

// 检查是否逾期
function isOverdue(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false
  const date = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date < today
}

export function TaskOutlineItem({ 
  task, 
  onClick, 
  className,
  selected 
}: TaskOutlineItemProps) {
  
  const hasFlags = task.is_important || task.is_urgent
  const hasDates = task.defer_date || task.due_date
  const hasTags = task.tags && task.tags.length > 0
  const hasNote = task.note && task.note.trim().length > 0
  
  const overdue = isOverdue(task.due_date)
  
  // 截断备注，只显示第一行
  const notePreview = task.note 
    ? task.note.split('\n')[0].slice(0, 50) + (task.note.length > 50 ? '...' : '')
    : ''

  return (
    <div
      onClick={onClick}
      className={cn(
        "py-2 px-3 rounded-md cursor-pointer transition-colors",
        "hover:bg-accent/50",
        selected && "bg-accent",
        task.completed_at && "opacity-50",
        className
      )}
    >
      {/* 第一行：标记 ｜ 标题 */}
      <div className="flex items-center gap-1.5">
        {/* 标记分隔符 */}
        {hasFlags && (
          <>
            <TaskFlagIcons 
              isImportant={task.is_important} 
              isUrgent={task.is_urgent}
              size="sm"
            />
            <span className="text-muted-foreground">｜</span>
          </>
        )}
        
        {/* 标题 */}
        <span className={cn(
          "flex-1 truncate",
          task.completed_at && "line-through text-muted-foreground",
          overdue && !task.completed_at && "text-red-600"
        )}>
          {task.title}
        </span>
      </div>
      
      {/* 第二行：日期 ｜ 标签 */}
      {(hasDates || hasTags) && (
        <div className="flex items-center gap-1.5 text-xs mt-0.5">
          {/* 日期部分 */}
          {hasDates && (
            <>
              <span className="text-muted-foreground">
                {task.defer_date && (
                  <span>推迟到{formatDateDisplay(task.defer_date)}</span>
                )}
                {task.defer_date && task.due_date && ' - '}
                {task.due_date && (
                  <span className={cn(overdue && !task.completed_at && "text-red-500 font-medium")}>
                    截止{formatDateDisplay(task.due_date)}
                  </span>
                )}
              </span>
            </>
          )}
          
          {/* 日期与标签分隔符 */}
          {hasDates && hasTags && (
            <span className="text-muted-foreground">｜</span>
          )}
          
          {/* 标签部分 */}
          {hasTags && (
            <span className="flex items-center gap-1 truncate">
              {task.tags?.map((tag, index) => (
                <span 
                  key={tag.id} 
                  className="text-blue-600 dark:text-blue-400"
                >
                  #{tag.name || `tag${index + 1}`}
                </span>
              ))}
            </span>
          )}
        </div>
      )}
      
      {/* 第三行：备注 */}
      {hasNote && (
        <div className="text-xs text-muted-foreground mt-0.5 truncate">
          {notePreview}
        </div>
      )}
    </div>
  )
}

/**
 * 紧凑版 - 只显示一行
 */
export function TaskOutlineItemCompact({ 
  task, 
  onClick, 
  className,
  selected 
}: TaskOutlineItemProps) {
  const overdue = isOverdue(task.due_date)
  
  return (
    <div
      onClick={onClick}
      className={cn(
        "py-1.5 px-2 rounded-md cursor-pointer transition-colors flex items-center gap-1.5",
        "hover:bg-accent/50",
        selected && "bg-accent",
        task.completed_at && "opacity-50",
        className
      )}
    >
      {/* 标记 */}
      <TaskFlagIcons 
        isImportant={task.is_important} 
        isUrgent={task.is_urgent}
        size="sm"
      />
      
      {/* 逾期指示器 */}
      {overdue && !task.completed_at && (
        <span className="text-red-500 text-xs">!</span>
      )}
      
      {/* 标题 */}
      <span className={cn(
        "flex-1 truncate text-sm",
        task.completed_at && "line-through text-muted-foreground",
        overdue && !task.completed_at && "text-red-600"
      )}>
        {task.title}
      </span>
      
      {/* 截止日期简写 */}
      {task.due_date && (
        <span className={cn(
          "text-xs text-muted-foreground",
          overdue && !task.completed_at && "text-red-500"
        )}>
          {formatDateDisplay(task.due_date)}
        </span>
      )}
    </div>
  )
}

export default TaskOutlineItem
