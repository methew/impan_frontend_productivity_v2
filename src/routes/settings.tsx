import { createFileRoute } from '@tanstack/react-router'
// import { useNavigate } from '@tanstack/react-router'  // reserved for future use
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  Settings, 
  Save, 
  X, 
  Monitor, 
  SlidersHorizontal, 
  ListTodo,
  RotateCcw
} from 'lucide-react'
import { Button } from '@/packages/ui/components/button'
import { Input } from '@/packages/ui/components/input'
import { Label } from '@/packages/ui/components/label'
import { Switch } from '@/packages/ui/components/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/packages/ui/components/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/packages/ui/components/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/packages/ui/components/card'
import { Separator } from '@/packages/ui/components/separator'
import { useSettings, useUpdateSettings } from '@/hooks/useSettings'
import type { UserSettings, ProjectType } from '@/types'
import { toast } from 'sonner'
import { usePageMeta } from '@/hooks/usePageMeta'

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
})

// Default form values
const defaultFormValues: Partial<UserSettings> = {
  default_perspective: 'inbox',
  today_start_hour: 0,
  week_start_day: 0,
  default_review_interval: 7,
  show_completed_items: false,
  show_dropped_items: false,
  default_project_type: 'parallel' as ProjectType,
  task_default_duration: 30,
  morning_start_time: '06:00',
  evening_start_time: '18:00',
}

