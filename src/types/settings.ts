/**
 * User Settings Types
 * 用户设置类型定义
 */

// ========== Core Settings ==========
export interface CoreSettings {
  theme: 'light' | 'dark' | 'system'
  language: 'zh' | 'en' | 'ja'
  timezone: string
  date_format: string
  time_format: '12h' | '24h'
  sidebar_collapsed: boolean
  notifications_enabled: boolean
}

// ========== Accounting Settings ==========
export interface AccountingSettings {
  default_ledger_id: number | null
  default_fiscal_year_id: number | null
  default_period_id: number | null
  currency_display: 'symbol' | 'code' | 'name'
  number_format: 'comma_dot' | 'dot_comma' | 'space_dot'
  decimal_places: number
  show_cents: boolean
  items_per_page: number
}

// ========== Learning Settings ==========
export interface LearningSettings {
  daily_goal_minutes: number
  daily_goal_cards: number
  reminder_time: string
  reminder_enabled: boolean
  auto_play_audio: boolean
  show_answer_timer: boolean
  default_deck_id: number | null
  review_order: 'random' | 'due_date' | 'created'
  cards_per_session: number
}

// ========== Productivity Settings ==========
export interface ProductivitySettings {
  pomodoro_duration: number
  short_break_duration: number
  long_break_duration: number
  pomodoros_until_long_break: number
  auto_start_breaks: boolean
  auto_start_pomodoros: boolean
  sound_enabled: boolean
  default_view: 'list' | 'board' | 'calendar'
  default_task_filter: 'all' | 'today' | 'upcoming' | 'completed'
  work_start_time: string
  work_end_time: string
  working_days: number[]
}

// ========== All Settings ==========
export interface UserSettings {
  core: CoreSettings
  accounting: AccountingSettings
  learning: LearningSettings
  productivity: ProductivitySettings
  updated_at: string
}

// ========== API Request/Response Types ==========
export interface UpdateSettingsRequest {
  app: AppName
  settings: Partial<CoreSettings | AccountingSettings | LearningSettings | ProductivitySettings>
}

export interface SettingsResponse {
  app: AppName
  settings: CoreSettings | AccountingSettings | LearningSettings | ProductivitySettings
  updated_at: string
}

export type AppName = 'core' | 'accounting' | 'learning' | 'productivity'

// ========== Default Values ==========
export const DEFAULT_CORE_SETTINGS: CoreSettings = {
  theme: 'light',
  language: 'zh',
  timezone: 'Asia/Shanghai',
  date_format: 'YYYY-MM-DD',
  time_format: '24h',
  sidebar_collapsed: false,
  notifications_enabled: true,
}

export const DEFAULT_ACCOUNTING_SETTINGS: AccountingSettings = {
  default_ledger_id: null,
  default_fiscal_year_id: null,
  default_period_id: null,
  currency_display: 'symbol',
  number_format: 'comma_dot',
  decimal_places: 2,
  show_cents: true,
  items_per_page: 20,
}

export const DEFAULT_LEARNING_SETTINGS: LearningSettings = {
  daily_goal_minutes: 30,
  daily_goal_cards: 10,
  reminder_time: '09:00',
  reminder_enabled: true,
  auto_play_audio: true,
  show_answer_timer: true,
  default_deck_id: null,
  review_order: 'random',
  cards_per_session: 20,
}

export const DEFAULT_PRODUCTIVITY_SETTINGS: ProductivitySettings = {
  pomodoro_duration: 25,
  short_break_duration: 5,
  long_break_duration: 15,
  pomodoros_until_long_break: 4,
  auto_start_breaks: false,
  auto_start_pomodoros: false,
  sound_enabled: true,
  default_view: 'list',
  default_task_filter: 'all',
  work_start_time: '09:00',
  work_end_time: '17:00',
  working_days: [1, 2, 3, 4, 5],
}
