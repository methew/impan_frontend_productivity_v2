import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Clock, Target, TrendingUp, Brain } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PomodoroTimer } from './PomodoroTimer'
import { clsx, type ClassValue } from 'clsx'

function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

interface Task {
  id: string
  title: string
  project: string
  completed?: boolean
  priority?: 'high' | 'medium' | 'low'
}

interface FocusStats {
  completedPomodoros: number
  totalFocusTime: number
  completedTasks: number
}

interface FocusSessionProps {
  tasks?: Task[]
  stats?: FocusStats
  onTaskComplete?: (taskId: string) => void
  onSessionComplete?: (duration: number) => void
}

export function FocusSession({
  tasks = [],
  stats = { completedPomodoros: 0, totalFocusTime: 0, completedTasks: 0 },
  onTaskComplete,
  onSessionComplete,
}: FocusSessionProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [sessionComplete, setSessionComplete] = useState(false)
  const [showTaskSelector, setShowTaskSelector] = useState(true)
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null)

  const handleStartFocus = useCallback(() => {
    setShowTaskSelector(false)
    setSessionStartTime(Date.now())
  }, [])

  const handleTimerComplete = useCallback(() => {
    setSessionComplete(true)
    if (sessionStartTime) {
      const duration = Math.floor((Date.now() - sessionStartTime) / 60000)
      onSessionComplete?.(duration)
    }
  }, [sessionStartTime, onSessionComplete])

  const handleTaskCompletion = useCallback(() => {
    if (selectedTask) {
      onTaskComplete?.(selectedTask.id)
      selectedTask.completed = true
    }
  }, [selectedTask, onTaskComplete])

  const handleNewSession = useCallback(() => {
    setSessionComplete(false)
    setShowTaskSelector(true)
    setSelectedTask(null)
    setSessionStartTime(null)
  }, [])

  // Task Selector View
  if (showTaskSelector) {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">选择专注任务</h2>
          <p className="text-gray-500">
            选择一个任务开始番茄钟专注 session
          </p>
        </div>

        {tasks.length > 0 ? (
          <div className="space-y-3">
            {tasks.map((task) => (
              <motion.div
                key={task.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={cn(
                  'cursor-pointer transition-all p-4 rounded-lg border hover:border-blue-500',
                  selectedTask?.id === task.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                )}
                onClick={() => setSelectedTask(task)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                        selectedTask?.id === task.id
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-400'
                      )}
                    >
                      {selectedTask?.id === task.id && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">{task.title}</h3>
                      <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-gray-100 rounded">
                        {task.project}
                      </span>
                    </div>
                  </div>
                  {task.priority && (
                    <span
                      className={cn(
                        'px-2 py-1 text-xs rounded',
                        task.priority === 'high'
                          ? 'bg-red-100 text-red-700'
                          : task.priority === 'medium'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      )}
                    >
                      {task.priority === 'high'
                        ? '高'
                        : task.priority === 'medium'
                        ? '中'
                        : '低'}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center border rounded-lg">
            <p className="text-gray-500">暂无待办任务</p>
            <Button className="mt-4" variant="outline">
              创建新任务
            </Button>
          </div>
        )}

        <div className="flex justify-center">
          <Button
            size="lg"
            disabled={!selectedTask}
            onClick={handleStartFocus}
          >
            <Brain className="mr-2 h-5 w-5" />
            {selectedTask ? '开始专注' : '请先选择任务'}
          </Button>
        </div>

        {/* Today's Stats */}
        <div className="bg-gray-50 rounded-lg p-4 border">
          <h3 className="text-base font-medium flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4" />
            今日专注统计
          </h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{stats.completedPomodoros}</div>
              <div className="text-xs text-gray-500">完成番茄</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.totalFocusTime}分钟</div>
              <div className="text-xs text-gray-500">专注时长</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.completedTasks}</div>
              <div className="text-xs text-gray-500">完成任务</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Session Complete View
  if (sessionComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto text-center space-y-6"
      >
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-12 w-12 text-green-600" />
        </div>

        <div>
          <h2 className="text-2xl font-bold">专注完成！</h2>
          <p className="text-gray-500 mt-2">
            恭喜你完成了一个番茄钟
          </p>
        </div>

        {selectedTask && (
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-blue-500" />
              <div className="text-left">
                <div className="font-medium">{selectedTask.title}</div>
                <div className="text-sm text-gray-500">
                  {selectedTask.project}
                </div>
              </div>
            </div>
            {!selectedTask.completed && (
              <Button
                className="w-full mt-4"
                variant="outline"
                onClick={handleTaskCompletion}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                完成任务
              </Button>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={handleNewSession}>
            返回任务列表
          </Button>
          <Button className="flex-1" onClick={() => setSessionComplete(false)}>
            <Clock className="mr-2 h-4 w-4" />
            再专注一个
          </Button>
        </div>
      </motion.div>
    )
  }

  // Active Focus View
  return (
    <div className="max-w-2xl mx-auto">
      {/* Task Info */}
      {selectedTask && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="bg-blue-50 border-blue-200 rounded-lg p-4 flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500 mb-1">当前任务</div>
              <div className="font-medium text-lg">{selectedTask.title}</div>
              <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-gray-200 rounded">
                {selectedTask.project}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTaskSelector(true)}
            >
              切换任务
            </Button>
          </div>
        </motion.div>
      )}

      {/* Timer */}
      <PomodoroTimer onComplete={handleTimerComplete} />

      {/* Tips */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>💡 专注提示：将手机调至静音，关闭通知，全身心投入当前任务</p>
      </div>
    </div>
  )
}
