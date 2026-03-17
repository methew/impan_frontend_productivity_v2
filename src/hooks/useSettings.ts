import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query'
import * as settingsApi from '@/api/settings'
import type { UserSettings } from '@/types'

const SETTINGS_STORAGE_KEY = 'user_settings'
const QUERY_KEY = ['settings']

// Load settings from localStorage for offline access
function loadSettingsFromStorage(): UserSettings | null {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {
    // Ignore localStorage errors
  }
  return null
}

// Save settings to localStorage
function saveSettingsToStorage(settings: UserSettings) {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Ignore localStorage errors
  }
}

// Default settings (reserved for future use)
// const defaultSettings: Partial<UserSettings> = {
//   default_perspective: 'inbox',
//   today_start_hour: 0,
//   week_start_day: 0, // Sunday
//   default_review_interval: 7,
//   show_completed_items: false,
//   show_dropped_items: false,
//   default_project_type: 'parallel',
//   task_default_duration: 30,
//   morning_start_time: '06:00',
//   evening_start_time: '18:00',
// }

// ===== Queries =====

export function useSettings(options?: Omit<UseQueryOptions<UserSettings, Error>, 'queryKey' | 'queryFn'>) {
  // queryClient reserved for future use (e.g., optimistic updates)
  useQueryClient() // call to satisfy import, result not used currently

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      try {
        const settings = await settingsApi.getSettings()
        // Save to localStorage for offline access
        saveSettingsToStorage(settings)
        return settings
      } catch (error) {
        // If API fails, try to load from localStorage
        const stored = loadSettingsFromStorage()
        if (stored) {
          return stored
        }
        throw error
      }
    },
    // Use cached data from localStorage as initial data
    initialData: () => {
      return loadSettingsFromStorage() || undefined
    },
    ...options,
  })

  return {
    settings: query.data,
    isLoading: query.isLoading,
    error: query.error,
    isError: query.isError,
    refetch: query.refetch,
  }
}

// ===== Mutations =====

export function useUpdateSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Partial<UserSettings>) => {
      const updated = await settingsApi.updateSettings(data)
      return updated
    },
    onSuccess: (data) => {
      // Update cache
      queryClient.setQueryData(QUERY_KEY, data)
      // Update localStorage
      saveSettingsToStorage(data)
    },
  })
}

export default useSettings
