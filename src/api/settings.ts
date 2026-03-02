import apiClient from '@/lib/axios'
import type { 
  UserSettings, 
  SettingsResponse, 
  UpdateSettingsRequest,
  CoreSettings,
  AccountingSettings,
  LearningSettings,
  ProductivitySettings,
  AppName
} from '@/types/settings'

// ========== Core Settings API ==========

export async function getCoreSettings(): Promise<CoreSettings> {
  const response = await apiClient.get<SettingsResponse>('/core/settings/core/')
  return response.data.settings as CoreSettings
}

export async function updateCoreSettings(settings: Partial<CoreSettings>): Promise<CoreSettings> {
  const response = await apiClient.patch<SettingsResponse>('/core/settings/core/', {
    settings
  })
  return response.data.settings as CoreSettings
}

export async function resetCoreSettings(): Promise<CoreSettings> {
  const response = await apiClient.delete<SettingsResponse>('/core/settings/core/')
  return response.data.settings as CoreSettings
}

// ========== Accounting Settings API ==========

export async function getAccountingSettings(): Promise<AccountingSettings> {
  const response = await apiClient.get<SettingsResponse>('/core/settings/accounting/')
  return response.data.settings as AccountingSettings
}

export async function updateAccountingSettings(settings: Partial<AccountingSettings>): Promise<AccountingSettings> {
  const response = await apiClient.patch<SettingsResponse>('/core/settings/accounting/', {
    settings
  })
  return response.data.settings as AccountingSettings
}

export async function resetAccountingSettings(): Promise<AccountingSettings> {
  const response = await apiClient.delete<SettingsResponse>('/core/settings/accounting/')
  return response.data.settings as AccountingSettings
}

// ========== Learning Settings API ==========

export async function getLearningSettings(): Promise<LearningSettings> {
  const response = await apiClient.get<SettingsResponse>('/core/settings/learning/')
  return response.data.settings as LearningSettings
}

export async function updateLearningSettings(settings: Partial<LearningSettings>): Promise<LearningSettings> {
  const response = await apiClient.patch<SettingsResponse>('/core/settings/learning/', {
    settings
  })
  return response.data.settings as LearningSettings
}

export async function resetLearningSettings(): Promise<LearningSettings> {
  const response = await apiClient.delete<SettingsResponse>('/core/settings/learning/')
  return response.data.settings as LearningSettings
}

// ========== Productivity Settings API ==========

export async function getProductivitySettings(): Promise<ProductivitySettings> {
  const response = await apiClient.get<SettingsResponse>('/core/settings/productivity/')
  return response.data.settings as ProductivitySettings
}

export async function updateProductivitySettings(settings: Partial<ProductivitySettings>): Promise<ProductivitySettings> {
  const response = await apiClient.patch<SettingsResponse>('/core/settings/productivity/', {
    settings
  })
  return response.data.settings as ProductivitySettings
}

export async function resetProductivitySettings(): Promise<ProductivitySettings> {
  const response = await apiClient.delete<SettingsResponse>('/core/settings/productivity/')
  return response.data.settings as ProductivitySettings
}

// ========== All Settings API ==========

export async function getAllSettings(): Promise<UserSettings> {
  const response = await apiClient.get<UserSettings>('/core/settings/')
  return response.data
}

export async function updateAllSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
  const response = await apiClient.patch<UserSettings>('/core/settings/', settings)
  return response.data
}

// ========== Generic Settings API ==========

export async function getSettings(app: AppName): Promise<SettingsResponse> {
  const response = await apiClient.get<SettingsResponse>(`/core/settings/${app}/`)
  return response.data
}

export async function updateSettings(app: AppName, settings: Record<string, unknown>): Promise<SettingsResponse> {
  const response = await apiClient.patch<SettingsResponse>(`/core/settings/${app}/`, {
    settings
  })
  return response.data
}

export async function resetSettings(app: AppName): Promise<SettingsResponse> {
  const response = await apiClient.delete<SettingsResponse>(`/core/settings/${app}/`)
  return response.data
}
