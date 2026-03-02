import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Perspective } from '@/types'
import * as api from '@/api/perspectives'

const PERSPECTIVES_KEY = 'perspectives'

// ========== Query Hooks ==========

export function usePerspectives(params?: Parameters<typeof api.getPerspectives>[0]) {
  return useQuery({
    queryKey: [PERSPECTIVES_KEY, params],
    queryFn: () => api.getPerspectives(params),
  })
}

export function useSidebarPerspectives() {
  return useQuery({
    queryKey: [PERSPECTIVES_KEY, 'sidebar'],
    queryFn: api.getSidebarPerspectives,
  })
}

export function useSectionPerspectives() {
  return useQuery({
    queryKey: [PERSPECTIVES_KEY, 'sections'],
    queryFn: api.getSectionPerspectives,
  })
}

export function usePerspective(id: string | null) {
  return useQuery({
    queryKey: [PERSPECTIVES_KEY, id],
    queryFn: () => api.getPerspective(id!),
    enabled: !!id,
  })
}

export function usePerspectiveTasks(
  id: string | null,
  params?: Parameters<typeof api.getPerspectiveTasks>[1]
) {
  return useQuery({
    queryKey: [PERSPECTIVES_KEY, id, 'tasks', params],
    queryFn: () => api.getPerspectiveTasks(id!, params),
    enabled: !!id,
  })
}

export function usePerspectiveGrouped(id: string | null) {
  return useQuery({
    queryKey: [PERSPECTIVES_KEY, id, 'grouped'],
    queryFn: () => api.getPerspectiveGrouped(id!),
    enabled: !!id,
  })
}

export function useGroupByChoices() {
  return useQuery({
    queryKey: [PERSPECTIVES_KEY, 'choices', 'group-by'],
    queryFn: api.getGroupByChoices,
  })
}

export function useViewModeChoices() {
  return useQuery({
    queryKey: [PERSPECTIVES_KEY, 'choices', 'view-mode'],
    queryFn: api.getViewModeChoices,
  })
}

// ========== Mutation Hooks ==========

export function useCreatePerspective() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: api.createPerspective,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PERSPECTIVES_KEY] })
    },
  })
}

export function useUpdatePerspective() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: api.UpdatePerspectiveRequest }) =>
      api.updatePerspective(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [PERSPECTIVES_KEY] })
      queryClient.invalidateQueries({ queryKey: [PERSPECTIVES_KEY, data.id] })
    },
  })
}

export function useDeletePerspective() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: api.deletePerspective,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PERSPECTIVES_KEY] })
    },
  })
}
