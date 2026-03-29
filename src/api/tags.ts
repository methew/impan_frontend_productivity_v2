import apiClient from '@/lib/axios'
import type { Tag } from '@/types'

export async function getTags(): Promise<Tag[]> {
  const response = await apiClient.get('/tags/')
  const data = response.data
  if (Array.isArray(data)) {
    return data
  }
  if (data && Array.isArray(data.results)) {
    return data.results
  }
  return []
}

export async function getTag(id: string): Promise<Tag> {
  const response = await apiClient.get(`/tags/${id}/`)
  return response.data
}

export async function createTag(data: Partial<Tag>): Promise<Tag> {
  const response = await apiClient.post('/tags/', data)
  return response.data
}

export async function updateTag(id: string, data: Partial<Tag>): Promise<Tag> {
  const response = await apiClient.patch(`/tags/${id}/`, data)
  return response.data
}

export async function deleteTag(id: string): Promise<void> {
  await apiClient.delete(`/tags/${id}/`)
}
