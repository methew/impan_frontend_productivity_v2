import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { 
  CoreSettings, 
  AccountingSettings, 
  LearningSettings, 
  ProductivitySettings,
  UserSettings,
  AppName
} from '@/types/settings'
import * as api from '@/api/settings'

const SETTINGS_KEY = 'settings'

// ========== Core Settings Hooks ==========

export function useCoreSettings() {
  return useQuery<CoreSettings>({
    queryKey: [SETTINGS_KEY, 'core'],
    queryFn: api.getCoreSettings,
  })
}

export function useUpdateCoreSettings() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: api.updateCoreSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SETTINGS_KEY, 'core'] })
      queryClient.invalidateQueries({ queryKey: [SETTINGS_KEY] })
    },
  })
}

export function useResetCoreSettings() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: api.resetCoreSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SETTINGS_KEY, 'core'] })
      queryClient.invalidateQueries({ queryKey: [SETTINGS_KEY] })
    },
  })
}

// ========== Accounting Settings Hooks ==========

export function useAccountingSettings() {
  return useQuery<AccountingSettings>({
    queryKey: [SETTINGS_KEY, 'accounting'],
    queryFn: api.getAccountingSettings,
  })
}

export function useUpdateAccountingSettings() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: api.updateAccountingSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SETTINGS_KEY, 'accounting'] })
      queryClient.invalidateQueries({ queryKey: [SETTINGS_KEY] })
    },
  })
}

export function useResetAccountingSettings() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: api.resetAccountingSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SETTINGS_KEY, 'accounting'] })
      queryClient.invalidateQueries({ queryKey: [SETTINGS_KEY] })
    },
  })
}

// ========== Learning Settings Hooks ==========

export function useLearningSettings() {
  return useQuery<LearningSettings>({
    queryKey: [SETTINGS_KEY, 'learning'],
    queryFn: api.getLearningSettings,
  })
}

export function useUpdateLearningSettings() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: api.updateLearningSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SETTINGS_KEY, 'learning'] })
      queryClient.invalidateQueries({ queryKey: [SETTINGS_KEY] })
    },
  })
}

export function useResetLearningSettings() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: api.resetLearningSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SETTINGS_KEY, 'learning'] })
      queryClient.invalidateQueries({ queryKey: [SETTINGS_KEY] })
    },
  })
}

// ========== Productivity Settings Hooks ==========

export function useProductivitySettings() {
  return useQuery<ProductivitySettings>({
    queryKey: [SETTINGS_KEY, 'productivity'],
    queryFn: api.getProductivitySettings,
  })
}

export function useUpdateProductivitySettings() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: api.updateProductivitySettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SETTINGS_KEY, 'productivity'] })
      queryClient.invalidateQueries({ queryKey: [SETTINGS_KEY] })
    },
  })
}

export function useResetProductivitySettings() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: api.resetProductivitySettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SETTINGS_KEY, 'productivity'] })
      queryClient.invalidateQueries({ queryKey: [SETTINGS_KEY] })
    },
  })
}

// ========== All Settings Hooks ==========

export function useAllSettings() {
  return useQuery<UserSettings>({
    queryKey: [SETTINGS_KEY],
    queryFn: api.getAllSettings,
  })
}

export function useUpdateAllSettings() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: api.updateAllSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SETTINGS_KEY] })
    },
  })
}

// ========== Generic Settings Hooks ==========

export function useSettings(app: AppName) {
  return useQuery<SettingsResponse['settings']>({
    queryKey: [SETTINGS_KEY, app],
    queryFn: () => api.getSettings(app).then(r => r.settings),
  })
}

export function useUpdateSettings(app: AppName) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (settings: Record<string, unknown>) => api.updateSettings(app, settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SETTINGS_KEY, app] })
      queryClient.invalidateQueries({ queryKey: [SETTINGS_KEY] })
    },
  })
}

export function useResetSettings(app: AppName) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: () => api.resetSettings(app),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SETTINGS_KEY, app] })
      queryClient.invalidateQueries({ queryKey: [SETTINGS_KEY] })
    },
  })
}

// ========== Helper Types ==========
import type { SettingsResponse } from '@/types/settings'
