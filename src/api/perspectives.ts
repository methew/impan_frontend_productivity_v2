import apiClient from '@/lib/axios'
import type { 
  Perspective, 
  TaskTreeNode,
  PaginatedResponse 
} from '@/types'

// ========== Perspective APIs ==========

export interface CreatePerspectiveRequest {
  name: string
  description?: string
  filter_criteria?: Record<string, unknown>
  group_by?: 'none' | 'project' | 'tag' | 'due_date' | 'defer_date' | 'folder'
  sort_by?: string
  show_completed?: boolean
  show_dropped?: boolean
  show_future?: boolean
  view_mode?: 'list' | 'kanban' | 'calendar'
}

export interface UpdatePerspectiveRequest extends Partial<CreatePerspectiveRequest> {}

// Get all perspectives
export async function getPerspectives(
  params?: { page?: number; page_size?: number }
): Promise<PaginatedResponse<Perspective>> {
  const response = await apiClient.get<PaginatedResponse<Perspective>>(
    '/productivity/perspectives/',
    { params }
  )
  return response.data
}

// Get sidebar perspectives (built-in)
export async function getSidebarPerspectives(): Promise<Perspective[]> {
  const response = await apiClient.get<Perspective[]>('/productivity/perspectives/sidebar/')
  return response.data
}

// Get section perspectives (grouped)
export async function getSectionPerspectives(): Promise<Array<{
  section: string
  perspectives: Perspective[]
}>> {
  const response = await apiClient.get('/productivity/perspectives/sections/')
  return response.data
}

// Get single perspective
export async function getPerspective(id: string): Promise<Perspective> {
  const response = await apiClient.get<Perspective>(`/productivity/perspectives/${id}/`)
  return response.data
}

// Create perspective
export async function createPerspective(data: CreatePerspectiveRequest): Promise<Perspective> {
  const response = await apiClient.post<Perspective>('/productivity/perspectives/', data)
  return response.data
}

// Update perspective
export async function updatePerspective(
  id: string, 
  data: UpdatePerspectiveRequest
): Promise<Perspective> {
  const response = await apiClient.put<Perspective>(`/productivity/perspectives/${id}/`, data)
  return response.data
}

// Delete perspective
export async function deletePerspective(id: string): Promise<void> {
  await apiClient.delete(`/productivity/perspectives/${id}/`)
}

// Get perspective tasks
export async function getPerspectiveTasks(
  id: string,
  params?: { page?: number; page_size?: number }
): Promise<PaginatedResponse<TaskTreeNode>> {
  const response = await apiClient.get<PaginatedResponse<TaskTreeNode>>(
    `/productivity/perspectives/${id}/tasks/`,
    { params }
  )
  return response.data
}

// Get grouped perspective tasks
export async function getPerspectiveGrouped(
  id: string
): Promise<Array<{ group: string; tasks: TaskTreeNode[] }>> {
  const response = await apiClient.get(`/productivity/perspectives/${id}/grouped/`)
  return response.data
}

// Get group by choices
export async function getGroupByChoices(): Promise<Array<{ value: string; label: string }>> {
  const response = await apiClient.get('/productivity/perspectives/group-by-choices/')
  return response.data
}

// Get view mode choices
export async function getViewModeChoices(): Promise<Array<{ value: string; label: string }>> {
  const response = await apiClient.get('/productivity/perspectives/view-mode-choices/')
  return response.data
}
