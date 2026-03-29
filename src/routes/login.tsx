import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/packages/ui/components/card'
import { usePageMeta } from '@/hooks/usePageMeta'
import { startOAuth2Login } from '@/lib/oauth2'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  usePageMeta({ titleKey: 'auth.login', descriptionKey: 'meta.login.description' })
  const { t } = useTranslation()

  useEffect(() => {
    // 启动 OAuth 2.0 登录流程
    // 注意：OAuth 回调在 /oauth/callback 路由处理
    startOAuth2Login()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f3f2f1]">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="space-y-1 text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-[#2563eb] rounded-xl">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-semibold text-gray-900">
            {t('auth.redirecting') || 'Redirecting...'}
          </CardTitle>
          <p className="text-sm text-gray-500">
            {t('auth.redirectingToLogin') || 'Redirecting to login page...'}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            OAuth 2.0 + PKCE 安全登录
          </p>
        </CardHeader>
        <CardContent className="flex justify-center pb-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563eb]"></div>
        </CardContent>
      </Card>
    </div>
  )
}

// 组件已内联在 Route 配置中，不需要单独导出
