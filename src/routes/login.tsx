import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/packages/ui/components/button'
import { Input } from '@/packages/ui/components/input'
import { Label } from '@/packages/ui/components/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/packages/ui/components/card'
import { setUserInfo, loginApi } from '@/lib/auth'
import { usePageMeta } from '@/hooks/usePageMeta'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  usePageMeta({ titleKey: 'auth.login', descriptionKey: 'meta.login.description' })
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const navigate = useNavigate()

  // Mark as client-side (for hydration safety)
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  // Show loading during SSR/hydration to prevent flash
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f3f2f1]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast.error(t('auth.enterCredentials'))
      return
    }

    setIsLoading(true)
    
    try {
      const data = await loginApi(email, password)
      localStorage.setItem('access_token', data.access)
      localStorage.setItem('refresh_token', data.refresh)
      
      // Save user info
      setUserInfo({
        id: data.user?.id || '',
        email: data.user?.email || email,
        name: data.user?.name || data.user?.email?.split('@')[0],
      })
      
      toast.success(t('auth.loginSuccess'), { description: t('auth.welcomeBack') })
      
      // Navigate to home page
      navigate({ to: '/' })
    } catch (error: any) {
      toast.error(t('auth.loginFailed'), { description: error.message || t('auth.enterCredentials') })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f3f2f1]">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="space-y-1 text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-[#2563eb] rounded-xl">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-semibold text-gray-900">{t('auth.appTitle')}</CardTitle>
          <p className="text-sm text-gray-500">{t('auth.subtitle')}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                autoComplete="email"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.password')}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="current-password"
                  className="h-11 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-11 w-11 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full h-11 bg-[#2563eb] hover:bg-[#1d4ed8]" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('auth.loggingIn')}
                </>
              ) : (
                t('auth.login')
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default LoginPage
