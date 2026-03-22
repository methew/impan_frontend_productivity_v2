/**
 * Habit Tracker - 习惯追踪
 * 
 * 类似 Done 的简单习惯打卡，周视图
 */

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  Check, 
  Plus, 
  MoreHorizontal,
  Flame,
  Target,
  Trash2,
  Edit2
} from 'lucide-react'
import { Button } from '@/packages/ui/components/button'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/packages/ui/components/dropdown-menu'

// ============================================================================
// Types
// ============================================================================

type Frequency = 'daily' | 'weekly' | 'custom'

interface Habit {
  id: string
  name: string
  color: string
  icon?: string
  frequency: Frequency
  targetDays: number // 每周目标天数
  completions: string[] // ISO date strings
  archived?: boolean
}

interface HabitTrackerProps {
  habits: Habit[]
  onToggle: (habitId: string, date: Date) => void
  onAdd?: () => void
  onEdit?: (habit: Habit) => void
  onDelete?: (habitId: string) => void
}

// ============================================================================
// Helper Functions
// ============================================================================

function getWeekDays(): Date[] {
  const today = new Date()
  const day = today.getDay()
  const diff = today.getDate() - day + (day === 0 ? -6 : 1) // Start from Monday
  
  const monday = new Date(today.setDate(diff))
  const days: Date[] = []
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    days.push(d)
  }
  
  return days
}

function isSameDay(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate()
}

function formatDateKey(date: Date): string {
  return date.toISOString().split('T')[0]
}

function getStreak(completions: string[]): number {
  if (completions.length === 0) return 0
  
  const sorted = [...completions].sort().reverse()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  let streak = 0
  let currentDate = new Date(today)
  
  // Check if completed today
  if (sorted[0] === formatDateKey(currentDate)) {
    streak = 1
  } else {
    // Check if completed yesterday (streak can continue if yesterday was completed)
    const yesterday = new Date(currentDate)
    yesterday.setDate(yesterday.getDate() - 1)
    if (sorted[0] !== formatDateKey(yesterday)) {
      return 0
    }
    streak = 1
    currentDate = yesterday
  }
  
  // Count consecutive days
  for (let i = 1; i < sorted.length; i++) {
    const expectedDate = new Date(currentDate)
    expectedDate.setDate(expectedDate.getDate() - 1)
    
    if (sorted[i] === formatDateKey(expectedDate)) {
      streak++
      currentDate = expectedDate
    } else {
      break
    }
  }
  
  return streak
}

// ============================================================================
// Components
// ============================================================================

interface HabitCardProps {
  habit: Habit
  weekDays: Date[]
  onToggle: (habitId: string, date: Date) => void
  onEdit?: (habit: Habit) => void
  onDelete?: (habitId: string) => void
}

