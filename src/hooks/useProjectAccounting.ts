/**
 * Productivity - Accounting 集成的 React Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '@/api/accounting'

// Query keys
const PROJECT_BUDGET_KEY = 'project-budget'
const PROJECT_EXPENSES_KEY = 'project-expenses'
const PROJECT_FINANCIAL_KEY = 'project-financial'
const TASK_TIME_KEY = 'task-time'
const TASK_RECEIPTS_KEY = 'task-receipts'

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * 获取项目预算
 */
export function useProjectBudget(projectId: string | undefined) {
  return useQuery({
    queryKey: [PROJECT_BUDGET_KEY, projectId],
    queryFn: () => api.getProjectBudget(projectId!),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * 获取项目支出详情
 */
export function useProjectExpenses(projectId: string | undefined) {
  return useQuery({
    queryKey: [PROJECT_EXPENSES_KEY, projectId],
    queryFn: () => api.getProjectExpenses(projectId!),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * 获取项目财务汇总
 */
export function useProjectFinancialSummary(projectId: string | undefined) {
  return useQuery({
    queryKey: [PROJECT_FINANCIAL_KEY, projectId],
    queryFn: () => api.getProjectFinancialSummary(projectId!),
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * 获取任务时间记录
 */
export function useTaskTimeEntries(taskId: string | undefined) {
  return useQuery({
    queryKey: [TASK_TIME_KEY, taskId],
    queryFn: () => api.getTaskTimeEntries(taskId!),
    enabled: !!taskId,
    staleTime: 1 * 60 * 1000, // 1 minute
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

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * 设置项目预算
 */
export function useSetProjectBudget() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: { total_budget: number; hourly_rate?: number } }) =>
      api.setProjectBudget(projectId, data),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: [PROJECT_BUDGET_KEY, projectId] })
      queryClient.invalidateQueries({ queryKey: [PROJECT_FINANCIAL_KEY, projectId] })
    },
  })
}

/**
 * 创建时间记录
 */
export function useCreateTimeEntry() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: { started_at: string; description?: string } }) =>
      api.createTimeEntry(taskId, data),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: [TASK_TIME_KEY, taskId] })
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
      queryClient.invalidateQueries({ queryKey: [TASK_TIME_KEY, taskId] })
    },
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
      data: {
        title: string
        amount: number
        type: 'expense' | 'income'
        description?: string
        date?: string
      }
    }) => api.createReceiptForTask(taskId, data),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: [TASK_RECEIPTS_KEY, taskId] })
    },
  })
}
