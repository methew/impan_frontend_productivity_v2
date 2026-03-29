/**
 * Habit Tracker - 习惯追踪
 * 
 * 类似 Done 的简单习惯打卡，周视图
 */

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  Check, 
  Plus, 
  MoreHorizontal,
  Flame,
  Target,
  Trash2,
  Edit2,
  Archive
} from 'lucide-react'
import { Button } from '@/packages/ui/components/button'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/packages/ui/components/dropdown-menu'
import type { Habit } from '@/api/habits'

// ============================================================================
// Types
// ============================================================================

interface HabitTrackerProps {
  habits: Habit[]
  onToggle: (habitId: string, date: Date) => void
  onAdd?: () => void
  onEdit?: (habit: Habit) => void
  onDelete?: (habitId: string) => void
  onArchive?: (habitId: string) => void
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

/**
 * 从习惯的completions_this_week数据检查某天是否完成
 */
function isDateCompleted(habit: Habit, date: Date): boolean {
  const dateKey = formatDateKey(date)
  return habit.completions_this_week.some(
    c => c.date === dateKey && c.is_completed
  )
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
  onArchive?: (habitId: string) => void
}

function HabitCard({ habit, weekDays, onToggle, onEdit, onDelete, onArchive }: HabitCardProps) {
  const progress = habit.completion_rate_this_week

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
              {habit.current_streak > 0 && (
                <span className="flex items-center gap-0.5 text-orange-500">
                  <Flame className="h-3 w-3" />
                  {habit.current_streak} 天连续
                </span>
              )}
              <span>{habit.completions_this_week.filter(c => c.is_completed).length}/{habit.target_days} 本周</span>
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
            <DropdownMenuItem onClick={() => onArchive?.(habit.id)}>
              <Archive className="h-4 w-4 mr-2" />
              归档
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
          const isCompleted = isDateCompleted(habit, day)
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
  onDelete,
  onArchive,
}: HabitTrackerProps) {
  useTranslation() // Keep hook for future i18n
  const weekDays = useMemo(() => getWeekDays(), [])

  const activeHabits = habits.filter(h => !h.is_archived)
  
  // 计算今日完成数
  const today = new Date()
  const totalCompletionsToday = activeHabits.filter(h => 
    isDateCompleted(h, today)
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
                  activeHabits.reduce((sum, h) => sum + h.completion_rate_this_week, 0) 
                  / activeHabits.length
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
                onArchive={onArchive}
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

export default HabitTracker