function HabitCard({ habit, weekDays, onToggle, onEdit, onDelete }: HabitCardProps) {
  const streak = getStreak(habit.completions)
  const thisWeekCompletions = weekDays.filter(day => 
    habit.completions.includes(formatDateKey(day))
  ).length
  const progress = Math.round((thisWeekCompletions / habit.targetDays) * 100)

  return (
    <div className="bg-card rounded-lg border p-4 hover:shadow-sm transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
            style={{ backgroundColor: habit.color }}
          >
            <Target className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-medium">{habit.name}</h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {streak > 0 && (
                <span className="flex items-center gap-0.5 text-orange-500">
                  <Flame className="h-3 w-3" />
                  {streak} 天连续
                </span>
              )}
              <span>{thisWeekCompletions}/{habit.targetDays} 本周</span>
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit?.(habit)}>
              <Edit2 className="h-4 w-4 mr-2" />
              编辑
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete?.(habit.id)}
              className="text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all"
            style={{ 
              width: `${Math.min(progress, 100)}%`,
              backgroundColor: habit.color 
            }}
          />
        </div>
      </div>

      {/* Week Days */}
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((day, index) => {
          const dateKey = formatDateKey(day)
          const isCompleted = habit.completions.includes(dateKey)
          const isToday = isSameDay(day, new Date())

          return (
            <button
              key={index}
              onClick={() => onToggle(habit.id, day)}
              className={cn(
                "aspect-square rounded-lg flex flex-col items-center justify-center gap-1 transition-all",
                isCompleted 
                  ? "text-white" 
                  : "bg-muted/50 hover:bg-muted",
                isToday && !isCompleted && "ring-2 ring-primary ring-offset-1",
                isToday && isCompleted && "ring-2 ring-white ring-offset-1"
              )}
              style={isCompleted ? { backgroundColor: habit.color } : undefined}
            >
              <span className="text-[10px] opacity-80">
                {['一', '二', '三', '四', '五', '六', '日'][index]}
              </span>
              <span className="text-sm font-medium">{day.getDate()}</span>
              {isCompleted && <Check className="h-3 w-3" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================================
// Main Habit Tracker
// ============================================================================

export function HabitTracker({ 
  habits, 
  onToggle, 
  onAdd, 
  onEdit, 
  onDelete 
}: HabitTrackerProps) {
  useTranslation() // Keep hook for future i18n
  const weekDays = useMemo(() => getWeekDays(), [])

  const activeHabits = habits.filter(h => !h.archived)
  const totalCompletionsToday = activeHabits.filter(h => 
    h.completions.includes(formatDateKey(new Date()))
  ).length

  return (
    <div className="h-full flex flex-col">
      {/* Stats Header */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">活跃习惯</p>
          <p className="text-2xl font-semibold">{activeHabits.length}</p>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">今日完成</p>
          <p className="text-2xl font-semibold">{totalCompletionsToday}/{activeHabits.length}</p>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">本周进度</p>
          <p className="text-2xl font-semibold">
            {activeHabits.length > 0 
              ? Math.round(
                  activeHabits.reduce((sum, h) => {
                    const weekCompletions = weekDays.filter(d => 
                      h.completions.includes(formatDateKey(d))
                    ).length
                    return sum + (weekCompletions / h.targetDays) * 100
                  }, 0) / activeHabits.length
                )
              : 0}%
          </p>
        </div>
      </div>

      {/* Habits Grid */}
      {activeHabits.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-1">还没有习惯</h3>
            <p className="text-sm text-muted-foreground mb-4">
              添加一些习惯来开始追踪
            </p>
            <Button onClick={onAdd}>
              <Plus className="h-4 w-4 mr-1" />
              添加习惯
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {activeHabits.map(habit => (
              <HabitCard
                key={habit.id}
                habit={habit}
                weekDays={weekDays}
                onToggle={onToggle}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Floating Add Button */}
      {activeHabits.length > 0 && (
        <div className="fixed bottom-6 right-6">
          <Button size="lg" className="rounded-full shadow-lg" onClick={onAdd}>
            <Plus className="h-5 w-5 mr-1" />
            添加习惯
          </Button>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Sample Data & Hooks
// ============================================================================

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>(() => {
    // Load from localStorage or use defaults
    const saved = localStorage.getItem('habits')
    if (saved) {
      return JSON.parse(saved)
    }
    return [
      {
        id: '1',
        name: '晨间阅读',
        color: '#6366f1',
        frequency: 'daily',
        targetDays: 7,
        completions: []
      },
      {
        id: '2',
        name: '运动健身',
        color: '#10b981',
        frequency: 'daily',
        targetDays: 5,
        completions: []
      },
      {
        id: '3',
        name: '冥想',
        color: '#8b5cf6',
        frequency: 'daily',
        targetDays: 7,
        completions: []
      }
    ]
  })

  // Save to localStorage
  useState(() => {
    localStorage.setItem('habits', JSON.stringify(habits))
  })

  const toggleHabit = (habitId: string, date: Date) => {
    const dateKey = formatDateKey(date)
    
    setHabits(prev => prev.map(habit => {
      if (habit.id !== habitId) return habit
      
      const completions = habit.completions.includes(dateKey)
        ? habit.completions.filter(d => d !== dateKey)
        : [...habit.completions, dateKey]
      
      return { ...habit, completions }
    }))
  }

  const addHabit = (name: string, color: string, targetDays: number) => {
    const newHabit: Habit = {
      id: Date.now().toString(),
      name,
      color,
      frequency: 'daily',
      targetDays,
      completions: []
    }
    setHabits(prev => [...prev, newHabit])
  }

  const updateHabit = (id: string, updates: Partial<Habit>) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h))
  }

  const deleteHabit = (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id))
  }

  return {
    habits,
    toggleHabit,
    addHabit,
    updateHabit,
    deleteHabit
  }
}

export default HabitTracker
