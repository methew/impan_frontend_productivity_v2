/**
 * Notion Calendar Style - 日历视图 (增强版)
 * 
 * 功能：
 * - 侧边栏迷你日历 + 即将开始
 * - 日/周/月三种视图
 * - 全天事件支持
 * - 拖拽调整时间
 * - 项目/标签颜色区分
 * - 筛选功能
 */

import { useState, useMemo, useRef, useEffect } from 'react'
import { 
  ChevronLeft, 
  ChevronRight,
  Calendar as CalendarIcon,
  GripVertical,
  CalendarDays,
  Clock3,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  X
} from 'lucide-react'
import { Button } from '@/packages/ui/components/button'
import { Badge } from '@/packages/ui/components/badge'
import { cn } from '@/lib/utils'
import { format, addDays, startOfWeek, eachDayOfInterval, isSameDay, isSameMonth, startOfMonth, endOfMonth, eachWeekOfInterval, addMonths, subMonths, isToday } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import type { Task } from '@/types'

// ============================================================================
// Types
// ============================================================================

type ViewMode = 'month' | 'week' | 'day'
type FilterType = 'all' | 'project' | 'tag' | 'completed' | 'overdue'

interface NotionCalendarProps {
  tasks: Task[]
  projects?: { id: string; title: string; color?: string }[]
  onTaskClick?: (task: Task) => void
  onDateClick?: (date: Date) => void
  onTaskTimeChange?: (taskId: string, deferDate: string | null, dueDate: string | null) => void
}

interface CalendarEvent {
  task: Task
  start: Date
  end: Date
  isAllDay: boolean
  column: number
  totalColumns: number
  spanDays: number
}

interface DragState {
  taskId: string
  type: 'move' | 'resize-top' | 'resize-bottom'
  startY: number
  startTime: number
  duration: number
  originalDay?: Date // 用于周视图跨天拖拽
}

// ============================================================================
// Constants
// ============================================================================

const HOUR_HEIGHT = 64
const MINUTE_HEIGHT = HOUR_HEIGHT / 60
const TIME_COLUMN_WIDTH = 60

// 颜色映射
const PROJECT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  default: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
  red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
  green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
  yellow: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
  pink: { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
}

// ============================================================================
// Helper Functions
// ============================================================================

function timeToPixels(date: Date): number {
  return date.getHours() * HOUR_HEIGHT + date.getMinutes() * MINUTE_HEIGHT
}

function pixelsToMinutes(pixels: number): number {
  return Math.round(pixels / MINUTE_HEIGHT)
}

function formatTime(date: Date): string {
  return format(date, 'HH:mm')
}

function getTaskTimeRange(task: Task): { start: Date; end: Date; isAllDay: boolean } | null {
  let start: Date | null = null
  let end: Date | null = null
  let isAllDay = false

  if (task.defer_date) {
    start = new Date(task.defer_date)
  }
  if (task.due_date) {
    end = new Date(task.due_date)
  }

  // 如果都没有时间，检查是否是全天事件
  if (!start && !end) return null

  // 如果没有开始时间，默认结束时间前1小时
  if (!start && end) {
    start = new Date(end.getTime() - 60 * 60 * 1000)
  }
  // 如果没有结束时间，默认开始时间后1小时
  if (start && !end) {
    end = new Date(start.getTime() + 60 * 60 * 1000)
  }

  // 检查是否为全天事件（跨天或时间为00:00-23:59）
  if (start && end) {
    const startHour = start.getHours()
    const startMin = start.getMinutes()
    const endHour = end.getHours()
    const endMin = end.getMinutes()
    
    if (!isSameDay(start, end) || (startHour === 0 && startMin === 0 && endHour === 23 && endMin === 59)) {
      isAllDay = true
    }
  }

  // 最少30分钟
  if (end!.getTime() - start!.getTime() < 30 * 60 * 1000) {
    end = new Date(start!.getTime() + 30 * 60 * 1000)
  }

  return { start: start!, end: end!, isAllDay }
}

