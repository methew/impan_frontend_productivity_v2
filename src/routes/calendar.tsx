import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NotionCalendar } from '@/components/calendar/NotionCalendar'
import { useTasks, useUpdateTask } from '@/hooks/useTasks'
import { useProjects } from '@/hooks/useProjects'
import { Inspector } from '@/packages/productivity-components/components/Inspector'
import { NewTaskDialog } from '@/components/NewTaskDialog'
import { toast } from 'sonner'
import type { Task } from '@/types'

export const Route = createFileRoute('/calendar')({
  component: CalendarPage,
})

function CalendarPage() {
  useTranslation() // kept for future i18n usage
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showNewTaskDialog, setShowNewTaskDialog] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  
  const { data: tasks = [], isLoading } = useTasks()
  const { data: projects = [] } = useProjects()
  const updateTask = useUpdateTask()

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setShowNewTaskDialog(true)
  }

  // Handle task time change from day view drag/resize
  const handleTaskTimeChange = (taskId: string, deferDate: string | null, dueDate: string | null) => {
    updateTask.mutate(
      { 
        id: taskId, 
        data: { 
          defer_date: deferDate,
          due_date: dueDate 
        } 
      },
      {
        onSuccess: () => {
          toast.success('时间已更新')
        },
        onError: () => {
          toast.error('时间更新失败')
        }
      }
    )
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
      <NotionCalendar
        tasks={tasks}
        onTaskClick={handleTaskClick}
        onDateClick={handleDateClick}
        onTaskTimeChange={handleTaskTimeChange}
      />

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
      
      {/* New Task Dialog */}
      <NewTaskDialog
        open={showNewTaskDialog}
        onOpenChange={(open) => {
          setShowNewTaskDialog(open)
          if (!open) setSelectedDate(null)
        }}
        defaultDueDate={selectedDate || undefined}
      />
    </div>
  )
}

export default CalendarPage
