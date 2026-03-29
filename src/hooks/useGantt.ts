/**
 * 甘特图 Hooks
 * ============
 * 
 * React Query hooks for Gantt chart data fetching
 */

import { useQuery } from '@tanstack/react-query'
import {
  getProjectGantt,
  getTaskGantt,
  getCombinedGantt,
  type GanttData,
  type GanttQueryParams,
} from '@/api/gantt'

const STALE_TIME = 5 * 60 * 1000 // 5 minutes

/**
 * 获取项目甘特图数据
 */
export function useProjectGantt(params?: GanttQueryParams) {
  return useQuery<GanttData>({
    queryKey: ['gantt', 'projects', params],
    queryFn: () => getProjectGantt(params),
    staleTime: STALE_TIME,
  })
}

/**
 * 获取任务甘特图数据
 */
export function useTaskGantt(params?: GanttQueryParams) {
  return useQuery<GanttData>({
    queryKey: ['gantt', 'tasks', params],
    queryFn: () => getTaskGantt(params),
    staleTime: STALE_TIME,
  })
}

/**
 * 获取组合甘特图数据
 */
export function useCombinedGantt(params?: GanttQueryParams) {
  return useQuery<GanttData>({
    queryKey: ['gantt', 'combined', params],
    queryFn: () => getCombinedGantt(params),
    staleTime: STALE_TIME,
  })
}
