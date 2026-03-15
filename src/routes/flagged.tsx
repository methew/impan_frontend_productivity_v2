import { createFileRoute } from '@tanstack/react-router'
import { Star } from 'lucide-react'
import { Checkbox } from '@/packages/ui/components/checkbox'
import { useFlaggedTasks, useCompleteTask, useUpdateTask } from '@/hooks/useTasks'
import type { Task } from '@/types'

export const Route = createFileRoute('/flagged')({
  component: FlaggedPage,
})

function FlaggedPage() {
  const { data: tasks, isLoading } = useFlaggedTasks()
  const completeTask = useCompleteTask()
  const updateTask = useUpdateTask()

  const activeTasks = tasks?.filter(t => !t.completed_at) || []
  const completedTasks = tasks?.filter(t => t.completed_at) || []

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
        <div className="flex items-center gap-3 mb-2">
          <Star className="h-8 w-8 text-[#f59e0b] fill-[#f59e0b]" />
          <h1 className="text-2xl font-semibold text-gray-900">重要</h1>
        </div>
        <p className="text-gray-500 ml-11">{activeTasks.length} 个重要任务</p>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto px-8 pb-8">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">加载中...</div>
        ) : (
          <>
            {/* Active Tasks */}
            <div className="space-y-2">
              {activeTasks.map(task => (
                <TaskItem 
                  key={task.id} 
                  task={task} 
                  onComplete={() => completeTask.mutate(task.id)}
                  onFlag={() => handleFlag(task)}
                />
              ))}
            </div>

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-500 mb-3">
                  已完成 {completedTasks.length}
                </h3>
                <div className="space-y-2">
                  {completedTasks.map(task => (
                    <TaskItem 
                      key={task.id} 
                      task={task} 
                      onComplete={() => {}}
                      onFlag={() => handleFlag(task)}
                      completed
                    />
                  ))}
                </div>
              </div>
            )}

            {activeTasks.length === 0 && completedTasks.length === 0 && (
              <div className="text-center py-12">
                <Star className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  没有重要任务
                </h3>
                <p className="text-gray-500 max-w-sm mx-auto">
                  标记一些任务为重要，它们会显示在这里
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
  onFlag: () => void
  completed?: boolean
}

function TaskItem({ task, onComplete, onFlag, completed }: TaskItemProps) {
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
        className="h-5 w-5 border-2 border-[#f59e0b] data-[state=checked]:bg-[#f59e0b]"
      />
      <div className="flex-1 min-w-0">
        <span className={`block truncate ${completed || task.completed_at ? 'line-through text-gray-400' : 'text-gray-900'}`}>
          {task.title}
        </span>
        {task.project_title && (
          <span className="text-xs text-gray-400">{task.project_title}</span>
        )}
      </div>
      <button
        onClick={onFlag}
        className="opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <svg 
          className={`h-5 w-5 ${task.flagged ? 'text-[#f59e0b] fill-[#f59e0b]' : 'text-gray-300 hover:text-[#f59e0b]'}`} 
          viewBox="0 0 24 24"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      </button>
    </div>
  )
}

export default FlaggedPage
