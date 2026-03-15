import apiClient from '@/lib/axios'
import type { Task, TaskTree, TasksByProjectTreeResponse, TasksByTagResponse } from '@/types'

export async function getTasks(params?: {
  project?: string
  task_type?: string
  flagged?: boolean
  completed_at__isnull?: boolean
}): Promise<Task[]> {
  const response = await apiClient.get('/tasks/', { params })
  const data = response.data
  if (Array.isArray(data)) {
    return data
  }
  if (data && Array.isArray(data.results)) {
    return data.results
  }
  return []
}

export async function getTask(id: string): Promise<Task> {
  const response = await apiClient.get(`/tasks/${id}/`)
  return response.data
}

export async function getTaskTree(id: string): Promise<TaskTree> {
  const response = await apiClient.get(`/tasks/${id}/tree/`)
  return response.data
}

export async function createTask(data: Partial<Task>): Promise<Task> {
  const response = await apiClient.post('/tasks/', data)
  return response.data
}

export async function updateTask(id: string, data: Partial<Task>): Promise<Task> {
  const response = await apiClient.patch(`/tasks/${id}/`, data)
  return response.data
}

export async function deleteTask(id: string): Promise<void> {
  await apiClient.delete(`/tasks/${id}/`)
}

export async function completeTask(id: string): Promise<void> {
  await apiClient.post(`/tasks/${id}/complete/`)
}

export async function dropTask(id: string): Promise<void> {
  await apiClient.post(`/tasks/${id}/drop/`)
}

export async function flagTask(id: string): Promise<{ flagged: boolean }> {
  const response = await apiClient.post(`/tasks/${id}/flag/`)
  return response.data
}

export async function moveTask(id: string, data: {
  parent_id?: string | null
  sort_order?: number
}): Promise<void> {
  await apiClient.post(`/tasks/${id}/move/`, data)
}

export async function moveTaskToProject(id: string, projectId: string): Promise<void> {
  await apiClient.post(`/tasks/${id}/move_to_project/`, { project_id: projectId })
}

export async function convertToProject(id: string): Promise<{ project_id: string }> {
  const response = await apiClient.post(`/tasks/${id}/convert_to_project/`)
  return response.data
}

export async function addSubtask(parentId: string, data: Partial<Task>): Promise<Task> {
  const response = await apiClient.post(`/tasks/${parentId}/add_subtask/`, data)
  return response.data
}

export async function addTag(taskId: string, tagId: string): Promise<void> {
  await apiClient.post(`/tasks/${taskId}/add_tag/`, { tag_id: tagId })
}

export async function removeTag(taskId: string, tagId: string): Promise<void> {
  await apiClient.post(`/tasks/${taskId}/remove_tag/`, { tag_id: tagId })
}

// Special endpoints
export async function getInbox(): Promise<Task[]> {
  const response = await apiClient.get('/tasks/inbox/')
  const data = response.data
  if (Array.isArray(data)) {
    return data
  }
  if (data && Array.isArray(data.results)) {
    return data.results
  }
  return []
}

export async function getFlaggedTasks(): Promise<Task[]> {
  const response = await apiClient.get('/tasks/flagged/')
  const data = response.data
  if (Array.isArray(data)) {
    return data
  }
  if (data && Array.isArray(data.results)) {
    return data.results
  }
  return []
}

export async function getDueToday(): Promise<Task[]> {
  const response = await apiClient.get('/tasks/due_today/')
  const data = response.data
  if (Array.isArray(data)) {
    return data
  }
  if (data && Array.isArray(data.results)) {
    return data.results
  }
  return []
}

export async function getOverdue(): Promise<Task[]> {
  const response = await apiClient.get('/tasks/overdue/')
  const data = response.data
  if (Array.isArray(data)) {
    return data
  }
  if (data && Array.isArray(data.results)) {
    return data.results
  }
  return []
}

export async function getCompletedToday(): Promise<Task[]> {
  const response = await apiClient.get('/tasks/completed_today/')
  const data = response.data
  if (Array.isArray(data)) {
    return data
  }
  if (data && Array.isArray(data.results)) {
    return data.results
  }
  return []
}

export async function getTasksByTag(): Promise<TasksByTagResponse[]> {
  const response = await apiClient.get('/tasks/by_tag/')
  return response.data
}

export async function getTasksByProjectTree(params: {
  project_id?: string
  folder_id?: string
  format?: 'flat' | 'tree'
  include_completed?: boolean
}): Promise<TasksByProjectTreeResponse> {
  const response = await apiClient.get('/tasks/by_project_tree/', { params })
  return response.data
}
