/**
 * OmniFocus 4.8.5-style Inspector Panel - Using Sheet
 * Based on: https://support.omnigroup.com/documentation/omnifocus/universal/4.8.5/en/inspector
 */
import React, { useState, useEffect } from 'react'
import {
  Calendar, Flag, Clock, Paperclip, CheckCircle2,
  ChevronLeft, ChevronRight, Share2, FolderInput,
  Repeat,
  X
} from 'lucide-react'
import { Button } from '@/packages/ui/components/button'
import { Input } from '@/packages/ui/components/input'
import { Label } from '@/packages/ui/components/label'
import { Textarea } from '@/packages/ui/components/textarea'
import { Badge } from '@/packages/ui/components/badge'
import { Switch } from '@/packages/ui/components/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/packages/ui/components/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/packages/ui/components/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/packages/ui/components/popover'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/packages/ui/components/sheet'
import { Calendar as CalendarComponent } from '@/packages/ui/components/calendar'
import { format, parseISO } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { cn } from '@/packages/ui/lib/utils'

// Types - should be defined locally or imported from a shared types package
interface Tag {
  id: string
  name: string
  color?: string
}

type ProjectType = 'sequential' | 'parallel' | 'single_action'
type TaskType = 'inbox' | 'project_task' | 'action_group'
type ProjectStatus = 'active' | 'on_hold' | 'dropped' | 'completed'
type FolderStatus = 'active' | 'dropped'

interface BaseItem {
  id: string
  title: string
  note?: string
  flagged: boolean
  sort_order: number
  created_at: string
  modified_at: string
  due_date?: string | null
  defer_date?: string | null
  completed_at?: string | null
  dropped_at?: string | null
  is_important?: boolean
  is_urgent?: boolean
}

interface Task extends BaseItem {
  task_type: TaskType
  action_group_type?: 'parallel' | 'sequential'
  project?: string
  parent?: string
  estimated_duration?: number
  abbreviation?: string
  tags?: Tag[]
}

interface Project extends BaseItem {
  project_type: ProjectType
  status: ProjectStatus
  folder?: string
  folder_name?: string
  folder_path?: string
  review_interval_days: number
  complete_with_last_action: boolean
  completion_percentage: number
}

interface FolderType {
  id: string
  name: string
  full_path?: string
  abbreviation?: string
  note?: string
  status: FolderStatus
  parent?: string
  sort_order: number
  created_at: string
  modified_at: string
}

// ============================================================================
// Types
// ============================================================================

export type InspectorItemType = 'task' | 'project' | 'folder'
export type InspectorItem = Task | Project | FolderType

interface InspectorProps {
  item: Task | Project | FolderType | null
  type: InspectorItemType
  isOpen?: boolean
  onClose: () => void
  onUpdate: (data: Partial<Task | Project | FolderType>) => void
  onNavigate?: (direction: 'prev' | 'next') => void
  onConvert?: (targetType: 'task' | 'project' | 'folder') => void
  onSave?: () => void
  projects?: Project[]
  folders?: FolderType[]
  tags?: Tag[]
  tasks?: Task[]
}

// ============================================================================
// Helper Functions
// ============================================================================

function isTask(item: Task | Project | FolderType | null): item is Task {
  return item !== null && 'task_type' in item
}

function isProject(item: Task | Project | FolderType | null): item is Project {
  return item !== null && 'project_type' in item
}

function isFolder(item: Task | Project | FolderType | null): item is FolderType {
  return item !== null && !('task_type' in item) && !('project_type' in item)
}

// ============================================================================
// Main Inspector Component
// ============================================================================

