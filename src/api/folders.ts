import apiClient from '@/lib/axios'
import type { Folder } from '@/types'

export async function getFolders(): Promise<Folder[]> {
  const response = await apiClient.get('/folders/')
  // Handle both array and paginated response ({ results: [...] })
  const data = response.data
  if (Array.isArray(data)) {
    return data
  }
  if (data && Array.isArray(data.results)) {
    return data.results
  }
  return []
}

export async function getFolder(id: string): Promise<Folder> {
  const response = await apiClient.get(`/folders/${id}/`)
  return response.data
}

export async function createFolder(data: Partial<Folder>): Promise<Folder> {
  const response = await apiClient.post('/folders/', data)
  return response.data
}

export async function updateFolder(id: string, data: Partial<Folder>): Promise<Folder> {
  const response = await apiClient.patch(`/folders/${id}/`, data)
  return response.data
}

export async function deleteFolder(id: string): Promise<void> {
  await apiClient.delete(`/folders/${id}/`)
}