function getEventColor(task: Task): { bg: string; border: string; text: string } {
  // 根据标签颜色
  if (task.tags && task.tags.length > 0) {
    const firstTag = task.tags[0]
    if (firstTag.color) {
      const colorKey = firstTag.color.toLowerCase()
      if (PROJECT_COLORS[colorKey]) return PROJECT_COLORS[colorKey]
    }
  }
  
  // 已完成任务
  if (task.completed_at) {
    return { bg: 'bg-muted/60', border: 'border-muted', text: 'text-muted-foreground' }
  }
  
  // 逾期任务
  if (task.due_date && new Date(task.due_date) < new Date() && !task.completed_at) {
    return { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700' }
  }
  
  // 重要任务
  if (task.is_important) {
    return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' }
  }
  
  return PROJECT_COLORS.default
}

// ============================================================================
// Filter Panel
// ============================================================================

interface FilterPanelProps {
  filter: FilterType
  setFilter: (f: FilterType) => void
  selectedProject: string | null
  setSelectedProject: (p: string | null) => void
  projects?: { id: string; title: string }[]
}

function FilterPanel({ filter, setFilter, selectedProject, setSelectedProject, projects }: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <Button 
        variant={filter !== 'all' || selectedProject ? 'secondary' : 'ghost'} 
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-1"
      >
        <Filter className="h-4 w-4" />
        筛选
        {(filter !== 'all' || selectedProject) && (
          <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] text-xs">
            1
          </Badge>
        )}
      </Button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-64 bg-popover border rounded-lg shadow-lg z-50 p-3">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-sm">筛选条件</h4>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">状态</label>
                <div className="flex flex-wrap gap-1">
                  {[
                    { key: 'all', label: '全部', icon: CalendarIcon },
                    { key: 'completed', label: '已完成', icon: CheckCircle2 },
                    { key: 'overdue', label: '已逾期', icon: AlertCircle },
                  ].map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => setFilter(key as FilterType)}
                      className={cn(
                        "flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs transition-colors",
                        filter === key 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted hover:bg-accent"
                      )}
                    >
                      <Icon className="h-3 w-3" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {projects && projects.length > 0 && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">项目</label>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    <button
                      onClick={() => setSelectedProject(null)}
                      className={cn(
                        "w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-colors",
                        selectedProject === null 
                          ? "bg-primary text-primary-foreground" 
                          : "hover:bg-accent"
                      )}
                    >
                      全部项目
                    </button>
                    {projects.map(p => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedProject(p.id)}
                        className={cn(
                          "w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-colors truncate",
                          selectedProject === p.id 
                            ? "bg-primary text-primary-foreground" 
                            : "hover:bg-accent"
                        )}
                      >
                        {p.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ============================================================================
// Mini Calendar
// ============================================================================

interface MiniCalendarProps {
  currentDate: Date
  onSelectDate: (date: Date) => void
  tasks: Task[]
}

function MiniCalendar({ currentDate, onSelectDate, tasks }: MiniCalendarProps) {
  const [displayMonth, setDisplayMonth] = useState(currentDate)
  
  const monthStart = startOfMonth(displayMonth)
  const monthEnd = endOfMonth(displayMonth)
  const weeks = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 1 })
  const weekDays = ['一', '二', '三', '四', '五', '六', '日']

  const getTaskCountForDay = (day: Date) => {
    return tasks.filter(task => {
      const range = getTaskTimeRange(task)
      if (!range) return false
      return isSameDay(range.start, day) || isSameDay(range.end, day)
    }).length
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6"
          onClick={() => setDisplayMonth(subMonths(displayMonth, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 
          className="font-semibold text-sm cursor-pointer hover:text-primary"
          onClick={() => setDisplayMonth(new Date())}
        >
          {format(displayMonth, 'yyyy年 M月', { locale: zhCN })}
        </h3>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6"
          onClick={() => setDisplayMonth(addMonths(displayMonth, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs text-muted-foreground py-1">
            {day}
          </div>
        ))}

        {weeks.flatMap(week => {
          const days = eachDayOfInterval({ start: week, end: addDays(week, 6) })
          return days.map(day => {
            const isCurrentMonth = isSameMonth(day, displayMonth)
            const today = isToday(day)
            const selected = isSameDay(day, currentDate)
            const taskCount = getTaskCountForDay(day)

            return (
              <button
                key={day.toISOString()}
                onClick={() => {
                  onSelectDate(day)
                  setDisplayMonth(day)
                }}
                className={cn(
                  "relative h-8 w-8 rounded-lg text-xs flex items-center justify-center transition-all",
                  !isCurrentMonth && "text-muted-foreground/30",
                  isCurrentMonth && !selected && !today && "hover:bg-accent text-foreground",
                  today && !selected && "bg-primary/10 text-primary font-semibold",
                  selected && "bg-primary text-primary-foreground shadow-sm"
                )}
              >
                {day.getDate()}
                {taskCount > 0 && (
                  <span className={cn(
                    "absolute -bottom-0.5 w-1 h-1 rounded-full",
                    selected ? "bg-primary-foreground" : "bg-primary"
                  )} />
                )}
              </button>
            )
          })
        })}
      </div>
    </div>
  )
}

// ============================================================================
// Upcoming Events
// ============================================================================

interface UpcomingEventsProps {
  tasks: Task[]
  onTaskClick?: (task: Task) => void
}

function UpcomingEvents({ tasks, onTaskClick }: UpcomingEventsProps) {
  const upcoming = useMemo(() => {
    const now = new Date()
    return tasks
      .filter(task => {
        const range = getTaskTimeRange(task)
        if (!range) return false
        return range.end >= now && !task.completed_at
      })
      .slice(0, 6)
  }, [tasks])

  if (upcoming.length === 0) return null

  return (
    <div className="px-4 py-3 border-t">
      <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-1">
        <Clock className="h-3 w-3" />
        即将开始
      </h4>
      <div className="space-y-2">
        {upcoming.map(task => {
          const range = getTaskTimeRange(task)
          const colors = getEventColor(task)
          return (
            <div
              key={task.id}
              onClick={() => onTaskClick?.(task)}
              className={cn(
                "group flex items-start gap-2 p-2 rounded-lg cursor-pointer transition-all border",
                colors.bg,
                colors.border,
                "hover:shadow-sm"
              )}
            >
              <div className={cn("w-1 h-full min-h-[36px] rounded-full opacity-50", colors.text.replace('text-', 'bg-'))} />
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium truncate", colors.text)}>{task.title}</p>
                {range && (
                  <p className="text-xs text-muted-foreground">
                    {isToday(range.start) 
                      ? `今天 ${formatTime(range.start)}`
                      : format(range.start, 'M月d日 HH:mm')
                    }
                  </p>
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
// Day View (Enhanced)
// ============================================================================

interface DayViewProps {
  date: Date
  tasks: Task[]
  onTaskClick?: (task: Task) => void
  onTaskTimeChange?: (taskId: string, deferDate: string, dueDate: string) => void
  onDateClick?: (date: Date) => void
}

function DayView({ date, tasks, onTaskClick, onTaskTimeChange, onDateClick }: DayViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [dragState, setDragState] = useState<DragState | null>(null)
  const isDraggingRef = useRef(false)
  const [hoveredHour, setHoveredHour] = useState<number | null>(null)

  // 分离全天事件和定时事件
  const { allDayEvents, timedEvents } = useMemo(() => {
    const allDay: CalendarEvent[] = []
    const timed: CalendarEvent[] = []

    tasks.forEach(task => {
      const range = getTaskTimeRange(task)
      if (!range) return

      const event: CalendarEvent = {
        task,
        start: range.start,
        end: range.end,
        isAllDay: range.isAllDay,
        column: 0,
        totalColumns: 1,
        spanDays: 1
      }

      if (range.isAllDay || !isSameDay(range.start, range.end)) {
        allDay.push(event)
      } else {
        timed.push(event)
      }
    })

    // 计算定时事件布局
    timed.sort((a, b) => a.start.getTime() - b.start.getTime())
    const columns: CalendarEvent[][] = []
    for (const event of timed) {
      let placed = false
      for (let i = 0; i < columns.length; i++) {
        const column = columns[i]
        const lastEvent = column[column.length - 1]
        if (lastEvent.end <= event.start) {
          column.push(event)
          event.column = i
          placed = true
          break
        }
      }
      if (!placed) {
        columns.push([event])
        event.column = columns.length - 1
      }
    }
    timed.forEach(e => e.totalColumns = columns.length)

    return { allDayEvents: allDay, timedEvents: timed }
  }, [tasks])

  const isCurrentDay = isToday(date)

  useEffect(() => {
    if (scrollRef.current && isCurrentDay) {
      const now = new Date()
      scrollRef.current.scrollTop = Math.max(0, timeToPixels(now) - 200)
    }
  }, [isCurrentDay])

  // 拖拽处理
  const handleMouseDown = (e: React.MouseEvent, event: CalendarEvent, type: 'move' | 'resize-top' | 'resize-bottom') => {
    e.stopPropagation()
    e.preventDefault()
    isDraggingRef.current = false

    setDragState({
      taskId: event.task.id,
      type,
      startY: e.clientY,
      startTime: event.start.getTime(),
      duration: event.end.getTime() - event.start.getTime()
    })
  }

  useEffect(() => {
    if (!dragState) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - dragState.startY
      if (Math.abs(deltaY) > 3) isDraggingRef.current = true

      const el = document.getElementById(`day-event-${dragState.taskId}`)
      if (!el) return

      const deltaMinutes = pixelsToMinutes(deltaY)
      const snapMinutes = Math.round(deltaMinutes / 15) * 15
      const originalStart = new Date(dragState.startTime)

      let newStart: Date
      let newEnd: Date

      if (dragState.type === 'move') {
        newStart = new Date(originalStart.getTime() + snapMinutes * 60000)
        newEnd = new Date(newStart.getTime() + dragState.duration)
      } else if (dragState.type === 'resize-top') {
        newStart = new Date(originalStart.getTime() + snapMinutes * 60000)
        newEnd = new Date(dragState.startTime + dragState.duration)
        if (newStart >= newEnd) newStart = new Date(newEnd.getTime() - 30 * 60000)
      } else {
        newStart = originalStart
        newEnd = new Date(newStart.getTime() + dragState.duration + snapMinutes * 60000)
        if (newEnd <= newStart) newEnd = new Date(newStart.getTime() + 30 * 60000)
      }

      const newTop = timeToPixels(newStart)
      const newHeight = Math.max(24, timeToPixels(newEnd) - newTop)

      el.style.top = `${newTop}px`
      el.style.height = `${newHeight}px`
      
      // 更新时间显示
      const timeEl = el.querySelector('.event-time') as HTMLElement
      if (timeEl) {
        timeEl.textContent = `${formatTime(newStart)} - ${formatTime(newEnd)}`
      }
    }

    const handleMouseUp = () => {
      if (dragState && isDraggingRef.current) {
        const el = document.getElementById(`day-event-${dragState.taskId}`)
        if (el) {
          const newTop = parseInt(el.style.top)
          const newHeight = parseInt(el.style.height)
          const startMinutes = pixelsToMinutes(newTop)
          const endMinutes = pixelsToMinutes(newTop + newHeight)

          const newStart = new Date(date)
          newStart.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0)
          const newEnd = new Date(date)
          newEnd.setHours(Math.floor(endMinutes / 60), endMinutes % 60, 0, 0)

          onTaskTimeChange?.(dragState.taskId, newStart.toISOString(), newEnd.toISOString())
        }
      }
      setDragState(null)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragState, date, onTaskTimeChange])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-background">
        <div className="flex items-center gap-3">
          <h2 className={cn("text-2xl font-semibold", isCurrentDay && "text-primary")}>
            {isCurrentDay ? '今天' : format(date, 'EEEE', { locale: zhCN })}
          </h2>
          <span className="text-lg text-muted-foreground">
            {format(date, 'M月d日', { locale: zhCN })}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            {timedEvents.length} 个事件
          </span>
          {allDayEvents.length > 0 && (
            <span className="flex items-center gap-1 ml-3">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              {allDayEvents.length} 个全天
            </span>
          )}
        </div>
      </div>

      {/* All Day Events */}
      {allDayEvents.length > 0 && (
        <div className="border-b bg-muted/20">
          <div className="flex">
            <div className="w-16 px-2 py-2 text-xs text-muted-foreground text-right border-r">
              全天
            </div>
            <div className="flex-1 p-2 space-y-1">
              {allDayEvents.map(event => {
                const colors = getEventColor(event.task)
                return (
                  <div
                    key={event.task.id}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-sm border cursor-pointer",
                      colors.bg,
                      colors.border,
                      colors.text,
                      event.task.completed_at && "opacity-50 line-through"
                    )}
                    onDoubleClick={() => onTaskClick?.(event.task)}
                  >
                    {event.task.title}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Time Grid */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto relative">
        <div className="relative" style={{ height: `${24 * HOUR_HEIGHT}px` }}>
          {/* 时间刻度 */}
          {Array.from({ length: 24 }, (_, i) => (
            <div
              key={i}
              className="absolute w-full border-b border-border/30 flex"
              style={{ top: `${i * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
              onMouseEnter={() => setHoveredHour(i)}
              onMouseLeave={() => setHoveredHour(null)}
            >
              <div className="w-16 pr-3 text-xs text-muted-foreground text-right pt-2">
                {i === 0 ? '午夜' : i === 12 ? '中午' : `${i}:00`}
              </div>
              <div className="flex-1 relative">
                {[15, 30, 45].map(m => (
                  <div
                    key={m}
                    className="absolute w-full border-b border-dashed border-border/20"
                    style={{ top: `${m * MINUTE_HEIGHT}px` }}
                  />
                ))}
                {/* 悬停高亮 */}
                {hoveredHour === i && (
                  <div className="absolute inset-0 bg-accent/30 pointer-events-none" />
                )}
              </div>
            </div>
          ))}

          {/* 当前时间线 */}
          {isCurrentDay && (
            <div
              className="absolute w-full z-20 pointer-events-none flex items-center"
              style={{ top: `${timeToPixels(new Date())}px` }}
            >
              <div className="w-16 pr-2 text-xs text-red-500 font-medium text-right">
                {format(new Date(), 'HH:mm')}
              </div>
              <div className="flex-1 h-px bg-red-500" />
            </div>
          )}

          {/* 定时事件 */}
          {timedEvents.map(event => {
            const top = timeToPixels(event.start)
            const height = Math.max(28, timeToPixels(event.end) - top)
            const widthPercent = 100 / event.totalColumns
            const leftPercent = event.column * widthPercent
            const colors = getEventColor(event.task)

            return (
              <div
                key={event.task.id}
                id={`day-event-${event.task.id}`}
                className={cn(
                  "absolute rounded-lg border shadow-sm cursor-pointer overflow-hidden group",
                  "hover:shadow-md transition-shadow",
                  colors.bg,
                  colors.border,
                  event.task.completed_at && "opacity-50"
                )}
                style={{
                  top: `${top}px`,
                  height: `${height}px`,
                  left: `calc(${TIME_COLUMN_WIDTH}px + ${leftPercent}% + 2px)`,
                  width: `calc(${widthPercent}% - 4px)`
                }}
                onMouseDown={(e) => handleMouseDown(e, event, 'move')}
                onDoubleClick={(e) => {
                  e.stopPropagation()
                  onTaskClick?.(event.task)
                }}
              >
                {/* 调整大小手柄 - 顶部 */}
                <div
                  className="absolute top-0 left-0 right-0 h-2 cursor-n-resize opacity-0 group-hover:opacity-100 transition-opacity flex justify-center bg-gradient-to-b from-black/5 to-transparent"
                  onMouseDown={(e) => handleMouseDown(e, event, 'resize-top')}
                >
                  <GripVertical className="h-3 w-3 rotate-90" />
                </div>

                {/* 内容 */}
                <div className="px-2 py-1 h-full flex flex-col">
                  <p className={cn("text-sm font-medium truncate", colors.text, event.task.completed_at && "line-through")}>
                    {event.task.title}
                  </p>
                  {height > 24 && (
                    <p className="event-time text-xs text-muted-foreground mt-0.5">
                      {formatTime(event.start)} - {formatTime(event.end)}
                    </p>
                  )}
                  {height > 50 && event.task.note && (
                    <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-2">
                      {event.task.note}
                    </p>
                  )}
                  {height > 40 && event.task.tags && event.task.tags.length > 0 && (
                    <div className="flex gap-1 mt-auto pt-1">
                      {event.task.tags.slice(0, 2).map(tag => (
                        <span key={tag.id} className="text-[10px] px-1 py-0.5 rounded bg-white/50">
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 调整大小手柄 - 底部 */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-2 cursor-s-resize opacity-0 group-hover:opacity-100 transition-opacity flex justify-center bg-gradient-to-t from-black/5 to-transparent"
                  onMouseDown={(e) => handleMouseDown(e, event, 'resize-bottom')}
                >
                  <GripVertical className="h-3 w-3 rotate-90" />
                </div>
              </div>
            )
          })}

          {/* 点击创建 */}
          <div 
            className="absolute inset-0"
            style={{ left: `${TIME_COLUMN_WIDTH}px` }}
            onClick={(e) => {
              if (isDraggingRef.current) return
              const rect = e.currentTarget.getBoundingClientRect()
              const y = e.clientY - rect.top + (scrollRef.current?.scrollTop || 0)
              const minutes = pixelsToMinutes(y)
              const hours = Math.floor(minutes / 60)
              const mins = Math.round((minutes % 60) / 15) * 15
              const clickedDate = new Date(date)
              clickedDate.setHours(hours, mins, 0, 0)
              onDateClick?.(clickedDate)
            }}
          />
        </div>
      </div>

      {/* 图例 */}
      <div className="px-4 py-2 border-t bg-muted/30 text-xs text-muted-foreground flex gap-4 flex-wrap">
        <span>🖱️ 拖拽移动</span>
        <span>↕️ 边界调时长</span>
        <span>👆👆 双击编辑</span>
        <span className="ml-auto">🟦 普通 🟨 重要 🟥 逾期</span>
      </div>
    </div>
  )
}

// ============================================================================
// Week View (Enhanced with Drag Support)
// ============================================================================

interface WeekViewProps {
  date: Date
  tasks: Task[]
  onTaskClick?: (task: Task) => void
  onTaskTimeChange?: (taskId: string, deferDate: string, dueDate: string) => void
  onDateClick?: (date: Date) => void
}

function WeekView({ date, tasks, onTaskClick, onTaskTimeChange, onDateClick }: WeekViewProps) {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 })
  const weekDays = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) })
  const [dragState, setDragState] = useState<DragState | null>(null)
  const isDraggingRef = useRef(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // 获取每天的事件
  const dayEvents = useMemo(() => {
    return weekDays.map(day => {
      const dayTasks = tasks.filter(task => {
        const range = getTaskTimeRange(task)
        if (!range || range.isAllDay) return false
        return isSameDay(range.start, day)
      })
      
      // 计算布局
      const events = dayTasks.map(task => ({
        task,
        ...getTaskTimeRange(task)!,
        column: 0,
        totalColumns: 1
      }))
      
      events.sort((a, b) => a.start.getTime() - b.start.getTime())
      const columns: typeof events[] = []
      for (const event of events) {
        let placed = false
        for (let i = 0; i < columns.length; i++) {
          const col = columns[i]
          if (col[col.length - 1].end <= event.start) {
            col.push(event)
            event.column = i
            placed = true
            break
          }
        }
        if (!placed) {
          columns.push([event])
          event.column = columns.length - 1
        }
      }
      events.forEach(e => e.totalColumns = columns.length)
      
      return { day, events }
    })
  }, [tasks, weekDays])

  // 全天事件
  const allDayEvents = useMemo(() => {
    return tasks.filter(task => {
      const range = getTaskTimeRange(task)
      return range?.isAllDay
    })
  }, [tasks])

  const handleMouseDown = (e: React.MouseEvent, event: any, day: Date, type: 'move' | 'resize-top' | 'resize-bottom') => {
    e.stopPropagation()
    e.preventDefault()
    isDraggingRef.current = false

    setDragState({
      taskId: event.task.id,
      type,
      startY: e.clientY,
      startTime: event.start.getTime(),
      duration: event.end.getTime() - event.start.getTime(),
      originalDay: day
    })
  }

  useEffect(() => {
    if (!dragState) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - dragState.startY
      if (Math.abs(deltaY) > 3) isDraggingRef.current = true

      const el = document.getElementById(`week-event-${dragState.taskId}`)
      if (!el) return

      const snapMinutes = Math.round(pixelsToMinutes(deltaY) / 15) * 15
      const originalStart = new Date(dragState.startTime)

      let newStart: Date
      let newEnd: Date

      if (dragState.type === 'move') {
        newStart = new Date(originalStart.getTime() + snapMinutes * 60000)
        newEnd = new Date(newStart.getTime() + dragState.duration)
      } else if (dragState.type === 'resize-top') {
        newStart = new Date(originalStart.getTime() + snapMinutes * 60000)
        newEnd = new Date(dragState.startTime + dragState.duration)
        if (newStart >= newEnd) newStart = new Date(newEnd.getTime() - 30 * 60000)
      } else {
        newStart = originalStart
        newEnd = new Date(newStart.getTime() + dragState.duration + snapMinutes * 60000)
        if (newEnd <= newStart) newEnd = new Date(newStart.getTime() + 30 * 60000)
      }

      el.style.top = `${timeToPixels(newStart)}px`
      el.style.height = `${Math.max(24, timeToPixels(newEnd) - timeToPixels(newStart))}px`
    }

    const handleMouseUp = () => {
      if (dragState && isDraggingRef.current) {
        const el = document.getElementById(`week-event-${dragState.taskId}`)
        if (el && dragState.originalDay) {
          const newTop = parseInt(el.style.top)
          const newHeight = parseInt(el.style.height)
          const startMinutes = pixelsToMinutes(newTop)
          const endMinutes = pixelsToMinutes(newTop + newHeight)

          const newStart = new Date(dragState.originalDay)
          newStart.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0)
          const newEnd = new Date(dragState.originalDay)
          newEnd.setHours(Math.floor(endMinutes / 60), endMinutes % 60, 0, 0)

          onTaskTimeChange?.(dragState.taskId, newStart.toISOString(), newEnd.toISOString())
        }
      }
      setDragState(null)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragState, onTaskTimeChange])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex border-b bg-background">
        <div className="w-16 border-r flex items-center justify-center">
          <span className="text-xs text-muted-foreground">GMT+8</span>
        </div>
        {weekDays.map(day => {
          const isToday = isSameDay(day, new Date())
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "flex-1 py-3 text-center border-r last:border-r-0",
                isToday && "bg-blue-50/30"
              )}
            >
              <div className="text-xs text-muted-foreground mb-1">
                {format(day, 'EEE', { locale: zhCN })}
              </div>
              <div className={cn(
                "text-lg font-semibold w-10 h-10 mx-auto flex items-center justify-center rounded-full",
                isToday && "bg-primary text-primary-foreground"
              )}>
                {day.getDate()}
              </div>
            </div>
          )
        })}
      </div>

      {/* All Day */}
      {allDayEvents.length > 0 && (
        <div className="border-b bg-muted/20">
          <div className="flex">
            <div className="w-16 px-2 py-2 text-xs text-muted-foreground text-right border-r">
              全天
            </div>
            <div className="flex-1 p-2">
              <div className="flex gap-2 overflow-x-auto">
                {allDayEvents.map(event => {
                  const colors = getEventColor(event)
                  return (
                    <div
                      key={event.id}
                      className={cn(
                        "px-3 py-1 rounded-md text-sm border whitespace-nowrap cursor-pointer",
                        colors.bg, colors.border, colors.text
                      )}
                      onDoubleClick={() => onTaskClick?.(event)}
                    >
                      {event.title}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Time Grid */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="relative" style={{ height: `${24 * HOUR_HEIGHT}px` }}>
          {Array.from({ length: 24 }, (_, i) => (
            <div
              key={i}
              className="absolute w-full border-b border-border/30 flex"
              style={{ top: `${i * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
            >
              <div className="w-16 pr-2 text-xs text-muted-foreground text-right pt-2 border-r">
                {i === 0 ? '' : `${i}:00`}
              </div>
              <div className="flex-1 flex">
                {dayEvents.map(({ day, events }) => (
                    <div
                      key={day.toISOString()}
                      className="flex-1 border-r last:border-r-0 relative hover:bg-accent/10 transition-colors"
                      onClick={() => {
                        if (isDraggingRef.current) return
                        const clickedDate = new Date(day)
                        clickedDate.setHours(i, 0, 0, 0)
                        onDateClick?.(clickedDate)
                      }}
                    >
                      {events.map(event => {
                        if (event.start.getHours() !== i) return null
                        const top = timeToPixels(event.start) % HOUR_HEIGHT
                        const height = Math.max(20, timeToPixels(event.end) - timeToPixels(event.start))
                        const widthPercent = 100 / event.totalColumns
                        const colors = getEventColor(event.task)

                        return (
                          <div
                            key={event.task.id}
                            id={`week-event-${event.task.id}`}
                            className={cn(
                              "absolute rounded border shadow-sm cursor-pointer overflow-hidden group",
                              "hover:shadow-md transition-shadow text-xs",
                              colors.bg,
                              colors.border,
                              event.task.completed_at && "opacity-50"
                            )}
                            style={{
                              top: `${top}px`,
                              height: `${height}px`,
                              left: `${event.column * widthPercent + 1}%`,
                              width: `${widthPercent - 2}%`
                            }}
                            onMouseDown={(e) => handleMouseDown(e, event, day, 'move')}
                            onDoubleClick={(e) => {
                              e.stopPropagation()
                              onTaskClick?.(event.task)
                            }}
                          >
                            <div className={cn("px-1 py-0.5 truncate font-medium", colors.text)}>
                              {event.task.title}
                            </div>
                            <div className="px-1 text-[10px] text-muted-foreground">
                              {formatTime(event.start)}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Month View (Enhanced)
// ============================================================================

interface MonthViewProps {
  date: Date
  tasks: Task[]
  onTaskClick?: (task: Task) => void
  onDateClick?: (date: Date) => void
  onTaskTimeChange?: (taskId: string, deferDate: string, dueDate: string) => void
}

function MonthView({ date, tasks, onTaskClick, onDateClick, onTaskTimeChange }: MonthViewProps) {
  const monthStart = startOfMonth(date)
  const monthEnd = endOfMonth(date)
  const weeks = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 1 })
  const weekDays = ['一', '二', '三', '四', '五', '六', '日']
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null)
  const [dragOverDay, setDragOverDay] = useState<Date | null>(null)
  const isDraggingRef = useRef(false)

  // 拖拽开始
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggingTaskId(taskId)
    isDraggingRef.current = false
    e.dataTransfer.effectAllowed = 'move'
    // 设置拖拽时的透明度效果
    const el = document.getElementById(`month-task-${taskId}`)
    if (el) {
      el.style.opacity = '0.5'
    }
  }

  const handleDragEnd = (taskId: string) => {
    setDraggingTaskId(null)
    setDragOverDay(null)
    const el = document.getElementById(`month-task-${taskId}`)
    if (el) {
      el.style.opacity = '1'
    }
  }

  // 拖拽进入日期格子
  const handleDragOver = (e: React.DragEvent, day: Date) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverDay(day)
  }

  // 放置任务到新日期
  const handleDrop = (e: React.DragEvent, day: Date) => {
    e.preventDefault()
    if (!draggingTaskId) return

    const task = tasks.find(t => t.id === draggingTaskId)
    if (!task) return

    const range = getTaskTimeRange(task)
    if (!range) return

    isDraggingRef.current = true

    // 计算新的日期，保持原有时间
    const newStart = new Date(day)
    newStart.setHours(range.start.getHours(), range.start.getMinutes(), 0, 0)
    
    const duration = range.end.getTime() - range.start.getTime()
    const newEnd = new Date(newStart.getTime() + duration)

    onTaskTimeChange?.(draggingTaskId, newStart.toISOString(), newEnd.toISOString())
    setDragOverDay(null)
    setDraggingTaskId(null)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <h2 className="text-xl font-semibold">
          {format(date, 'yyyy年 M月', { locale: zhCN })}
        </h2>
      </div>

      {/* Week Days */}
      <div className="grid grid-cols-7 border-b bg-muted/30">
        {weekDays.map(day => (
          <div key={day} className="py-2 text-center text-sm font-medium text-muted-foreground">
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="flex-1 grid grid-rows-5">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7">
            {eachDayOfInterval({ start: week, end: addDays(week, 6) }).map(day => {
              const isCurrentMonth = isSameMonth(day, date)
              const today = isSameDay(day, new Date())
              const isDragOver = dragOverDay && isSameDay(dragOverDay, day)
              
              const dayTasks = tasks.filter(task => {
                const range = getTaskTimeRange(task)
                if (!range) return false
                return isSameDay(range.start, day)
              })

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "border-b border-r p-2 min-h-[100px] cursor-pointer transition-all",
                    !isCurrentMonth && "bg-muted/20 text-muted-foreground/50",
                    today && "bg-blue-50/50",
                    isDragOver && "bg-blue-100 ring-2 ring-inset ring-primary",
                    !isDragOver && "hover:bg-accent/30"
                  )}
                  onClick={() => {
                    if (isDraggingRef.current) return
                    onDateClick?.(day)
                  }}
                  onDragOver={(e) => handleDragOver(e, day)}
                  onDrop={(e) => handleDrop(e, day)}
                  onDragLeave={() => setDragOverDay(null)}
                >
                  <div className={cn(
                    "text-sm w-7 h-7 flex items-center justify-center rounded-full mb-1",
                    today && "bg-primary text-primary-foreground font-medium"
                  )}>
                    {day.getDate()}
                  </div>
                  <div className="space-y-1">
                    {dayTasks.slice(0, 4).map(event => {
                      const colors = getEventColor(event)
                      const isDraggingThis = draggingTaskId === event.id
                      
                      return (
                        <div
                          id={`month-task-${event.id}`}
                          key={event.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, event.id)}
                          onDragEnd={() => handleDragEnd(event.id)}
                          onClick={(e) => {
                            if (isDraggingRef.current) {
                              isDraggingRef.current = false
                              return
                            }
                            e.stopPropagation()
                            onTaskClick?.(event)
                          }}
                          className={cn(
                            "text-[11px] px-1.5 py-0.5 rounded truncate cursor-grab active:cursor-grabbing border transition-all",
                            colors.bg,
                            colors.border,
                            colors.text,
                            event.completed_at && "opacity-50 line-through",
                            isDraggingThis && "opacity-50 scale-95",
                            !isDraggingThis && "hover:shadow-sm"
                          )}
                        >
                          <div className="flex items-center gap-1">
                            <GripVertical className="h-2.5 w-2.5 opacity-40" />
                            <span className="truncate">{event.title}</span>
                          </div>
                        </div>
                      )
                    })}
                    {dayTasks.length > 4 && (
                      <div className="text-[10px] text-muted-foreground px-1">
                        +{dayTasks.length - 4} 更多
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function NotionCalendar({ tasks, projects, onTaskClick, onDateClick, onTaskTimeChange }: NotionCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('week')
  const [filter, setFilter] = useState<FilterType>('all')
  const [selectedProject, setSelectedProject] = useState<string | null>(null)

  // 筛选任务
  const filteredTasks = useMemo(() => {
    let result = tasks

    if (filter === 'completed') {
      result = result.filter(t => t.completed_at)
    } else if (filter === 'overdue') {
      result = result.filter(t => t.due_date && new Date(t.due_date) < new Date() && !t.completed_at)
    } else if (filter === 'all') {
      result = result.filter(t => !t.completed_at)
    }

    if (selectedProject) {
      result = result.filter(t => t.project === selectedProject)
    }

    return result
  }, [tasks, filter, selectedProject])

  const navigate = (direction: number) => {
    const newDate = new Date(currentDate)
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + direction)
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + direction * 7)
    } else {
      newDate.setDate(newDate.getDate() + direction)
    }
    setCurrentDate(newDate)
  }

  const goToToday = () => setCurrentDate(new Date())

  return (
    <div className="h-full flex bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r bg-muted/20 flex flex-col flex-shrink-0">
        <div className="p-4 border-b flex items-center justify-between">
          <h1 className="font-semibold text-lg flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            日历
          </h1>
        </div>

        <MiniCalendar 
          currentDate={currentDate} 
          onSelectDate={setCurrentDate}
          tasks={filteredTasks}
        />

        <div className="px-4 py-2">
          <div className="flex bg-muted rounded-lg p-1">
            {(['day', 'week', 'month'] as ViewMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  "flex-1 py-1.5 text-xs font-medium rounded-md transition-colors",
                  viewMode === mode 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {mode === 'day' ? '日' : mode === 'week' ? '周' : '月'}
              </button>
            ))}
          </div>
        </div>

        <UpcomingEvents tasks={filteredTasks} onTaskClick={onTaskClick} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday} className="ml-2">
              今天
            </Button>
            <span className="ml-4 text-sm text-muted-foreground">
              {filteredTasks.length} 个任务
            </span>
          </div>

          <div className="flex items-center gap-2">
            <FilterPanel 
              filter={filter} 
              setFilter={setFilter}
              selectedProject={selectedProject}
              setSelectedProject={setSelectedProject}
              projects={projects}
            />
            <Button
              variant={viewMode === 'day' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('day')}
            >
              <Clock3 className="h-4 w-4 mr-1" />
              日
            </Button>
            <Button
              variant={viewMode === 'week' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('week')}
            >
              <CalendarDays className="h-4 w-4 mr-1" />
              周
            </Button>
            <Button
              variant={viewMode === 'month' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('month')}
            >
              <CalendarIcon className="h-4 w-4 mr-1" />
              月
            </Button>
          </div>
        </div>

        {/* View Content */}
        <div className="flex-1 overflow-hidden">
          {viewMode === 'day' && (
            <DayView
              date={currentDate}
              tasks={filteredTasks}
              onTaskClick={onTaskClick}
              onDateClick={onDateClick}
              onTaskTimeChange={onTaskTimeChange}
            />
          )}
          {viewMode === 'week' && (
            <WeekView
              date={currentDate}
              tasks={filteredTasks}
              onTaskClick={onTaskClick}
              onDateClick={onDateClick}
              onTaskTimeChange={onTaskTimeChange}
            />
          )}
          {viewMode === 'month' && (
            <MonthView
              date={currentDate}
              tasks={filteredTasks}
              onTaskClick={onTaskClick}
              onDateClick={onDateClick}
              onTaskTimeChange={onTaskTimeChange}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default NotionCalendar
