import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { handleOAuth2Callback } from '@/lib/oauth2'

export const Route = createFileRoute('/oauth/callback')({
  component: OAuthCallbackPage,
})

function OAuthCallbackPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const processCallback = async () => {
      const result = await handleOAuth2Callback()
      
      if (result.success) {
        setStatus('success')
        // 短暂延迟后跳转，让用户看到成功状态
        setTimeout(() => {
          navigate({ to: result.redirectPath || '/' })
        }, 500)
      } else {
        setStatus('error')
        setError(result.error || 'Authentication failed')
      }
    }

    processCallback()
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        {status === 'processing' && (
          <>
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <h2 className="mt-4 text-lg font-medium">正在完成登录...</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              正在验证身份信息，请稍候
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mx-auto h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mt-4 text-lg font-medium text-green-600">登录成功</h2>
            <p className="mt-2 text-sm text-muted-foreground">正在跳转...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mx-auto h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="mt-4 text-lg font-medium text-red-600">登录失败</h2>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            <button
              onClick={() => navigate({ to: '/login' })}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              返回登录页
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default OAuthCallbackPage
