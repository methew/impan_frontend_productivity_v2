// Core Application Types
// Based on 说明书/后端/01-Core-API.md

// ========== Common ==========
export interface ChoiceItem {
  value: string
  label: string
}

export interface PaginatedResponse<T> {
  count: number
  results: T[]
}

// ========== Location ==========
export type LocationType = 
  | 'ASIA' 
  | 'EUROPE' 
  | 'AFRICA' 
  | 'NORTH_AMERICA' 
  | 'SOUTH_AMERICA' 
  | 'OCEANIA' 
  | 'ANTARCTICA' 
  | 'OTHER'

export interface Location {
  id: number
  type: LocationType
  type_display: string
  code: string
  abbreviation: string
  title: string
  title_zh: string
  title_ja: string
  details: Record<string, unknown>
  address: string
  position: string
  build_in: boolean
  is_valid: boolean
  parent: number | null
  parent_name: string | null
  abbreviated_path: string
  created_at: string
  updated_at: string
}

export interface LocationTreeNode extends Location {
  children: LocationTreeNode[]
}

// ========== Person ==========
export type PersonType = 'ARTIFICIAL' | 'INDIVIDUAL' | 'OTHER'

export interface Person {
  id: number
  type: PersonType
  type_display: string
  code: string
  abbreviation: string
  title: string
  title_zh: string
  title_ja: string
  details: Record<string, unknown>
  build_in: boolean
  is_valid: boolean
  parent: number | null
  parent_name: string | null
  abbreviated_path: string
  created_at: string
  updated_at: string
}

export interface PersonTreeNode extends Person {
  children: PersonTreeNode[]
}

// ========== Tag ==========
export type TagType = 'STATUS' | 'DATE' | 'THING' | 'OTHER'

export interface Tag {
  id: number
  type: TagType
  type_display: string
  code: string
  abbreviation: string
  title: string
  title_zh: string
  title_ja: string
  details: Record<string, unknown>
  build_in: boolean
  is_valid: boolean
  parent: number | null
  parent_name: string | null
  abbreviated_path: string
  created_at: string
  updated_at: string
}

// ========== Calendar System ==========
export type CalendarType = 'SOLAR' | 'LUNAR' | 'LUNISOLAR' | 'OTHER'

export interface CalendarSystem {
  id: number
  code: string
  calendar_type: CalendarType
  calendar_type_display: string
  title: string
  title_zh: string
  title_ja: string
  months_per_year: number
  has_leap_month: boolean
  leap_month_rule: string
  epoch_date: string
  short_week_days: string[]
  long_week_days: string[]
  month_names: string[]
  is_builtin: boolean
  is_active: boolean
  sort_order: number
}

// ========== Calendar Date ==========
export interface CalendarDate {
  id: number
  date: string
  system: number
  system_name: string
  system_code: string
  year_int: number
  year_short: string
  year_long: string
  year_in_cycle: number | null
  is_leap_month: boolean
  month_int: number
  month_short: string
  month_long: string
  day_int: number
  day_short: string
  day_long: string
  week_day: number
  week_day_name: string
  week_of_year: number
  date_int: number
  date_string: string
  is_holiday: boolean
  holiday_name: string
  is_workday: boolean
  description: string
  is_weekend: boolean
  display_name: string
}

// ========== TimeZone ==========
export interface TimeZone {
  id: string
  iana_name: string
  label: string
  standard_offset: string
  dst_offset: string
  uses_dst: boolean
  offset_display: string
  countries: Location[]
  note: string
  is_builtin: boolean
  is_active: boolean
}

// ========== Recurrence Rule ==========
export type CalendarTypeRecurrence = 'GREGORIAN' | 'LUNAR' | 'CUSTOM'
export type RecurrenceFreq = 
  | 'SECONDLY' 
  | 'MINUTELY' 
  | 'HOURLY' 
  | 'DAILY' 
  | 'WEEKLY' 
  | 'MONTHLY' 
  | 'YEARLY'

export interface RecurrenceRule {
  id: string
  name: string
  calendar_type: CalendarTypeRecurrence
  calendar_system: number | null
  freq: RecurrenceFreq
  interval: number
  dtstart: string
  until: string | null
  count: number | null
  // Gregorian rules
  byday: string[] | null
  bymonthday: number[] | null
  bymonth: number[] | null
  // Lunar rules
  bylunarmonth: number[] | null
  bylunarday: number[] | null
  bylunarterm: string[] | null
  byzodiac: string[] | null
  include_leap_month: boolean
  timezone_str: string
  is_active: boolean
  total_generated: number
  next_scheduled_at: string | null
}
