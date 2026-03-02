import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, Calendar, Flag, Clock, Target } from 'lucide-react'
import { useTasks } from '@/hooks/useTasks'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { addDays, format, startOfWeek, addWeeks, isSameDay, isToday, isBefore, startOfDay } from 'date-fns'
import type { Task } from '@/types'

export const Route = createFileRoute('/_app/forecast')({
  component: ForecastPage,
})

function ForecastPage() {
  const { t } = useTranslation()
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 })
  const weekEnd = addDays(weekStart, 6)

  // Fetch all active tasks
  const { data: tasksData, isLoading } = useTasks({ page_size: 100 })
  const tasks = tasksData?.results || []

  // Generate 7 days
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  // Categorize tasks by date type
  const getTasksForDay = (day: Date): Array<{ task: Task; type: 'due' | 'planned' | 'defer' }> => {
    const result: Array<{ task: Task; type: 'due' | 'planned' | 'defer' }> = []
    
    tasks.forEach((task) => {
      if (task.is_completed) return
      
      // Due Date (highest priority)
      if (task.due_date && isSameDay(new Date(task.due_date), day)) {
        result.push({ task, type: 'due' })
        return
      }
      
      // Planned Date (medium priority)
      if (task.planned_date && isSameDay(new Date(task.planned_date), day)) {
        result.push({ task, type: 'planned' })
        return
      }
      
      // Defer Date - show when it becomes available
      if (task.defer_date && isSameDay(new Date(task.defer_date), day)) {
        result.push({ task, type: 'defer' })
      }
    })
    
    return result
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeek((prev) => addWeeks(prev, direction === 'prev' ? -1 : 1))
  }

  const goToToday = () => {
    setCurrentWeek(new Date())
  }

  // Summary stats
  const today = startOfDay(new Date())
  const overdueTasks = tasks.filter(t => t.due_date && !t.is_completed && isBefore(new Date(t.due_date), today))
  const dueTodayTasks = tasks.filter(t => t.due_date && !t.is_completed && isSameDay(new Date(t.due_date), today))
  const plannedTasks = tasks.filter(t => t.planned_date && !t.is_completed && isSameDay(new Date(t.planned_date), today))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('forecast.title')}</h1>
          <p className="text-muted-foreground">
            {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            {t('forecast.today')}
          </Button>
          <div className="flex items-center border rounded-md">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateWeek('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-3 text-sm">
              {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d')}
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateWeek('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <SummaryCard
          title={t('forecast.overdue')}
          value={overdueTasks.length}
          icon={Clock}
          color="text-red-500"
          bgColor="bg-red-50"
        />
        <SummaryCard
          title={t('forecast.dueToday')}
          value={dueTodayTasks.length}
          icon={Calendar}
          color="text-amber-500"
          bgColor="bg-amber-50"
        />
        <SummaryCard
          title={t('forecast.plannedToday')}
          value={plannedTasks.length}
          icon={Target}
          color="text-blue-500"
          bgColor="bg-blue-50"
        />
        <SummaryCard
          title={t('common.flagged')}
          value={tasks.filter(t => t.flagged && !t.is_completed).length}
          icon={Flag}
          color="text-orange-500"
          bgColor="bg-orange-50"
        />
      </div>

      {/* Weekly View */}
      <div className="grid grid-cols-7 gap-3">
        {weekDays.map((day) => (
          <DayColumn
            key={day.toISOString()}
            date={day}
            taskItems={getTasksForDay(day)}
            isLoading={isLoading}
          />
        ))}
      </div>
    </div>
  )
}

interface DayColumnProps {
  date: Date
  taskItems: Array<{ task: Task; type: 'due' | 'planned' | 'defer' }>
  isLoading: boolean
}

function DayColumn({ date, taskItems, isLoading }: DayColumnProps) {
  const { t } = useTranslation()
  const _isToday = isToday(date)
  const dayName = format(date, 'EEE')
  const dayNumber = format(date, 'd')

  // Sort: due > planned > defer
  const sortedItems = [...taskItems].sort((a, b) => {
    const priority = { due: 0, planned: 1, defer: 2 }
    return priority[a.type] - priority[b.type]
  })

  return (
    <div className={cn('flex flex-col border rounded-lg overflow-hidden min-h-[300px]', _isToday && 'ring-2 ring-primary')}>
      {/* Header */}
      <div className={cn('px-2 py-2 text-center border-b', _isToday ? 'bg-primary text-primary-foreground' : 'bg-muted/50')}>
        <div className="text-xs font-medium uppercase">{dayName}</div>
        <div className="text-lg font-bold">{dayNumber}</div>
      </div>

      {/* Tasks */}
      <div className="flex-1 p-2 space-y-1.5">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sortedItems.length > 0 ? (
          sortedItems.map(({ task, type }) => (
            <TaskCard key={task.id} task={task} type={type} />
          ))
        ) : (
          <div className="text-center text-muted-foreground/50 text-xs py-8">{t('forecast.noItems')}</div>
        )}
      </div>
    </div>
  )
}

interface TaskCardProps {
  task: Task
  type: 'due' | 'planned' | 'defer'
}

function TaskCard({ task, type }: TaskCardProps) {
  const { t } = useTranslation()
  const typeConfig = {
    due: { color: 'border-l-red-400 bg-red-50/50', label: t('forecast.taskTypes.due'), badge: 'bg-red-100 text-red-600' },
    planned: { color: 'border-l-blue-400 bg-blue-50/50', label: t('forecast.taskTypes.planned'), badge: 'bg-blue-100 text-blue-600' },
    defer: { color: 'border-l-gray-300 bg-gray-50/50', label: t('forecast.taskTypes.defer'), badge: 'bg-gray-100 text-gray-600' },
  }

  const config = typeConfig[type]

  return (
    <div className={cn('p-2 rounded border border-l-4 text-sm', config.color)}>
      <div className="flex items-start gap-1.5">
        {task.flagged && <Flag className="h-3 w-3 text-amber-500 fill-amber-500 flex-shrink-0 mt-0.5" />}
        <span className="line-clamp-2 flex-1">{task.title}</span>
      </div>
      <div className="flex items-center justify-between mt-1">
        <Badge variant="secondary" className={cn('text-[9px] px-1 py-0 h-4', config.badge)}>
          {config.label}
        </Badge>
        {task.project_name && (
          <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">{task.project_name}</span>
        )}
      </div>
    </div>
  )
}

interface SummaryCardProps {
  title: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  color?: string
  bgColor?: string
}

function SummaryCard({ title, value, icon: Icon, color, bgColor }: SummaryCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-md', bgColor || 'bg-muted')}>
            <Icon className={cn('h-5 w-5', color)} />
          </div>
          <div>
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs text-muted-foreground">{title}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
