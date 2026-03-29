/**
 * TaskPaper 快速输入对话框
 * 支持自动创建 Folder 和 Project
 */

import { useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/packages/ui/components/dialog'
import { TaskPaperInput, type TaskPaperTask, type TaskPaperFolder, type TaskPaperProject } from './TaskPaperInput'
import { useCreateTask } from '@/hooks/useTasks'
import { useProjects, useCreateProject } from '@/hooks/useProjects'
import { useFolders, useCreateFolder } from '@/hooks/useFolders'
import { toast } from 'sonner'
import { Badge } from '@/packages/ui/components/badge'
import { Button } from '@/packages/ui/components/button'
import { FolderKanban, FolderOpen, CheckCircle2 } from 'lucide-react'

interface TaskPaperDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultProjectId?: string
  defaultDueDate?: Date
}

interface CreateConfirmState {
  show: boolean
  foldersToCreate: TaskPaperFolder[]
  projectsToCreate: TaskPaperProject[]
  tasks: TaskPaperTask[]
}

export function TaskPaperDialog({ 
  open, 
  onOpenChange, 
  defaultProjectId,
}: TaskPaperDialogProps) {
  const createTask = useCreateTask()
  const createProject = useCreateProject()
  const createFolder = useCreateFolder()
  const { data: existingProjects, refetch: refetchProjects } = useProjects()
  const { data: existingFolders, refetch: refetchFolders } = useFolders()
  
  // 解析结果状态
  const [parsedResult, setParsedResult] = useState<{
    tasks: TaskPaperTask[]
    folders: TaskPaperFolder[]
    projects: TaskPaperProject[]
  }>({ tasks: [], folders: [], projects: [] })
  
  // 创建确认对话框状态
  const [confirmState, setConfirmState] = useState<CreateConfirmState>({
    show: false,
    foldersToCreate: [],
    projectsToCreate: [],
    tasks: []
  })
  
  // 创建进度状态
  const [isCreating, setIsCreating] = useState(false)
  const [creationProgress, setCreationProgress] = useState('')

  // 处理解析结果
  const handleParsed = useCallback((result: { tasks: TaskPaperTask[]; folders: TaskPaperFolder[]; projects: TaskPaperProject[] }) => {
    setParsedResult(result)
  }, [])

  // 检查需要创建的 Folder 和 Project
  const checkNeedsCreation = useCallback((folders: TaskPaperFolder[], projects: TaskPaperProject[]) => {
    const foldersToCreate = folders.filter(f => 
      !existingFolders?.some(ef => ef.name === f.name)
    )
    const projectsToCreate = projects.filter(p =>
      !existingProjects?.some(ep => ep.title === p.name)
    )
    return { foldersToCreate, projectsToCreate }
  }, [existingFolders, existingProjects])

  // 提交处理
  const handleSubmit = useCallback(async (tasks: TaskPaperTask[]) => {
    if (tasks.length === 0) {
      toast.error('请输入至少一个任务')
      return
    }

    const { foldersToCreate, projectsToCreate } = checkNeedsCreation(
      parsedResult.folders, 
      parsedResult.projects
    )

    // 如果有需要创建的 Folder 或 Project，显示确认对话框
    if (foldersToCreate.length > 0 || projectsToCreate.length > 0) {
      setConfirmState({
        show: true,
        foldersToCreate,
        projectsToCreate,
        tasks
      })
      return
    }

    // 直接创建任务
    await createTasks(tasks)
  }, [parsedResult, checkNeedsCreation])

  // 创建 Folder（支持多级层级）
  const createFolders = async (folders: TaskPaperFolder[]): Promise<Map<string, string>> => {
    const folderIdMap = new Map<string, string>()
    
    // 按层级排序（indent 小的先创建，即父 Folder 先创建）
    const sortedFolders = [...folders].sort((a, b) => a.indent - b.indent)
    
    for (const folder of sortedFolders) {
      try {
        setCreationProgress(`正在创建 Folder: ${folder.fullPath}...`)
        
        // 查找父 Folder ID
        let parentId: string | undefined
        if (folder.parent && folderIdMap.has(folder.parent)) {
          parentId = folderIdMap.get(folder.parent)
        }
        
        const result = await createFolder.mutateAsync({ 
          name: folder.name,
          parent: parentId
        })
        
        // 使用 fullPath 作为 key，便于项目查找
        folderIdMap.set(folder.fullPath, result.id)
        // 同时用名称存储，便于子 folder 查找
        folderIdMap.set(folder.name, result.id)
        
        toast.success(`Folder "${folder.fullPath}" 创建成功`)
      } catch (error) {
        toast.error(`Folder "${folder.fullPath}" 创建失败`)
        throw error
      }
    }
    
    return folderIdMap
  }

  // 创建 Project（支持多级 Folder 路径）
  const createProjects = async (
    projects: TaskPaperProject[], 
    folderIdMap: Map<string, string>
  ): Promise<Map<string, string>> => {
    const projectIdMap = new Map<string, string>()
    
    for (const project of projects) {
      try {
        setCreationProgress(`正在创建项目: ${project.name}...`)
        
        // 使用 folderPath 或 folderName 查找 Folder ID
        // 优先使用完整路径查找
        const folderPath = project.folderPath || project.folderName
        let folderId: string | undefined
        if (folderPath) {
          folderId = folderIdMap.get(folderPath)
          // 如果完整路径找不到，尝试用最后一级名称查找
          if (!folderId) {
            const pathParts = folderPath.split('/')
            const lastName = pathParts[pathParts.length - 1]
            folderId = folderIdMap.get(lastName)
          }
        }
        
        const result = await createProject.mutateAsync({
          title: project.name,
          folder: folderId
        })
        projectIdMap.set(project.name, result.id)
        toast.success(`项目 "${project.name}" 创建成功`)
      } catch (error) {
        toast.error(`项目 "${project.name}" 创建失败`)
        throw error
      }
    }
    
    return projectIdMap
  }

  // 创建任务（支持父子任务层级）
  const createTasks = async (tasks: TaskPaperTask[], projectIdMap?: Map<string, string>) => {
    setIsCreating(true)
    let successCount = 0
    let failCount = 0
    
    // 用于存储已创建任务的 ID（key: 任务标题, value: 任务ID）
    // 注意：如果任务标题可能重复，需要使用更复杂的 key
    const taskIdMap = new Map<string, string>()

    try {
      // 按层级排序，确保父任务先创建
      const sortedTasks = [...tasks].sort((a, b) => a.level - b.level)
      
      for (const task of sortedTasks) {
        try {
          setCreationProgress(`正在创建任务: ${task.title}${task.level > 0 ? ' (子任务)' : ''}...`)
          
          // 查找项目 ID
          let projectId = defaultProjectId
          if (task.project) {
            // 优先使用新创建的 project ID
            if (projectIdMap?.has(task.project)) {
              projectId = projectIdMap.get(task.project)
            } else {
              // 查找已有项目
              const project = existingProjects?.find(p => p.title === task.project)
              if (project) {
                projectId = project.id
              }
            }
          }

          // 查找父任务 ID
          let parentId: string | undefined
          if (task.parent && taskIdMap.has(task.parent)) {
            parentId = taskIdMap.get(task.parent)
          }

          // 将标签添加到笔记中
          let note = task.note || ''
          if (task.tags.length > 0) {
            note = note ? `${note}\n\n标签: ${task.tags.join(', ')}` : `标签: ${task.tags.join(', ')}`
          }

          // 确定任务类型
          // - 有子任务的任务 → action_group
          // - 有项目的任务 → project_task
          // - 无项目的任务 → inbox
          const hasChildren = tasks.some(t => t.parent === task.title)
          let taskType: 'inbox' | 'project_task' | 'action_group' = 'inbox'
          if (hasChildren) {
            taskType = 'action_group'
          } else if (projectId) {
            taskType = 'project_task'
          }
          
          // 创建任务
          const result = await createTask.mutateAsync({
            title: task.title,
            project: projectId,
            parent: parentId,
            task_type: taskType,
            note: note || undefined,
            flagged: task.isImportant || task.isUrgent || task.isToday,
            is_important: task.isImportant,
            is_urgent: task.isUrgent,
            due_date: task.dueDate,
            defer_date: task.deferDate,
            estimated_duration: task.estimatedMinutes,
            completed_at: task.isDone ? new Date().toISOString() : undefined,
          })
          
          // 记录任务 ID（用于子任务关联）
          taskIdMap.set(task.title, result.id)

          successCount++
        } catch (error) {
          console.error('Failed to create task:', task, error)
          failCount++
        }
      }

      if (successCount > 0) {
        toast.success(`成功创建 ${successCount} 个任务`)
      }
      if (failCount > 0) {
        toast.error(`${failCount} 个任务创建失败`)
      }

      // 刷新列表
      await refetchProjects()
      await refetchFolders()
      
      onOpenChange(false)
    } catch (error) {
      toast.error('创建失败')
    } finally {
      setIsCreating(false)
      setCreationProgress('')
    }
  }

  // 确认创建
  const handleConfirmCreate = async () => {
    setConfirmState(prev => ({ ...prev, show: false }))
    setIsCreating(true)

    try {
      // 1. 创建 Folders
      const folderIdMap = await createFolders(confirmState.foldersToCreate)
      
      // 2. 创建 Projects
      const projectIdMap = await createProjects(confirmState.projectsToCreate, folderIdMap)
      
      // 3. 创建 Tasks
      await createTasks(confirmState.tasks, projectIdMap)
    } catch (error) {
      toast.error('创建过程中出现错误')
    } finally {
      setIsCreating(false)
      setCreationProgress('')
    }
  }

  // 取消创建
  const handleCancelCreate = () => {
    setConfirmState(prev => ({ ...prev, show: false }))
  }

  // 跳过创建，只创建已有资源对应的任务
  const handleSkipCreate = async () => {
    setConfirmState(prev => ({ ...prev, show: false }))
    await createTasks(confirmState.tasks)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>📝</span>
              快速创建任务
              <span className="text-xs font-normal text-muted-foreground ml-2">
                TaskPaper 格式
              </span>
            </DialogTitle>
          </DialogHeader>

          {isCreating && (
            <div className="bg-primary/10 rounded-lg p-4 flex items-center gap-3">
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
              <span className="text-sm text-primary">{creationProgress || '正在创建...'}</span>
            </div>
          )}

          <TaskPaperInput
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
            onParsed={handleParsed}
            autoFocus={open}
          />

          {/* 格式说明 */}
          <div className="mt-4 pt-4 border-t text-xs text-muted-foreground space-y-2">
            <p className="font-medium">支持的格式：</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <code className="bg-muted px-1 rounded">- 任务标题</code>
                <span className="ml-1">创建任务</span>
              </div>
              <div>
                <code className="bg-muted px-1 rounded">项目名:</code>
                <span className="ml-1">指定所属项目</span>
              </div>
              <div>
                <code className="bg-muted px-1 rounded">项目 @folder:</code>
                <span className="ml-1">标记为 Folder</span>
              </div>
              <div>
                <code className="bg-muted px-1 rounded">@folder(名称):</code>
                <span className="ml-1">Folder 指定名称</span>
              </div>
              <div>
                <code className="bg-muted px-1 rounded">@due(明天)</code>
                <span className="ml-1">截止日期</span>
              </div>
              <div>
                <code className="bg-muted px-1 rounded">@defer(下周一)</code>
                <span className="ml-1">开始日期</span>
              </div>
              <div>
                <code className="bg-muted px-1 rounded">@high / @important</code>
                <span className="ml-1">重要标记</span>
              </div>
              <div>
                <code className="bg-muted px-1 rounded">@urgent</code>
                <span className="ml-1">紧急标记</span>
              </div>
              <div>
                <code className="bg-muted px-1 rounded">@today</code>
                <span className="ml-1">今天</span>
              </div>
              <div>
                <code className="bg-muted px-1 rounded">@estimate(30min)</code>
                <span className="ml-1">预计时长</span>
              </div>
              <div>
                <code className="bg-muted px-1 rounded">@done</code>
                <span className="ml-1">已完成</span>
              </div>
              <div>
                <code className="bg-muted px-1 rounded">@custom-tag</code>
                <span className="ml-1">自定义标签</span>
              </div>
            </div>
            <p className="mt-2 text-amber-600">
              💡 系统将自动检测不存在的 Folder 和项目，并提示是否创建
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* 创建确认对话框 */}
      <Dialog open={confirmState.show} onOpenChange={(show: boolean) => setConfirmState(prev => ({ ...prev, show }))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-amber-500" />
              需要创建以下资源
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 text-sm">
            <p className="text-muted-foreground">以下 Folder 和项目尚未存在，是否创建？</p>
            
            {confirmState.foldersToCreate.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-medium text-amber-700 flex items-center gap-1">
                  <FolderKanban className="h-3.5 w-3.5" />
                  待创建 Folder ({confirmState.foldersToCreate.length}):
                </span>
                <div className="flex flex-col gap-1 pl-1">
                  {confirmState.foldersToCreate.map((f, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {f.parent && (
                        <span className="text-xs text-muted-foreground">
                          {'└─ '.repeat(f.fullPath.split('/').length - 1)}
                        </span>
                      )}
                      <Badge variant="outline" className="text-[10px] bg-amber-50 border-amber-200">
                        {f.name}
                      </Badge>
                      {f.parent && (
                        <span className="text-[10px] text-muted-foreground">
                          (父: {f.parent})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {confirmState.projectsToCreate.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-medium text-blue-700 flex items-center gap-1">
                  <FolderOpen className="h-3.5 w-3.5" />
                  待创建项目 ({confirmState.projectsToCreate.length}):
                </span>
                <div className="flex flex-wrap gap-1">
                  {confirmState.projectsToCreate.map((p, i) => (
                    <Badge key={i} variant="outline" className="text-[10px] bg-blue-50 border-blue-200">
                      {p.folderName ? `${p.folderName}/` : ''}{p.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {confirmState.tasks.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-medium text-green-700 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  任务 ({confirmState.tasks.length}):
                  {confirmState.tasks.some(t => t.level > 0) && (
                    <span className="text-[10px] text-muted-foreground ml-1">
                      (含 {confirmState.tasks.filter(t => t.level > 0).length} 个子任务)
                    </span>
                  )}
                </span>
              </div>
            )}
            
            <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
              <CheckCircle2 className="h-3 w-3 inline mr-1" />
              选择"创建全部"将先创建 Folder 和项目，然后创建任务（自动关联父子关系）
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCancelCreate}>取消</Button>
            <Button 
              variant="secondary"
              onClick={handleSkipCreate}
            >
              跳过，只创建任务
            </Button>
            <Button onClick={handleConfirmCreate} className="bg-primary">
              创建全部
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default TaskPaperDialog
