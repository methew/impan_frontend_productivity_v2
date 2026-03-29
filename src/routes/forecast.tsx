import { createFileRoute } from '@tanstack/react-router'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/packages/ui/components/button'
import { Checkbox } from '@/packages/ui/components/checkbox'
import { useState } from 'react'
import { useDueToday, useOverdue, useCompleteTask, useUpdateTask } from '@/hooks/useTasks'
import { format, addDays, startOfWeek, addWeeks, isSameDay } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import type { Task } from '@/types'
import { usePageMeta } from '@/hooks/usePageMeta'

export const Route = createFileRoute('/forecast')({
  component: ForecastPage,
})

function ForecastPage() {
  usePageMeta({ titleKey: 'forecast.title', descriptionKey: 'meta.forecast.description' })
  const { t } = useTranslation()
  const [currentDate, setCurrentDate] = useState(new Date())
  const { data: dueToday } = useDueToday()
  const { data: overdue } = useOverdue()
  const completeTask = useCompleteTask()
  const updateTask = useUpdateTask()

  // Get week days
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const handlePrevWeek = () => setCurrentDate(addWeeks(currentDate, -1))
  const handleNextWeek = () => setCurrentDate(addWeeks(currentDate, 1))

  const getTasksForDay = (date: Date) => {
    return dueToday?.filter(t => {
      if (!t.due_date) return false
      return isSameDay(new Date(t.due_date), date)
    }) || []
  }

  const handleFlag = (task: Task) => {
    updateTask.mutate({
      id: task.id,
      data: { flagged: !task.flagged }
    })
  }

  return (
    <div className="h-full flex flex-col bg-[#faf9f8]">
      {/* Header */}
      <div className="px-8 pt-8 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="h-8 w-8 text-[#10b981]" />
          <h1 className="text-2xl font-semibold text-gray-900">{t('forecast.title')}</h1>
        </div>
        
        {/* Week Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handlePrevWeek}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <span className="font-medium">
              {format(weekStart, 'yyyy年M月', { locale: zhCN })}
            </span>
            <Button variant="ghost" size="icon" onClick={handleNextWeek}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Week View */}
      <div className="flex-1 overflow-y-auto px-8 pb-8">
        <div className="grid grid-cols-7 gap-4">
          {weekDays.map((day, index) => {
            const dayTasks = getTasksForDay(day)
            const isToday = isSameDay(day, new Date())
            
            return (
              <div key={index} className="min-w-0">
                {/* Day Header */}
                <div className={`
                  text-center py-3 rounded-lg mb-3
                  ${isToday ? 'bg-[#2563eb] text-white' : 'bg-white'}
                `}>
                  <div className="text-xs opacity-80">
                    {format(day, 'EEEE', { locale: zhCN })}
                  </div>
                  <div className="text-lg font-semibold">
                    {format(day, 'd')}
                  </div>
                </div>

                {/* Tasks for this day */}
                <div className="space-y-2">
                  {dayTasks.map(task => (
                    <TaskItem 
                      key={task.id}
                      task={task}
                      onComplete={() => completeTask.mutate(task.id)}
                      onFlag={() => handleFlag(task)}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Overdue Section */}
        {overdue && overdue.length > 0 && (
          <div className="mt-8">
            <h3 className="text-sm font-medium text-red-500 mb-3">{t('forecast.overdue')}</h3>
            <div className="space-y-2">
              {overdue.map(task => (
                <TaskItem 
                  key={task.id}
                  task={task}
                  onComplete={() => completeTask.mutate(task.id)}
                  onFlag={() => handleFlag(task)}
                  overdue
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface TaskItemProps {
  task: Task
  onComplete: () => void
  onFlag: () => void
  overdue?: boolean
}

function TaskItem({ task, onComplete, onFlag, overdue }: TaskItemProps) {
  return (
    <div 
      className={`
        group flex items-center gap-2 bg-white rounded-lg shadow-sm border 
        px-3 py-2 hover:shadow-md transition-shadow text-sm
        ${overdue ? 'border-red-200' : 'border-gray-200'}
      `}
    >
      <Checkbox 
        checked={!!task.completed_at}
        onCheckedChange={onComplete}
        className="h-4 w-4 border-2 border-[#10b981] data-[state=checked]:bg-[#10b981]"
      />
      <span className={`flex-1 truncate ${task.completed_at ? 'line-through text-gray-400' : 'text-gray-900'}`}>
        {task.title}
      </span>
      <button
        onClick={onFlag}
        className="opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <svg 
          className={`h-4 w-4 ${task.flagged ? 'text-[#f59e0b] fill-[#f59e0b]' : 'text-gray-300 hover:text-[#f59e0b]'}`} 
          viewBox="0 0 24 24"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      </button>
    </div>
  )
}

export default ForecastPage
