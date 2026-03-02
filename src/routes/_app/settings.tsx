import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Loader2, RotateCcw } from 'lucide-react'
import { 
  useCoreSettings, 
  useUpdateCoreSettings,
  useResetCoreSettings,
  useProductivitySettings,
  useUpdateProductivitySettings,
  useResetProductivitySettings,
} from '@/hooks'
import { toast } from 'sonner'

export const Route = createFileRoute('/_app/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const { t, i18n } = useTranslation()
  
  // Core Settings
  const { data: coreSettings, isLoading: isLoadingCore } = useCoreSettings()
  const updateCore = useUpdateCoreSettings()
  const resetCore = useResetCoreSettings()

  // Productivity Settings
  const { data: productivitySettings, isLoading: isLoadingProductivity } = useProductivitySettings()
  const updateProductivity = useUpdateProductivitySettings()
  const resetProductivity = useResetProductivitySettings()

  // Local state for form values
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(coreSettings?.theme || 'light')
  const [language, setLanguage] = useState<'zh' | 'en' | 'ja'>((coreSettings?.language as 'zh' | 'en' | 'ja') || 'zh')
  const [notifications, setNotifications] = useState(coreSettings?.notifications_enabled ?? true)
  
  const [pomodoroDuration, setPomodoroDuration] = useState(productivitySettings?.pomodoro_duration || 25)
  const [shortBreak, setShortBreak] = useState(productivitySettings?.short_break_duration || 5)
  const [longBreak, setLongBreak] = useState(productivitySettings?.long_break_duration || 15)
  const [soundEnabled, setSoundEnabled] = useState(productivitySettings?.sound_enabled ?? true)

  const handleSaveCore = async () => {
    try {
      await updateCore.mutateAsync({
        theme: theme as 'light' | 'dark' | 'system',
        language: language as 'zh' | 'en' | 'ja',
        notifications_enabled: notifications,
      })
      // Update i18n language when settings are saved
      i18n.changeLanguage(language)
      toast.success(t('settings.messages.coreSaved'))
    } catch {
      toast.error(t('settings.messages.coreError'))
    }
  }

  const handleSaveProductivity = async () => {
    try {
      await updateProductivity.mutateAsync({
        pomodoro_duration: pomodoroDuration,
        short_break_duration: shortBreak,
        long_break_duration: longBreak,
        sound_enabled: soundEnabled,
      })
      toast.success(t('settings.messages.productivitySaved'))
    } catch {
      toast.error(t('settings.messages.productivityError'))
    }
  }

  const handleResetCore = async () => {
    try {
      await resetCore.mutateAsync()
      toast.success(t('settings.messages.coreReset'))
    } catch {
      toast.error(t('settings.messages.coreResetError'))
    }
  }

  const handleResetProductivity = async () => {
    try {
      await resetProductivity.mutateAsync()
      toast.success(t('settings.messages.productivityReset'))
    } catch {
      toast.error(t('settings.messages.productivityResetError'))
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">{t('settings.title')}</h1>

      {/* Core Settings */}
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.core.title')}</CardTitle>
          <CardDescription>{t('settings.core.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoadingCore ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="size-6 animate-spin" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>{t('settings.core.theme')}</Label>
                  <Select value={theme} onValueChange={(value) => setTheme(value as 'light' | 'dark' | 'system')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">{t('settings.core.themeOptions.light')}</SelectItem>
                      <SelectItem value="dark">{t('settings.core.themeOptions.dark')}</SelectItem>
                      <SelectItem value="system">{t('settings.core.themeOptions.system')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('settings.core.language')}</Label>
                  <Select value={language} onValueChange={(value) => setLanguage(value as 'zh' | 'en' | 'ja')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="zh">{t('settings.core.languageOptions.zh')}</SelectItem>
                      <SelectItem value="en">{t('settings.core.languageOptions.en')}</SelectItem>
                      <SelectItem value="ja">{t('settings.core.languageOptions.ja')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('settings.core.notifications')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.core.notificationsDescription')}
                  </p>
                </div>
                <Switch 
                  checked={notifications} 
                  onCheckedChange={setNotifications}
                />
              </div>

              <Separator />

              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={handleResetCore}
                  disabled={resetCore.isPending}
                >
                  {resetCore.isPending ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <RotateCcw className="mr-2 size-4" />
                  )}
                  {t('settings.actions.reset')}
                </Button>
                <Button 
                  onClick={handleSaveCore}
                  disabled={updateCore.isPending}
                >
                  {updateCore.isPending && (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  )}
                  {t('settings.actions.save')}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Productivity Settings */}
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.productivity.title')}</CardTitle>
          <CardDescription>{t('settings.productivity.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoadingProductivity ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="size-6 animate-spin" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>{t('settings.productivity.pomodoroDuration')}</Label>
                  <Input
                    type="number"
                    min={1}
                    max={60}
                    value={pomodoroDuration}
                    onChange={(e) => setPomodoroDuration(parseInt(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('settings.productivity.shortBreak')}</Label>
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    value={shortBreak}
                    onChange={(e) => setShortBreak(parseInt(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('settings.productivity.longBreak')}</Label>
                  <Input
                    type="number"
                    min={1}
                    max={60}
                    value={longBreak}
                    onChange={(e) => setLongBreak(parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('settings.productivity.sound')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.productivity.soundDescription')}
                  </p>
                </div>
                <Switch 
                  checked={soundEnabled} 
                  onCheckedChange={setSoundEnabled}
                />
              </div>

              <Separator />

              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={handleResetProductivity}
                  disabled={resetProductivity.isPending}
                >
                  {resetProductivity.isPending ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <RotateCcw className="mr-2 size-4" />
                  )}
                  {t('settings.actions.reset')}
                </Button>
                <Button 
                  onClick={handleSaveProductivity}
                  disabled={updateProductivity.isPending}
                >
                  {updateProductivity.isPending && (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  )}
                  {t('settings.actions.save')}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
