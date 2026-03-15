import { createFileRoute } from '@tanstack/react-router'
import { Sun, Plus, CheckCircle2 } from 'lucide-react'
import { Input } from '@/packages/ui/components/input'
import { Checkbox } from '@/packages/ui/components/checkbox'
import { useState } from 'react'
import { useInbox, useCreateTask, useCompleteTask } from '@/hooks/useTasks'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { toast } from 'sonner'
import type { Task } from '@/types'

export const Route = createFileRoute('/')({
  component: MyDayPage,
})

function MyDayPage() {
  const { data: tasks, isLoading } = useInbox()
  const [newTask, setNewTask] = useState('')
  const createTask = useCreateTask()
  const completeTask = useCompleteTask()

  const today = new Date()
  const dayName = format(today, 'EEEE', { locale: zhCN })
  const dateStr = format(today, 'M月d日', { locale: zhCN })

  // Filter tasks for today (due today or no due date)
  const todayTasks = tasks?.filter(t => {
    if (t.completed_at) return false
    if (!t.due_date) return true
    const due = new Date(t.due_date)
    return due.toDateString() === today.toDateString()
  }) || []

  const completedTasks = tasks?.filter(t => {
    if (!t.completed_at) return false
    const completed = new Date(t.completed_at)
    return completed.toDateString() === today.toDateString()
  }) || []

  const handleAddTask = async () => {
    if (!newTask.trim()) return
    await createTask.mutateAsync({
      title: newTask,
      task_type: 'inbox',
      due_date: new Date().toISOString(),
    })
    setNewTask('')
    toast.success('已添加到我的一天')
  }

  return (
    <div className="h-full flex flex-col bg-[#faf9f8]">
      {/* Header */}
      <div className="px-8 pt-8 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <Sun className="h-8 w-8 text-[#2563eb]" />
          <h1 className="text-2xl font-semibold text-gray-900">我的一天</h1>
        </div>
        <p className="text-gray-500 ml-11">{dayName}，{dateStr}</p>
      </div>

      {/* Add Task Input */}
      <div className="px-8 py-4">
        <div className="flex items-center gap-3 bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3">
          <Plus className="h-5 w-5 text-[#2563eb]" />
          <Input
            placeholder="添加任务"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
            className="border-0 focus-visible:ring-0 p-0 text-base"
          />
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto px-8 pb-8">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">加载中...</div>
        ) : (
          <>
            {/* Active Tasks */}
            <div className="space-y-2">
              {todayTasks.map(task => (
                <TaskItem 
                  key={task.id} 
                  task={task} 
                  onComplete={() => completeTask.mutate(task.id)}
                />
              ))}
            </div>

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  已完成 {completedTasks.length}
                </h3>
                <div className="space-y-2">
                  {completedTasks.map(task => (
                    <TaskItem 
                      key={task.id} 
                      task={task} 
                      onComplete={() => {}}
                      completed
                    />
                  ))}
                </div>
              </div>
            )}

            {todayTasks.length === 0 && completedTasks.length === 0 && (
              <div className="text-center py-12">
                <Sun className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  专注于你的一天
                </h3>
                <p className="text-gray-500 max-w-sm mx-auto">
                  添加一些任务来规划你的一天。完成后记得勾选它们！
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

interface TaskItemProps {
  task: Task
  onComplete: () => void
  completed?: boolean
}

function TaskItem({ task, onComplete, completed }: TaskItemProps) {
  return (
    <div 
      className={`
        group flex items-center gap-3 bg-white rounded-lg shadow-sm border border-gray-200 
        px-4 py-3 hover:shadow-md transition-shadow
        ${completed ? 'opacity-60' : ''}
      `}
    >
      <Checkbox 
        checked={completed || !!task.completed_at}
        onCheckedChange={onComplete}
        className="h-5 w-5 border-2 border-[#2563eb] data-[state=checked]:bg-[#2563eb]"
      />
      <div className="flex-1 min-w-0">
        <span className={`block truncate ${completed || task.completed_at ? 'line-through text-gray-400' : 'text-gray-900'}`}>
          {task.title}
        </span>
        {task.project_title && (
          <span className="text-xs text-gray-400">{task.project_title}</span>
        )}
      </div>
      {task.flagged && (
        <svg className="h-5 w-5 text-[#f59e0b] fill-[#f59e0b]" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      )}
    </div>
  )
}

export default MyDayPage
