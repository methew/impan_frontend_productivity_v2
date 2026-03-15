import { createFileRoute } from '@tanstack/react-router'
import { Tags, Plus, Hash } from 'lucide-react'
import { Button } from '@/packages/ui/components/button'
import { Card, CardContent } from '@/packages/ui/components/card'
import { Badge } from '@/packages/ui/components/badge'
import { Checkbox } from '@/packages/ui/components/checkbox'
import { useTasksByTag, useCompleteTask } from '@/hooks/useTasks'


export const Route = createFileRoute('/tags')({
  component: TagsPage,
})

function TagsPage() {
  const { data: tasksByTag } = useTasksByTag()

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Tags className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-bold">标签</h1>
            <p className="text-sm text-muted-foreground">
              按上下文组织任务
            </p>
          </div>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-1" />
          新建标签
        </Button>
      </div>

      {/* Tags Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasksByTag?.map(({ tag, tasks }) => (
            <TagCard key={tag.id} tag={tag} tasks={tasks} />
          ))}
        </div>
      </div>
    </div>
  )
}

function TagCard({ tag, tasks }: { tag: { id: string; name: string; color?: string }; tasks: any[] }) {
  const completeTask = useCompleteTask()

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Hash className="h-4 w-4" style={{ color: tag.color }} />
          <h3 className="font-semibold">{tag.name}</h3>
          <Badge variant="secondary" className="ml-auto">
            {tasks.length}
          </Badge>
        </div>

        <div className="space-y-2">
          {tasks.slice(0, 5).map((task: any) => (
            <div 
              key={task.id} 
              className="flex items-start gap-2 text-sm"
            >
              <Checkbox 
                checked={!!task.completed_at}
                onCheckedChange={() => completeTask.mutate(task.id)}
                className="mt-0.5 rounded-full"
              />
              <div className="flex-1 min-w-0">
                <span className={task.completed_at ? 'line-through text-muted-foreground' : ''}>
                  {task.title}
                </span>
                {task.due_date && (
                  <p className="text-xs text-muted-foreground">
                    {new Date(task.due_date).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          ))}
          {tasks.length > 5 && (
            <p className="text-xs text-muted-foreground text-center">
              还有 {tasks.length - 5} 个任务...
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
