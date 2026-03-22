/**
 * Productivity - Accounting 集成 API
 * 
 * 获取项目的预算、支出、时间成本等财务信息
 */

import apiClient from '@/lib/axios'

// ============================================================================
// Types
// ============================================================================

export interface ProjectBudget {
  project_id: string
  budget_total: number
  budget_spent: number
  budget_remaining: number
  budget_percentage: number // 0-100
}

export interface ProjectExpenses {
  project_id: string
  total_expenses: number
  total_income: number
  net_profit: number
  profit_margin: number
  expense_breakdown: {
    category: string
    amount: number
    percentage: number
  }[]
}

export interface TaskTimeEntry {
  id: string
  task_id: string
  started_at: string
  ended_at?: string
  duration_minutes: number
  description?: string
  hourly_rate?: number
  labor_cost?: number
}

export interface TaskWithTime {
  task_id: string
  total_time_minutes: number
  total_labor_cost: number
  time_entries: TaskTimeEntry[]
}

export interface ProjectFinancialSummary {
  project_id: string
  project_title: string
  
  // 预算信息
  budget?: {
    total: number
    spent: number
    remaining: number
    percentage: number
  }
  
  // 收支信息
  finances: {
    total_income: number
    total_expenses: number
    net_profit: number
    profit_margin: number
  }
  
  // 时间成本
  time_tracking: {
    total_hours: number
    hourly_rate: number
    labor_cost: number
  }
  
  // 综合成本
  total_cost: number // expenses + labor_cost
}

export interface ReceiptLink {
  receipt_id: number
  title: string
  date: string
  amount: number
  type: string
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * 获取项目预算信息
 */
export async function getProjectBudget(projectId: string): Promise<ProjectBudget | null> {
  try {
    const response = await apiClient.get(`/productivity/projects/${projectId}/budget/`)
    return response.data
  } catch (error: any) {
    // 如果没有预算，返回 null 而不是报错
    if (error.response?.status === 404) {
      return null
    }
    throw error
  }
}

/**
 * 获取项目支出详情
 */
export async function getProjectExpenses(projectId: string): Promise<ProjectExpenses> {
  const response = await apiClient.get(`/productivity/projects/${projectId}/expenses/`)
  return response.data
}

/**
 * 获取项目财务汇总
 */
export async function getProjectFinancialSummary(projectId: string): Promise<ProjectFinancialSummary> {
  const response = await apiClient.get(`/productivity/projects/${projectId}/financial-summary/`)
  return response.data
}

/**
 * 获取任务的时间记录
 */
export async function getTaskTimeEntries(taskId: string): Promise<TaskWithTime> {
  const response = await apiClient.get(`/productivity/tasks/${taskId}/time-entries/`)
  return response.data
}

/**
 * 创建时间记录
 */
export async function createTimeEntry(
  taskId: string, 
  data: { started_at: string; description?: string }
): Promise<TaskTimeEntry> {
  const response = await apiClient.post(`/productivity/tasks/${taskId}/time-entries/`, data)
  return response.data
}

/**
 * 停止时间记录
 */
export async function stopTimeEntry(taskId: string): Promise<TaskTimeEntry> {
  const response = await apiClient.post(`/productivity/tasks/${taskId}/time-entries/stop/`)
  return response.data
}

/**
 * 获取任务关联的凭证
 */
export async function getTaskReceipts(taskId: string): Promise<ReceiptLink[]> {
  const response = await apiClient.get(`/productivity/tasks/${taskId}/receipts/`)
  return response.data || []
}

/**
 * 为任务创建凭证（快速记账）
 */
export async function createReceiptForTask(
  taskId: string, 
  data: {
    title: string
    amount: number
    type: 'expense' | 'income'
    description?: string
    date?: string
  }
): Promise<ReceiptLink> {
  const response = await apiClient.post(`/productivity/tasks/${taskId}/create-receipt/`, data)
  return response.data
}

/**
 * 为项目设置预算
 */
export async function setProjectBudget(
  projectId: string,
  data: { total_budget: number; hourly_rate?: number }
): Promise<ProjectBudget> {
  const response = await apiClient.post(`/productivity/projects/${projectId}/budget/`, data)
  return response.data
}
