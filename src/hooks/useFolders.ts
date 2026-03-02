import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import * as api from '@/api/folders'

const FOLDERS_KEY = 'folders'

// ========== Query Hooks ==========

export function useFolders(params?: Parameters<typeof api.getFolders>[0]) {
  return useQuery({
    queryKey: [FOLDERS_KEY, params],
    queryFn: () => api.getFolders(params),
  })
}

export function useFolderTree() {
  return useQuery({
    queryKey: [FOLDERS_KEY, 'tree'],
    queryFn: api.getFolderTree,
  })
}

export function useFolder(id: string | null) {
  return useQuery({
    queryKey: [FOLDERS_KEY, id],
    queryFn: () => api.getFolder(id!),
    enabled: !!id,
  })
}

export function useFolderDescendants(id: string | null) {
  return useQuery({
    queryKey: [FOLDERS_KEY, id, 'descendants'],
    queryFn: () => api.getFolderDescendants(id!),
    enabled: !!id,
  })
}

export function useFolderAncestors(id: string | null) {
  return useQuery({
    queryKey: [FOLDERS_KEY, id, 'ancestors'],
    queryFn: () => api.getFolderAncestors(id!),
    enabled: !!id,
  })
}

export function useFolderProjectTree(params?: Parameters<typeof api.getFolderProjectTree>[0]) {
  return useQuery({
    queryKey: [FOLDERS_KEY, 'project-tree', params],
    queryFn: () => api.getFolderProjectTree(params),
  })
}

export function useFolderStatusChoices() {
  return useQuery({
    queryKey: [FOLDERS_KEY, 'choices', 'status'],
    queryFn: api.getFolderStatusChoices,
  })
}

// ========== Mutation Hooks ==========

export function useCreateFolder() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: api.createFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FOLDERS_KEY] })
    },
  })
}

export function useUpdateFolder() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: api.UpdateFolderRequest }) =>
      api.updateFolder(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [FOLDERS_KEY] })
      queryClient.invalidateQueries({ queryKey: [FOLDERS_KEY, data.id] })
    },
  })
}

export function useDeleteFolder() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: api.deleteFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FOLDERS_KEY] })
    },
  })
}

export function useMoveFolder() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, parentId }: { id: string; parentId: string | null }) =>
      api.moveFolder(id, parentId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [FOLDERS_KEY] })
      queryClient.invalidateQueries({ queryKey: [FOLDERS_KEY, data.id] })
    },
  })
}
