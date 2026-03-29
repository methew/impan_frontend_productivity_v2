import apiClient from '@/lib/axios'
import type { UserSettings } from '@/types'

export async function getSettings(): Promise<UserSettings> {
  const response = await apiClient.get('/settings/')
  return response.data
}

export async function updateSettings(data: Partial<UserSettings>): Promise<UserSettings> {
  const response = await apiClient.patch('/settings/', data)
  return response.data
}
