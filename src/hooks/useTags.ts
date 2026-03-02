import { useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '@/api/tags'

const TAGS_KEY = 'tags'

// ========== Query Hooks ==========

export function useTags(params?: Parameters<typeof api.getTags>[0]) {
  return useQuery({
    queryKey: [TAGS_KEY, params],
    queryFn: () => api.getTags(params),
  })
}

export function useTagTasks(
  tagId: number | null,
  params?: Parameters<typeof api.getTagTasks>[1]
) {
  return useQuery({
    queryKey: [TAGS_KEY, tagId, 'tasks', params],
    queryFn: () => api.getTagTasks(tagId!, params),
    enabled: !!tagId,
  })
}

export function useTagProjects(
  tagId: number | null,
  params?: Parameters<typeof api.getTagProjects>[1]
) {
  return useQuery({
    queryKey: [TAGS_KEY, tagId, 'projects', params],
    queryFn: () => api.getTagProjects(tagId!, params),
    enabled: !!tagId,
  })
}

export function useTagStatistics() {
  return useQuery({
    queryKey: [TAGS_KEY, 'statistics'],
    queryFn: api.getTagStatistics,
  })
}
