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

export function formatRelativeDate(date: string | Date, t?: (key: string) => string): string {
  const d = new Date(date)
  if (isToday(d)) return t ? t('date.today') : '今天'
  if (isTomorrow(d)) return t ? t('date.tomorrow') : '明天'
  if (isYesterday(d)) return t ? t('date.yesterday') : '昨天'
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

export function getProjectTypeLabel(type: string, t?: (key: string) => string): string {
  switch (type) {
    case 'sequential': return t ? t('projectType.sequential') : '顺序'
    case 'parallel': return t ? t('projects.parallel') : '并行'
    case 'single_action': return t ? t('projectType.singleAction') : '单动作'
    default: return type
  }
}

export function getStatusLabel(status: string, t?: (key: string) => string): string {
  switch (status) {
    case 'active': return t ? t('status.active') : '活跃'
    case 'on_hold': return t ? t('status.onHold') : '暂停'
    case 'dropped': return t ? t('projects.status.dropped') : '已丢弃'
    case 'completed': return t ? t('projects.status.completed') : '已完成'
    default: return status
  }
}

export function formatDuration(minutes?: number, t?: (key: string, options?: object) => string): string {
  if (!minutes) return ''
  if (minutes < 60) return t ? t('common.minutes', { count: minutes }) : `${minutes}分钟`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) return t ? t('common.hours', { count: hours }) : `${hours}小时`
  return t ? t('common.hoursMinutes', { hours, mins }) : `${hours}小时${mins}分钟`
}
