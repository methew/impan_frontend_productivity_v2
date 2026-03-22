import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Target, Plus } from 'lucide-react'

import { HabitTracker } from '@/components/habits/HabitTracker'
import { Button } from '@/packages/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/packages/ui/components/dialog'
import { Input } from '@/packages/ui/components/input'
import { Label } from '@/packages/ui/components/label'
import { usePageMeta } from '@/hooks/usePageMeta'
import {
  useHabits,
  useCreateHabit,
  useDeleteHabit,
  useArchiveHabit,
  useToggleHabitCompletion,
} from '@/hooks/useHabits'
import { toast } from 'sonner'

export const Route = createFileRoute('/habits')({
  component: HabitsPage,
})

const COLOR_OPTIONS = [
  '#6366f1', // Indigo
  '#10b981', // Green
  '#8b5cf6', // Violet
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#ef4444', // Red
  '#84cc16', // Lime
]

function HabitsPage() {
  usePageMeta({ titleKey: 'habits.title', descriptionKey: 'meta.habits.description' })
  const { t } = useTranslation()
  
  // API Hooks
  const { data: habits = [], isLoading } = useHabits()
  const createHabit = useCreateHabit()
  const deleteHabit = useDeleteHabit()
  const archiveHabit = useArchiveHabit()
  const toggleCompletion = useToggleHabitCompletion()
  
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newHabitName, setNewHabitName] = useState('')
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0])
  const [targetDays, setTargetDays] = useState(7)

  const handleAdd = async () => {
    if (newHabitName.trim()) {
      try {
        await createHabit.mutateAsync({
          name: newHabitName.trim(),
          color: selectedColor,
          target_days: targetDays,
        })
        toast.success('习惯创建成功')
        setNewHabitName('')
        setSelectedColor(COLOR_OPTIONS[0])
        setTargetDays(7)
        setShowAddDialog(false)
      } catch (error) {
        toast.error('创建失败')
      }
    }
  }

  const handleToggle = async (habitId: string, date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    try {
      await toggleCompletion.mutateAsync({ habitId, date: dateStr })
    } catch (error) {
      toast.error('操作失败')
    }
  }

  const handleDelete = async (habitId: string) => {
    if (confirm('确定要删除这个习惯吗？')) {
      try {
        await deleteHabit.mutateAsync(habitId)
        toast.success('已删除')
      } catch (error) {
        toast.error('删除失败')
      }
    }
  }

  const handleArchive = async (habitId: string) => {
    try {
      await archiveHabit.mutateAsync(habitId)
      toast.success('已归档')
    } catch (error) {
      toast.error('归档失败')
    }
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="h-14 border-b bg-card flex items-center px-4 justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Target className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-lg font-semibold">{t('habits.title', '习惯')}</h1>
          <span className="text-sm text-muted-foreground">
            {habits.length} {t('common.items', '项')}
          </span>
        </div>
        <Button size="sm" onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-1" />
          {t('habits.addHabit', '添加习惯')}
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden p-4">
        <HabitTracker
          habits={habits}
          onToggle={handleToggle}
          onAdd={() => setShowAddDialog(true)}
          onEdit={(habit) => {
            // TODO: Open edit dialog
            console.log('Edit habit:', habit)
          }}
          onDelete={handleDelete}
          onArchive={handleArchive}
        />
      </div>

      {/* Add Habit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('habits.newHabit', '新建习惯')}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>{t('habits.name', '习惯名称')}</Label>
              <Input
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                placeholder={t('habits.namePlaceholder', '例如：晨间阅读')}
              />
            </div>

            <div>
              <Label>{t('habits.color', '颜色')}</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {COLOR_OPTIONS.map(color => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-8 h-8 rounded-full transition-all ${
                      selectedColor === color ? 'ring-2 ring-offset-2 ring-primary' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div>
              <Label>{t('habits.targetDays', '每周目标天数')}</Label>
              <div className="flex items-center gap-4 mt-2">
                <input
                  type="range"
                  min="1"
                  max="7"
                  value={targetDays}
                  onChange={(e) => setTargetDays(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm font-medium w-8">{targetDays}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              {t('common.cancel', '取消')}
            </Button>
            <Button 
              onClick={handleAdd} 
              disabled={!newHabitName.trim() || createHabit.isPending}
            >
              {createHabit.isPending ? '创建中...' : t('common.create', '创建')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default HabitsPage
