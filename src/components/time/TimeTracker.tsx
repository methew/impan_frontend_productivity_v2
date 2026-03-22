/**
 * Time Tracker - 时间追踪组件
 * 
 * 全局悬浮计时器 + 任务时间记录
 */

import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  Play, 
  Pause, 
  Square, 
  Clock,
  Timer,
  History
} from 'lucide-react'
import { Button } from '@/packages/ui/components/button'
import { Badge } from '@/packages/ui/components/badge'
import { cn } from '@/lib/utils'
import { formatDuration } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

interface TimeEntry {
  id: string
  task_id: string
  task_title: string
  started_at: string
  ended_at?: string
  duration_minutes: number
}

interface TimeTrackerProps {
  taskId?: string
  taskTitle?: string
  onStart?: () => void
  onStop?: (durationMinutes: number) => void
  compact?: boolean
}

// ============================================================================
// Timer Hook
// ============================================================================

interface UseTimerReturn {
  isRunning: boolean
  elapsedSeconds: number
  startTime: Date | null
  start: () => void
  stop: () => number
  reset: () => void
}

function useTimer(): UseTimerReturn {
  const [isRunning, setIsRunning] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [startTime, setStartTime] = useState<Date | null>(null)

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRunning) {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1)
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning])

  const start = useCallback(() => {
    setIsRunning(true)
    setStartTime(new Date())
  }, [])

  const stop = useCallback(() => {
    setIsRunning(false)
    const minutes = Math.ceil(elapsedSeconds / 60)
    return minutes
  }, [elapsedSeconds])

  const reset = useCallback(() => {
    setIsRunning(false)
    setElapsedSeconds(0)
    setStartTime(null)
  }, [])

  return { isRunning, elapsedSeconds, startTime, start, stop, reset }
}

// ============================================================================
// Timer Button (for task items)
// ============================================================================

interface TimerButtonProps {
  isRunning: boolean
  elapsedSeconds: number
  onToggle: () => void
  className?: string
}

export function TimerButton({ isRunning, elapsedSeconds, onToggle, className }: TimerButtonProps) {
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onToggle()
      }}
      className={cn(
        "flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors",
        isRunning 
          ? "bg-green-100 text-green-700 hover:bg-green-200" 
          : "bg-muted text-muted-foreground hover:bg-muted/80",
        className
      )}
    >
      {isRunning ? (
        <>
          <Pause className="h-3 w-3" />
          <span>{formatTime(elapsedSeconds)}</span>
        </>
      ) : (
        <>
          <Play className="h-3 w-3" />
          <span>开始</span>
        </>
      )}
    </button>
  )
}

// ============================================================================
// Main Time Tracker Component
// ============================================================================

export function TimeTracker({ 
  taskId, 
  taskTitle, 
  onStart, 
  onStop,
  compact = false 
}: TimeTrackerProps) {
  const { t } = useTranslation()
  const { isRunning, elapsedSeconds, startTime, start, stop, reset } = useTimer()
  const [entries, setEntries] = useState<TimeEntry[]>([])

  // Load entries from localStorage
  useEffect(() => {
    if (taskId) {
      const saved = localStorage.getItem(`time-entries-${taskId}`)
      if (saved) {
        setEntries(JSON.parse(saved))
      }
    }
  }, [taskId])

  // Save entries
  useEffect(() => {
    if (taskId && entries.length > 0) {
      localStorage.setItem(`time-entries-${taskId}`, JSON.stringify(entries))
    }
  }, [entries, taskId])

  const handleStart = () => {
    start()
    onStart?.()
  }

  const handleStop = () => {
    const minutes = stop()
    onStop?.(minutes)
    
    if (taskId && minutes > 0) {
      const newEntry: TimeEntry = {
        id: Date.now().toString(),
        task_id: taskId,
        task_title: taskTitle || '',
        started_at: startTime?.toISOString() || new Date().toISOString(),
        ended_at: new Date().toISOString(),
        duration_minutes: minutes
      }
      setEntries(prev => [newEntry, ...prev])
    }
    
    reset()
  }

  const totalTimeMinutes = entries.reduce((sum, e) => sum + e.duration_minutes, 0) + 
    (isRunning ? Math.floor(elapsedSeconds / 60) : 0)

  if (compact) {
    return (
      <TimerButton
        isRunning={isRunning}
        elapsedSeconds={elapsedSeconds}
        onToggle={isRunning ? handleStop : handleStart}
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Active Timer */}
      <div className={cn(
        "rounded-lg border p-4",
        isRunning ? "bg-green-50 border-green-200" : "bg-card"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              isRunning ? "bg-green-100 text-green-600" : "bg-muted text-muted-foreground"
            )}>
              {isRunning ? <Timer className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
            </div>
            <div>
              <p className="text-sm font-medium">
                {isRunning ? '计时中...' : '准备开始'}
              </p>
              {taskTitle && (
                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                  {taskTitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-2xl font-mono font-semibold">
              {Math.floor(elapsedSeconds / 3600).toString().padStart(2, '0')}:
              {Math.floor((elapsedSeconds % 3600) / 60).toString().padStart(2, '0')}:
              {(elapsedSeconds % 60).toString().padStart(2, '0')}
            </span>

            {isRunning ? (
              <Button 
                size="icon" 
                variant="destructive"
                onClick={handleStop}
                className="h-10 w-10"
              >
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button 
                size="icon"
                onClick={handleStart}
                className="h-10 w-10"
              >
                <Play className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Summary */}
      {totalTimeMinutes > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <History className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">累计时间:</span>
          <Badge variant="secondary">
            {formatDuration(totalTimeMinutes)}
          </Badge>
        </div>
      )}

      {/* Recent Entries */}
      {entries.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">最近记录</h4>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {entries.slice(0, 5).map(entry => (
              <div 
                key={entry.id}
                className="flex items-center justify-between text-xs py-1 px-2 rounded bg-muted/50"
              >
                <span className="text-muted-foreground">
                  {new Date(entry.started_at).toLocaleDateString('zh-CN')}
                </span>
                <span className="font-medium">
                  {formatDuration(entry.duration_minutes)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default TimeTracker
