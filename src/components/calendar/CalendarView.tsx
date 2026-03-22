/**
 * Calendar View - 日历视图
 * 
 * 类似 Google Calendar 的月/周/日视图
 */

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock
} from 'lucide-react'
import { Button } from '@/packages/ui/components/button'
import { cn } from '@/lib/utils'
import type { Task } from '@/types'

// ============================================================================
// Types
// ============================================================================

type ViewMode = 'month' | 'week' | 'day'

interface CalendarViewProps {
  tasks: Task[]
  onTaskClick?: (task: Task) => void
  onDateClick?: (date: Date) => void
}

// ============================================================================
// Helper Functions
// ============================================================================

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = []
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  
  // Add padding days from previous month
  const firstDayOfWeek = firstDay.getDay()
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i))
  }
  
  // Add days of current month
  for (let day = 1; day <= lastDay.getDate(); day++) {
    days.push(new Date(year, month, day))
  }
  
  // Add padding days from next month
  const remainingDays = 42 - days.length // 6 weeks * 7 days
  for (let i = 1; i <= remainingDays; i++) {
    days.push(new Date(year, month + 1, i))
  }
  
  return days
}

function isSameDay(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate()
}

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })
}

// ============================================================================
// Month View
// ============================================================================

interface MonthViewProps {
  currentDate: Date
  tasks: Task[]
  onTaskClick?: (task: Task) => void
  onDateClick?: (date: Date) => void
}

