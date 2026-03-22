/**
 * 项目财务信息面板
 * 
 * 在项目 Inspector 中显示预算、支出、时间成本等财务信息
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  DollarSign, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  AlertCircle,
  Edit2,
  Save,
  X,
  Receipt
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/packages/ui/components/card'
import { Button } from '@/packages/ui/components/button'
import { Input } from '@/packages/ui/components/input'
import { Label } from '@/packages/ui/components/label'
import { Progress } from '@/packages/ui/components/progress'
import { Badge } from '@/packages/ui/components/badge'
import { Separator } from '@/packages/ui/components/separator'
import { toast } from 'sonner'
import { 
  useProjectBudget, 
  useProjectFinancialSummary,
  useSetProjectBudget 
} from '@/hooks/useProjectAccounting'
import { formatCurrency, formatDuration } from '@/lib/utils'

interface ProjectFinancialPanelProps {
  projectId: string
}

export function ProjectFinancialPanel({ projectId }: ProjectFinancialPanelProps) {
  const { t } = useTranslation()
  const { data: budget, isLoading: isLoadingBudget } = useProjectBudget(projectId)
  const { data: summary, isLoading: isLoadingSummary } = useProjectFinancialSummary(projectId)
  const setBudget = useSetProjectBudget()
  
  const [isEditingBudget, setIsEditingBudget] = useState(false)
  const [budgetInput, setBudgetInput] = useState('')
  const [hourlyRateInput, setHourlyRateInput] = useState('')

  if (isLoadingBudget || isLoadingSummary) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-20 bg-muted animate-pulse rounded-lg" />
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
      </div>
    )
  }

  const handleSetBudget = async () => {
    const total = parseFloat(budgetInput)
    const hourlyRate = hourlyRateInput ? parseFloat(hourlyRateInput) : undefined
    
    if (isNaN(total) || total < 0) {
      toast.error('请输入有效的预算金额')
      return
    }
    
    try {
      await setBudget.mutateAsync({ projectId, data: { total_budget: total, hourly_rate: hourlyRate } })
      toast.success('预算设置成功')
      setIsEditingBudget(false)
    } catch {
      toast.error('预算设置失败')
    }
  }

  return (
    <div className="p-4 space-y-4">
      {/* 预算卡片 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            项目预算
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!budget ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-3">尚未设置预算</p>
              {!isEditingBudget ? (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    setBudgetInput('')
                    setHourlyRateInput('')
                    setIsEditingBudget(true)
                  }}
                >
                  <Edit2 className="h-3.5 w-3.5 mr-1" />
                  设置预算
                </Button>
              ) : (
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">预算总额</Label>
                    <Input
                      type="number"
                      placeholder="输入预算金额"
                      value={budgetInput}
                      onChange={(e) => setBudgetInput(e.target.value)}
                      className="h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">小时费率（用于计算时间成本）</Label>
                    <Input
                      type="number"
                      placeholder="可选，如：100"
                      value={hourlyRateInput}
                      onChange={(e) => setHourlyRateInput(e.target.value)}
                      className="h-8"
                    />
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Button size="sm" variant="ghost" onClick={() => setIsEditingBudget(false)}>
                      <X className="h-3.5 w-3.5 mr-1" />
                      取消
                    </Button>
                    <Button size="sm" onClick={handleSetBudget} disabled={setBudget.isPending}>
                      <Save className="h-3.5 w-3.5 mr-1" />
                      保存
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {/* 预算进度 */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>已使用 {budget.budget_percentage.toFixed(1)}%</span>
                  <span className={budget.budget_percentage >= 100 ? 'text-red-500 font-medium' : ''}>
                    {formatCurrency(budget.budget_spent)} / {formatCurrency(budget.budget_total)}
                  </span>
                </div>
                <Progress 
                  value={Math.min(budget.budget_percentage, 100)} 
                  className="h-2"
                />
                {budget.budget_percentage >= 100 && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    预算已超支 {formatCurrency(Math.abs(budget.budget_remaining))}
                  </p>
                )}
              </div>
              
              {/* 预算详情 */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-muted/50 rounded-lg p-2">
                  <p className="text-xs text-muted-foreground">剩余预算</p>
                  <p className={`text-sm font-medium ${budget.budget_remaining < 0 ? 'text-red-500' : 'text-green-600'}`}>
                    {formatCurrency(budget.budget_remaining)}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-2">
                  <p className="text-xs text-muted-foreground">小时费率</p>
                  <p className="text-sm font-medium">
                    {summary?.time_tracking.hourly_rate 
                      ? formatCurrency(summary.time_tracking.hourly_rate) + '/h'
                      : '未设置'
                  }
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 财务汇总 */}
      {summary && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Receipt className="h-4 w-4 text-muted-foreground" />
              收支情况
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* 收入与支出 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">收入</p>
                    <p className="text-sm font-medium text-green-600">
                      {formatCurrency(summary.finances.total_income)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">支出</p>
                    <p className="text-sm font-medium text-red-600">
                      {formatCurrency(summary.finances.total_expenses)}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* 净利润 */}
              <div className="flex items-center justify-between">
                <span className="text-sm">净利润</span>
                <div className="text-right">
                  <p className={`text-lg font-semibold ${summary.finances.net_profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {formatCurrency(summary.finances.net_profit)}
                  </p>
                  <Badge variant={summary.finances.profit_margin >= 0 ? 'default' : 'destructive'} className="text-xs">
                    利润率 {summary.finances.profit_margin.toFixed(1)}%
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 时间成本 */}
      {summary && summary.time_tracking.total_hours > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              时间成本
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">总投入时间</span>
                <span className="font-medium">{summary.time_tracking.total_hours.toFixed(1)} 小时</span>
              </div>
              
              {summary.time_tracking.labor_cost > 0 && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm">人工成本</span>
                    <span className="font-medium">{formatCurrency(summary.time_tracking.labor_cost)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">总成本（支出+人工）</span>
                    <span className="font-semibold">{formatCurrency(summary.total_cost)}</span>
                  </div>
                  {summary.finances.net_profit - summary.time_tracking.labor_cost < 0 && (
                    <p className="text-xs text-amber-600 flex items-center gap-1 mt-2">
                      <AlertCircle className="h-3 w-3" />
                      扣除人工成本后，项目处于亏损状态
                    </p>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
