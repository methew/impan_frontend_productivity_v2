import apiClient from '@/lib/axios'
import type { Location, LocationTreeNode, PaginatedResponse } from '@/types'

// ========== Location APIs (from Core module) ==========

// Get all locations
export async function getLocations(
  params?: {
    type?: string
    is_valid?: boolean
    search?: string
    page?: number
    page_size?: number
  }
): Promise<PaginatedResponse<Location>> {
  const response = await apiClient.get<PaginatedResponse<Location>>(
    '/core/locations/',
    { params }
  )
  return response.data
}

// Get location tree
export async function getLocationTree(
  params?: { type?: string }
): Promise<LocationTreeNode[]> {
  const response = await apiClient.get<LocationTreeNode[]>(
    '/core/locations/tree/',
    { params }
  )
  return response.data
}

// Get location by ID
export async function getLocation(id: number): Promise<Location> {
  const response = await apiClient.get<Location>(`/core/locations/${id}/`)
  return response.data
}

// Get location descendants
export async function getLocationDescendants(id: number): Promise<Location[]> {
  const response = await apiClient.get<Location[]>(
    `/core/locations/${id}/descendants/`
  )
  return response.data
}

// Get location ancestors
export async function getLocationAncestors(id: number): Promise<Location[]> {
  const response = await apiClient.get<Location[]>(
    `/core/locations/${id}/ancestors/`
  )
  return response.data
}

// Get locations by type
export async function getLocationsByType(
  type: string
): Promise<Location[]> {
  const response = await apiClient.get<Location[]>(
    '/core/locations/by_type/',
    { params: { type } }
  )
  return response.data
}

// Get location type choices
export async function getLocationTypeChoices(): Promise<
  Array<{ value: string; label: string }>
> {
  const response = await apiClient.get<Array<{ value: string; label: string }>>(
    '/core/locations/types/'
  )
  return response.data
}

// Create location
export interface CreateLocationRequest {
  type: string
  code: string
  abbreviation: string
  title: string
  title_zh?: string
  title_ja?: string
  address?: string
  position?: string
  parent?: number | null
  is_valid?: boolean
}

export async function createLocation(
  data: CreateLocationRequest
): Promise<Location> {
  const response = await apiClient.post<Location>('/core/locations/', data)
  return response.data
}

// Update location
export interface UpdateLocationRequest {
  type?: string
  code?: string
  abbreviation?: string
  title?: string
  title_zh?: string
  title_ja?: string
  address?: string
  position?: string
  parent?: number | null
  is_valid?: boolean
}

export async function updateLocation(
  id: number,
  data: UpdateLocationRequest
): Promise<Location> {
  const response = await apiClient.patch<Location>(`/core/locations/${id}/`, data)
  return response.data
}

// Delete location
export async function deleteLocation(id: number): Promise<void> {
  await apiClient.delete(`/core/locations/${id}/`)
}

// Move location
export async function moveLocation(
  id: number,
  parentId: number | null
): Promise<Location> {
  const response = await apiClient.post<Location>(
    `/core/locations/${id}/move/`,
    { parent: parentId }
  )
  return response.data
}