function SettingsPage() {
  usePageMeta({ titleKey: 'settings.title', descriptionKey: 'meta.settings.description' })
  const { t } = useTranslation()

  const { settings, isLoading } = useSettings()
  const updateSettings = useUpdateSettings()
  
  // Form state
  const [formData, setFormData] = useState<Partial<UserSettings>>(defaultFormValues)
  const [hasChanges, setHasChanges] = useState(false)

  // Load settings into form when available
  useEffect(() => {
    if (settings) {
      setFormData({
        default_perspective: settings.default_perspective,
        today_start_hour: settings.today_start_hour,
        week_start_day: settings.week_start_day,
        default_review_interval: settings.default_review_interval,
        show_completed_items: settings.show_completed_items,
        show_dropped_items: settings.show_dropped_items,
        default_project_type: settings.default_project_type,
        task_default_duration: settings.task_default_duration,
        morning_start_time: settings.morning_start_time,
        evening_start_time: settings.evening_start_time,
        inbox_project_id: settings.inbox_project_id,
      })
      setHasChanges(false)
    }
  }, [settings])

  // Handle field changes
  const handleChange = <K extends keyof UserSettings>(field: K, value: UserSettings[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  // Handle save
  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync(formData)
      setHasChanges(false)
      toast.success(t('settings.saveSuccess'))
    } catch {
      toast.error(t('settings.saveError'))
    }
  }

  // Handle cancel
  const handleCancel = () => {
    if (settings) {
      setFormData({
        default_perspective: settings.default_perspective,
        today_start_hour: settings.today_start_hour,
        week_start_day: settings.week_start_day,
        default_review_interval: settings.default_review_interval,
        show_completed_items: settings.show_completed_items,
        show_dropped_items: settings.show_dropped_items,
        default_project_type: settings.default_project_type,
        task_default_duration: settings.task_default_duration,
        morning_start_time: settings.morning_start_time,
        evening_start_time: settings.evening_start_time,
        inbox_project_id: settings.inbox_project_id,
      })
    }
    setHasChanges(false)
    toast.info(t('settings.changesDiscarded'))
  }

  // Handle reset to defaults
  const handleReset = () => {
    setFormData(defaultFormValues)
    setHasChanges(true)
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-muted-foreground">{t('common.loading')}</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold">{t('settings.title')}</h1>
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <span className="text-sm text-muted-foreground mr-2">
                {t('settings.unsavedChanges')}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={!hasChanges || updateSettings.isPending}
            >
              <X className="h-4 w-4 mr-1.5" />
              {t('settings.cancel')}
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges || updateSettings.isPending}
            >
              <Save className="h-4 w-4 mr-1.5" />
              {updateSettings.isPending ? t('settings.saving') : t('settings.save')}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <Tabs defaultValue="general" className="max-w-3xl mx-auto">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general" className="gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              {t('settings.general')}
            </TabsTrigger>
            <TabsTrigger value="display" className="gap-2">
              <Monitor className="h-4 w-4" />
              {t('settings.display')}
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-2">
              <ListTodo className="h-4 w-4" />
              {t('settings.taskDefaults')}
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.general')}</CardTitle>
                <CardDescription>{t('settings.generalDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Default Perspective */}
                <div className="space-y-2">
                  <Label htmlFor="default_perspective">{t('settings.defaultPerspective')}</Label>
                  <Select
                    value={formData.default_perspective}
                    onValueChange={(value) => handleChange('default_perspective', value)}
                  >
                    <SelectTrigger id="default_perspective">
                      <SelectValue placeholder={t('settings.selectPerspective')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inbox">{t('nav.inbox')}</SelectItem>
                      <SelectItem value="projects">{t('nav.projects')}</SelectItem>
                      <SelectItem value="tags">{t('nav.tags')}</SelectItem>
                      <SelectItem value="forecast">{t('nav.forecast')}</SelectItem>
                      <SelectItem value="flagged">{t('nav.flagged')}</SelectItem>
                      <SelectItem value="review">{t('nav.review')}</SelectItem>
                      <SelectItem value="completed">{t('nav.completed')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {t('settings.defaultPerspectiveHelp')}
                  </p>
                </div>

                <Separator />

                {/* Week Start Day */}
                <div className="space-y-2">
                  <Label htmlFor="week_start_day">{t('settings.weekStartDay')}</Label>
                  <Select
                    value={String(formData.week_start_day)}
                    onValueChange={(value) => handleChange('week_start_day', parseInt(value))}
                  >
                    <SelectTrigger id="week_start_day">
                      <SelectValue placeholder={t('settings.selectDay')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">{t('settings.days.sunday')}</SelectItem>
                      <SelectItem value="1">{t('settings.days.monday')}</SelectItem>
                      <SelectItem value="2">{t('settings.days.tuesday')}</SelectItem>
                      <SelectItem value="3">{t('settings.days.wednesday')}</SelectItem>
                      <SelectItem value="4">{t('settings.days.thursday')}</SelectItem>
                      <SelectItem value="5">{t('settings.days.friday')}</SelectItem>
                      <SelectItem value="6">{t('settings.days.saturday')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Default Review Interval */}
                <div className="space-y-2">
                  <Label htmlFor="default_review_interval">{t('settings.defaultReviewInterval')}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="default_review_interval"
                      type="number"
                      min={1}
                      max={365}
                      value={formData.default_review_interval}
                      onChange={(e) => handleChange('default_review_interval', parseInt(e.target.value) || 7)}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">{t('settings.days')}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('settings.defaultReviewIntervalHelp')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Display Settings */}
          <TabsContent value="display" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.display')}</CardTitle>
                <CardDescription>{t('settings.displayDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Show Completed Items */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="show_completed_items">{t('settings.showCompletedItems')}</Label>
                    <p className="text-xs text-muted-foreground">
                      {t('settings.showCompletedItemsHelp')}
                    </p>
                  </div>
                  <Switch
                    id="show_completed_items"
                    checked={formData.show_completed_items}
                    onCheckedChange={(checked) => handleChange('show_completed_items', checked)}
                  />
                </div>

                <Separator />

                {/* Show Dropped Items */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="show_dropped_items">{t('settings.showDroppedItems')}</Label>
                    <p className="text-xs text-muted-foreground">
                      {t('settings.showDroppedItemsHelp')}
                    </p>
                  </div>
                  <Switch
                    id="show_dropped_items"
                    checked={formData.show_dropped_items}
                    onCheckedChange={(checked) => handleChange('show_dropped_items', checked)}
                  />
                </div>

                <Separator />

                {/* Today Start Hour */}
                <div className="space-y-2">
                  <Label htmlFor="today_start_hour">{t('settings.todayStartHour')}</Label>
                  <Select
                    value={String(formData.today_start_hour)}
                    onValueChange={(value) => handleChange('today_start_hour', parseInt(value))}
                  >
                    <SelectTrigger id="today_start_hour" className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem key={i} value={String(i)}>
                          {String(i).padStart(2, '0')}:00
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {t('settings.todayStartHourHelp')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Task Defaults */}
          <TabsContent value="tasks" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.taskDefaults')}</CardTitle>
                <CardDescription>{t('settings.taskDefaultsDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Default Project Type */}
                <div className="space-y-2">
                  <Label htmlFor="default_project_type">{t('settings.defaultProjectType')}</Label>
                  <Select
                    value={formData.default_project_type}
                    onValueChange={(value) => handleChange('default_project_type', value as ProjectType)}
                  >
                    <SelectTrigger id="default_project_type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parallel">{t('projects.parallel')}</SelectItem>
                      <SelectItem value="sequential">{t('projects.sequential')}</SelectItem>
                      <SelectItem value="single_action">{t('projects.singleAction')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {t('settings.defaultProjectTypeHelp')}
                  </p>
                </div>

                <Separator />

                {/* Task Default Duration */}
                <div className="space-y-2">
                  <Label htmlFor="task_default_duration">{t('settings.taskDefaultDuration')}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="task_default_duration"
                      type="number"
                      min={5}
                      max={480}
                      step={5}
                      value={formData.task_default_duration}
                      onChange={(e) => handleChange('task_default_duration', parseInt(e.target.value) || 30)}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">{t('settings.minutes')}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('settings.taskDefaultDurationHelp')}
                  </p>
                </div>

                <Separator />

                {/* Morning Start Time */}
                <div className="space-y-2">
                  <Label htmlFor="morning_start_time">{t('settings.morningStartTime')}</Label>
                  <Input
                    id="morning_start_time"
                    type="time"
                    value={formData.morning_start_time}
                    onChange={(e) => handleChange('morning_start_time', e.target.value)}
                    className="w-32"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('settings.morningStartTimeHelp')}
                  </p>
                </div>

                <Separator />

                {/* Evening Start Time */}
                <div className="space-y-2">
                  <Label htmlFor="evening_start_time">{t('settings.eveningStartTime')}</Label>
                  <Input
                    id="evening_start_time"
                    type="time"
                    value={formData.evening_start_time}
                    onChange={(e) => handleChange('evening_start_time', e.target.value)}
                    className="w-32"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('settings.eveningStartTimeHelp')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Reset to Defaults */}
        <div className="max-w-3xl mx-auto mt-8 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="text-muted-foreground"
          >
            <RotateCcw className="h-4 w-4 mr-1.5" />
            {t('settings.resetToDefaults')}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
