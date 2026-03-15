import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { useInbox, useCreateTask, useCompleteTask, useUpdateTask } from '@/hooks/useTasks'
import { useProjects } from '@/hooks/useProjects'
import { Outline, type OutlineItem } from '@/components/Outline'
import { Inspector, type InspectorItem } from '@/packages/productivity-components/components/Inspector'
import { Button } from '@/packages/ui/components/button'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import type { Task } from '@/types'

export const Route = createFileRoute('/inbox')({
  component: InboxPage,
})

function InboxPage() {
  const { data: tasks, isLoading } = useInbox()
  const { data: projects } = useProjects()
  const createTask = useCreateTask()
  const completeTask = useCompleteTask()
  const updateTask = useUpdateTask()
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const handleNewAction = async () => {
    const title = prompt('输入新动作标题:')
    if (!title) return
    
    try {
      await createTask.mutateAsync({
        title,
        task_type: 'inbox',
      })
      toast.success('动作已添加')
    } catch (error) {
      toast.error('添加失败')
    }
  }

  const handleItemComplete = (item: OutlineItem) => {
    if (item.type === 'task' || item.type === 'inbox') {
      completeTask.mutate(item.id)
    }
  }

  const handleItemFlag = (item: OutlineItem) => {
    updateTask.mutate({
      id: item.id,
      data: { flagged: !item.flagged }
    })
  }

  const handleItemClick = (item: OutlineItem) => {
    // Find the actual task from tasks array
    const task = tasks?.find(t => t.id === item.id)
    if (task) {
      setSelectedTask(task)
    }
  }

  // Build tree structure from flat tasks
  const buildTreeItems = (tasks: Task[]): OutlineItem[] => {
    
    // Get root level tasks (no parent)
    const rootTasks = tasks.filter(t => !t.parent)
    
    // Convert task to OutlineItem recursively
    const convertTask = (task: Task): OutlineItem => {
      const children = tasks
        .filter(t => t.parent === task.id)
        .map(convertTask)
      
      return {
        id: task.id,
        title: task.title,
        type: task.task_type === 'action_group' ? 'group' : 'inbox',
        status: task.completed_at ? 'completed' : task.dropped_at ? 'dropped' : 'active',
        completed: !!task.completed_at,
        flagged: task.flagged,
        due_date: task.due_date,
        defer_date: task.defer_date,
        has_note: !!task.note,
        tags: task.tags,
        estimated_duration: task.estimated_duration,
        children: children.length > 0 ? children : undefined,
      }
    }
    
    return rootTasks.map(convertTask)
  }

  // Convert tasks to outline items with tree structure
  const outlineItems = useMemo(() => {
    if (!tasks) return []
    // Filter out tasks that have a project (not in inbox)
    const inboxTasks = tasks.filter(t => !t.project)
    return buildTreeItems(inboxTasks)
  }, [tasks])

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Quick Add Button */}
      <div className="p-4 border-b">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={handleNewAction}
        >
          <Plus className="h-4 w-4 mr-2" />
          添加收件箱动作
        </Button>
      </div>

      {/* Outline */}
      <Outline
        items={outlineItems}
        onItemClick={handleItemClick}
        onItemComplete={handleItemComplete}
        onItemFlag={handleItemFlag}
        selectedItemId={selectedTask?.id}
        className="p-2"
      />

      {/* Inspector Sheet */}
      <Inspector
        isOpen={!!selectedTask}
        item={selectedTask as InspectorItem}
        type="task"
        onClose={() => setSelectedTask(null)}
        onUpdate={(data) => {
          if (selectedTask) {
            updateTask.mutate({ id: selectedTask.id, data: data as Partial<Task> })
          }
        }}
        projects={projects || []}
      />
    </div>
  )
}

export default InboxPage
