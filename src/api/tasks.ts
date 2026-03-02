import apiClient from '@/lib/axios'
import type { 
  Task, 
  TaskTreeNode, 
  TaskFilterResponse,
  PaginatedResponse 
} from '@/types'

// ========== Task APIs ==========

export interface CreateTaskRequest {
  title: string
  note?: string
  task_type?: 'inbox' | 'project_task' | 'action_group'
  project?: string | null
  parent?: string | null
  flagged?: boolean
  defer_date?: string | null
  due_date?: string | null
  planned_date?: string | null  // ⭐ OmniFocus 4.7+
  estimated_duration?: number | null
  recurrence_rule?: string | null
  tag_ids?: number[]
}

export interface UpdateTaskRequest extends Partial<CreateTaskRequest> {}

export interface MoveTaskRequest {
  parent_id?: string | null
  target_position?: number
}

// Get all tasks (paginated)
export async function getTasks(
  params?: {
    task_type?: string
    project?: string
    parent?: string
    flagged?: boolean
    available_only?: boolean
    overdue_only?: boolean
    tag?: number
    location?: number
    search?: string
    page?: number
    page_size?: number
  }
): Promise<PaginatedResponse<Task>> {
  const response = await apiClient.get<PaginatedResponse<Task>>(
    '/productivity/tasks/',
    { params }
  )
  return response.data
}

// Get single task
export async function getTask(id: string): Promise<Task> {
  const response = await apiClient.get<Task>(`/productivity/tasks/${id}/`)
  return response.data
}

// Create task
export async function createTask(data: CreateTaskRequest): Promise<Task> {
  const response = await apiClient.post<Task>('/productivity/tasks/', data)
  return response.data
}

// Update task
export async function updateTask(id: string, data: UpdateTaskRequest): Promise<Task> {
  const response = await apiClient.patch<Task>(`/productivity/tasks/${id}/`, data)
  return response.data
}

// Delete task
export async function deleteTask(id: string): Promise<void> {
  await apiClient.delete(`/productivity/tasks/${id}/`)
}

// Complete task
export async function completeTask(id: string): Promise<Task> {
  const response = await apiClient.post<Task>(`/productivity/tasks/${id}/complete/`)
  return response.data
}

// Drop task
export async function dropTask(id: string): Promise<Task> {
  const response = await apiClient.post<Task>(`/productivity/tasks/${id}/drop/`)
  return response.data
}

// Toggle flag
export async function toggleTaskFlag(id: string): Promise<Task> {
  const response = await apiClient.post<Task>(`/productivity/tasks/${id}/flag/`)
  return response.data
}

// Move task to project
export async function moveTaskToProject(taskId: string, projectId: string | null): Promise<Task> {
  const response = await apiClient.post<Task>(
    `/productivity/tasks/${taskId}/move_to_project/`,
    { project_id: projectId }
  )
  return response.data
}

// Move task (change parent/position)
export async function moveTask(taskId: string, data: MoveTaskRequest): Promise<Task> {
  const response = await apiClient.post<Task>(
    `/productivity/tasks/${taskId}/move/`,
    data
  )
  return response.data
}

// Convert task to project
export async function convertTaskToProject(taskId: string): Promise<Task> {
  const response = await apiClient.post<Task>(`/productivity/tasks/${taskId}/convert_to_project/`)
  return response.data
}

// Add subtask
export async function addSubtask(
  parentId: string, 
  taskData: { title: string; note?: string }
): Promise<Task> {
  const response = await apiClient.post<Task>(
    `/productivity/tasks/${parentId}/add_subtask/`,
    taskData
  )
  return response.data
}

// Get task tree
export async function getTaskTree(taskId: string): Promise<TaskTreeNode> {
  const response = await apiClient.get<TaskTreeNode>(`/productivity/tasks/${taskId}/tree/`)
  return response.data
}

// Get inbox tasks
export async function getInboxTasks(
  params?: { page?: number; page_size?: number }
): Promise<PaginatedResponse<Task>> {
  const response = await apiClient.get<PaginatedResponse<Task>>(
    '/productivity/tasks/inbox/',
    { params }
  )
  return response.data
}

// Get flagged tasks
export async function getFlaggedTasks(
  params?: { page?: number; page_size?: number }
): Promise<PaginatedResponse<Task>> {
  const response = await apiClient.get<PaginatedResponse<Task>>(
    '/productivity/tasks/flagged/',
    { params }
  )
  return response.data
}

// Get tasks due today
export async function getTasksDueToday(
  params?: { page?: number; page_size?: number }
): Promise<PaginatedResponse<Task>> {
  const response = await apiClient.get<PaginatedResponse<Task>>(
    '/productivity/tasks/due_today/',
    { params }
  )
  return response.data
}

// Get overdue tasks
export async function getOverdueTasks(
  params?: { page?: number; page_size?: number }
): Promise<PaginatedResponse<Task>> {
  const response = await apiClient.get<PaginatedResponse<Task>>(
    '/productivity/tasks/overdue/',
    { params }
  )
  return response.data
}

// Get tasks by tag
export async function getTasksByTag(
  tagId: number,
  params?: { page?: number; page_size?: number }
): Promise<PaginatedResponse<Task>> {
  const response = await apiClient.get<PaginatedResponse<Task>>(
    '/productivity/tasks/by_tag/',
    { params: { tag: tagId, ...params } }
  )
  return response.data
}

// Get tasks by project/folder tree
export async function getTasksByProjectTree(
  params: {
    project_id?: string
    folder_id?: string
    format?: 'flat' | 'tree'
    include_completed?: boolean
  }
): Promise<TaskFilterResponse> {
  const response = await apiClient.get<TaskFilterResponse>(
    '/productivity/tasks/by_project_tree/',
    { params }
  )
  return response.data
}

// Get task type choices
export async function getTaskTypeChoices(): Promise<Array<{ value: string; label: string }>> {
  const response = await apiClient.get('/productivity/tasks/task-type-choices/')
  return response.data
}