function MonthView({ currentDate, tasks, onTaskClick, onDateClick }: MonthViewProps) {
  const days = useMemo(() => {
    return getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth())
  }, [currentDate])

  const weekDays = ['日', '一', '二', '三', '四', '五', '六']

  const getTasksForDay = (day: Date) => {
    return tasks.filter(task => {
      if (task.due_date) {
        return isSameDay(new Date(task.due_date), day)
      }
      return false
    })
  }

  const today = new Date()

  return (
    <div className="h-full flex flex-col">
      {/* Week Days Header */}
      <div className="grid grid-cols-7 gap-px border-b">
        {weekDays.map(day => (
          <div key={day} className="py-2 text-center text-sm font-medium text-muted-foreground">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 grid grid-cols-7 grid-rows-6 gap-px bg-border">
        {days.map((day, index) => {
          const dayTasks = getTasksForDay(day)
          const isCurrentMonth = day.getMonth() === currentDate.getMonth()
          const isToday = isSameDay(day, today)

          return (
            <div
              key={index}
              onClick={() => onDateClick?.(day)}
              className={cn(
                "bg-card p-2 min-h-[100px] cursor-pointer hover:bg-accent/50 transition-colors",
                !isCurrentMonth && "bg-muted/30 text-muted-foreground",
                isToday && "bg-blue-50/50"
              )}
            >
              <div className={cn(
                "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                isToday && "bg-primary text-primary-foreground"
              )}>
                {day.getDate()}
              </div>

              <div className="mt-1 space-y-0.5">
                {dayTasks.slice(0, 3).map(task => (
                  <div
                    key={task.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      onTaskClick?.(task)
                    }}
                    className={cn(
                      "text-xs px-1.5 py-0.5 rounded truncate cursor-pointer",
                      task.completed_at ? "bg-muted line-through" : "bg-primary/10 text-primary"
                    )}
                  >
                    {task.title}
                  </div>
                ))}
                {dayTasks.length > 3 && (
                  <div className="text-xs text-muted-foreground px-1.5">
                    +{dayTasks.length - 3} 更多
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================================
// Week View
// ============================================================================

interface WeekViewProps {
  currentDate: Date
  tasks: Task[]
  onTaskClick?: (task: Task) => void
}

function WeekView({ currentDate, tasks, onTaskClick }: WeekViewProps) {
  const weekDays = useMemo(() => {
    const start = new Date(currentDate)
    const day = start.getDay()
    start.setDate(start.getDate() - day)
    
    const days: Date[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      days.push(d)
    }
    return days
  }, [currentDate])

  const getTasksForDay = (day: Date) => {
    return tasks.filter(task => {
      if (task.due_date) {
        return isSameDay(new Date(task.due_date), day)
      }
      return false
    })
  }

  const today = new Date()

  return (
    <div className="h-full flex flex-col">
      {/* Week Days Header */}
      <div className="grid grid-cols-7 border-b">
        {weekDays.map((day, index) => (
          <div
            key={index}
            className={cn(
              "py-3 text-center border-r last:border-r-0",
              isSameDay(day, today) && "bg-blue-50/50"
            )}
          >
            <div className="text-xs text-muted-foreground">
              {['日', '一', '二', '三', '四', '五', '六'][day.getDay()]}
            </div>
            <div className={cn(
              "text-lg font-semibold mt-1 w-8 h-8 mx-auto flex items-center justify-center rounded-full",
              isSameDay(day, today) && "bg-primary text-primary-foreground"
            )}>
              {day.getDate()}
            </div>
          </div>
        ))}
      </div>

      {/* Week Grid */}
      <div className="flex-1 grid grid-cols-7 overflow-auto">
        {weekDays.map((day, index) => {
          const dayTasks = getTasksForDay(day)

          return (
            <div
              key={index}
              className={cn(
                "border-r last:border-r-0 p-2 min-h-[200px]",
                isSameDay(day, today) && "bg-blue-50/30"
              )}
            >
              <div className="space-y-2">
                {dayTasks.map(task => (
                  <div
                    key={task.id}
                    onClick={() => onTaskClick?.(task)}
                    className={cn(
                      "p-2 rounded border text-sm cursor-pointer hover:shadow-sm transition-shadow",
                      task.completed_at 
                        ? "bg-muted border-muted line-through" 
                        : "bg-white border-border"
                    )}
                  >
                    <p className="font-medium truncate">{task.title}</p>
                    {task.due_date && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3" />
                        {new Date(task.due_date).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================================
// Main Calendar View
// ============================================================================

export function CalendarView({ tasks, onTaskClick, onDateClick }: CalendarViewProps) {
  useTranslation() // Keep hook for future i18n
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('month')

  const navigatePrev = () => {
    const newDate = new Date(currentDate)
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7)
    } else {
      newDate.setDate(newDate.getDate() - 1)
    }
    setCurrentDate(newDate)
  }

  const navigateNext = () => {
    const newDate = new Date(currentDate)
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1)
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7)
    } else {
      newDate.setDate(newDate.getDate() + 1)
    }
    setCurrentDate(newDate)
  }

  const navigateToday = () => {
    setCurrentDate(new Date())
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="h-14 border-b flex items-center px-4 justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={navigatePrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={navigateNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <h2 className="text-lg font-semibold min-w-[150px]">
            {formatMonthYear(currentDate)}
          </h2>

          <Button variant="outline" size="sm" onClick={navigateToday}>
            今天
          </Button>
        </div>

        <div className="flex items-center gap-1">
          {(['month', 'week', 'day'] as ViewMode[]).map(mode => (
            <Button
              key={mode}
              variant={viewMode === mode ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode(mode)}
            >
              {mode === 'month' ? '月' : mode === 'week' ? '周' : '日'}
            </Button>
          ))}
        </div>
      </div>

      {/* Calendar Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'month' && (
          <MonthView
            currentDate={currentDate}
            tasks={tasks}
            onTaskClick={onTaskClick}
            onDateClick={onDateClick}
          />
        )}
        {viewMode === 'week' && (
          <WeekView
            currentDate={currentDate}
            tasks={tasks}
            onTaskClick={onTaskClick}
          />
        )}
        {viewMode === 'day' && (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            日视图开发中...
          </div>
        )}
      </div>
    </div>
  )
}

export default CalendarView
