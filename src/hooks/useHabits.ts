/**
 * useHabits Hook - 习惯追踪Hook
 * 
 * 使用React Query管理习惯数据
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '@/api/habits'

const HABITS_KEY = 'habits'
const HABIT_STATS_KEY = 'habit-statistics'
const TODAY_STATUS_KEY = 'habit-today-status'

/**
 * 获取所有习惯
 */
export function useHabits() {
  return useQuery({
    queryKey: [HABITS_KEY],
    queryFn: api.getHabits,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * 获取习惯统计
 */
export function useHabitStatistics() {
  return useQuery({
    queryKey: [HABIT_STATS_KEY],
    queryFn: api.getHabitStatistics,
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

/**
 * 获取今日打卡状态
 */
export function useTodayStatus() {
  return useQuery({
    queryKey: [TODAY_STATUS_KEY],
    queryFn: api.getTodayStatus,
    staleTime: 30 * 1000, // 30 seconds
  })
}

/**
 * 创建习惯
 */
export function useCreateHabit() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: api.createHabit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [HABITS_KEY] })
      queryClient.invalidateQueries({ queryKey: [HABIT_STATS_KEY] })
    },
  })
}

/**
 * 更新习惯
 */
export function useUpdateHabit() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof api.updateHabit>[1] }) =>
      api.updateHabit(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [HABITS_KEY] })
      queryClient.invalidateQueries({ queryKey: [HABITS_KEY, id] })
    },
  })
}

/**
 * 删除习惯
 */
export function useDeleteHabit() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: api.deleteHabit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [HABITS_KEY] })
      queryClient.invalidateQueries({ queryKey: [HABIT_STATS_KEY] })
    },
  })
}

/**
 * 切换打卡状态
 */
export function useToggleHabitCompletion() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ habitId, date, note }: { habitId: string; date: string; note?: string }) =>
      api.toggleHabitCompletion(habitId, date, note),
    onSuccess: (_, { habitId }) => {
      queryClient.invalidateQueries({ queryKey: [HABITS_KEY] })
      queryClient.invalidateQueries({ queryKey: [HABITS_KEY, habitId] })
      queryClient.invalidateQueries({ queryKey: [HABIT_STATS_KEY] })
      queryClient.invalidateQueries({ queryKey: [TODAY_STATUS_KEY] })
    },
  })
}

/**
 * 归档习惯
 */
export function useArchiveHabit() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: api.archiveHabit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [HABITS_KEY] })
      queryClient.invalidateQueries({ queryKey: [HABIT_STATS_KEY] })
    },
  })
}

/**
 * 恢复习惯
 */
export function useRestoreHabit() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: api.restoreHabit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [HABITS_KEY] })
      queryClient.invalidateQueries({ queryKey: [HABIT_STATS_KEY] })
    },
  })
}
