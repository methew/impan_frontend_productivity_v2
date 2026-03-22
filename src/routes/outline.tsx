import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ListTree, Plus } from 'lucide-react'

import { TaskOutlineItem, TaskOutlineItemCompact } from '@/components/task/TaskOutlineItem'
import { Button } from '@/packages/ui/components/button'
import { useTasks } from '@/hooks/useTasks'
import { Inspector } from '@/packages/productivity-components/components/Inspector'
import { NewTaskDialog } from '@/components/NewTaskDialog'
import { useProjects } from '@/hooks/useProjects'
import { usePageMeta } from '@/hooks/usePageMeta'
import type { Task } from '@/types'

export const Route = createFileRoute('/outline')({
  component: OutlinePage,
})

function OutlinePage() {
  usePageMeta({ titleKey: 'outline.title', descriptionKey: 'meta.outline.description' })
  const { t } = useTranslation()
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showNewTaskDialog, setShowNewTaskDialog] = useState(false)
  const [compactMode, setCompactMode] = useState(false)
  
  const { data: tasks = [], isLoading } = useTasks()
  const { data: projects = [] } = useProjects()

  const activeTasks = tasks.filter(t => !t.completed_at && !t.dropped_at)

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
          <ListTree className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-lg font-semibold">{t('outline.title', '大纲')}</h1>
          <span className="text-sm text-muted-foreground">
            {activeTasks.length} {t('common.items', '项')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setCompactMode(!compactMode)}
          >
            {compactMode ? '详细' : '紧凑'}
          </Button>
          <Button size="sm" onClick={() => setShowNewTaskDialog(true)}>
            <Plus className="h-4 w-4 mr-1" />
            {t('common.newTask', '新建任务')}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto py-4 px-4">
          {activeTasks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t('common.noData', '暂无数据')}</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setShowNewTaskDialog(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                {t('common.newTask')}
              </Button>
            </div>
          ) : (
            <div className="space-y-1">
              {activeTasks.map(task => (
                compactMode ? (
                  <TaskOutlineItemCompact
                    key={task.id}
                    task={task}
                    selected={selectedTask?.id === task.id}
                    onClick={() => setSelectedTask(task)}
                  />
                ) : (
                  <TaskOutlineItem
                    key={task.id}
                    task={task}
                    selected={selectedTask?.id === task.id}
                    onClick={() => setSelectedTask(task)}
                  />
                )
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Inspector */}
      <Inspector
        isOpen={!!selectedTask}
        item={selectedTask}
        type="task"
        onClose={() => setSelectedTask(null)}
        onUpdate={() => {
          if (selectedTask) {
            // Update task logic
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

export default OutlinePage
