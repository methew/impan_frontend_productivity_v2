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
import { Flag, Zap } from 'lucide-react'
import { useProjects } from '@/hooks/useProjects'
import { useTasks, useCreateTask } from '@/hooks/useTasks'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { ProjectSelect } from './selects'
import { cn } from '@/lib/utils'
import type { Task } from '@/types'

interface NewTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultProjectId?: string
}

export function NewTaskDialog({ open, onOpenChange, defaultProjectId }: NewTaskDialogProps) {
  const { t } = useTranslation()
  const [title, setTitle] = useState('')
  const [projectId, setProjectId] = useState<string | undefined>(defaultProjectId)
  const [parentId, setParentId] = useState<string>('')
  const [actionGroupType, setActionGroupType] = useState<'parallel' | 'sequential'>('parallel')
  const [isImportant, setIsImportant] = useState(false)
  const [isUrgent, setIsUrgent] = useState(false)
  const [hasSubtasks, setHasSubtasks] = useState(false)
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
      // 自动判断类型：如果有子节点标记则为动作组
      const taskType = hasSubtasks ? 'action_group' : 'project_task'
      
      await createTask.mutateAsync({
        title: title.trim(),
        project: isInbox ? undefined : projectId,
        parent: parentId || undefined,
        task_type: taskType,
        action_group_type: hasSubtasks ? actionGroupType : undefined,
        flagged: isImportant || isUrgent,
        is_important: isImportant,
        is_urgent: isUrgent,
        due_date: dueDate || undefined,
        defer_date: deferDate || undefined,
      })
      toast.success(t('task.created'))
      onOpenChange(false)
      // Reset form
      setTitle('')
      setProjectId(defaultProjectId)
      setParentId('')
      setActionGroupType('parallel')
      setHasSubtasks(false)
      setIsImportant(false)
      setIsUrgent(false)
      setDueDate('')
      setDeferDate('')
    } catch (error: any) {
      toast.error(t('projects.createFailed'), { description: error.message })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('dialog.newAction.title')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>{t('dialog.newAction.actionTitleLabel')}</Label>
            <Input
              placeholder={t('dialog.newAction.actionTitlePlaceholder')}
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
            <Label>{t('dialog.newAction.projectLabel')}</Label>
            <ProjectSelect
              value={projectId}
              onValueChange={(value) => {
                setProjectId(value)
                setParentId('') // 切换项目时重置父动作
              }}
              projects={projects || []}
              placeholder={t('dialog.newAction.projectPlaceholder')}
              showInbox
              inboxLabel={t('nav.inbox')}
            />
          </div>

          {/* 上级动作（父级） */}
          {filteredParents.length > 0 && (
            <div className="space-y-2">
              <Label>{t('dialog.newAction.parentLabel')}</Label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">{t('dialog.newAction.noParent')}</option>
                {filteredParents.map((task: Task) => (
                  <option key={task.id} value={task.id}>
                    {task.action_group_type === 'sequential' ? t('dialog.newAction.sequentialGroup') : t('dialog.newAction.parallelGroup')} {task.title}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                {t('dialog.newAction.parentHint')}
              </p>
            </div>
          )}

          {/* 动作组选项 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Switch
                checked={hasSubtasks}
                onCheckedChange={setHasSubtasks}
              />
              <Label className="cursor-pointer">
                {t('dialog.newAction.hasSubtasks', '这是一个动作组（将包含子动作）')}
              </Label>
            </div>
            
            {/* Action Group 类型 - 仅在勾选时显示 */}
            {hasSubtasks && (
              <div className="space-y-2 pt-2">
                <Label>{t('dialog.newAction.actionGroupTypeLabel')}</Label>
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
                      {t('projects.parallel')}
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
                      {t('projects.sequential')}
                    </div>
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('dialog.newAction.actionGroupHint')}
                </p>
              </div>
            )}
          </div>

          {/* 标记 */}
          <div className="space-y-3">
            <Label>{t('dialog.newAction.markLabel')}</Label>
            <div className="flex items-center gap-6">
              {/* Important */}
              <div className="flex items-center gap-2">
                <Switch
                  checked={isImportant}
                  onCheckedChange={setIsImportant}
                />
                <div className="flex items-center gap-1.5">
                  <Flag className="h-3.5 w-3.5 text-orange-500 fill-orange-500" />
                  <span className={cn("text-sm font-bold", isImportant ? "text-orange-600" : "text-muted-foreground")}>
                    {t('dialog.newAction.important')}
                  </span>
                </div>
              </div>

              {/* Urgent */}
              <div className="flex items-center gap-2">
                <Switch
                  checked={isUrgent}
                  onCheckedChange={setIsUrgent}
                />
                <div className="flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-red-500 fill-red-500" />
                  <span className={cn("text-sm font-bold", isUrgent ? "text-red-600" : "text-muted-foreground")}>
                    {t('dialog.newAction.urgent')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 日期 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('dialog.newAction.dueDate')}</Label>
              <Input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-10 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('dialog.newAction.deferDate')}</Label>
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
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSubmit} disabled={!title.trim()}>
              {t('common.create')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default NewTaskDialog
