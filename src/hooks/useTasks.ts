import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import * as api from '@/api/tasks'

const TASKS_KEY = 'tasks'

// ========== Query Hooks ==========

export function useTasks(params?: Parameters<typeof api.getTasks>[0]) {
  return useQuery({
    queryKey: [TASKS_KEY, params],
    queryFn: () => api.getTasks(params),
  })
}

export function useTasksByLocation(locationId: number | null, params?: Omit<Parameters<typeof api.getTasks>[0], 'location'>) {
  return useQuery({
    queryKey: [TASKS_KEY, 'by-location', locationId, params],
    queryFn: () => api.getTasks({ ...params, location: locationId! }),
    enabled: !!locationId,
  })
}

export function useTask(id: string | null) {
  return useQuery({
    queryKey: [TASKS_KEY, id],
    queryFn: () => api.getTask(id!),
    enabled: !!id,
  })
}

export function useTaskTree(id: string | null) {
  return useQuery({
    queryKey: [TASKS_KEY, id, 'tree'],
    queryFn: () => api.getTaskTree(id!),
    enabled: !!id,
  })
}

export function useInboxTasks(params?: Parameters<typeof api.getInboxTasks>[0]) {
  return useQuery({
    queryKey: [TASKS_KEY, 'inbox', params],
    queryFn: () => api.getInboxTasks(params),
  })
}

export function useFlaggedTasks(params?: Parameters<typeof api.getFlaggedTasks>[0]) {
  return useQuery({
    queryKey: [TASKS_KEY, 'flagged', params],
    queryFn: () => api.getFlaggedTasks(params),
  })
}

export function useTasksDueToday(params?: Parameters<typeof api.getTasksDueToday>[0]) {
  return useQuery({
    queryKey: [TASKS_KEY, 'due-today', params],
    queryFn: () => api.getTasksDueToday(params),
  })
}

export function useOverdueTasks(params?: Parameters<typeof api.getOverdueTasks>[0]) {
  return useQuery({
    queryKey: [TASKS_KEY, 'overdue', params],
    queryFn: () => api.getOverdueTasks(params),
  })
}

export function useTasksByTag(tagId: number | null, params?: Parameters<typeof api.getTasksByTag>[1]) {
  return useQuery({
    queryKey: [TASKS_KEY, 'by-tag', tagId, params],
    queryFn: () => api.getTasksByTag(tagId!, params),
    enabled: !!tagId,
  })
}

export function useTasksByProjectTree(
  params: Parameters<typeof api.getTasksByProjectTree>[0]
) {
  return useQuery({
    queryKey: [TASKS_KEY, 'by-project-tree', params],
    queryFn: () => api.getTasksByProjectTree(params),
    enabled: !!(params.project_id || params.folder_id),
  })
}

export function useTaskTypeChoices() {
  return useQuery({
    queryKey: [TASKS_KEY, 'choices', 'task-type'],
    queryFn: api.getTaskTypeChoices,
  })
}

// ========== Mutation Hooks ==========

export function useCreateTask() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: api.createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_KEY] })
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: api.UpdateTaskRequest }) =>
      api.updateTask(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [TASKS_KEY] })
      queryClient.invalidateQueries({ queryKey: [TASKS_KEY, data.id] })
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: api.deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_KEY] })
    },
  })
}

export function useCompleteTask() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: api.completeTask,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [TASKS_KEY] })
      queryClient.invalidateQueries({ queryKey: [TASKS_KEY, data.id] })
    },
  })
}

export function useDropTask() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: api.dropTask,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [TASKS_KEY] })
      queryClient.invalidateQueries({ queryKey: [TASKS_KEY, data.id] })
    },
  })
}

export function useToggleTaskFlag() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: api.toggleTaskFlag,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [TASKS_KEY] })
      queryClient.invalidateQueries({ queryKey: [TASKS_KEY, data.id] })
      queryClient.invalidateQueries({ queryKey: [TASKS_KEY, 'flagged'] })
    },
  })
}

export function useMoveTaskToProject() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ taskId, projectId }: { taskId: string; projectId: string | null }) =>
      api.moveTaskToProject(taskId, projectId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [TASKS_KEY] })
      queryClient.invalidateQueries({ queryKey: [TASKS_KEY, data.id] })
    },
  })
}

export function useMoveTask() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: api.MoveTaskRequest }) =>
      api.moveTask(taskId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [TASKS_KEY] })
      queryClient.invalidateQueries({ queryKey: [TASKS_KEY, data.id] })
    },
  })
}

export function useConvertTaskToProject() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: api.convertTaskToProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_KEY] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export function useAddSubtask() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ 
      parentId, 
      taskData 
    }: { 
      parentId: string
      taskData: { title: string; note?: string }
    }) => api.addSubtask(parentId, taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_KEY] })
    },
  })
}
