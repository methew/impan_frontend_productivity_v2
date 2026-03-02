import apiClient from '@/lib/axios'
import type { 
  Folder, 
  FolderTreeNode, 
  FolderProjectTreeResponse,
  PaginatedResponse 
} from '@/types'

// ========== Folder APIs ==========

export interface CreateFolderRequest {
  name: string
  note?: string
  parent?: string | null
  status?: 'active' | 'dropped'
  sort_order?: number
}

export interface UpdateFolderRequest extends Partial<CreateFolderRequest> {}

export interface MoveFolderRequest {
  parent_id: string | null
}

// Get all folders (paginated)
export async function getFolders(
  params?: {
    status?: string
    parent?: string | null
    ordering?: string
    page?: number
    page_size?: number
  }
): Promise<PaginatedResponse<Folder>> {
  const response = await apiClient.get<PaginatedResponse<Folder>>(
    '/productivity/folders/',
    { params }
  )
  return response.data
}

// Get folder tree
export async function getFolderTree(): Promise<FolderTreeNode[]> {
  const response = await apiClient.get<FolderTreeNode[]>('/productivity/folders/tree/')
  return response.data
}

// Get single folder
export async function getFolder(id: string): Promise<Folder> {
  const response = await apiClient.get<Folder>(`/productivity/folders/${id}/`)
  return response.data
}

// Create folder
export async function createFolder(data: CreateFolderRequest): Promise<Folder> {
  const response = await apiClient.post<Folder>('/productivity/folders/', data)
  return response.data
}

// Update folder
export async function updateFolder(id: string, data: UpdateFolderRequest): Promise<Folder> {
  const response = await apiClient.patch<Folder>(`/productivity/folders/${id}/`, data)
  return response.data
}

// Delete folder
export async function deleteFolder(id: string): Promise<void> {
  await apiClient.delete(`/productivity/folders/${id}/`)
}

// Move folder
export async function moveFolder(id: string, parentId: string | null): Promise<Folder> {
  const response = await apiClient.post<Folder>(
    `/productivity/folders/${id}/move/`,
    { parent_id: parentId }
  )
  return response.data
}

// Get folder descendants
export async function getFolderDescendants(id: string): Promise<Folder[]> {
  const response = await apiClient.get<Folder[]>(`/productivity/folders/${id}/descendants/`)
  return response.data
}

// Get folder ancestors
export async function getFolderAncestors(id: string): Promise<Folder[]> {
  const response = await apiClient.get<Folder[]>(`/productivity/folders/${id}/ancestors/`)
  return response.data
}

// Get folder projects
export async function getFolderProjects(
  id: string,
  params?: { page?: number; page_size?: number }
): Promise<PaginatedResponse<Folder>> {
  const response = await apiClient.get<PaginatedResponse<Folder>>(
    `/productivity/folders/${id}/projects/`,
    { params }
  )
  return response.data
}

// Get folder + project combined tree
export async function getFolderProjectTree(
  params?: {
    include_projects?: boolean
    include_stats?: boolean
  }
): Promise<FolderProjectTreeResponse> {
  const response = await apiClient.get<FolderProjectTreeResponse>(
    '/productivity/folders/project_tree/',
    { params }
  )
  return response.data
}

// Get folder status choices
export async function getFolderStatusChoices(): Promise<Array<{ value: string; label: string }>> {
  const response = await apiClient.get('/productivity/folders/status-choices/')
  return response.data
}
