/**
 * Calendar View - 日历视图
 * 
 * 类似 Google Calendar 的月/周/日视图
 */

import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock,
  GripVertical
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
  onTaskTimeChange?: (taskId: string, deferDate: string | null, dueDate: string | null) => void
}

interface TimeBlock {
  task: Task
  startTime: Date
  endTime: Date
  top: number
  height: number
  left: number
  width: number
  column: number
  totalColumns: number
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

// Convert time to pixels (24 hours = 1440 minutes, each hour = 60px)
const HOUR_HEIGHT = 60
const MINUTE_HEIGHT = HOUR_HEIGHT / 60

function timeToPixels(date: Date): number {
  const hours = date.getHours()
  const minutes = date.getMinutes()
  return (hours * HOUR_HEIGHT) + (minutes * MINUTE_HEIGHT)
}

function pixelsToTime(pixels: number): { hours: number; minutes: number } {
  const totalMinutes = pixels / MINUTE_HEIGHT
  const hours = Math.floor(totalMinutes / 60)
  const minutes = Math.floor(totalMinutes % 60)
  return { hours: Math.max(0, Math.min(23, hours)), minutes: Math.max(0, Math.min(59, minutes)) }
}

// Detect overlapping time blocks and calculate layout
function calculateTimeBlockLayout(tasks: Task[], currentDate: Date): TimeBlock[] {
  // Filter tasks for current date that have time info
  const dayTasks = tasks.filter(task => {
    const hasDefer = task.defer_date && isSameDay(new Date(task.defer_date), currentDate)
    const hasDue = task.due_date && isSameDay(new Date(task.due_date), currentDate)
    return hasDefer || hasDue
  })

  if (dayTasks.length === 0) return []

  // Create time blocks
  const blocks: TimeBlock[] = dayTasks.map(task => {
    // defer_date = start time, due_date = end time
    let startTime: Date
    let endTime: Date

    if (task.defer_date) {
      startTime = new Date(task.defer_date)
    } else if (task.due_date) {
      // If no defer_date, start 1 hour before due_date
      startTime = new Date(new Date(task.due_date).getTime() - 60 * 60 * 1000)
    } else {
      startTime = new Date(currentDate)
      startTime.setHours(9, 0, 0, 0)
    }

    if (task.due_date) {
      endTime = new Date(task.due_date)
    } else {
      // If no due_date, end 1 hour after start
      endTime = new Date(startTime.getTime() + 60 * 60 * 1000)
    }

    // Ensure minimum duration of 30 minutes
    if (endTime.getTime() - startTime.getTime() < 30 * 60 * 1000) {
      endTime = new Date(startTime.getTime() + 30 * 60 * 1000)
    }

    const top = timeToPixels(startTime)
    const height = Math.max(30, timeToPixels(endTime) - top) // Minimum 30px height

    return {
      task,
      startTime,
      endTime,
      top,
      height,
      left: 0,
      width: 100,
      column: 0,
      totalColumns: 1
    }
  })

  // Sort by start time
  blocks.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())

  // Detect overlaps and assign columns
  const columns: TimeBlock[][] = []

  for (const block of blocks) {
    let placed = false
    
    for (const column of columns) {
      // Check if this block overlaps with any block in this column
      const overlaps = column.some(existing => {
        return !(block.endTime <= existing.startTime || block.startTime >= existing.endTime)
      })
      
      if (!overlaps) {
        column.push(block)
        block.column = columns.indexOf(column)
        placed = true
        break
      }
    }
    
    if (!placed) {
      columns.push([block])
      block.column = columns.length - 1
    }
  }

  // Calculate widths and positions
  const totalColumns = columns.length
  const columnWidth = 100 / totalColumns

  for (const block of blocks) {
    block.totalColumns = totalColumns
    block.width = columnWidth - 2 // -2 for gap
    block.left = (block.column * columnWidth) + 1 // +1 for gap
  }