export function Inspector({
  item,
  type,
  isOpen,
  onClose,
  onUpdate,
  onNavigate,
  onConvert,
  onSave,
  projects = [],
  folders = [],
  tags = [],
  tasks = []
}: InspectorProps) {
  const [formData, setFormData] = useState<Partial<Task | Project | FolderType>>({})
  // const [isOpen, setIsOpen] = useState<boolean>(false)

  useEffect(() => {
    if (item) {
      setFormData({ ...item })
    }
  }, [item])

  const handleUpdate = (updates: Partial<Task | Project | FolderType>) => {
    setFormData(prev => ({ ...prev, ...updates }))
    onUpdate(updates)
  }



  // Get item type label
  const getTypeLabel = () => {
    switch (type) {
      case 'task': return '动作'
      case 'project': return '项目'
      case 'folder': return '文件夹'
      default: return ''
    }
  }

  // Determine if sheet should be open - use isOpen prop if provided, otherwise fall back to item existence
  const sheetOpen = isOpen !== undefined ? isOpen : !!item

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose()
    }
  }

  return (
    <Sheet open={sheetOpen} onOpenChange={handleOpenChange}>
      <SheetContent showCloseButton={false} className="w-[400px] sm:w-[450px] p-0 flex flex-col overflow-hidden">
        {item ? (
          <>
            {/* Header */}
            <SheetHeader className="px-4 py-3 border-b space-y-0 flex-shrink-0">
              <div className="flex items-center ">
                <div className="flex items-center gap-1">
                  {onNavigate && (
                    <>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onNavigate('prev')}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onNavigate('next')}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
                <SheetTitle className="text-sm font-medium m-0">
                  {getTypeLabel()}
                </SheetTitle>

                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </SheetHeader>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Title/Name Section */}
              <InspectorSection title={isFolder(item) ? '名称' : '标题'} defaultOpen>
                {isFolder(item) ? (
                  <Input
                    value={(formData as FolderType).name || ''}
                    onChange={(e) => handleUpdate({ name: e.target.value })}
                    className="text-sm"
                    placeholder="文件夹名称"
                  />
                ) : (
                  <Textarea
                    value={(formData as Task | Project).title || ''}
                    onChange={(e) => handleUpdate({ title: e.target.value })}
                    className="min-h-[60px] resize-none text-sm"
                    placeholder={isTask(item) ? '动作标题' : '项目标题'}
                  />
                )}
              </InspectorSection>

              {/* Folder-specific fields */}
              {isFolder(item) && (
                <>
                  <InspectorSection title="简称" defaultOpen={false}>
                    <Input
                      value={(formData as FolderType).abbreviation || ''}
                      onChange={(e) => handleUpdate({ abbreviation: e.target.value })}
                      className="text-sm"
                      placeholder="简称"
                    />
                  </InspectorSection>

                  <InspectorSection title="状态" defaultOpen>
                    <Select
                      value={(formData as FolderType).status || 'active'}
                      onValueChange={(value) => handleUpdate({ status: value as any })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">活跃</SelectItem>
                        <SelectItem value="dropped">已丢弃</SelectItem>
                      </SelectContent>
                    </Select>
                  </InspectorSection>

                  <InspectorSection title="父文件夹" defaultOpen={false}>
                    <Select
                      value={(formData as FolderType).parent || '__none__'}
                      onValueChange={(value) => handleUpdate({ parent: value === '__none__' ? undefined : value })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="选择父文件夹..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">无（顶级文件夹）</SelectItem>
                        {folders.filter(f => f.id !== item.id).map(f => (
                          <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </InspectorSection>
                </>
              )}

              {/* Project/Task common fields */}
              {(isProject(item) || isTask(item)) && (
                <>
                  {/* Status */}
                  <InspectorSection title="状态" defaultOpen>
                    <div className="space-y-3">
                      {/* Status */}
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">状态</Label>
                        <Select
                          value={(formData as any).status || 'active'}
                          onValueChange={(value) => handleUpdate({ status: value as any })}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">活跃</SelectItem>
                            {isProject(item) && <SelectItem value="on_hold">暂停</SelectItem>}
                            <SelectItem value="completed">已完成</SelectItem>
                            <SelectItem value="dropped">已丢弃</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Project Type (projects only) */}
                      {isProject(item) && (
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">类型</Label>
                          <Select
                            value={(formData as Project).project_type || 'parallel'}
                            onValueChange={(value) => handleUpdate({ project_type: value as ProjectType })}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sequential">顺序型</SelectItem>
                              <SelectItem value="parallel">并行型</SelectItem>
                              <SelectItem value="single_action">单动作列表</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Task Type (tasks only) */}
                      {isTask(item) && (
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">任务类型</Label>
                          <Select
                            value={(formData as Task).task_type || 'project_task'}
                            onValueChange={(value) => handleUpdate({ task_type: value as any })}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="inbox">收件箱</SelectItem>
                              <SelectItem value="project_task">项目任务</SelectItem>
                              <SelectItem value="action_group">动作组</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Status Section - Group Button Style */}
                      <div className="space-y-1.5 pt-2 border-t">
                        <Label className="text-xs text-muted-foreground">状态</Label>
                        
                        {/* Task/Action Group Status - Group Button */}
                        {isTask(item) && (
                          <div className="flex rounded-lg border overflow-hidden">
                            {[
                              { value: 'active', label: '活跃', color: 'bg-green-500' },
                              { value: 'completed', label: '已完成', color: 'bg-green-600' },
                              { value: 'dropped', label: '已丢弃', color: 'bg-gray-400' },
                            ].map((option) => {
                              const task = formData as Task
                              const currentStatus = task.dropped_at ? 'dropped' : task.completed_at ? 'completed' : 'active'
                              const isActive = currentStatus === option.value
                              return (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() => {
                                    if (option.value === 'active') {
                                      handleUpdate({ completed_at: null, dropped_at: null })
                                    } else if (option.value === 'completed') {
                                      handleUpdate({ completed_at: new Date().toISOString(), dropped_at: null })
                                    } else if (option.value === 'dropped') {
                                      handleUpdate({ completed_at: null, dropped_at: new Date().toISOString() })
                                    }
                                  }}
                                  className={cn(
                                    "flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors",
                                    isActive 
                                      ? "bg-primary text-primary-foreground" 
                                      : "bg-background hover:bg-muted text-muted-foreground"
                                  )}
                                >
                                  <span className={cn("w-2 h-2 rounded-full", option.color)} />
                                  {option.label}
                                </button>
                              )
                            })}
                          </div>
                        )}

                        {/* Project Status - Group Button */}
                        {isProject(item) && (
                          <div className="flex rounded-lg border overflow-hidden">
                            {[
                              { value: 'active', label: '活跃', color: 'bg-green-500' },
                              { value: 'on_hold', label: '暂停', color: 'bg-yellow-500' },
                              { value: 'completed', label: '已完成', color: 'bg-green-600' },
                              { value: 'dropped', label: '已丢弃', color: 'bg-gray-400' },
                            ].map((option) => {
                              const project = formData as Project
                              const isActive = (project.status || 'active') === option.value
                              return (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() => handleUpdate({ status: option.value as ProjectStatus })}
                                  className={cn(
                                    "flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors",
                                    isActive 
                                      ? "bg-primary text-primary-foreground" 
                                      : "bg-background hover:bg-muted text-muted-foreground"
                                  )}
                                >
                                  <span className={cn("w-2 h-2 rounded-full", option.color)} />
                                  {option.label}
                                </button>
                              )
                            })}
                          </div>
                        )}

                        {/* Folder Status - Group Button */}
                        {isFolder(item) && (
                          <div className="flex rounded-lg border overflow-hidden">
                            {[
                              { value: 'active', label: '活跃', color: 'bg-green-500' },
                              { value: 'dropped', label: '已丢弃', color: 'bg-gray-400' },
                            ].map((option) => {
                              const folder = formData as FolderType
                              const isActive = (folder.status || 'active') === option.value
                              return (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() => handleUpdate({ status: option.value as FolderStatus })}
                                  className={cn(
                                    "flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors",
                                    isActive 
                                      ? "bg-primary text-primary-foreground" 
                                      : "bg-background hover:bg-muted text-muted-foreground"
                                  )}
                                >
                                  <span className={cn("w-2 h-2 rounded-full", option.color)} />
                                  {option.label}
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>

                      {/* Flag */}
                      <div className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-2">
                          <Flag className={cn(
                            "h-4 w-4",
                            (formData as any).flagged ? 'text-orange-500 fill-orange-500' : 'text-muted-foreground'
                          )} />
                          <Label className="text-sm">标记</Label>
                        </div>
                        <Switch
                          checked={(formData as any).flagged || false}
                          onCheckedChange={(checked) => handleUpdate({ flagged: checked })}
                        />
                      </div>

                      {/* Importance/Urgency */}
                      <div className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className={cn(
                            "h-4 w-4",
                            (formData as any).is_important ? 'text-red-500' : 'text-muted-foreground'
                          )} />
                          <Label className="text-sm">重要</Label>
                        </div>
                        <Switch
                          checked={(formData as any).is_important || false}
                          onCheckedChange={(checked) => handleUpdate({ is_important: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-2">
                          <Clock className={cn(
                            "h-4 w-4",
                            (formData as any).is_urgent ? 'text-red-500' : 'text-muted-foreground'
                          )} />
                          <Label className="text-sm">紧急</Label>
                        </div>
                        <Switch
                          checked={(formData as any).is_urgent || false}
                          onCheckedChange={(checked) => handleUpdate({ is_urgent: checked })}
                        />
                      </div>

                      {/* Complete with last action (projects only) */}
                      {isProject(item) && (formData as Project).project_type !== 'single_action' && (
                        <div className="flex items-center justify-between py-1">
                          <Label className="text-sm">最后动作完成时自动完成</Label>
                          <Switch
                            checked={(formData as Project).complete_with_last_action ?? true}
                            onCheckedChange={(checked) => handleUpdate({ complete_with_last_action: checked })}
                          />
                        </div>
                      )}

                      {/* Folder assignment (projects only) */}
                      {isProject(item) && (
                        <div className="space-y-1.5 pt-2">
                          <Label className="text-xs text-muted-foreground">文件夹</Label>
                          <Select
                            value={(formData as Project).folder || '__none__'}
                            onValueChange={(value) => handleUpdate({ folder: value === '__none__' ? undefined : value })}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="选择文件夹..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">无</SelectItem>
                              {folders.map(f => (
                                <SelectItem key={f.id} value={f.id}>
                                  <span className="flex items-center gap-2">
                                    <span className="truncate">{f.full_path || f.name}</span>
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* 当前位置信息（只读） */}
                      {isTask(item) && (() => {
                        const currentProject = (formData as Task).project
                        const currentParent = (formData as Task).parent
                        const project = currentProject ? projects.find(p => String(p.id) === String(currentProject)) : null
                        const parentTask = currentParent ? tasks.find(t => String(t.id) === String(currentParent)) : null
                        
                        return (
                          <div className="space-y-1.5 pt-2 pb-2 border-b">
                            <Label className="text-xs text-muted-foreground">当前位置</Label>
                            <div className="text-sm">
                              {project ? (
                                <span className="flex items-center gap-1 text-muted-foreground">
                                  <span className="text-amber-500">📁</span>
                                  {project.folder_path || project.folder_name ? (
                                    <span>【{project.folder_path || project.folder_name}】</span>
                                  ) : null}
                                  <span className="font-medium text-foreground">《{project.title}》</span>
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-muted-foreground">
                                  <span>📥</span>
                                  <span>收件箱</span>
                                </span>
                              )}
                              {parentTask && (
                                <span className="flex items-center gap-1 ml-4 text-muted-foreground">
                                  <span className="text-purple-500">⊐</span>
                                  <span className="font-medium text-foreground">{parentTask.title}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })()}

                      {/* Parent Node selection - unified for tasks */}
                      {isTask(item) && (
                        <div className="space-y-1.5 pt-2">
                          <Label className="text-xs text-muted-foreground">上级节点</Label>
                          <Select
                            value={(() => {
                              const task = formData as Task
                              if (task.parent) return `task:${task.parent}`
                              if (task.project) return `project:${task.project}`
                              return 'inbox'
                            })()}
                            onValueChange={(value) => {
                              if (value === 'inbox') {
                                handleUpdate({ project: undefined, parent: undefined })
                              } else if (value.startsWith('project:')) {
                                const projectId = value.replace('project:', '')
                                handleUpdate({ project: projectId, parent: undefined })
                              } else if (value.startsWith('task:')) {
                                const parentId = value.replace('task:', '')
                                const parentTask = tasks.find(t => t.id === parentId)
                                handleUpdate({ 
                                  project: parentTask?.project, 
                                  parent: parentId 
                                })
                              }
                            }}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="选择上级节点..." />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                              {/* 收件箱 */}
                              <SelectItem value="inbox">
                                <span className="flex items-center gap-1.5">
                                  <span>📥</span>
                                  <span>收件箱（顶级）</span>
                                </span>
                              </SelectItem>
                              
                              {/* 项目列表 */}
                              {projects.map(p => {
                                const folderDisplay = p.folder_path || p.folder_name
                                return (
                                  <SelectItem key={`project:${p.id}`} value={`project:${p.id}`}>
                                    <span className="flex items-center gap-1.5">
                                      <span className="text-amber-500">📁</span>
                                      {folderDisplay && (
                                        <span className="text-muted-foreground">【{folderDisplay}】</span>
                                      )}
                                      <span className="font-medium">《{p.title}》</span>
                                    </span>
                                  </SelectItem>
                                )
                              })}
                              
                              {/* 分割线 */}
                              {tasks.filter(t => t.task_type === 'action_group' && t.id !== item?.id).length > 0 && (
                                <div className="my-1 h-px bg-border" />
                              )}
                              
                              {/* Action Group 任务列表 */}
                              {tasks
                                .filter((t: Task) => {
                                  if (t.id === item?.id) return false
                                  if (t.task_type !== 'action_group') return false
                                  return true
                                })
                                .map((t: Task) => {
                                  const taskProject = t.project ? projects.find(p => String(p.id) === String(t.project)) : null
                                  const folderDisplay = taskProject?.folder_path || taskProject?.folder_name
                                  return (
                                    <SelectItem key={`task:${t.id}`} value={`task:${t.id}`}>
                                      <span className="flex items-center gap-1.5">
                                        <span className="text-purple-500">⊐</span>
                                        {folderDisplay && (
                                          <span className="text-muted-foreground text-xs">【{folderDisplay}】</span>
                                        )}
                                        {taskProject && (
                                          <span className="text-muted-foreground text-xs">《{taskProject.title}》</span>
                                        )}
                                        <span className="font-medium">{t.title}</span>
                                        <span className="text-xs text-purple-600">
                                          {t.action_group_type === 'sequential' ? '[顺序]' : '[并行]'}
                                        </span>
                                      </span>
                                    </SelectItem>
                                  )
                                })}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </InspectorSection>

                  {/* Tags Section */}
                  <InspectorSection title="标签" defaultOpen>
                    <TagSelector
                      selectedTags={(item as Task).tags || []}
                      availableTags={tags}
                      onChange={(newTags) => handleUpdate({ tags: newTags })}
                    />
                  </InspectorSection>

                  {/* Dates Section */}
                  <InspectorSection title="日期" defaultOpen>
                    <div className="space-y-3">
                      {/* Defer Date */}
                      <DateField
                        label="推迟至"
                        date={(formData as any).defer_date}
                        onChange={(date) => handleUpdate({ defer_date: date })}
                        description="在此日期前项目不可用"
                      />

                      {/* Due Date */}
                      <DateField
                        label="截止日期"
                        date={(formData as any).due_date}
                        onChange={(date) => handleUpdate({ due_date: date })}
                        description="必须在此日期前完成"
                      />

                      {/* Duration (tasks only) */}
                      {isTask(item) && (
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            预计时长（分钟）
                          </Label>
                          <Input
                            type="number"
                            value={(formData as Task).estimated_duration || ''}
                            onChange={(e) => handleUpdate({ estimated_duration: parseInt(e.target.value) || undefined })}
                            placeholder="例如: 30"
                            min={1}
                            className="h-9"
                          />
                          {/* Quick buttons */}
                          <div className="flex gap-1 pt-1">
                            {[5, 15, 30, 60].map(mins => (
                              <Button
                                key={mins}
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs px-2"
                                onClick={() => handleUpdate({ estimated_duration: mins })}
                              >
                                +{mins}分
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Review interval (projects only) */}
                      {isProject(item) && (
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">回顾间隔（天）</Label>
                          <Input
                            type="number"
                            value={(formData as Project).review_interval_days || 7}
                            onChange={(e) => handleUpdate({ review_interval_days: parseInt(e.target.value) || 7 })}
                            min={1}
                            max={365}
                            className="h-9"
                          />
                        </div>
                      )}

                      {/* Metadata */}
                      <div className="space-y-1 text-xs text-muted-foreground pt-2 bg-muted/50 p-2 rounded">
                        {item.created_at && (
                          <div>创建于: {format(new Date(item.created_at), 'yyyy-MM-dd HH:mm')}</div>
                        )}
                        {item.modified_at && (
                          <div>修改于: {format(new Date(item.modified_at), 'yyyy-MM-dd HH:mm')}</div>
                        )}
                        {(item as any).completed_at && (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="h-3 w-3" />
                            完成于: {format(new Date((item as any).completed_at), 'yyyy-MM-dd HH:mm')}
                          </div>
                        )}
                      </div>
                    </div>
                  </InspectorSection>

                  {/* Abbreviation (tasks only) */}
                  {isTask(item) && (
                    <InspectorSection title="简称" defaultOpen={false}>
                      <Input
                        value={(formData as Task).abbreviation || ''}
                        onChange={(e) => handleUpdate({ abbreviation: e.target.value })}
                        className="text-sm"
                        placeholder="简称"
                      />
                    </InspectorSection>
                  )}

                  {/* Repeat Section */}
                  <InspectorSection title="重复" defaultOpen={false}>
                    <div className="flex items-center justify-center h-16 border-2 border-dashed rounded-lg text-muted-foreground text-sm">
                      <Repeat className="h-4 w-4 mr-2" />
                      添加重复规则
                    </div>
                  </InspectorSection>
                </>
              )}

              {/* Note Section (common) */}
              <InspectorSection title="备注" defaultOpen={false}>
                <Textarea
                  value={(formData as any).note || ''}
                  onChange={(e) => handleUpdate({ note: e.target.value })}
                  className="min-h-[100px] resize-none text-sm"
                  placeholder="添加备注..."
                />
              </InspectorSection>

              {/* Attachments Section (common) */}
              <InspectorSection title="附件" defaultOpen={false}>
                <div className="flex items-center justify-center h-16 border-2 border-dashed rounded-lg text-muted-foreground text-sm hover:border-primary/50 hover:bg-muted/50 transition-colors cursor-pointer">
                  <Paperclip className="h-4 w-4 mr-2" />
                  点击添加附件
                </div>
              </InspectorSection>
            </div>

            {/* Bottom Toolbar */}
            <div className="h-12 border-t flex items-center justify-between px-3 bg-muted/30 flex-shrink-0">
              <div className="flex items-center gap-1">
                {/* Share Button - 跳转到对应链接 */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => {
                    if (!item) return
                    let url = ''
                    if (type === 'task') {
                      url = `/tasks/${item.id}`
                    } else if (type === 'project') {
                      url = `/projects/p/${item.id}`
                    } else if (type === 'folder') {
                      url = `/projects/f/${item.id}`
                    }
                    if (url) {
                      window.open(url, '_blank')
                    }
                  }}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                
                {/* Convert Dropdown - 类型转换 */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <FolderInput className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                      转换为
                    </div>
                    {type !== 'task' && (
                      <DropdownMenuItem onClick={() => onConvert?.('task')}>
                        <span className="mr-2">☐</span> 动作
                      </DropdownMenuItem>
                    )}
                    {type !== 'project' && (
                      <DropdownMenuItem onClick={() => onConvert?.('project')}>
                        <span className="mr-2">📁</span> 项目
                      </DropdownMenuItem>
                    )}
                    {type !== 'folder' && (
                      <DropdownMenuItem onClick={() => onConvert?.('folder')}>
                        <span className="mr-2">📂</span> 文件夹
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                
                {/* Save Button - 保存 */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => {
                    onSave?.()
                    // 触发更新
                    if (item) {
                      onUpdate(formData)
                    }
                  }}
                >
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground p-4 text-center text-sm">
            选择一个项目以查看和编辑详情
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

// ============================================================================
// Inspector Section (Collapsible)
// ============================================================================

interface InspectorSectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

function InspectorSection({ title, children, defaultOpen = false }: InspectorSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border-b last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <span className="font-medium text-sm">{title}</span>
        <svg
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            isOpen && "rotate-180"
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="px-4 pb-3">
          {children}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Date Field Component
// ============================================================================

interface DateFieldProps {
  label: string
  date?: string
  onChange: (date: string | undefined) => void
  description?: string
}

function DateField({ label, date, onChange, description }: DateFieldProps) {
  const [open, setOpen] = useState(false)
  
  // Parse the date string to Date object
  const parsedDate = React.useMemo(() => {
    if (!date) return undefined
    try {
      return parseISO(date)
    } catch {
      return undefined
    }
  }, [date])

  const handleSelect = (newDate: Date | undefined) => {
    if (newDate) {
      // Create date at end of day (23:59:59)
      const result = new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate(), 23, 59, 59)
      onChange(result.toISOString())
      setOpen(false)
    } else {
      onChange(undefined)
    }
  }

  const quickAdd = (days: number) => {
    const newDate = new Date()
    newDate.setDate(newDate.getDate() + days)
    newDate.setHours(23, 59, 59, 0)
    onChange(newDate.toISOString())
    setOpen(false)
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {label}
          </Label>
          {description && (
            <p className="text-[10px] text-muted-foreground/70">{description}</p>
          )}
        </div>
        {date && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs text-muted-foreground"
            onClick={() => onChange(undefined)}
          >
            清除
          </Button>
        )}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal h-9 text-sm",
              !date && 'text-muted-foreground'
            )}
          >
            {date && parsedDate 
              ? format(parsedDate, 'yyyy年MM月dd日', { locale: zhCN }) 
              : '选择日期...'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarComponent
            mode="single"
            selected={parsedDate}
            onSelect={handleSelect}
            initialFocus
            locale={zhCN}
          />
          <div className="p-2 border-t flex gap-1 flex-wrap">
            <Button variant="outline" size="sm" className="text-xs" onClick={() => quickAdd(0)}>今天</Button>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => quickAdd(1)}>明天</Button>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => quickAdd(7)}>+1周</Button>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => quickAdd(30)}>+1月</Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

// ============================================================================
// Tag Selector Component
// ============================================================================

interface TagSelectorProps {
  selectedTags: Tag[]
  availableTags: Tag[]
  onChange: (tags: Tag[]) => void
}

function TagSelector({ selectedTags, availableTags, onChange }: TagSelectorProps) {
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const filteredTags = (availableTags || []).filter(
    tag =>
      tag?.name?.toLowerCase().includes(search.toLowerCase()) &&
      !selectedTags.find(st => st.id === tag.id)
  )

  const addTag = (tag: Tag) => {
    onChange([...selectedTags, tag])
    setSearch('')
  }

  const removeTag = (tagId: string) => {
    onChange(selectedTags.filter(t => t.id !== tagId))
  }

  return (
    <div className="space-y-2">
      {/* Selected Tags */}
      <div className="flex flex-wrap gap-1">
        {selectedTags.map(tag => (
          <Badge
            key={tag.id}
            variant="secondary"
            className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground text-xs"
            onClick={() => removeTag(tag.id)}
          >
            {tag.name}
            <span className="ml-1">×</span>
          </Badge>
        ))}
      </div>

      {/* Add Tag Input */}
      <div className="relative">
        <Input
          placeholder="添加标签..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          className="text-sm h-9"
        />

        {isOpen && (filteredTags.length > 0 || search) && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-32 overflow-auto">
              {filteredTags.map(tag => (
                <button
                  key={tag.id}
                  className="w-full px-3 py-1.5 text-left text-sm hover:bg-accent"
                  onClick={() => {
                    addTag(tag)
                    setIsOpen(false)
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: tag.color || '#888' }}
                    />
                    {tag.name}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Inspector
