import { useState } from "react"
import { Button } from "./button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./card"
import { Input } from "./input"
import { Label } from "./label"
import { Eye, EyeOff, Loader2 } from "lucide-react"

export interface LoginFormData {
  email: string
  password: string
}

export interface LoginPageProps {
  title: string
  subtitle: string
  icon: React.ReactNode
  onSubmit: (data: LoginFormData) => Promise<void>
  emailLabel?: string
  passwordLabel?: string
  emailPlaceholder?: string
  passwordPlaceholder?: string
  submitLabel?: string
  loadingLabel?: string
  forgotPasswordLabel?: string
  errorMessage?: string
}

export function LoginPage({
  title,
  subtitle,
  icon,
  onSubmit,
  emailLabel = "Email",
  passwordLabel = "Password",
  emailPlaceholder = "Enter your email",
  passwordPlaceholder = "Enter your password",
  submitLabel = "Sign In",
  loadingLabel = "Signing in...",
  forgotPasswordLabel = "Forgot password?",
  errorMessage = "Invalid credentials",
}: LoginPageProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    
    if (!formData.email || !formData.password) {
      setFormError(errorMessage)
      return
    }

    setIsLoading(true)
    try {
      await onSubmit(formData)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              {icon}
            </div>
          </div>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>{subtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="text-sm text-destructive text-center">
                {formError}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">{emailLabel}</Label>
              <Input
                id="email"
                type="email"
                placeholder={emailPlaceholder}
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{passwordLabel}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={passwordPlaceholder}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  required
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {loadingLabel}
                </>
              ) : (
                submitLabel
              )}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <a href="#" className="text-primary hover:underline">
              {forgotPasswordLabel}
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default LoginPage
