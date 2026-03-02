import apiClient from '@/lib/axios'
import type { Tag, TagStatistics, Project, Task, PaginatedResponse } from '@/types'

// ========== Tag APIs (Productivity specific) ==========

// Get all tags
export async function getTags(
  params?: {
    type?: string
    build_in?: boolean
    is_valid?: boolean
    page?: number
    page_size?: number
  }
): Promise<PaginatedResponse<Tag>> {
  const response = await apiClient.get<PaginatedResponse<Tag>>(
    '/productivity/tags/',
    { params }
  )
  return response.data
}

// Get tag tasks
export async function getTagTasks(
  tagId: number,
  params?: { page?: number; page_size?: number }
): Promise<PaginatedResponse<Task>> {
  const response = await apiClient.get<PaginatedResponse<Task>>(
    `/productivity/tags/${tagId}/tasks/`,
    { params }
  )
  return response.data
}

// Get tag projects
export async function getTagProjects(
  tagId: number,
  params?: { page?: number; page_size?: number }
): Promise<PaginatedResponse<Project>> {
  const response = await apiClient.get<PaginatedResponse<Project>>(
    `/productivity/tags/${tagId}/projects/`,
    { params }
  )
  return response.data
}

// Get tag statistics
export async function getTagStatistics(): Promise<TagStatistics[]> {
  const response = await apiClient.get<TagStatistics[]>('/productivity/tags/statistics/')
  return response.data
}
