/**
 * Kanban Board Page - 看板视图页面
 * 
 * 展示所有任务的看板视图
 */

import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Layout } from 'lucide-react'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { Inspector } from '@/packages/productivity-components/components/Inspector'
import { NewTaskDialog } from '@/components/NewTaskDialog'
import { useTasks, useUpdateTask } from '@/hooks/useTasks'
import { useProjects } from '@/hooks/useProjects'
import { usePageMeta } from '@/hooks/usePageMeta'
import type { Task } from '@/types'

export const Route = createFileRoute('/board')({
  component: BoardPage,
})

type TaskStatus = 'todo' | 'in_progress' | 'done'

function BoardPage() {
  usePageMeta({ titleKey: 'board.title', descriptionKey: 'meta.board.description' })
  const { t } = useTranslation()
  const { data: tasks = [], isLoading } = useTasks()
  const { data: projects = [] } = useProjects()
  const updateTask = useUpdateTask()
  
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showNewTaskDialog, setShowNewTaskDialog] = useState(false)

  // Handle task move between columns
  const handleTaskMove = (taskId: string, newStatus: TaskStatus) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    // Update task based on new status
    const updates: Partial<Task> = {}
    
    if (newStatus === 'done') {
      updates.completed_at = new Date().toISOString()
      updates.dropped_at = null
    } else if (newStatus === 'todo') {
      updates.completed_at = null
      updates.dropped_at = null
      updates.defer_date = null
    } else if (newStatus === 'in_progress') {
      updates.completed_at = null
      updates.dropped_at = null
      updates.defer_date = new Date().toISOString()
    }

    updateTask.mutate({ id: taskId, data: updates })
  }

  // Handle task click - open inspector
  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
  }

  // Handle add task from column
  const handleAddTask = () => {
    setShowNewTaskDialog(true)
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-muted-foreground">{t('common.loading')}</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="h-14 border-b bg-card flex items-center px-4 justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Layout className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-lg font-semibold">{t('board.title')}</h1>
          <span className="text-sm text-muted-foreground">
            {tasks.length} {t('common.items')}
          </span>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-hidden">
        <KanbanBoard
          tasks={tasks}
          onTaskMove={handleTaskMove}
          onTaskClick={handleTaskClick}
          onAddTask={handleAddTask}
        />
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

      {/* New Task Dialog */}
      <NewTaskDialog
        open={showNewTaskDialog}
        onOpenChange={setShowNewTaskDialog}
      />
    </div>
  )
}

export default BoardPage
