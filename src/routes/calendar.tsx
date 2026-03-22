import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CalendarIcon, Plus } from 'lucide-react'

import { CalendarView } from '@/components/calendar/CalendarView'
import { Button } from '@/packages/ui/components/button'
import { useTasks, useUpdateTask } from '@/hooks/useTasks'
import { useProjects } from '@/hooks/useProjects'
import { Inspector } from '@/packages/productivity-components/components/Inspector'
import type { Task } from '@/types'

export const Route = createFileRoute('/calendar')({
  component: CalendarPage,
})

function CalendarPage() {
  const { t } = useTranslation()
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  
  const { data: tasks = [], isLoading } = useTasks()
  const { data: projects = [] } = useProjects()
  const updateTask = useUpdateTask()

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
  }

  const handleDateClick = (date: Date) => {
    // TODO: Open create task dialog with due date pre-filled
    console.log('Date clicked:', date)
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="h-14 border-b bg-card flex items-center px-4 justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <CalendarIcon className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-lg font-semibold">{t('calendar.title')}</h1>
          <span className="text-sm text-muted-foreground">
            {tasks.length} {t('common.items')}
          </span>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          {t('common.newTask')}
        </Button>
      </div>

      <div className="flex-1 overflow-hidden p-4">
        <div className="h-full bg-card rounded-lg border shadow-sm">
          <CalendarView
            tasks={tasks}
            onTaskClick={handleTaskClick}
            onDateClick={handleDateClick}
          />
        </div>
      </div>

      {/* Task Inspector */}
      <Inspector
        isOpen={!!selectedTask}
        item={selectedTask}
        type="task"
        onClose={() => setSelectedTask(null)}
        onUpdate={(data) => {
          if (selectedTask) {
            updateTask.mutate({ id: selectedTask.id, data: data as Partial<Task> })
          }
        }}
        onSave={() => {}}
        projects={projects}
      />
    </div>
  )
}

export default CalendarPage
