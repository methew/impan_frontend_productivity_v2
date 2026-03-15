import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, isToday, isTomorrow, isYesterday, isPast } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, pattern: string = 'yyyy-MM-dd') {
  return format(new Date(date), pattern, { locale: zhCN })
}

export function formatRelativeDate(date: string | Date): string {
  const d = new Date(date)
  if (isToday(d)) return '今天'
  if (isTomorrow(d)) return '明天'
  if (isYesterday(d)) return '昨天'
  return format(d, 'MM月dd日', { locale: zhCN })
}

export function getDueStatus(dueDate?: string): 'overdue' | 'due-soon' | 'normal' | null {
  if (!dueDate) return null
  const d = new Date(dueDate)
  if (isPast(d) && !isToday(d)) return 'overdue'
  if (isToday(d) || isTomorrow(d)) return 'due-soon'
  return 'normal'
}

export function getQuadrantColor(quadrantId: number): string {
  switch (quadrantId) {
    case 1: return 'bg-red-500'
    case 2: return 'bg-orange-500'
    case 3: return 'bg-blue-500'
    case 4: return 'bg-gray-400'
    default: return 'bg-gray-400'
  }
}

export function getProjectTypeLabel(type: string): string {
  switch (type) {
    case 'sequential': return '顺序'
    case 'parallel': return '并行'
    case 'single_action': return '单动作'
    default: return type
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'active': return '活跃'
    case 'on_hold': return '暂停'
    case 'dropped': return '已丢弃'
    case 'completed': return '已完成'
    default: return status
  }
}

export function formatDuration(minutes?: number): string {
  if (!minutes) return ''
  if (minutes < 60) return `${minutes}分钟`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) return `${hours}小时`
  return `${hours}小时${mins}分钟`
}
