import { useTranslation } from 'react-i18next'
import { X, Calendar, Clock, Tag, FileText, Folder } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { useUpdateTask, useToggleTaskFlag } from '@/hooks/useTasks'
import type { Task } from '@/types'

interface InspectorProps {
  task: Task | null
  open: boolean
  onClose: () => void
}

export function Inspector({ task, open, onClose }: InspectorProps) {
  const { t } = useTranslation()
  const updateTask = useUpdateTask()
  const toggleFlag = useToggleTaskFlag()

  if (!task) return null

  const handleUpdate = (updates: Partial<Task>) => {
    updateTask.mutate({ id: task.id, data: updates })
  }

  const handleToggleFlag = () => {
    toggleFlag.mutate(task.id)
  }

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && !task.is_completed

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-[380px] sm:w-[450px] overflow-y-auto">
        <SheetHeader className="pb-4 border-b">
          <div className="flex items-start justify-between">
            <SheetTitle className="text-lg font-semibold">{t('inspector.title')}</SheetTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="space-y-6 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label>{t('inspector.titleLabel')}</Label>
            <Input
              value={task.title}
              onChange={(e) => handleUpdate({ title: e.target.value })}
              className={cn(isOverdue && 'border-red-300')}
            />
            {isOverdue && <p className="text-xs text-red-500">{t('inspector.overdueWarning')}</p>}
          </div>

          {/* Status & Flag */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-4 h-4 rounded-full border-2',
                task.is_completed ? 'bg-emerald-500 border-emerald-500' : 
                task.flagged ? 'border-amber-400 bg-amber-50' : 'border-slate-400'
              )} />
              <span className="text-sm">
                {task.is_completed ? 'Completed' : task.flagged ? 'Flagged' : 'Active'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="flag-switch" className="text-sm cursor-pointer">{t('inspector.flag')}</Label>
              <Switch
                id="flag-switch"
                checked={task.flagged}
                onCheckedChange={handleToggleFlag}
              />
            </div>
          </div>

          {/* Project */}
          {task.project_name && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Folder className="w-4 h-4" />
                {t('inspector.project')}
              </Label>
              <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/30">
                <span className="text-sm">{task.project_name}</span>
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {t('inspector.dates')}
            </h4>
            
            <div className="grid grid-cols-2 gap-3">
              {/* Defer Date */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{t('inspector.deferDate')}</Label>
                <Input
                  type="date"
                  value={task.defer_date?.split('T')[0] || ''}
                  onChange={(e) => handleUpdate({ defer_date: e.target.value || null })}
                  className="h-9"
                />
              </div>

              {/* Planned Date */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {t('inspector.plannedDate')}
                </Label>
                <Input
                  type="date"
                  value={task.planned_date?.split('T')[0] || ''}
                  onChange={(e) => handleUpdate({ planned_date: e.target.value || null })}
                  className="h-9 border-blue-200 focus:border-blue-400"
                />
              </div>

              {/* Due Date */}
              <div className="space-y-1.5 col-span-2">
                <Label className={cn(
                  "text-xs",
                  isOverdue ? "text-red-500 font-medium" : "text-muted-foreground"
                )}>
                  {t('inspector.dueDate')}
                  {isOverdue && ` ⚠️ ${t('common.overdue')}`}
                </Label>
                <Input
                  type="date"
                  value={task.due_date?.split('T')[0] || ''}
                  onChange={(e) => handleUpdate({ due_date: e.target.value || null })}
                  className={cn("h-9", isOverdue && "border-red-300")}
                />
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              {t('inspector.tags')}
            </Label>
            <div className="flex flex-wrap gap-2">
              {task.tags_list && task.tags_list.length > 0 ? (
                task.tags_list.map((tag) => (
                  <Badge key={tag.id} variant="secondary" className="text-xs">
                    {tag.name}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">{t('inspector.noTags')}</span>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {t('inspector.notes')}
            </Label>
            <Textarea
              value={task.note || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleUpdate({ note: e.target.value })}
              placeholder={t('inspector.notesPlaceholder')}
              className="min-h-[120px] resize-none"
            />
          </div>

          {/* Metadata */}
          <div className="pt-4 border-t space-y-2 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>{t('inspector.metadata.created')}</span>
              <span>{new Date(task.created_at).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>{t('inspector.metadata.modified')}</span>
              <span>{new Date(task.modified_at).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>{t('inspector.metadata.type')}</span>
              <span className="capitalize">{task.task_type_display}</span>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
