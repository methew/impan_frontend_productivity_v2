import { createFileRoute } from '@tanstack/react-router'
import { Flag, ListTodo } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  useFlaggedTasks,
  useCompleteTask,
  useToggleTaskFlag,
} from '@/hooks/useTasks'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TaskList } from '@/components/TaskList/TaskList'
import { useState } from 'react'

export const Route = createFileRoute('/_app/flagged')({
  component: FlaggedPage,
})

function FlaggedPage() {
  const { t } = useTranslation()
  const { data: flaggedTasks, isLoading } = useFlaggedTasks()
  const completeTask = useCompleteTask()
  const toggleFlag = useToggleTaskFlag()
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  // Filter tasks
  const activeTasks = flaggedTasks?.results.filter((t) => !t.is_completed) || []
  const completedTasks = flaggedTasks?.results.filter((t) => t.is_completed) || []

  const handleComplete = (taskId: string) => {
    completeTask.mutate(taskId)
  }

  const handleToggleFlag = (taskId: string) => {
    toggleFlag.mutate(taskId)
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
            <Flag className="h-6 w-6 text-amber-500 fill-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t('flagged.title')}</h1>
            <p className="text-muted-foreground">
              {t('flagged.tasksCount', { count: activeTasks.length })}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList>
          <TabsTrigger value="active">
            {t('flagged.active')}
            {activeTasks.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeTasks.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed">
            {t('flagged.completed')}
            {completedTasks.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {completedTasks.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          <Card className="border-0 shadow-none bg-transparent">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : activeTasks.length > 0 ? (
                <TaskList
                  tasks={activeTasks}
                  onComplete={handleComplete}
                  onToggleFlag={handleToggleFlag}
                  onSelect={(task) => setSelectedTaskId(task.id)}
                  selectedId={selectedTaskId}
                  showProject={true}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <div className="w-20 h-20 rounded-full border-2 border-dashed border-muted-foreground/20 flex items-center justify-center mb-4">
                    <Flag className="w-10 h-10 text-muted-foreground/30" />
                  </div>
                  <p className="text-lg font-medium">{t('flagged.emptyTitle')}</p>
                  <p className="text-sm text-muted-foreground mt-1">{t('flagged.emptyDescription')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          <Card className="border-0 shadow-none bg-transparent">
            <CardContent className="p-0">
              {completedTasks.length > 0 ? (
                <TaskList
                  tasks={completedTasks}
                  onComplete={handleComplete}
                  onToggleFlag={handleToggleFlag}
                  showProject={true}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <div className="w-20 h-20 rounded-full border-2 border-dashed border-muted-foreground/20 flex items-center justify-center mb-4">
                    <ListTodo className="w-10 h-10 text-muted-foreground/30" />
                  </div>
                  <p className="text-lg font-medium">{t('flagged.emptyCompleted')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
