import apiClient from '@/lib/axios'
import type { 
  Project, 

  ProjectStatistics,
  PaginatedResponse 
} from '@/types'

// ========== Project APIs ==========

export interface CreateProjectRequest {
  title: string
  note?: string
  project_type?: 'sequential' | 'parallel' | 'single_action'
  status?: 'active' | 'on_hold' | 'dropped' | 'completed'
  folder?: string | null
  flagged?: boolean
  defer_date?: string | null
  due_date?: string | null
  review_interval_days?: number
  tag_ids?: number[]
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {}

// Get all projects (paginated)
export async function getProjects(
  params?: {
    status?: string
    project_type?: string
    folder?: string
    flagged?: boolean
    location?: number
    search?: string
    page?: number
    page_size?: number
  }
): Promise<PaginatedResponse<Project>> {
  const response = await apiClient.get<PaginatedResponse<Project>>(
    '/productivity/projects/',
    { params }
  )
  return response.data
}

// Get single project
export async function getProject(id: string): Promise<Project> {
  const response = await apiClient.get<Project>(`/productivity/projects/${id}/`)
  return response.data
}

// Create project
export async function createProject(data: CreateProjectRequest): Promise<Project> {
  const response = await apiClient.post<Project>('/productivity/projects/', data)
  return response.data
}

// Update project
export async function updateProject(id: string, data: UpdateProjectRequest): Promise<Project> {
  const response = await apiClient.patch<Project>(`/productivity/projects/${id}/`, data)
  return response.data
}

// Delete project
export async function deleteProject(id: string): Promise<void> {
  await apiClient.delete(`/productivity/projects/${id}/`)
}

// Complete project
export async function completeProject(id: string): Promise<Project> {
  const response = await apiClient.post<Project>(`/productivity/projects/${id}/complete/`)
  return response.data
}

// Drop project
export async function dropProject(id: string): Promise<Project> {
  const response = await apiClient.post<Project>(`/productivity/projects/${id}/drop/`)
  return response.data
}

// Review project
export async function reviewProject(id: string): Promise<{ status: string; next_review: string }> {
  const response = await apiClient.post(`/productivity/projects/${id}/review/`)
  return response.data
}

// Add task to project
export async function addTaskToProject(
  projectId: string, 
  taskData: { title: string; note?: string; due_date?: string | null }
): Promise<Project> {
  const response = await apiClient.post<Project>(
    `/productivity/projects/${projectId}/add_task/`, 
    taskData
  )
  return response.data
}

// Add tag to project
export async function addTagToProject(projectId: string, tagId: number): Promise<Project> {
  const response = await apiClient.post<Project>(
    `/productivity/projects/${projectId}/add_tag/`, 
    { tag_id: tagId }
  )
  return response.data
}

// Remove tag from project
export async function removeTagFromProject(projectId: string, tagId: number): Promise<Project> {
  const response = await apiClient.post<Project>(
    `/productivity/projects/${projectId}/remove_tag/`, 
    { tag_id: tagId }
  )
  return response.data
}

// Get due soon projects
export async function getDueSoonProjects(): Promise<Project[]> {
  const response = await apiClient.get<Project[]>('/productivity/projects/due_soon/')
  return response.data
}

// Get projects needing review
export async function getProjectsNeedingReview(): Promise<Project[]> {
  const response = await apiClient.get<Project[]>('/productivity/projects/needs_review/')
  return response.data
}

// Get project statistics
export async function getProjectStatistics(): Promise<ProjectStatistics> {
  const response = await apiClient.get<ProjectStatistics>('/productivity/projects/statistics/')
  return response.data
}

// Get project type choices
export async function getProjectTypeChoices(): Promise<Array<{ value: string; label: string }>> {
  const response = await apiClient.get('/productivity/projects/project-type-choices/')
  return response.data
}

// Get project status choices
export async function getProjectStatusChoices(): Promise<Array<{ value: string; label: string }>> {
  const response = await apiClient.get('/productivity/projects/status-choices/')
  return response.data
}
