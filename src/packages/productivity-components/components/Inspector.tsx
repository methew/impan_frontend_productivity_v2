/**
 * OmniFocus 4.8.5-style Inspector Panel - Using Sheet with Tabs
 * Based on: https://support.omnigroup.com/documentation/omnifocus/universal/4.8.5/en/inspector
 */
import React, { useState, useEffect } from 'react'
import {
  Calendar, Clock, CheckCircle2,
  ChevronLeft, ChevronRight, Share2, FolderInput,
  Repeat, X, Info, Wallet, Trash2, Upload, Link, FileText, Image
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
import { useTranslation } from 'react-i18next'
import { ProjectFinancialPanel } from '@/components/project/ProjectFinancialPanel'

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
  const [activeTab, setActiveTab] = useState<'info' | 'budget'>('info')

  useEffect(() => {
    if (item) {
      setFormData({ ...item })
      // Reset to info tab when item changes
      setActiveTab('info')
    }
  }, [item])

  const handleUpdate = (updates: Partial<Task | Project | FolderType>) => {
    setFormData(prev => ({ ...prev, ...updates }))
    onUpdate(updates)
  }



  const { t } = useTranslation()

  // Get item type label
  const getTypeLabel = () => {
    switch (type) {
      case 'task': return t('inspector.type.task')
      case 'project': return t('inspector.type.project')
      case 'folder': return t('inspector.type.folder')
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
              <div className="flex items-center justify-between">
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
              
              {/* Tab Navigation - OmniFocus Style */}
              <div className="flex items-center gap-1 mt-3 -mx-4 px-4 border-t pt-2">
                <button
                  onClick={() => setActiveTab('info')}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                    activeTab === 'info'
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Info className="h-3.5 w-3.5" />
                  信息
                </button>
                {/* Budget Tab - Projects Only */}
                {isProject(item) && (
                  <button
                    onClick={() => setActiveTab('budget')}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                      activeTab === 'budget'
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <Wallet className="h-3.5 w-3.5" />
                    预算
                  </button>
                )}
              </div>
            </SheetHeader>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === 'budget' && isProject(item) ? (
                /* Budget Tab Content - Projects Only */
                <div className="p-4">
                  <ProjectFinancialPanel projectId={item.id} />
                </div>
              ) : (
                /* Info Tab Content - All Types */
                <>
              {/* Title/Name Section */}
              <InspectorSection title={isFolder(item) ? t('inspector.section.name') : t('inspector.section.title')} defaultOpen>
                {isFolder(item) ? (
                  <Input
                    value={(formData as FolderType).name || ''}
                    onChange={(e) => handleUpdate({ name: e.target.value })}
                    className="text-sm"
                    placeholder={t('inspector.placeholder.folderName')}
                  />
                ) : (
                  <Textarea
                    value={(formData as Task | Project).title || ''}
                    onChange={(e) => handleUpdate({ title: e.target.value })}
                    className="min-h-[60px] resize-none text-sm"
                    placeholder={isTask(item) ? t('inspector.placeholder.actionTitle') : t('inspector.placeholder.projectTitle')}
                  />
                )}
              </InspectorSection>

              {/* Folder-specific fields */}
              {isFolder(item) && (
                <>
                  <InspectorSection title={t('inspector.section.shortTitle')} defaultOpen={false}>
                    <Input
                      value={(formData as FolderType).abbreviation || ''}
                      onChange={(e) => handleUpdate({ abbreviation: e.target.value })}
                      className="text-sm"
                      placeholder={t('inspector.placeholder.shortTitle')}
                    />
                  </InspectorSection>

                  <InspectorSection title={t('inspector.section.status')} defaultOpen>
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

                  <InspectorSection title={t('inspector.section.parentFolder')} defaultOpen={false}>
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
                              { value: 'active', label: t('status.active'), color: 'bg-green-500' },
                              { value: 'completed', label: t('projects.status.completed'), color: 'bg-green-600' },
                              { value: 'dropped', label: t('projects.status.dropped'), color: 'bg-gray-400' },
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
                              { value: 'active', label: t('status.active'), color: 'bg-green-500' },
                              { value: 'on_hold', label: t('status.onHold'), color: 'bg-yellow-500' },
                              { value: 'completed', label: t('projects.status.completed'), color: 'bg-green-600' },
                              { value: 'dropped', label: t('projects.status.dropped'), color: 'bg-gray-400' },
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

                      {/* 当前位置信息（只读）- 显示完整路径 */}
                      {isTask(item) && (() => {
                        const currentProject = (formData as Task).project
                        const currentParent = (formData as Task).parent
                        const project = currentProject ? projects.find(p => String(p.id) === String(currentProject)) : null
                        const parentTask = currentParent ? tasks.find(t => String(t.id) === String(currentParent)) : null
                        
                        // 构建上级动作组的完整路径
                        const buildParentTaskPath = (taskId: string): string => {
                          const task = tasks.find(t => String(t.id) === String(taskId))
                          if (!task) return ''
                          
                          // 递归构建路径
                          const buildPath = (t: Task | undefined, path: string[]): string[] => {
                            if (!t) return path
                            path.unshift(t.title)
                            if (t.parent) {
                              const parent = tasks.find(pt => String(pt.id) === String(t.parent))
                              return buildPath(parent, path)
                            }
                            return path
                          }
                          
                          const pathArray = buildPath(task, [])
                          return pathArray.join(' > ')
                        }
                        
                        return (
                          <div className="space-y-1.5 pt-2 pb-2 border-b">
                            <Label className="text-xs text-muted-foreground">当前位置</Label>
                            <div className="text-sm space-y-1">
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
                                  <span className="font-medium text-foreground">{buildParentTaskPath(parentTask.id)}</span>
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
                              
                              {/* 项目列表 - 显示完整路径 */}
                              {projects.map(p => {
                                const folderDisplay = p.folder_path || p.folder_name
                                return (
                                  <SelectItem key={`project:${p.id}`} value={`project:${p.id}`}>
                                    <span className="flex items-center gap-1.5">
                                      <span className="text-amber-500">📁</span>
                                      {folderDisplay ? (
                                        <span className="text-muted-foreground">【{folderDisplay}】</span>
                                      ) : (
                                        <span className="text-muted-foreground text-xs">[无文件夹]</span>
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
                              
                              {/* Action Group 任务列表 - 显示完整路径 */}
                              {tasks
                                .filter((t: Task) => {
                                  if (t.id === item?.id) return false
                                  if (t.task_type !== 'action_group') return false
                                  return true
                                })
                                .map((t: Task) => {
                                  const taskProject = t.project ? projects.find(p => String(p.id) === String(t.project)) : null
                                  const folderDisplay = taskProject?.folder_path || taskProject?.folder_name
                                  
                                  // 构建动作组的完整路径
                                  const buildTaskPath = (task: Task | undefined): string => {
                                    if (!task) return ''
                                    const path: string[] = []
                                    let current: Task | undefined = task
                                    while (current) {
                                      path.unshift(current.title)
                                      if (current.parent) {
                                        current = tasks.find(pt => String(pt.id) === String(current!.parent))
                                      } else {
                                        break
                                      }
                                    }
                                    return path.join(' > ')
                                  }
                                  
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
                                        <span className="font-medium">{buildTaskPath(t)}</span>
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
                  <InspectorSection title={t('inspector.section.tags')} defaultOpen>
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
                      <DateTimeField
                        label="推迟至 (开始时间)"
                        date={(formData as any).defer_date}
                        onChange={(date) => handleUpdate({ defer_date: date })}
                        description="在此时间前任务不可用"
                      />

                      {/* Due Date */}
                      <DateTimeField
                        label="截止日期 (结束时间)"
                        date={(formData as any).due_date}
                        onChange={(date) => handleUpdate({ due_date: date })}
                        description="必须在此时间前完成"
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
                  <InspectorSection title={t('inspector.section.repetition')} defaultOpen={false}>
                    <RepeatRuleEditor
                      value={(formData as Task & { repeat_rule?: string }).repeat_rule}
                      onChange={(rule) => handleUpdate({ repeat_rule: rule } as Partial<Task | Project | FolderType>)}
                    />
                  </InspectorSection>
                </>
              )}

              {/* Note Section (common) */}
              <InspectorSection title={t('inspector.section.notes')} defaultOpen={false}>
                <Textarea
                  value={(formData as any).note || ''}
                  onChange={(e) => handleUpdate({ note: e.target.value })}
                  className="min-h-[100px] resize-none text-sm"
                  placeholder="添加备注..."
                />
              </InspectorSection>

              {/* Attachments Section (common) */}
              <InspectorSection title={t('inspector.section.attachments')} defaultOpen={false}>
                <AttachmentUploader
                  attachments={[]}
                  onUpload={(files) => {
                    // TODO: Implement file upload API
                    console.log('Upload files:', files)
                  }}
                  onDelete={(id) => {
                    // TODO: Implement delete attachment API
                    console.log('Delete attachment:', id)
                  }}
                />
              </InspectorSection>
                </>
              )}
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
// DateTime Field Component - Shows both date and time
// ============================================================================

interface DateTimeFieldProps {
  label: string
  date?: string
  onChange: (date: string | undefined) => void
  description?: string
}

function DateTimeField({ label, date, onChange, description }: DateTimeFieldProps) {
  const [dateOpen, setDateOpen] = useState(false)
  
  // Parse the date string to Date object
  const parsedDate = React.useMemo(() => {
    if (!date) return undefined
    try {
      return parseISO(date)
    } catch {
      return undefined
    }
  }, [date])

  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate) {
      // Keep existing time if available, otherwise default to 09:00
      const hours = parsedDate?.getHours() ?? 9
      const minutes = parsedDate?.getMinutes() ?? 0
      const result = new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate(), hours, minutes)
      onChange(result.toISOString())
      setDateOpen(false)
    } else {
      onChange(undefined)
    }
  }

  const handleTimeChange = (timeStr: string) => {
    if (!parsedDate || !timeStr) return
    const [hours, minutes] = timeStr.split(':').map(Number)
    const result = new Date(parsedDate)
    result.setHours(hours, minutes)
    onChange(result.toISOString())
  }

  const quickSetTime = (hours: number, minutes: number = 0) => {
    const result = parsedDate ? new Date(parsedDate) : new Date()
    result.setHours(hours, minutes, 0, 0)
    onChange(result.toISOString())
  }

  const formatTimeValue = (date?: Date) => {
    if (!date) return ''
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
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

      <div className="flex gap-2">
        {/* Date Picker */}
        <Popover open={dateOpen} onOpenChange={setDateOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "flex-1 justify-start text-left font-normal h-9 text-sm",
                !date && 'text-muted-foreground'
              )}
            >
              {date && parsedDate 
                ? format(parsedDate, 'yyyy-MM-dd', { locale: zhCN }) 
                : '选择日期...'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="single"
              selected={parsedDate}
              onSelect={handleDateSelect}
              initialFocus
              locale={zhCN}
            />
            <div className="p-2 border-t flex gap-1 flex-wrap">
              <Button variant="outline" size="sm" className="text-xs" onClick={() => handleDateSelect(new Date())}>今天</Button>
              <Button variant="outline" size="sm" className="text-xs" onClick={() => {
                const d = new Date()
                d.setDate(d.getDate() + 1)
                handleDateSelect(d)
              }}>明天</Button>
              <Button variant="outline" size="sm" className="text-xs" onClick={() => {
                const d = new Date()
                d.setDate(d.getDate() + 7)
                handleDateSelect(d)
              }}>+1周</Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Time Picker */}
        <div className="relative">
          <Input
            type="time"
            value={formatTimeValue(parsedDate)}
            onChange={(e) => handleTimeChange(e.target.value)}
            className="w-28 h-9 text-sm"
            disabled={!date}
          />
        </div>
      </div>

      {/* Quick time buttons */}
      {date && (
        <div className="flex gap-1 flex-wrap">
          {[8, 9, 10, 12, 14, 16, 18, 20].map(hour => (
            <Button
              key={hour}
              variant="ghost"
              size="sm"
              className={cn(
                "h-6 text-xs px-2",
                parsedDate?.getHours() === hour && "bg-primary/10 text-primary"
              )}
              onClick={() => quickSetTime(hour)}
            >
              {String(hour).padStart(2, '0')}:00
            </Button>
          ))}
        </div>
      )}
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

// ============================================================================
// Repeat Rule Editor Component
// ============================================================================

/**
 * RRULE Editor - 基于 RFC 5545 iCalendar 标准的重复规则编辑器
 * 
 * 支持的 RRULE 属性：
 * - FREQ: DAILY, WEEKLY, MONTHLY, YEARLY
 * - INTERVAL: 间隔
 * - BYDAY: 星期几 (MO, TU, WE, TH, FR, SA, SU)
 * - BYMONTHDAY: 月几号 (1-31)
 * - BYMONTH: 月份 (1-12)
 * - UNTIL: 结束日期
 * - COUNT: 重复次数
 * 
 * 示例：
 * - RRULE:FREQ=DAILY;INTERVAL=2 (每2天)
 * - RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR (每周一三五)
 * - RRULE:FREQ=MONTHLY;BYMONTHDAY=15 (每月15号)
 * - RRULE:FREQ=YEARLY;BYMONTH=1;BYMONTHDAY=1 (每年1月1日)
 */

type Frequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | null

interface ParsedRRule {
  freq: Frequency
  interval: number
  byday: string[]      // MO, TU, WE, TH, FR, SA, SU
  bymonthday: number[] // 1-31
  bymonth: number[]    // 1-12
  until?: string
  count?: number
}

interface RepeatRuleEditorProps {
  value?: string | null
  onChange: (rule: string | null) => void
}

// Parse RRULE string to object
function parseRRule(rule: string): ParsedRRule {
  const result: ParsedRRule = {
    freq: null,
    interval: 1,
    byday: [],
    bymonthday: [],
    bymonth: []
  }
  
  if (!rule || !rule.startsWith('RRULE:')) return result
  
  const parts = rule.replace('RRULE:', '').split(';')
  
  for (const part of parts) {
    const [key, value] = part.split('=')
    if (!key || !value) continue
    
    switch (key) {
      case 'FREQ':
        result.freq = value as Frequency
        break
      case 'INTERVAL':
        result.interval = parseInt(value) || 1
        break
      case 'BYDAY':
        result.byday = value.split(',')
        break
      case 'BYMONTHDAY':
        result.bymonthday = value.split(',').map(v => parseInt(v)).filter(v => !isNaN(v))
        break
      case 'BYMONTH':
        result.bymonth = value.split(',').map(v => parseInt(v)).filter(v => !isNaN(v))
        break
      case 'UNTIL':
        result.until = value
        break
      case 'COUNT':
        result.count = parseInt(value)
        break
    }
  }
  
  return result
}

// Build RRULE string from object
function buildRRule(parsed: ParsedRRule): string {
  if (!parsed.freq) return ''
  
  const parts: string[] = [`FREQ=${parsed.freq}`]
  
  if (parsed.interval > 1) {
    parts.push(`INTERVAL=${parsed.interval}`)
  }
  
  if (parsed.byday.length > 0) {
    parts.push(`BYDAY=${parsed.byday.join(',')}`)
  }
  
  if (parsed.bymonthday.length > 0) {
    parts.push(`BYMONTHDAY=${parsed.bymonthday.join(',')}`)
  }
  
  if (parsed.bymonth.length > 0) {
    parts.push(`BYMONTH=${parsed.bymonth.join(',')}`)
  }
  
  if (parsed.until) {
    parts.push(`UNTIL=${parsed.until}`)
  }
  
  if (parsed.count && parsed.count > 0) {
    parts.push(`COUNT=${parsed.count}`)
  }
  
  return `RRULE:${parts.join(';')}`
}

const WEEKDAY_MAP = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']
const WEEKDAY_NAMES = ['日', '一', '二', '三', '四', '五', '六']
const MONTH_NAMES = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

function RepeatRuleEditor({ value, onChange }: RepeatRuleEditorProps) {
  const parsed = parseRRule(value || '')
  
  const [freq, setFreq] = useState<Frequency>(parsed.freq)
  const [interval, setInterval] = useState(parsed.interval)
  const [byday, setByday] = useState<string[]>(parsed.byday)
  const [bymonthday, setBymonthday] = useState<number[]>(parsed.bymonthday)
  const [bymonth, setBymonth] = useState<number[]>(parsed.bymonth)
  const [endType, setEndType] = useState<'never' | 'until' | 'count'>('never')
  const [until, setUntil] = useState(parsed.until || '')
  const [count, setCount] = useState(parsed.count || 10)
  
  // Update local state when value changes
  useEffect(() => {
    const newParsed = parseRRule(value || '')
    setFreq(newParsed.freq)
    setInterval(newParsed.interval)
    setByday(newParsed.byday)
    setBymonthday(newParsed.bymonthday)
    setBymonth(newParsed.bymonth)
    if (newParsed.until) {
      setEndType('until')
      setUntil(newParsed.until)
    } else if (newParsed.count) {
      setEndType('count')
      setCount(newParsed.count)
    }
  }, [value])
  
  // Build and emit RRULE when any field changes
  const updateRRule = (updates: Partial<ParsedRRule>) => {
    const newParsed: ParsedRRule = {
      freq,
      interval,
      byday,
      bymonthday,
      bymonth,
      ...updates
    }
    
    // Handle end conditions
    if (endType === 'until' && until) {
      newParsed.until = until
      delete newParsed.count
    } else if (endType === 'count') {
      newParsed.count = count
      delete newParsed.until
    } else {
      delete newParsed.until
      delete newParsed.count
    }
    
    const rule = buildRRule(newParsed)
    onChange(rule || null)
  }
  
  const handleFreqChange = (newFreq: Frequency) => {
    setFreq(newFreq)
    
    // Reset freq-specific fields
    const updates: Partial<ParsedRRule> = { freq: newFreq }
    
    if (newFreq === 'WEEKLY') {
      // Default to current weekday if none selected
      if (byday.length === 0) {
        const today = new Date().getDay()
        updates.byday = [WEEKDAY_MAP[today]]
        setByday(updates.byday)
      }
    } else if (newFreq === 'MONTHLY') {
      if (bymonthday.length === 0) {
        updates.bymonthday = [new Date().getDate()]
        setBymonthday(updates.bymonthday)
      }
      updates.byday = []
    } else if (newFreq === 'YEARLY') {
      if (bymonth.length === 0) {
        updates.bymonth = [new Date().getMonth() + 1]
        setBymonth(updates.bymonth)
      }
      if (bymonthday.length === 0) {
        updates.bymonthday = [new Date().getDate()]
        setBymonthday(updates.bymonthday)
      }
      updates.byday = []
    } else {
      updates.byday = []
      updates.bymonthday = []
      updates.bymonth = []
    }
    
    updateRRule(updates)
  }
  
  const toggleWeekday = (day: string) => {
    const newDays = byday.includes(day)
      ? byday.filter(d => d !== day)
      : [...byday, day].sort()
    setByday(newDays)
    updateRRule({ byday: newDays })
  }
  
  const handleRemoveRule = () => {
    setFreq(null)
    setByday([])
    setBymonthday([])
    setBymonth([])
    setEndType('never')
    onChange(null)
  }
  
  if (!freq) {
    return (
      <div className="space-y-3">
        <Label className="text-xs text-muted-foreground">选择重复频率</Label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'DAILY' as Frequency, label: '每天', icon: '📅', desc: '按天重复' },
            { value: 'WEEKLY' as Frequency, label: '每周', icon: '📆', desc: '按周重复' },
            { value: 'MONTHLY' as Frequency, label: '每月', icon: '🗓️', desc: '按月重复' },
            { value: 'YEARLY' as Frequency, label: '每年', icon: '🎂', desc: '按年重复' },
          ].map(option => (
            <button
              key={option.value}
              onClick={() => handleFreqChange(option.value)}
              className="flex flex-col items-start p-3 rounded-lg border hover:bg-accent hover:border-primary/50 transition-all text-left"
            >
              <span className="text-lg mb-1">{option.icon}</span>
              <span className="text-sm font-medium">{option.label}</span>
              <span className="text-xs text-muted-foreground">{option.desc}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
        <div className="flex items-center gap-2">
          <Repeat className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">
            {freq === 'DAILY' && '每天'}
            {freq === 'WEEKLY' && '每周'}
            {freq === 'MONTHLY' && '每月'}
            {freq === 'YEARLY' && '每年'}
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleRemoveRule}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Interval */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">重复间隔</Label>
        <div className="flex items-center gap-2">
          <span className="text-sm">每</span>
          <Input
            type="number"
            min={1}
            max={999}
            value={interval}
            onChange={(e) => {
              const val = Math.max(1, parseInt(e.target.value) || 1)
              setInterval(val)
              updateRRule({ interval: val })
            }}
            className="w-20 h-8"
          />
          <span className="text-sm">
            {freq === 'DAILY' && '天'}
            {freq === 'WEEKLY' && '周'}
            {freq === 'MONTHLY' && '月'}
            {freq === 'YEARLY' && '年'}
          </span>
        </div>
      </div>
      
      {/* Weekly: BYDAY */}
      {freq === 'WEEKLY' && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">重复日期</Label>
          <div className="flex gap-1">
            {WEEKDAY_MAP.map((dayCode, index) => (
              <button
                key={dayCode}
                onClick={() => toggleWeekday(dayCode)}
                className={cn(
                  "w-8 h-8 rounded-full text-xs font-medium transition-colors",
                  byday.includes(dayCode)
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-accent"
                )}
                title={WEEKDAY_NAMES[index]}
              >
                {WEEKDAY_NAMES[index]}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Monthly: BYMONTHDAY */}
      {freq === 'MONTHLY' && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">每月几号</Label>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
              <button
                key={day}
                onClick={() => {
                  const newDays = bymonthday.includes(day) ? [] : [day]
                  setBymonthday(newDays)
                  updateRRule({ bymonthday: newDays })
                }}
                className={cn(
                  "h-8 rounded text-xs font-medium transition-colors",
                  bymonthday.includes(day)
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-accent"
                )}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Yearly: BYMONTH + BYMONTHDAY */}
      {freq === 'YEARLY' && (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">月份</Label>
            <div className="grid grid-cols-4 gap-1">
              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                <button
                  key={month}
                  onClick={() => {
                    const newMonths = bymonth.includes(month) ? [] : [month]
                    setBymonth(newMonths)
                    updateRRule({ bymonth: newMonths })
                  }}
                  className={cn(
                    "py-1.5 px-2 rounded text-xs transition-colors",
                    bymonth.includes(month)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-accent"
                  )}
                >
                  {MONTH_NAMES[month - 1]}
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">日期</Label>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                <button
                  key={day}
                  onClick={() => {
                    const newDays = bymonthday.includes(day) ? [] : [day]
                    setBymonthday(newDays)
                    updateRRule({ bymonthday: newDays })
                  }}
                  className={cn(
                    "h-8 rounded text-xs font-medium transition-colors",
                    bymonthday.includes(day)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-accent"
                  )}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* End Condition */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">结束条件</Label>
        <div className="flex gap-2">
          {[
            { value: 'never', label: '永不' },
            { value: 'count', label: '次数' },
            { value: 'until', label: '日期' },
          ].map(option => (
            <button
              key={option.value}
              onClick={() => setEndType(option.value as any)}
              className={cn(
                "flex-1 py-1.5 px-2 rounded text-xs transition-colors",
                endType === option.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-accent"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        
        {endType === 'count' && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm">重复</span>
            <Input
              type="number"
              min={1}
              max={999}
              value={count}
              onChange={(e) => {
                const val = Math.max(1, parseInt(e.target.value) || 1)
                setCount(val)
                updateRRule({})
              }}
              className="w-20 h-8"
            />
            <span className="text-sm">次后结束</span>
          </div>
        )}
        
        {endType === 'until' && (
          <div className="mt-2">
            <Input
              type="date"
              value={until}
              onChange={(e) => {
                setUntil(e.target.value)
                updateRRule({})
              }}
              className="h-8"
            />
          </div>
        )}
      </div>
      
      {/* RRULE Preview */}
      {value && (
        <div className="text-xs text-muted-foreground bg-muted p-2 rounded font-mono break-all">
          {value}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Attachment Uploader Component
// ============================================================================

interface Attachment {
  id: string
  name: string
  type: 'file' | 'image' | 'link'
  size?: number
  url?: string
}

interface AttachmentUploaderProps {
  attachments: Attachment[]
  onUpload: (files: File[]) => void
  onDelete: (id: string) => void
}

function AttachmentUploader({ attachments, onUpload, onDelete }: AttachmentUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      onUpload(files)
    }
  }
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      onUpload(files)
    }
  }
  
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }

  return (
    <div className="space-y-3">
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
          isDragging 
            ? "border-primary bg-primary/5" 
            : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/50"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground text-center">
          拖拽文件到此处，或点击上传
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          支持图片、文档、链接
        </p>
      </div>
      
      {/* Quick Actions */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1 text-xs">
          <Link className="h-3 w-3 mr-1" />
          添加链接
        </Button>
        <Button variant="outline" size="sm" className="flex-1 text-xs">
          <Image className="h-3 w-3 mr-1" />
          添加图片
        </Button>
      </div>
      
      {/* Attachment List */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map(attachment => (
            <div
              key={attachment.id}
              className="flex items-center gap-2 p-2 bg-muted rounded-lg group"
            >
              {attachment.type === 'image' ? (
                <Image className="h-4 w-4 text-blue-500" />
              ) : attachment.type === 'link' ? (
                <Link className="h-4 w-4 text-green-500" />
              ) : (
                <FileText className="h-4 w-4 text-orange-500" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{attachment.name}</p>
                {attachment.size && (
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(attachment.size)}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                onClick={() => onDelete(attachment.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Inspector
