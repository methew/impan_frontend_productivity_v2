/**
 * Habits API - 习惯追踪API
 */

import apiClient from '@/lib/axios'

export interface Habit {
  id: string
  name: string
  description?: string
  color: string
  icon?: string
  frequency: 'daily' | 'weekly' | 'custom'
  target_days: number
  reminder_time?: string
  sort_order: number
  is_archived: boolean
  current_streak: number
  longest_streak: number
  completion_rate_this_week: number
  completions_this_week: {
    date: string
    is_completed: boolean
    is_skipped: boolean
  }[]
  created_at: string
  updated_at: string
}

export interface HabitCompletion {
  id: string
  habit: string
  date: string
  is_completed: boolean
  is_skipped: boolean
  note?: string
  created_at: string
}

export interface HabitStatistics {
  total_habits: number
  active_habits: number
  completed_today: number
  total_completions_today: number
  week_completion_rate: number
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * 获取所有习惯
 */
export async function getHabits(): Promise<Habit[]> {
  const response = await apiClient.get('/productivity/habits/')
  return response.data
}

/**
 * 获取单个习惯
 */
export async function getHabit(id: string): Promise<Habit> {
  const response = await apiClient.get(`/productivity/habits/${id}/`)
  return response.data
}

/**
 * 创建习惯
 */
export async function createHabit(data: {
  name: string
  description?: string
  color: string
  icon?: string
  frequency?: string
  target_days?: number
  reminder_time?: string
}): Promise<Habit> {
  const response = await apiClient.post('/productivity/habits/', data)
  return response.data
}

/**
 * 更新习惯
 */
export async function updateHabit(
  id: string,
  data: Partial<Habit>
): Promise<Habit> {
  const response = await apiClient.patch(`/productivity/habits/${id}/`, data)
  return response.data
}

/**
 * 删除习惯
 */
export async function deleteHabit(id: string): Promise<void> {
  await apiClient.delete(`/productivity/habits/${id}/`)
}

/**
 * 切换打卡状态
 */
export async function toggleHabitCompletion(
  habitId: string,
  date: string,
  note?: string
): Promise<HabitCompletion | null> {
  const response = await apiClient.post(
    `/productivity/habits/${habitId}/toggle/`,
    { date, note }
  )
  return response.data
}

/**
 * 获取习惯的打卡记录
 */
export async function getHabitCompletions(
  habitId: string,
  startDate?: string,
  endDate?: string
): Promise<HabitCompletion[]> {
  const params: Record<string, string> = {}
  if (startDate) params.start_date = startDate
  if (endDate) params.end_date = endDate
  
  const response = await apiClient.get(
    `/productivity/habits/${habitId}/completions/`,
    { params }
  )
  return response.data
}

/**
 * 获取习惯统计
 */
export async function getHabitStatistics(): Promise<HabitStatistics> {
  const response = await apiClient.get('/productivity/habits/statistics/')
  return response.data
}

/**
 * 获取今日打卡状态
 */
export async function getTodayStatus(): Promise<
  {
    habit_id: string
    habit_name: string
    is_completed: boolean
    is_skipped: boolean
    color: string
    icon?: string
  }[]
> {
  const response = await apiClient.get('/productivity/habits/today-status/')
  return response.data
}

/**
 * 归档习惯
 */
export async function archiveHabit(id: string): Promise<Habit> {
  const response = await apiClient.post(`/productivity/habits/${id}/archive/`)
  return response.data
}

/**
 * 恢复习惯
 */
export async function restoreHabit(id: string): Promise<Habit> {
  const response = await apiClient.post(`/productivity/habits/${id}/restore/`)
  return response.data
}
