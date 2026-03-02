import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import * as api from '@/api/focusModes'

const FOCUS_MODES_KEY = 'focus-modes'

// ========== Query Hooks ==========

export function useFocusModes() {
  return useQuery({
    queryKey: [FOCUS_MODES_KEY],
    queryFn: api.getFocusModes,
  })
}

export function useActiveFocusMode() {
  return useQuery({
    queryKey: [FOCUS_MODES_KEY, 'active'],
    queryFn: api.getActiveFocusMode,
  })
}

// ========== Mutation Hooks ==========

export function useCreateFocusMode() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: api.createFocusMode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FOCUS_MODES_KEY] })
    },
  })
}

export function useUpdateFocusMode() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: api.UpdateFocusModeRequest }) =>
      api.updateFocusMode(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [FOCUS_MODES_KEY] })
      queryClient.invalidateQueries({ queryKey: [FOCUS_MODES_KEY, data.id] })
    },
  })
}

export function useDeleteFocusMode() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: api.deleteFocusMode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FOCUS_MODES_KEY] })
    },
  })
}

export function useActivateFocusMode() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: api.activateFocusMode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FOCUS_MODES_KEY] })
      queryClient.invalidateQueries({ queryKey: [FOCUS_MODES_KEY, 'active'] })
    },
  })
}

export function useDeactivateFocusMode() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: api.deactivateFocusMode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FOCUS_MODES_KEY] })
      queryClient.invalidateQueries({ queryKey: [FOCUS_MODES_KEY, 'active'] })
    },
  })
}
