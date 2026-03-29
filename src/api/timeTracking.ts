/**
 * Time Tracking API - 时间追踪API
 */

import apiClient from '@/lib/axios'

export interface TimeEntry {
  id: string
  task: string
  task_title?: string
  project?: string
  started_at: string
  ended_at?: string
  duration_minutes: number
  description?: string
  is_running: boolean
  hourly_rate: number
  labor_cost: number
  created_at: string
  updated_at: string
}

export interface TaskWithTime {
  task_id: string
  total_time_minutes: number
  total_labor_cost: number
  time_entries: TimeEntry[]
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
 * 获取任务的时间记录
 */
export async function getTaskTimeEntries(taskId: string): Promise<TaskWithTime> {
  const response = await apiClient.get(`/productivity/tasks/${taskId}/time-entries/`)
  return response.data
}

/**
 * 开始时间记录（创建并启动计时器）
 */
export async function startTimeEntry(
  taskId: string,
  description?: string
): Promise<TimeEntry> {
  const response = await apiClient.post(
    `/productivity/tasks/${taskId}/time-entries/create/`,
    { description }
  )
  return response.data
}

/**
 * 停止时间记录
 */
export async function stopTimeEntry(taskId: string): Promise<TimeEntry> {
  const response = await apiClient.post(
    `/productivity/tasks/${taskId}/time-entries/stop/`
  )
  return response.data
}

/**
 * 获取任务关联的凭证
 */
export async function getTaskReceipts(taskId: string): Promise<ReceiptLink[]> {
  const response = await apiClient.get(`/productivity/tasks/${taskId}/receipts/`)
  return response.data
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
  const response = await apiClient.post(
    `/productivity/tasks/${taskId}/create-receipt/`,
    data
  )
  return response.data
}
