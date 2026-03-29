import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Tags, Plus, Hash, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/packages/ui/components/button'
import { Card, CardContent } from '@/packages/ui/components/card'
import { Badge } from '@/packages/ui/components/badge'
import { Checkbox } from '@/packages/ui/components/checkbox'
import { Input } from '@/packages/ui/components/input'
import { Label } from '@/packages/ui/components/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/packages/ui/components/dialog'
import { useTasksByTag, useCompleteTask } from '@/hooks/useTasks'
import { useCreateTag } from '@/hooks/useTags'
import { usePageMeta } from '@/hooks/usePageMeta'
import { toast } from 'sonner'

const COLOR_OPTIONS = [
  { value: '#6366f1', label: 'Indigo' },
  { value: '#10b981', label: 'Green' },
  { value: '#8b5cf6', label: 'Violet' },
  { value: '#f59e0b', label: 'Amber' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#ef4444', label: 'Red' },
  { value: '#84cc16', label: 'Lime' },
]

export const Route = createFileRoute('/tags')({
  component: TagsPage,
})

function TagsPage() {
  usePageMeta({ titleKey: 'tags.title', descriptionKey: 'meta.tags.description' })
  const { t } = useTranslation()
  const { data: tasksByTag } = useTasksByTag()
  const createTag = useCreateTag()
  
  // New tag dialog state
  const [showNewTagDialog, setShowNewTagDialog] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0].value)

  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      toast.error(t('tags.nameRequired', '请输入标签名称'))
      return
    }
    
    try {
      await createTag.mutateAsync({
        name: newTagName.trim(),
        color: selectedColor,
      })
      toast.success(t('tags.createSuccess', '标签创建成功'))
      setNewTagName('')
      setSelectedColor(COLOR_OPTIONS[0].value)
      setShowNewTagDialog(false)
    } catch (error) {
      toast.error(t('tags.createFailed', '标签创建失败'))
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Tags className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-bold">{t('tags.title')}</h1>
            <p className="text-sm text-muted-foreground">
              {t('tags.subtitle')}
            </p>
          </div>
        </div>
        <Button onClick={() => setShowNewTagDialog(true)}>
          <Plus className="h-4 w-4 mr-1" />
          {t('tags.newTag')}
        </Button>
      </div>

      {/* New Tag Dialog */}
      <Dialog open={showNewTagDialog} onOpenChange={setShowNewTagDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('tags.newTag', '新建标签')}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('tags.name', '标签名称')}</Label>
              <Input
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder={t('tags.namePlaceholder', '例如：重要')}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleCreateTag()
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('tags.color', '颜色')}</Label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setSelectedColor(color.value)}
                    className={`w-8 h-8 rounded-full transition-all ${
                      selectedColor === color.value 
                        ? 'ring-2 ring-offset-2 ring-primary scale-110' 
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.label}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewTagDialog(false)}>
              {t('common.cancel', '取消')}
            </Button>
            <Button 
              onClick={handleCreateTag} 
              disabled={!newTagName.trim() || createTag.isPending}
            >
              {createTag.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  {t('common.creating', '创建中...')}
                </>
              ) : (
                t('common.create', '创建')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tags Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasksByTag?.map(({ tag, tasks }) => (
            <TagCard key={tag.id} tag={tag} tasks={tasks} />
          ))}
        </div>
      </div>
    </div>
  )
}

function TagCard({ tag, tasks }: { tag: { id: string; name: string; color?: string }; tasks: any[] }) {
  const { t } = useTranslation()
  const completeTask = useCompleteTask()

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Hash className="h-4 w-4" style={{ color: tag.color }} />
          <h3 className="font-semibold">{tag.name}</h3>
          <Badge variant="secondary" className="ml-auto">
            {tasks.length}
          </Badge>
        </div>

        <div className="space-y-2">
          {tasks.slice(0, 5).map((task: any) => (
            <div 
              key={task.id} 
              className="flex items-start gap-2 text-sm"
            >
              <Checkbox 
                checked={!!task.completed_at}
                onCheckedChange={() => completeTask.mutate(task.id)}
                className="mt-0.5 rounded-full"
              />
              <div className="flex-1 min-w-0">
                <span className={task.completed_at ? 'line-through text-muted-foreground' : ''}>
                  {task.title}
                </span>
                {task.due_date && (
                  <p className="text-xs text-muted-foreground">
                    {new Date(task.due_date).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          ))}
          {tasks.length > 5 && (
            <p className="text-xs text-muted-foreground text-center">
              {t('tags.moreTasks', { count: tasks.length - 5 })}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
