import apiClient from '@/lib/axios'
import type { Project } from '@/types'

export async function getProjects(params?: {
  folder?: string
  status?: string
}): Promise<Project[]> {
  const response = await apiClient.get('/projects/', { params })
  const data = response.data
  if (Array.isArray(data)) {
    return data
  }
  if (data && Array.isArray(data.results)) {
    return data.results
  }
  return []
}

export async function getProject(id: string): Promise<Project> {
  const response = await apiClient.get(`/projects/${id}/`)
  return response.data
}

export async function createProject(data: Partial<Project>): Promise<Project> {
  const response = await apiClient.post('/projects/', data)
  return response.data
}

export async function updateProject(id: string, data: Partial<Project>): Promise<Project> {
  const response = await apiClient.patch(`/projects/${id}/`, data)
  return response.data
}

export async function deleteProject(id: string): Promise<void> {
  await apiClient.delete(`/projects/${id}/`)
}

export async function completeProject(id: string): Promise<void> {
  await apiClient.post(`/projects/${id}/complete/`)
}

export async function dropProject(id: string): Promise<void> {
  await apiClient.post(`/projects/${id}/drop/`)
}

export async function reviewProject(id: string): Promise<void> {
  await apiClient.post(`/projects/${id}/review/`)
}
