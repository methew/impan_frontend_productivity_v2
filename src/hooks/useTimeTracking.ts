/**
 * useTimeTracking Hook - 时间追踪Hook
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '@/api/timeTracking'

const TIME_ENTRIES_KEY = 'time-entries'
const TASK_RECEIPTS_KEY = 'task-receipts'

/**
 * 获取任务的时间记录
 */
export function useTaskTimeEntries(taskId: string | undefined) {
  return useQuery({
    queryKey: [TIME_ENTRIES_KEY, taskId],
    queryFn: () => api.getTaskTimeEntries(taskId!),
    enabled: !!taskId,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: (query) => {
      // 如果有正在运行的计时器，每秒刷新
      const data = query.state.data
      if (data?.time_entries?.some((e: api.TimeEntry) => e.is_running)) {
        return 1000
      }
      return false
    },
  })
}

/**
 * 开始时间记录
 */
export function useStartTimeEntry() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ taskId, description }: { taskId: string; description?: string }) =>
      api.startTimeEntry(taskId, description),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: [TIME_ENTRIES_KEY, taskId] })
    },
  })
}

/**
 * 停止时间记录
 */
export function useStopTimeEntry() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (taskId: string) => api.stopTimeEntry(taskId),
    onSuccess: (_, taskId) => {
      queryClient.invalidateQueries({ queryKey: [TIME_ENTRIES_KEY, taskId] })
    },
  })
}

/**
 * 获取任务关联的凭证
 */
export function useTaskReceipts(taskId: string | undefined) {
  return useQuery({
    queryKey: [TASK_RECEIPTS_KEY, taskId],
    queryFn: () => api.getTaskReceipts(taskId!),
    enabled: !!taskId,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * 为任务创建凭证
 */
export function useCreateReceiptForTask() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ 
      taskId, 
      data 
    }: { 
      taskId: string
      data: Parameters<typeof api.createReceiptForTask>[1]
    }) => api.createReceiptForTask(taskId, data),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: [TASK_RECEIPTS_KEY, taskId] })
    },
  })
}
