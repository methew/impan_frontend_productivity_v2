import { createFileRoute } from '@tanstack/react-router'
import { CheckCircle2, RotateCcw } from 'lucide-react'
import { Button } from '@/packages/ui/components/button'
import { Checkbox } from '@/packages/ui/components/checkbox'
import { useCompletedToday, useUpdateTask } from '@/hooks/useTasks'
import { format, parseISO } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import type { Task } from '@/types'

export const Route = createFileRoute('/completed')({
  component: CompletedPage,
})

function CompletedPage() {
  const { data: completedTasks, isLoading } = useCompletedToday()
  const updateTask = useUpdateTask()

  const handleUndo = (task: Task) => {
    updateTask.mutate({
      id: task.id,
      data: { completed_at: undefined }
    })
  }

  // Group by completion date
  const grouped = completedTasks?.reduce((acc, task) => {
    const date = task.completed_at ? format(parseISO(task.completed_at), 'yyyy-MM-dd') : 'unknown'
    if (!acc[date]) acc[date] = []
    acc[date].push(task)
    return acc
  }, {} as Record<string, Task[]>) || {}

  return (
    <div className="h-full flex flex-col bg-[#faf9f8]">
      {/* Header */}
      <div className="px-8 pt-8 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <CheckCircle2 className="h-8 w-8 text-[#10b981]" />
          <h1 className="text-2xl font-semibold text-gray-900">已完成</h1>
        </div>
        <p className="text-gray-500 ml-11">
          {completedTasks?.length || 0} 个已完成任务
        </p>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto px-8 pb-8">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">加载中...</div>
        ) : (
          <>
            {Object.entries(grouped).map(([date, tasks]) => (
              <div key={date} className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-3">
                  {date === format(new Date(), 'yyyy-MM-dd') 
                    ? '今天' 
                    : format(parseISO(date), 'M月d日', { locale: zhCN })
                  }
                </h3>
                <div className="space-y-2">
                  {tasks.map(task => (
                    <div 
                      key={task.id}
                      className="group flex items-center gap-3 bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3"
                    >
                      <Checkbox 
                        checked={true}
                        className="h-5 w-5 border-2 border-[#10b981] bg-[#10b981]"
                      />
                      <span className="flex-1 line-through text-gray-400">
                        {task.title}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 h-8"
                        onClick={() => handleUndo(task)}
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        恢复
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {(!completedTasks || completedTasks.length === 0) && (
              <div className="text-center py-12">
                <CheckCircle2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  暂无已完成任务
                </h3>
                <p className="text-gray-500 max-w-sm mx-auto">
                  完成任务后，它们会显示在这里
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default CompletedPage
