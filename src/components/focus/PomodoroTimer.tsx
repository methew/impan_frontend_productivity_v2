import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, RotateCcw, Coffee, Brain, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

type TimerMode = 'work' | 'shortBreak' | 'longBreak'

interface PomodoroTimerProps {
  duration?: number // in minutes
  onComplete?: () => void
  onTick?: (remainingSeconds: number) => void
}

const MODE_CONFIG = {
  work: { minutes: 25, label: '专注时间', icon: Brain, color: 'text-red-500' },
  shortBreak: { minutes: 5, label: '短休息', icon: Coffee, color: 'text-green-500' },
  longBreak: { minutes: 15, label: '长休息', icon: Sun, color: 'text-blue-500' },
}

export function PomodoroTimer({
  duration = 25,
  onComplete,
  onTick,
}: PomodoroTimerProps) {
  const [mode, setMode] = useState<TimerMode>('work')
  const [timeLeft, setTimeLeft] = useState(duration * 60)
  const [isActive, setIsActive] = useState(false)
  const [progress, setProgress] = useState(100)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const currentConfig = MODE_CONFIG[mode]
  const totalSeconds = currentConfig.minutes * 60

  useEffect(() => {
    setTimeLeft(currentConfig.minutes * 60)
    setProgress(100)
    setIsActive(false)
  }, [mode, currentConfig.minutes])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = prev - 1
          const newProgress = (newTime / totalSeconds) * 100
          setProgress(newProgress)
          onTick?.(newTime)
          return newTime
        })
      }, 1000)
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false)
      playNotificationSound()
      onComplete?.()
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isActive, timeLeft, totalSeconds, onComplete, onTick])

  const playNotificationSound = () => {
    // Create a simple beep using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.value = 800
    gainNode.gain.value = 0.3
    
    oscillator.start()
    oscillator.stop(audioContext.currentTime + 0.2)
  }

  const toggleTimer = useCallback(() => {
    setIsActive((prev) => !prev)
  }, [])

  const resetTimer = useCallback(() => {
    setIsActive(false)
    setTimeLeft(currentConfig.minutes * 60)
    setProgress(100)
  }, [currentConfig.minutes])

  const switchMode = useCallback((newMode: TimerMode) => {
    setMode(newMode)
    setIsActive(false)
  }, [])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Calculate SVG circle progress
  const radius = 120
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progress / 100) * circumference

  const ModeIcon = currentConfig.icon

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Mode Selector */}
      <div className="flex gap-2 p-1 bg-muted rounded-lg">
        {(Object.keys(MODE_CONFIG) as TimerMode[]).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              mode === m
                ? 'bg-background shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {MODE_CONFIG[m].label}
          </button>
        ))}
      </div>

      {/* Timer Display */}
      <div className="relative" data-testid="progress-ring">
        {/* SVG Progress Ring */}
        <svg
          width="280"
          height="280"
          className="-rotate-90"
        >
          {/* Background circle */}
          <circle
            cx="140"
            cy="140"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-muted"
          />
          {/* Progress circle */}
          <motion.circle
            cx="140"
            cy="140"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            className={currentConfig.color}
            strokeDasharray={circumference}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.5 }}
          />
        </svg>

        {/* Time Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            key={timeLeft}
            initial={{ scale: 0.95, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-6xl font-bold tabular-nums"
          >
            {formatTime(timeLeft)}
          </motion.div>
          <div className={`flex items-center gap-2 mt-2 ${currentConfig.color}`}>
            <ModeIcon className="h-5 w-5" />
            <span className="text-lg font-medium">{currentConfig.label}</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-full"
          onClick={resetTimer}
        >
          <RotateCcw className="h-5 w-5" />
        </Button>

        <Button
          size="lg"
          className="h-16 px-8 rounded-full text-lg"
          onClick={toggleTimer}
        >
          {isActive ? (
            <>
              <Pause className="mr-2 h-5 w-5" />
              暂停
            </>
          ) : (
            <>
              <Play className="mr-2 h-5 w-5" />
              {timeLeft === totalSeconds ? '开始专注' : '继续'}
            </>
          )}
        </Button>

        <div className="w-12" /> {/* Spacer for alignment */}
      </div>

      {/* Keyboard hint */}
      <p className="text-xs text-muted-foreground">
        快捷键: 空格 开始/暂停 | Esc 重置
      </p>
    </div>
  )
}
