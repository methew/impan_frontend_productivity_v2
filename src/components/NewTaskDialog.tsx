import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/packages/ui/components/dialog'
import { Button } from '@/packages/ui/components/button'
import { Input } from '@/packages/ui/components/input'
import { Label } from '@/packages/ui/components/label'
import { Switch } from '@/packages/ui/components/switch'
import { Flag } from 'lucide-react'
import { useProjects } from '@/hooks/useProjects'
import { useTasks, useCreateTask } from '@/hooks/useTasks'
import { toast } from 'sonner'
import { ProjectSelect } from './selects'
import { cn } from '@/lib/utils'
import type { Task } from '@/types'

interface NewTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultProjectId?: string
}

export function NewTaskDialog({ open, onOpenChange, defaultProjectId }: NewTaskDialogProps) {
  const [title, setTitle] = useState('')
  const [projectId, setProjectId] = useState<string | undefined>(defaultProjectId)
  const [parentId, setParentId] = useState<string>('')
  const [taskType, setTaskType] = useState<'project_task' | 'action_group'>('project_task')
  const [actionGroupType, setActionGroupType] = useState<'parallel' | 'sequential'>('parallel')
  const [flagged, setFlagged] = useState(false)
  const [isImportant, setIsImportant] = useState(false)
  const [isUrgent, setIsUrgent] = useState(false)
  const [dueDate, setDueDate] = useState('')
  const [deferDate, setDeferDate] = useState('')
  const { data: projects } = useProjects()
  const { data: allTasks } = useTasks()
  const createTask = useCreateTask()

  // 获取可作为上级的动作（Action Group 或未指定项目的动作）
  const availableParents = useMemo(() => {
    if (!allTasks) return []
    // 过滤出 action_group 类型的任务，或者同项目下的任务
    return allTasks.filter((task: Task) => {
      // 只显示 action_group 作为可选父级
      if (task.task_type === 'action_group') return true
      return false
    })
  }, [allTasks])

  // 根据选择的项目过滤父动作
  const filteredParents = useMemo(() => {
    if (!projectId || projectId === '__none__') {
      // 收件箱：只显示收件箱中的 action_group（没有项目的）
      return availableParents.filter((task: Task) => !task.project)
    }
    // 特定项目：显示该项目下的 action_group
    return availableParents.filter((task: Task) => String(task.project) === projectId)
  }, [availableParents, projectId])

  const handleSubmit = async () => {
    if (!title.trim()) return

    try {
      const isInbox = !projectId || projectId === '__none__'
      await createTask.mutateAsync({
        title: title.trim(),
        project: isInbox ? undefined : projectId,
        parent: parentId || undefined,
        task_type: taskType,
        action_group_type: taskType === 'action_group' ? actionGroupType : undefined,
        flagged,
        is_important: isImportant,
        is_urgent: isUrgent,
        due_date: dueDate || undefined,
        defer_date: deferDate || undefined,
      })
      toast.success('动作已创建')
      onOpenChange(false)
      // Reset form
      setTitle('')
      setProjectId(defaultProjectId)
      setParentId('')
      setTaskType('project_task')
      setActionGroupType('parallel')
      setFlagged(false)
      setIsImportant(false)
      setIsUrgent(false)
      setDueDate('')
      setDeferDate('')
    } catch (error: any) {
      toast.error('创建失败', { description: error.message })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>新建动作</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>标题</Label>
            <Input
              placeholder="动作标题"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit()
                }
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>项目（可选）</Label>
            <ProjectSelect
              value={projectId}
              onValueChange={(value) => {
                setProjectId(value)
                setParentId('') // 切换项目时重置父动作
              }}
              projects={projects || []}
              placeholder="选择项目..."
              showInbox
              inboxLabel="收件箱"
            />
          </div>

          {/* 上级动作（父级） */}
          {filteredParents.length > 0 && (
            <div className="space-y-2">
              <Label>上级动作（可选）</Label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">无（顶级动作）</option>
                {filteredParents.map((task: Task) => (
                  <option key={task.id} value={task.id}>
                    {task.action_group_type === 'sequential' ? '【顺序】' : '【并行】'} {task.title}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                选择动作组作为上级，将此动作作为子动作
              </p>
            </div>
          )}

          {/* 任务类型 */}
          <div className="space-y-2">
            <Label>类型</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTaskType('project_task')}
                className={cn(
                  "flex-1 py-2 px-3 rounded-lg border text-sm transition-colors",
                  taskType === 'project_task'
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:border-primary/50"
                )}
              >
                普通动作
              </button>
              <button
                type="button"
                onClick={() => setTaskType('action_group')}
                className={cn(
                  "flex-1 py-2 px-3 rounded-lg border text-sm transition-colors font-bold",
                  taskType === 'action_group'
                    ? "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-border hover:border-purple-300"
                )}
              >
                动作组
              </button>
            </div>
          </div>

          {/* Action Group 类型 */}
          {taskType === 'action_group' && (
            <div className="space-y-2">
              <Label>动作组类型</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActionGroupType('parallel')}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-lg border text-sm transition-colors",
                    actionGroupType === 'parallel'
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-border hover:border-green-300"
                  )}
                >
                  <div className="flex items-center justify-center gap-2">
                    <div className="flex gap-[2px]">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    </div>
                    并行
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setActionGroupType('sequential')}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-lg border text-sm transition-colors",
                    actionGroupType === 'sequential'
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-border hover:border-blue-300"
                  )}
                >
                  <div className="flex items-center justify-center gap-2">
                    <div className="flex flex-col gap-[1px]">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-300" />
                    </div>
                    顺序
                  </div>
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                动作组可以包含子动作，必须完成所有子动作后才能完成父动作
              </p>
            </div>
          )}

          {/* 标记 */}
          <div className="space-y-3">
            <Label>标记</Label>
            <div className="flex items-center gap-6">
              {/* Flagged */}
              <div className="flex items-center gap-2">
                <Switch
                  checked={flagged}
                  onCheckedChange={setFlagged}
                />
                <div className="flex items-center gap-1.5">
                  <Flag className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                  <span className={cn("text-sm", flagged && "text-amber-600 font-medium")}>
                    Flag
                  </span>
                </div>
              </div>

              {/* Important */}
              <div className="flex items-center gap-2">
                <Switch
                  checked={isImportant}
                  onCheckedChange={setIsImportant}
                />
                <span className={cn("text-sm font-bold", isImportant ? "text-red-600" : "text-muted-foreground")}>
                  ! 重要
                </span>
              </div>

              {/* Urgent */}
              <div className="flex items-center gap-2">
                <Switch
                  checked={isUrgent}
                  onCheckedChange={setIsUrgent}
                />
                <span className={cn("text-sm font-bold", isUrgent ? "text-orange-600" : "text-muted-foreground")}>
                  * 紧急
                </span>
              </div>
            </div>
          </div>

          {/* 日期 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>截止日期</Label>
              <Input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-10 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label>推迟至</Label>
              <Input
                type="datetime-local"
                value={deferDate}
                onChange={(e) => setDeferDate(e.target.value)}
                className="h-10 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={!title.trim()}>
              创建
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default NewTaskDialog
