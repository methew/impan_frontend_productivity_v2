/**
 * 甘特图 API
 * ==========
 * 
 * 提供甘特图数据获取功能
 */

import apiClient from '@/lib/axios'

export interface GanttItem {
  id: string
  type: 'project' | 'task'
  title: string
  abbreviation: string
  start_date: string | null
  end_date: string | null
  progress: number
  status: string
  flagged?: boolean
  is_important?: boolean
  is_urgent?: boolean
  // Project specific
  folder_id?: string | null
  folder_name?: string | null
  project_type?: string
  // Task specific
  project_id?: string | null
  project_title?: string | null
  parent_id?: string | null
  task_type?: string
  estimated_duration?: number
}

export interface GanttData {
  start_date: string
  end_date: string
  items: GanttItem[]
  total: number
}

export interface GanttQueryParams {
  start_date?: string
  end_date?: string
  project_id?: string
  include_completed?: boolean
}

/**
 * 获取项目甘特图数据
 */
export async function getProjectGantt(params?: GanttQueryParams): Promise<GanttData> {
  const response = await apiClient.get('/gantt/projects/', { params })
  return response.data
}

/**
 * 获取任务甘特图数据
 */
export async function getTaskGantt(params?: GanttQueryParams): Promise<GanttData> {
  const response = await apiClient.get('/gantt/tasks/', { params })
  return response.data
}

/**
 * 获取组合甘特图数据（项目和任务）
 */
export async function getCombinedGantt(params?: GanttQueryParams): Promise<GanttData> {
  const response = await apiClient.get('/gantt/combined/', { params })
  return response.data
}

/**
 * 获取日期范围字符串
 */
export function getDateRange(days: number = 30): { start_date: string; end_date: string } {
  const today = new Date()
  const start = new Date(today)
  start.setDate(today.getDate() - Math.floor(days / 2))
  const end = new Date(today)
  end.setDate(today.getDate() + Math.floor(days / 2))
  
  return {
    start_date: start.toISOString().split('T')[0],
    end_date: end.toISOString().split('T')[0],
  }
}
