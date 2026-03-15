import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query'
import {
  createDetailHook,
  createCreateHook,
  createUpdateHook,
  createDeleteHook,
} from '@/packages/query/lib/factory'
import * as projectApi from '@/api/projects'
import type { Project } from '@/types'

export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (params: unknown) => [...projectKeys.lists(), params] as const,
  detail: (id: string) => [...projectKeys.all, 'detail', id] as const,
}

// 带参数的列表 hook（自定义实现）
export function useProjects(
  params?: { folder?: string; status?: string },
  options?: Omit<UseQueryOptions<Project[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: projectKeys.list(params),
    queryFn: () => projectApi.getProjects(params),
    ...options,
  })
}

// 使用工厂函数创建基础 hooks
export const useProject = createDetailHook<Project>('projects', projectApi.getProject)
export const useCreateProject = createCreateHook<Project>('projects', projectApi.createProject)
export const useUpdateProject = createUpdateHook<Project>('projects', projectApi.updateProject)
export const useDeleteProject = createDeleteHook('projects', projectApi.deleteProject)

// 自定义操作 hooks
export function useCompleteProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: projectApi.completeProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
    },
  })
}

export function useDropProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: projectApi.dropProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
    },
  })
}

export function useReviewProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: projectApi.reviewProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
    },
  })
}
