import apiClient from '@/lib/axios'
import type { FocusMode } from '@/types'

// ========== Focus Mode APIs ==========

export interface CreateFocusModeRequest {
  name: string
  folders?: string[]
  projects?: string[]
  tag_ids?: number[]
}

export interface UpdateFocusModeRequest extends Partial<CreateFocusModeRequest> {}

// Get all focus modes
export async function getFocusModes(): Promise<FocusMode[]> {
  const response = await apiClient.get<FocusMode[]>('/productivity/focus-modes/')
  return response.data
}

// Get active focus mode
export async function getActiveFocusMode(): Promise<FocusMode | null> {
  const response = await apiClient.get<FocusMode | null>('/productivity/focus-modes/active/')
  return response.data
}

// Create focus mode
export async function createFocusMode(data: CreateFocusModeRequest): Promise<FocusMode> {
  const response = await apiClient.post<FocusMode>('/productivity/focus-modes/', data)
  return response.data
}

// Update focus mode
export async function updateFocusMode(
  id: string, 
  data: UpdateFocusModeRequest
): Promise<FocusMode> {
  const response = await apiClient.patch<FocusMode>(`/productivity/focus-modes/${id}/`, data)
  return response.data
}

// Delete focus mode
export async function deleteFocusMode(id: string): Promise<void> {
  await apiClient.delete(`/productivity/focus-modes/${id}/`)
}

// Activate focus mode
export async function activateFocusMode(id: string): Promise<FocusMode> {
  const response = await apiClient.post<FocusMode>(`/productivity/focus-modes/${id}/activate/`)
  return response.data
}

// Deactivate focus mode
export async function deactivateFocusMode(id: string): Promise<FocusMode> {
  const response = await apiClient.post<FocusMode>(`/productivity/focus-modes/${id}/deactivate/`)
  return response.data
}
