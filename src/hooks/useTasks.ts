import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query'
import {
  createDetailHook,
  createCreateHook,
  createUpdateHook,
  createDeleteHook,
  createMutationHook,
} from '@/packages/query/lib/factory'
import * as taskApi from '@/api/tasks'
import type { Task } from '@/types'

export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (params: unknown) => [...taskKeys.lists(), params] as const,
  detail: (id: string) => [...taskKeys.all, 'detail', id] as const,
  inbox: () => [...taskKeys.all, 'inbox'] as const,
  flagged: () => [...taskKeys.all, 'flagged'] as const,
  dueToday: () => [...taskKeys.all, 'due_today'] as const,
  overdue: () => [...taskKeys.all, 'overdue'] as const,
  completedToday: () => [...taskKeys.all, 'completed_today'] as const,
  byTag: () => [...taskKeys.all, 'by_tag'] as const,
  byProjectTree: (params: unknown) => [...taskKeys.all, 'by_project_tree', params] as const,
}

// ===== Queries =====

// 带参数的列表 hook
export function useTasks(
  params?: { project?: string; task_type?: string; flagged?: boolean; completed_at__isnull?: boolean },
  options?: Omit<UseQueryOptions<Task[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: taskKeys.list(params),
    queryFn: () => taskApi.getTasks(params),
    ...options,
  })
}

// 基础 hooks
export const useTask = createDetailHook<Task>('tasks', taskApi.getTask)

export function useTaskTree(id: string) {
  return useQuery({
    queryKey: ['tasks', id, 'tree'],
    queryFn: () => taskApi.getTaskTree(id),
    enabled: !!id,
  })
}

// 特殊视图 hooks
export function useInbox() {
  return useQuery({
    queryKey: taskKeys.inbox(),
    queryFn: taskApi.getInbox,
  })
}

export function useFlaggedTasks() {
  return useQuery({
    queryKey: taskKeys.flagged(),
    queryFn: taskApi.getFlaggedTasks,
  })
}

export function useDueToday() {
  return useQuery({
    queryKey: taskKeys.dueToday(),
    queryFn: taskApi.getDueToday,
  })
}

export function useOverdue() {
  return useQuery({
    queryKey: taskKeys.overdue(),
    queryFn: taskApi.getOverdue,
  })
}

export function useCompletedToday() {
  return useQuery({
    queryKey: taskKeys.completedToday(),
    queryFn: taskApi.getCompletedToday,
  })
}

export function useTasksByTag() {
  return useQuery({
    queryKey: taskKeys.byTag(),
    queryFn: taskApi.getTasksByTag,
  })
}

export function useTasksByProjectTree(params: {
  project_id?: string
  folder_id?: string
  format?: 'flat' | 'tree'
  include_completed?: boolean
}) {
  return useQuery({
    queryKey: taskKeys.byProjectTree(params),
    queryFn: () => taskApi.getTasksByProjectTree(params),
    enabled: !!(params.project_id || params.folder_id),
  })
}

// ===== Mutations =====

// 基础 CRUD
export const useCreateTask = createCreateHook<Task>('tasks', taskApi.createTask, [['projects']])
export const useUpdateTask = createUpdateHook<Task>('tasks', taskApi.updateTask)
export const useDeleteTask = createDeleteHook('tasks', taskApi.deleteTask)

// 任务状态操作
export const useCompleteTask = createMutationHook<void, string>(
  taskApi.completeTask,
  [['tasks'], ['projects']]
)

export const useDropTask = createMutationHook<void, string>(
  taskApi.dropTask,
  [['tasks']]
)

export function useFlagTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: taskApi.flagTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
    },
  })
}

// 移动操作
export function useMoveTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { parent_id?: string | null; sort_order?: number } }) =>
      taskApi.moveTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
    },
  })
}

export function useMoveTaskToProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ taskId, projectId }: { taskId: string; projectId: string }) =>
      taskApi.moveTaskToProject(taskId, projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
    },
  })
}

// 子任务
export function useAddSubtask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ parentId, data }: { parentId: string; data: Partial<Task> }) =>
      taskApi.addSubtask(parentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
    },
  })
}

// 标签操作
export function useAddTagToTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ taskId, tagId }: { taskId: string; tagId: string }) =>
      taskApi.addTag(taskId, tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
    },
  })
}

export function useRemoveTagFromTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ taskId, tagId }: { taskId: string; tagId: string }) =>
      taskApi.removeTag(taskId, tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
    },
  })
}

// 转换
export function useConvertTaskToProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: taskApi.convertToProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}
