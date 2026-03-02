import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Project } from '@/types'
import * as api from '@/api/projects'

const PROJECTS_KEY = 'projects'

// ========== Query Hooks ==========

export function useProjects(params?: Parameters<typeof api.getProjects>[0]) {
  return useQuery({
    queryKey: [PROJECTS_KEY, params],
    queryFn: () => api.getProjects(params),
  })
}

export function useProjectsByLocation(locationId: number | null, params?: Omit<Parameters<typeof api.getProjects>[0], 'location'>) {
  return useQuery({
    queryKey: [PROJECTS_KEY, 'by-location', locationId, params],
    queryFn: () => api.getProjects({ ...params, location: locationId! }),
    enabled: !!locationId,
  })
}

export function useProject(id: string | null) {
  return useQuery({
    queryKey: [PROJECTS_KEY, id],
    queryFn: () => api.getProject(id!),
    enabled: !!id,
  })
}

export function useDueSoonProjects() {
  return useQuery({
    queryKey: [PROJECTS_KEY, 'due-soon'],
    queryFn: api.getDueSoonProjects,
  })
}

export function useProjectsNeedingReview() {
  return useQuery({
    queryKey: [PROJECTS_KEY, 'needs-review'],
    queryFn: api.getProjectsNeedingReview,
  })
}

export function useProjectStatistics() {
  return useQuery({
    queryKey: [PROJECTS_KEY, 'statistics'],
    queryFn: api.getProjectStatistics,
  })
}

export function useProjectTypeChoices() {
  return useQuery({
    queryKey: [PROJECTS_KEY, 'choices', 'project-type'],
    queryFn: api.getProjectTypeChoices,
  })
}

export function useProjectStatusChoices() {
  return useQuery({
    queryKey: [PROJECTS_KEY, 'choices', 'status'],
    queryFn: api.getProjectStatusChoices,
  })
}

// ========== Mutation Hooks ==========

export function useCreateProject() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: api.createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROJECTS_KEY] })
    },
  })
}

export function useUpdateProject() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: api.UpdateProjectRequest }) =>
      api.updateProject(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [PROJECTS_KEY] })
      queryClient.invalidateQueries({ queryKey: [PROJECTS_KEY, data.id] })
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: api.deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROJECTS_KEY] })
    },
  })
}

export function useCompleteProject() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: api.completeProject,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [PROJECTS_KEY] })
      queryClient.invalidateQueries({ queryKey: [PROJECTS_KEY, data.id] })
    },
  })
}

export function useDropProject() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: api.dropProject,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [PROJECTS_KEY] })
      queryClient.invalidateQueries({ queryKey: [PROJECTS_KEY, data.id] })
    },
  })
}

export function useReviewProject() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: api.reviewProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROJECTS_KEY] })
      queryClient.invalidateQueries({ queryKey: [PROJECTS_KEY, 'needs-review'] })
    },
  })
}

export function useAddTaskToProject() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ 
      projectId, 
      taskData 
    }: { 
      projectId: string
      taskData: { title: string; note?: string; due_date?: string | null }
    }) => api.addTaskToProject(projectId, taskData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [PROJECTS_KEY] })
      queryClient.invalidateQueries({ queryKey: [PROJECTS_KEY, data.id] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useAddTagToProject() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ projectId, tagId }: { projectId: string; tagId: number }) =>
      api.addTagToProject(projectId, tagId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [PROJECTS_KEY, data.id] })
    },
  })
}

export function useRemoveTagFromProject() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ projectId, tagId }: { projectId: string; tagId: number }) =>
      api.removeTagFromProject(projectId, tagId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [PROJECTS_KEY, data.id] })
    },
  })
}
