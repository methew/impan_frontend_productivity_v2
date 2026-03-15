/**
 * Productivity App Types
 * OmniFocus-inspired Task Management
 */

// ============================================================================
// Enums / Choices
// ============================================================================

export type FolderStatus = 'active' | 'dropped'

export type ProjectType = 'sequential' | 'parallel' | 'single_action'

export type ProjectStatus = 'active' | 'on_hold' | 'dropped' | 'completed'

export type TaskType = 'inbox' | 'project_task' | 'action_group'

export type ActionGroupType = 'parallel' | 'sequential'

export type RepeatType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'

export type RepeatFrom = 'completion' | 'due_date' | 'defer_date'

export type PerspectiveBuiltInType = 
  | 'inbox' 
  | 'projects' 
  | 'tags' 
  | 'forecast' 
  | 'flagged' 
  | 'review' 
  | 'completed' 
  | 'custom'

export type PerspectiveGroupBy = 
  | 'none' 
  | 'project' 
  | 'tag' 
  | 'due_date' 
  | 'defer_date' 
  | 'folder'

export type PerspectiveSortBy = 
  | 'due_date' 
  | 'defer_date' 
  | 'created' 
  | 'modified' 
  | 'title' 
  | 'flagged'

export type PerspectiveViewMode = 'list' | 'kanban' | 'calendar'

export type AttachmentType = 'file' | 'image' | 'link' | 'audio'

// ============================================================================
// Base Interfaces
// ============================================================================

export interface BaseItem {
  id: string
  title: string
  note?: string
  flagged: boolean
  is_important: boolean
  is_urgent: boolean
  defer_date?: string | null
  due_date?: string | null
  completed_at?: string | null
  dropped_at?: string | null
  created_at: string
  modified_at: string
  sort_order: number
}

export interface Quadrant {
  id: number
  name: string
  action: string
}

// ============================================================================
// Folder
// ============================================================================

export interface Folder {
  id: string
  name: string
  abbreviation?: string
  note?: string
  status: FolderStatus
  parent?: string
  children?: Folder[]
  projects?: Project[]
  sort_order: number
  created_at: string
  modified_at: string
  full_path?: string
}

// ============================================================================
// Project
// ============================================================================

export interface Project extends BaseItem {
  project_type: ProjectType
  status: ProjectStatus
  folder?: string
  folder_name?: string
  folder_path?: string
  review_interval_days: number
  last_reviewed_at?: string
  next_review_at?: string
  complete_with_last_action: boolean
  completion_percentage: number
  tasks?: Task[]
}

// ============================================================================
// Task
// ============================================================================

export interface Task extends BaseItem {
  abbreviation?: string
  task_type: TaskType
  action_group_type?: ActionGroupType
  project?: string
  project_title?: string
  parent?: string
  children?: Task[]
  estimated_duration?: number
  repeat_rule?: string
  original_task?: string
  level?: number
  tags?: Tag[]
}

export interface TaskTree extends Task {
  children: TaskTree[]
}

// ============================================================================
// Tag (from core app)
// ============================================================================

export interface Tag {
  id: string
  name: string
  color?: string
  user: string
  parent?: string
  children?: Tag[]
  is_valid: boolean
  created_at: string
  modified_at: string
}

export interface TaskTag {
  id: string
  task: string
  tag: Tag
}

// ============================================================================
// Repeat Rule
// ============================================================================

export interface RepeatRule {
  id: string
  repeat_type: RepeatType
  interval: number
  repeat_from: RepeatFrom
  week_days?: number[]
  month_day?: number
  end_date?: string
  max_occurrences?: number
}

// ============================================================================
// Attachment
// ============================================================================

export interface Attachment {
  id: string
  attachment_type: AttachmentType
  file_name?: string
  file_path?: string
  url?: string
  file_size?: number
  mime_type?: string
  content_object_type: string
  content_object_id: string
  uploaded_at: string
}

// ============================================================================
// Perspective
// ============================================================================

export interface Perspective {
  id: string
  name: string
  icon?: string
  built_in_type: PerspectiveBuiltInType
  is_builtin: boolean
  section: string
  
  // Filters
  filter_status?: ProjectStatus[]
  filter_project_type?: ProjectType[]
  filter_task_type?: TaskType[]
  filter_folder?: string[]
  filter_tag?: string[]
  filter_flagged?: boolean | null
  filter_available?: boolean
  
  // Display
  group_by: PerspectiveGroupBy
  sort_by: PerspectiveSortBy
  sort_ascending: boolean
  view_mode: PerspectiveViewMode
  columns: string[]
  
  created_at: string
  modified_at: string
}

// ============================================================================
// Focus Mode
// ============================================================================

export interface FocusMode {
  id: string
  name: string
  is_active: boolean
  selected_folders: string[]
  selected_projects: string[]
  selected_tags: string[]
  exclude_folders: string[]
  exclude_projects: string[]
  exclude_tags: string[]
  created_at: string
  modified_at: string
}

// ============================================================================
// User Settings
// ============================================================================

export interface UserSettings {
  id: string
  default_perspective: string
  today_start_hour: number
  week_start_day: number
  default_review_interval: number
  show_completed_items: boolean
  show_dropped_items: boolean
  default_project_type: ProjectType
  inbox_project_id?: string
  task_default_duration?: number
  morning_start_time: string
  evening_start_time: string
}

// ============================================================================
// API Response Types
// ============================================================================

export interface TasksByProjectTreeResponse {
  filter_type: 'project' | 'folder'
  project?: {
    id: string
    title: string
    folder_id?: string
    folder_name?: string
  }
  folder?: {
    id: string
    name: string
    full_path: string
  }
  included_folders?: { id: string; name: string }[]
  projects_count?: number
  tasks_count: number
  tasks?: Task[]
  projects?: {
    project: {
      id: string
      title: string
      completion_percentage: number
    }
    tasks: TaskTree[]
  }[]
}

export interface TasksByTagResponse {
  tag: Tag
  tasks: Task[]
}

// ============================================================================
// UI Types
// ============================================================================

export type SidebarView = 
  | 'inbox' 
  | 'projects' 
  | 'tags' 
  | 'forecast' 
  | 'review' 
  | 'flagged'
  | 'completed'

export interface ViewState {
  selectedPerspective: string
  selectedFolder?: string
  selectedProject?: string
  selectedTag?: string
  selectedDate?: Date
  searchQuery: string
  showCompleted: boolean
  showDropped: boolean
  groupBy: PerspectiveGroupBy
  sortBy: PerspectiveSortBy
}

// ============================================================================
// Helper Types
// ============================================================================

export interface DragItem {
  id: string
  type: 'folder' | 'project' | 'task'
  data: Folder | Project | Task
}

export interface DateRange {
  start: Date
  end: Date
}

export interface CompletionStats {
  total: number
  completed: number
  percentage: number
}
