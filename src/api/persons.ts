import apiClient from '@/lib/axios'
import type { Person } from '@/types'

export interface CreatePersonRequest {
  type: string
  code: string
  abbreviation: string
  title: string
  title_zh?: string
  title_ja?: string
  parent?: number | null
  details?: Record<string, unknown>
  is_valid?: boolean
}

// Get all persons
export async function getPersons(params?: {
  type?: string
  search?: string
}): Promise<Person[]> {
  const response = await apiClient.get<Person[]>('/core/persons/', { params })
  return response.data || []
}

// Get single person
export async function getPerson(id: number): Promise<Person> {
  const response = await apiClient.get<Person>(`/core/persons/${id}/`)
  return response.data
}

// Create person
export async function createPerson(data: CreatePersonRequest): Promise<Person> {
  const response = await apiClient.post<Person>('/core/persons/', data)
  return response.data
}

// Update person
export async function updatePerson(id: number, data: Partial<Person>): Promise<Person> {
  const response = await apiClient.patch<Person>(`/core/persons/${id}/`, data)
  return response.data
}

// Delete person
export async function deletePerson(id: number): Promise<void> {
  await apiClient.delete(`/core/persons/${id}/`)
}