  return blocks
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
      if (task.defer_date) {
        return isSameDay(new Date(task.defer_date), day)
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
      if (task.defer_date) {
        return isSameDay(new Date(task.defer_date), day)
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
// Day View - Enhanced with Time Blocks and Drag Support
// ============================================================================

interface DayViewProps {
  currentDate: Date
  tasks: Task[]
  onTaskClick?: (task: Task) => void
  onDateClick?: (date: Date) => void
  onTaskTimeChange?: (taskId: string, deferDate: string | null, dueDate: string | null) => void
}

function DayView({ currentDate, tasks, onTaskClick, onDateClick, onTaskTimeChange }: DayViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  
  // Drag state
  const [dragState, setDragState] = useState<{
    taskId: string
    type: 'move' | 'resize-top' | 'resize-bottom'
    startY: number
    originalTop: number
    originalHeight: number
  } | null>(null)

  // Calculate time blocks with layout
  const timeBlocks = useMemo(() => {
    return calculateTimeBlockLayout(tasks, currentDate)
  }, [tasks, currentDate])

  const today = new Date()
  const isToday = isSameDay(currentDate, today)

  // Track if this is a drag operation
  const isDraggingRef = useRef(false)
  const clickStartTimeRef = useRef(0)

  // Handle mouse events for dragging
  const handleMouseDown = useCallback((e: React.MouseEvent, block: TimeBlock, type: 'move' | 'resize-top' | 'resize-bottom') => {
    e.stopPropagation()
    e.preventDefault()
    
    isDraggingRef.current = false
    clickStartTimeRef.current = Date.now()
    
    setSelectedTaskId(block.task.id)
    
    setDragState({
      taskId: block.task.id,
      type,
      startY: e.clientY,
      originalTop: block.top,
      originalHeight: block.height
    })
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState || !containerRef.current) return

    // Mark as dragging if moved more than 3 pixels
    const deltaY = e.clientY - dragState.startY
    if (Math.abs(deltaY) > 3) {
      isDraggingRef.current = true
    }
    
    // Find the block being dragged
    const block = timeBlocks.find(b => b.task.id === dragState.taskId)
    if (!block) return

    let newTop = block.top
    let newHeight = block.height

    if (dragState.type === 'move') {
      newTop = Math.max(0, dragState.originalTop + deltaY)
      // Snap to 15-minute intervals
      const snapPixels = 15 * MINUTE_HEIGHT
      newTop = Math.round(newTop / snapPixels) * snapPixels
    } else if (dragState.type === 'resize-top') {
      newTop = Math.max(0, dragState.originalTop + deltaY)
      newHeight = Math.max(30, dragState.originalHeight - deltaY)
      // Snap
      const snapPixels = 15 * MINUTE_HEIGHT
      newTop = Math.round(newTop / snapPixels) * snapPixels
      newHeight = Math.max(30, dragState.originalTop + dragState.originalHeight - newTop)
    } else if (dragState.type === 'resize-bottom') {
      newHeight = Math.max(30, dragState.originalHeight + deltaY)
      // Snap
      const snapPixels = 15 * MINUTE_HEIGHT
      newHeight = Math.round((dragState.originalTop + newHeight) / snapPixels) * snapPixels - dragState.originalTop
      newHeight = Math.max(30, newHeight)
    }

    // Update visual position immediately (will be overridden by React on next render)
    const element = document.getElementById(`task-block-${dragState.taskId}`)
    if (element) {
      element.style.top = `${newTop}px`
      element.style.height = `${newHeight}px`
    }
  }, [dragState, timeBlocks])

  const handleMouseUp = useCallback(() => {
    if (!dragState || !containerRef.current) {
      setDragState(null)
      return
    }

    const block = timeBlocks.find(b => b.task.id === dragState.taskId)
    if (!block) {
      setDragState(null)
      return
    }

    // Get final position from the DOM element
    const element = document.getElementById(`task-block-${dragState.taskId}`)
    if (element) {
      const newTop = parseInt(element.style.top || '0')
      const newHeight = parseInt(element.style.height || '60')

      // Convert pixels back to time
      const startTime = pixelsToTime(newTop)
      const endTime = pixelsToTime(newTop + newHeight)

      // Build new dates
      const newDeferDate = new Date(currentDate)
      newDeferDate.setHours(startTime.hours, startTime.minutes, 0, 0)

      const newDueDate = new Date(currentDate)
      newDueDate.setHours(endTime.hours, endTime.minutes, 0, 0)

      // Call the update handler
      onTaskTimeChange?.(
        dragState.taskId,
        newDeferDate.toISOString(),
        newDueDate.toISOString()
      )
    }

    setDragState(null)
  }, [dragState, timeBlocks, currentDate, onTaskTimeChange])

  // Add global mouse event listeners
  useEffect(() => {
    if (dragState) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [dragState, handleMouseMove, handleMouseUp])

  // Handle clicking on empty space to deselect
  const handleContainerClick = (e: React.MouseEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).classList.contains('time-grid-line')) {
      setSelectedTaskId(null)
      
      // Calculate time from click position
      const rect = containerRef.current?.getBoundingClientRect()
      if (rect) {
        const scrollTop = containerRef.current?.scrollTop || 0
        const clickY = e.clientY - rect.top + scrollTop
        const time = pixelsToTime(clickY)
        const clickedDate = new Date(currentDate)
        clickedDate.setHours(time.hours, time.minutes, 0, 0)
        onDateClick?.(clickedDate)
      }
    }
  }

  // Scroll to current time on mount
  useEffect(() => {
    if (containerRef.current && isToday) {
      const now = new Date()
      const scrollPos = timeToPixels(now) - 200
      containerRef.current.scrollTop = Math.max(0, scrollPos)
    }
  }, [isToday])

  return (
    <div className="h-full flex flex-col">
      {/* Day Header */}
      <div className={cn(
        "py-3 px-4 border-b flex items-center justify-between",
        isToday && "bg-blue-50"
      )}>
        <div>
          <div className="text-sm text-muted-foreground">
            {currentDate.toLocaleDateString('zh-CN', { weekday: 'long' })}
          </div>
          <div className={cn(
            "text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-full mt-1",
            isToday && "bg-primary text-primary-foreground"
          )}>
            {currentDate.getDate()}
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          推迟至 = 开始时间 | 截止日期 = 结束时间
        </div>
      </div>

      {/* Time Grid */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto relative"
        onClick={handleContainerClick}
      >
        <div className="relative" style={{ height: `${24 * HOUR_HEIGHT}px` }}>
          {/* Hour grid lines */}
          {Array.from({ length: 24 }, (_, hour) => (
            <div
              key={hour}
              className="time-grid-line absolute w-full border-b border-border/50 flex"
              style={{ top: `${hour * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
            >
              <div className="w-16 pr-2 text-xs text-muted-foreground text-right pt-1">
                {String(hour).padStart(2, '0')}:00
              </div>
              <div className="flex-1 relative">
                {/* 15-min subgrid */}
                {[15, 30, 45].map(min => (
                  <div
                    key={min}
                    className="absolute w-full border-b border-dashed border-border/30"
                    style={{ top: `${min * MINUTE_HEIGHT}px` }}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Current time indicator */}
          {isToday && (
            <div
              className="absolute w-full z-20 pointer-events-none"
              style={{ top: `${timeToPixels(new Date())}px` }}
            >
              <div className="flex items-center">
                <div className="w-16 pr-1 text-xs text-red-500 font-medium text-right">
                  {new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="flex-1 h-px bg-red-500" />
              </div>
            </div>
          )}

          {/* Task time blocks */}
          {timeBlocks.map(block => {
            const isSelected = selectedTaskId === block.task.id
            const isDragging = dragState?.taskId === block.task.id

            return (
              <div
                key={block.task.id}
                id={`task-block-${block.task.id}`}
                className={cn(
                  "absolute rounded-lg border-2 cursor-pointer overflow-hidden transition-shadow",
                  "hover:shadow-lg select-none",
                  block.task.completed_at 
                    ? "bg-muted/80 border-gray-300 opacity-60" 
                    : "bg-primary/10 border-primary shadow-sm",
                  isSelected && "ring-2 ring-primary ring-offset-2 z-30",
                  isDragging && "z-40 opacity-90"
                )}
                style={{
                  top: `${block.top}px`,
                  height: `${block.height}px`,
                  left: `calc(4rem + ${block.left}%)`,
                  width: `calc((100% - 4rem) * ${block.width / 100} - 4px)`
                }}
                onMouseDown={(e) => handleMouseDown(e, block, 'move')}
                onClick={(e) => {
                  e.stopPropagation()
                  // Only select on click, don't open inspector
                  setSelectedTaskId(block.task.id)
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation()
                  // Only open inspector on double click
                  setSelectedTaskId(block.task.id)
                  onTaskClick?.(block.task)
                }}
              >
                {/* Resize handle - top */}
                <div
                  className="absolute top-0 left-0 right-0 h-2 cursor-n-resize hover:bg-primary/30"
                  onMouseDown={(e) => handleMouseDown(e, block, 'resize-top')}
                >
                  <div className="flex justify-center pt-0.5">
                    <GripVertical className="h-3 w-3 text-primary/50 rotate-90" />
                  </div>
                </div>

                {/* Content */}
                <div className="px-2 py-4 h-full flex flex-col">
                  <div className={cn(
                    "font-medium text-sm truncate",
                    block.task.completed_at && "line-through"
                  )}>
                    {block.task.title}
                  </div>
                  
                  {block.height > 40 && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {block.startTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} 
                      {' - '}
                      {block.endTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                  
                  {block.height > 60 && block.task.note && (
                    <div className="text-xs text-muted-foreground/70 mt-1 line-clamp-2">
                      {block.task.note}
                    </div>
                  )}

                  {/* Tags */}
                  {block.height > 50 && block.task.tags && block.task.tags.length > 0 && (
                    <div className="flex gap-1 mt-auto pt-1 flex-wrap">
                      {block.task.tags.slice(0, 2).map(tag => (
                        <span
                          key={tag.id}
                          className="text-[10px] px-1 py-0.5 rounded bg-primary/20 text-primary"
                        >
                          {tag.name}
                        </span>
                      ))}
                      {block.task.tags.length > 2 && (
                        <span className="text-[10px] text-muted-foreground">
                          +{block.task.tags.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Resize handle - bottom */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-2 cursor-s-resize hover:bg-primary/30"
                  onMouseDown={(e) => handleMouseDown(e, block, 'resize-bottom')}
                >
                  <div className="flex justify-center pb-0.5">
                    <GripVertical className="h-3 w-3 text-primary/50 rotate-90" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-2 border-t bg-muted/30 text-xs text-muted-foreground flex gap-4">
        <span>🖱️ 拖拽 = 移动时间</span>
        <span>↕️ 上下拖动 = 调整时长</span>
        <span>👆 单击 = 选中</span>
        <span>👆👆 双击 = 编辑</span>
      </div>
    </div>
  )
}

// ============================================================================
// Main Calendar View
// ============================================================================

export function CalendarView({ tasks, onTaskClick, onDateClick, onTaskTimeChange }: CalendarViewProps) {
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
          <DayView
            currentDate={currentDate}
            tasks={tasks}
            onTaskClick={onTaskClick}
            onDateClick={onDateClick}
            onTaskTimeChange={onTaskTimeChange}
          />
        )}
      </div>
    </div>
  )
}

export default CalendarView
