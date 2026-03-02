// Productivity Application Types
// Based on 说明书/后端/03-Productivity-API.md

import type { Tag } from './core'

// ========== Folder ==========
export type FolderStatus = 'active' | 'dropped'

export interface Folder {
  id: string
  name: string
  note: string
  parent: string | null
  parent_name: string | null
  status: FolderStatus
  status_display: string
  sort_order: number
  level: number
  full_path: string
  created_at: string
  modified_at: string
}

export interface FolderTreeNode extends Folder {
  children: FolderTreeNode[]
}

// ========== Project ==========
export type ProjectType = 'sequential' | 'parallel' | 'single_action'
export type ProjectStatus = 'active' | 'on_hold' | 'dropped' | 'completed'

export interface Project {
  id: string
  title: string
  note: string
  project_type: ProjectType
  project_type_display: string
  status: ProjectStatus
  status_display: string
  folder: string | null
  folder_name: string | null
  flagged: boolean
  defer_date: string | null
  due_date: string | null
  completed_at: string | null
  dropped_at: string | null
  review_interval_days: number
  next_review_date: string | null
  completion_percentage: number
  tags: number[]
  tags_list: Array<{ id: number; name: string }>
  tags_detail: Tag[]
  // Location fields (optional, for future backend support)
  location?: number | null
  location_name?: string | null
  created_at: string
  modified_at: string
}

export interface ProjectTreeNode {
  node_type: 'project'
  id: string
  name: string
  note: string
  level: number
  has_children: boolean
  status: ProjectStatus
  status_display: string
  project_type: ProjectType
  project_type_display: string
  tasks_count: number
  completion_percentage: number
  flagged: boolean
  due_date: string | null
  folder_id: string | null
  folder_name: string | null
  // Location fields (optional, for future backend support)
  location_id?: number | null
  location_name?: string | null
  children: ProjectTreeNode[]
  created_at: string
  modified_at: string
}

// ========== Folder + Project Combined Tree ==========
export interface FolderProjectNode {
  node_type: 'folder' | 'project'
  id: string
  name: string
  note: string
  level: number
  has_children: boolean
  children: FolderProjectNode[]
  created_at: string
  modified_at: string
  // Folder specific
  status?: FolderStatus
  status_display?: string
  // Project specific
  project_type?: ProjectType
  project_type_display?: string
  tasks_count?: number
  completion_percentage?: number
  flagged?: boolean
  due_date?: string | null
  folder_id?: string | null
  folder_name?: string | null
}

export interface FolderProjectTreeResponse {
  nodes: FolderProjectNode[]
  total_folders: number
  total_projects: number
}

// ========== Task ==========
export type TaskType = 'inbox' | 'project_task' | 'action_group'
export type TaskStatus = 'active' | 'completed' | 'dropped'

export interface Task {
  id: string
  title: string
  note: string
  task_type: TaskType
  task_type_display: string
  project: string | null
  project_name: string | null
  parent: string | null
  parent_name: string | null
  flagged: boolean
  defer_date: string | null
  due_date: string | null
  planned_date: string | null  // ⭐ OmniFocus 4.7+ 新增
  estimated_duration: number | null
  recurrence_rule: string | null
  recurrence_rule_name: string | null
  level: number
  is_completed: boolean
  completed_at: string | null
  tags: number[]
  tags_list: Array<{ id: number; name: string }>
  tags_detail: Tag[]
  // Location fields (optional, for future backend support)
  location?: number | null
  location_name?: string | null
  created_at: string
  modified_at: string
}

export interface TaskTreeNode {
  id: string
  title: string
  status: TaskStatus
  flag: 'none' | 'flagged'
  due_date: string | null
  completed_at: string | null
  estimated_duration: number | null
  level: number
  children: TaskTreeNode[]
}

// ========== Task Filter Response ==========
export interface ProjectTaskFilterInfo {
  filter_type: 'project'
  project: {
    id: string
    title: string
    folder_id: string | null
    folder_name: string | null
  }
  tasks_count: number
  tasks?: TaskTreeNode[]
}

export interface FolderTaskFilterInfo {
  filter_type: 'folder'
  folder: {
    id: string
    name: string
    full_path: string
  }
  included_folders: Array<{ id: string; name: string }>
  projects_count: number
  tasks_count: number
  projects?: Array<{
    project: {
      id: string
      title: string
      completion_percentage: number
    }
    tasks?: TaskTreeNode[]
  }>
}

export type TaskFilterResponse = ProjectTaskFilterInfo | FolderTaskFilterInfo

// ========== Perspective ==========
export type GroupBy = 'none' | 'project' | 'tag' | 'due_date' | 'defer_date' | 'folder'
export type ViewMode = 'list' | 'kanban' | 'calendar'
export type BuiltInPerspectiveType = 'inbox' | 'flagged' | 'today' | 'upcoming' | 'completed' | 'all'

export interface Perspective {
  id: string
  name: string
  description: string
  built_in_type: BuiltInPerspectiveType | null
  is_custom: boolean
  filter_criteria: Record<string, unknown>
  group_by: GroupBy
  sort_by: string
  show_completed: boolean
  show_dropped: boolean
  show_future: boolean
  view_mode: ViewMode
  created_at: string
  modified_at: string
}

// ========== Focus Mode ==========
export interface FocusMode {
  id: string
  name: string
  folders: string[]
  projects: string[]
  tag_ids: number[]
  is_active: boolean
  created_at: string
  modified_at: string
}

// ========== Attachment ==========
export type AttachmentType = 'file' | 'image' | 'link' | 'note'

export interface Attachment {
  id: string
  name: string
  file: string | null
  file_url: string | null
  attachment_type: AttachmentType
  attachment_type_display: string
  task: string | null
  task_title: string | null
  project: string | null
  project_title: string | null
  file_size: number | null
  mime_type: string | null
  created_at: string
  modified_at: string
}

// ========== Tag Statistics ==========
export interface TagStatistics {
  tag_id: number
  tag_name: string
  tag_abbreviation: string
  tag_type: string
  task_count: number
  project_count: number
}

// ========== Project Statistics ==========
export interface ProjectStatistics {
  total_projects: number
  active_projects: number
  completed_projects: number
  on_hold_projects: number
  dropped_projects: number
  total_tasks: number
  completed_tasks: number
  completion_rate: number
}
