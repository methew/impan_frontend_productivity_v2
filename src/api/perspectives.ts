import apiClient from '@/lib/axios'
import type { Perspective } from '@/types'

export async function getPerspectives(): Promise<Perspective[]> {
  const response = await apiClient.get('/perspectives/')
  const data = response.data
  if (Array.isArray(data)) {
    return data
  }
  if (data && Array.isArray(data.results)) {
    return data.results
  }
  return []
}

export async function getPerspective(id: string): Promise<Perspective> {
  const response = await apiClient.get(`/perspectives/${id}/`)
  return response.data
}

export async function createPerspective(data: Partial<Perspective>): Promise<Perspective> {
  const response = await apiClient.post('/perspectives/', data)
  return response.data
}

export async function updatePerspective(id: string, data: Partial<Perspective>): Promise<Perspective> {
  const response = await apiClient.patch(`/perspectives/${id}/`, data)
  return response.data
}

export async function deletePerspective(id: string): Promise<void> {
  await apiClient.delete(`/perspectives/${id}/`)
}
