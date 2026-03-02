import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Location } from '@/types'
import * as api from '@/api/locations'

const LOCATIONS_KEY = 'locations'

// ========== Query Hooks ==========

export function useLocations(params?: Parameters<typeof api.getLocations>[0]) {
  return useQuery({
    queryKey: [LOCATIONS_KEY, params],
    queryFn: () => api.getLocations(params),
  })
}

export function useLocationTree(params?: Parameters<typeof api.getLocationTree>[0]) {
  return useQuery({
    queryKey: [LOCATIONS_KEY, 'tree', params],
    queryFn: () => api.getLocationTree(params),
  })
}

export function useLocation(id: number | null) {
  return useQuery({
    queryKey: [LOCATIONS_KEY, id],
    queryFn: () => api.getLocation(id!),
    enabled: !!id,
  })
}

export function useLocationDescendants(id: number | null) {
  return useQuery({
    queryKey: [LOCATIONS_KEY, id, 'descendants'],
    queryFn: () => api.getLocationDescendants(id!),
    enabled: !!id,
  })
}

export function useLocationAncestors(id: number | null) {
  return useQuery({
    queryKey: [LOCATIONS_KEY, id, 'ancestors'],
    queryFn: () => api.getLocationAncestors(id!),
    enabled: !!id,
  })
}

export function useLocationsByType(type: string | null) {
  return useQuery({
    queryKey: [LOCATIONS_KEY, 'by-type', type],
    queryFn: () => api.getLocationsByType(type!),
    enabled: !!type,
  })
}

export function useLocationTypeChoices() {
  return useQuery({
    queryKey: [LOCATIONS_KEY, 'choices', 'type'],
    queryFn: api.getLocationTypeChoices,
  })
}

// ========== Mutation Hooks ==========

export function useCreateLocation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: api.createLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LOCATIONS_KEY] })
    },
  })
}

export function useUpdateLocation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: api.UpdateLocationRequest }) =>
      api.updateLocation(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [LOCATIONS_KEY] })
      queryClient.invalidateQueries({ queryKey: [LOCATIONS_KEY, data.id] })
    },
  })
}

export function useDeleteLocation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: api.deleteLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LOCATIONS_KEY] })
    },
  })
}

export function useMoveLocation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, parentId }: { id: number; parentId: number | null }) =>
      api.moveLocation(id, parentId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [LOCATIONS_KEY] })
      queryClient.invalidateQueries({ queryKey: [LOCATIONS_KEY, data.id] })
    },
  })
}
