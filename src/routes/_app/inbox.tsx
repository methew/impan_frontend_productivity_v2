import { createFileRoute } from '@tanstack/react-router'
import { Plus, Inbox as InboxIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useInboxTasks, useCompleteTask, useToggleTaskFlag, useCreateTask } from '@/hooks/useTasks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TaskList } from '@/components/TaskList/TaskList'
import { Inspector } from '@/components/Inspector'
import { useState } from 'react'
import type { Task } from '@/types'

export const Route = createFileRoute('/_app/inbox')({
  component: InboxPage,
})

function InboxPage() {
  const { t } = useTranslation()
  const { data: tasks, isLoading } = useInboxTasks()
  const completeTask = useCompleteTask()
  const toggleFlag = useToggleTaskFlag()
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [inspectorTask, setInspectorTask] = useState<Task | null>(null)
  const [inspectorOpen, setInspectorOpen] = useState(false)

  const handleComplete = (taskId: string) => {
    completeTask.mutate(taskId)
  }

  const handleToggleFlag = (taskId: string) => {
    toggleFlag.mutate(taskId)
  }

  const handleOpenInspector = (task: Task) => {
    setInspectorTask(task)
    setInspectorOpen(true)
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  void handleOpenInspector

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('inbox.title')}</h1>
          <p className="text-muted-foreground">
            {t('inbox.tasksCount', { count: tasks?.count || 0 })}
          </p>
        </div>
      </div>

      {/* Quick Add */}
      <TaskQuickAdd />

      {/* Tasks List - OmniFocus Style */}
      <Card className="border-0 shadow-none bg-transparent">
        <CardHeader className="px-0 pb-3">
          <CardTitle className="text-base font-medium text-muted-foreground">{t('inbox.unorganizedTasks')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : tasks?.results && tasks.results.length > 0 ? (
            <TaskList
              tasks={tasks.results}
              onComplete={handleComplete}
              onToggleFlag={handleToggleFlag}
              onSelect={(task) => setSelectedTaskId(task.id)}
              // Inspector is now opened via double click on task row
              selectedId={selectedTaskId}
              showProject={true}
              emptyMessage={t('inbox.emptyTitle')}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <div className="w-20 h-20 rounded-full border-2 border-dashed border-muted-foreground/20 flex items-center justify-center mb-4">
                <InboxIcon className="w-10 h-10 text-muted-foreground/30" />
              </div>
              <p className="text-lg font-medium">{t('inbox.emptyTitle')}</p>
              <p className="text-sm text-muted-foreground mt-1">{t('inbox.emptyDescription')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Inspector
        task={inspectorTask}
        open={inspectorOpen}
        onClose={() => setInspectorOpen(false)}
      />
    </div>
  )
}

// Task Quick Add Component
function TaskQuickAdd() {
  const { t } = useTranslation()
  const [title, setTitle] = useState('')
  const createTask = useCreateTask()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    createTask.mutate(
      { title: title.trim() },
      {
        onSuccess: () => {
          setTitle('')
        },
      }
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600" />
        </div>
        <Input
          placeholder={t('inbox.addTaskPlaceholder')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="pl-10 h-11 bg-white dark:bg-slate-900"
        />
      </div>
      <Button type="submit" disabled={!title.trim() || createTask.isPending} size="default">
        <Plus className="h-4 w-4 mr-2" />
        {t('inbox.addButton')}
      </Button>
    </form>
  )
}
