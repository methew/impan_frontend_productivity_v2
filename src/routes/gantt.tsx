import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { GanttChart, GanttList } from '@/components/gantt'
import { useCombinedGantt } from '@/hooks/useGantt'
import { getDateRange } from '@/api/gantt'
import { Button } from '@/packages/ui/components/button'
import { Card, CardContent } from '@/packages/ui/components/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/packages/ui/components/tabs'
import { Badge } from '@/packages/ui/components/badge'
import { 
  CalendarDays, 
  List, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  LayoutList,
} from 'lucide-react'
import { usePageMeta } from '@/hooks/usePageMeta'

export const Route = createFileRoute('/gantt')({
  component: GanttPage,
})

const TIME_RANGES = [
  { label: '7天', days: 7 },
  { label: '14天', days: 14 },
  { label: '30天', days: 30 },
  { label: '90天', days: 90 },
]

function GanttPage() {
  usePageMeta({ titleKey: 'gantt.title' })
  
  const [viewMode, setViewMode] = useState<'chart' | 'list'>('chart')
  const [timeRange, setTimeRange] = useState(30)
  const [dateOffset, setDateOffset] = useState(0)
  
  // 计算日期范围
  const dateRange = useMemo(() => {
    const baseRange = getDateRange(timeRange)
    const startDate = new Date(baseRange.start_date)
    const endDate = new Date(baseRange.end_date)
    
    // 应用偏移
    startDate.setDate(startDate.getDate() + dateOffset)
    endDate.setDate(endDate.getDate() + dateOffset)
    
    return {
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
    }
  }, [timeRange, dateOffset])
  
  // 获取甘特图数据
  const { data, isLoading, error } = useCombinedGantt({
    start_date: dateRange.start_date,
    end_date: dateRange.end_date,
    include_completed: false,
  })
  
  // 统计数据
  const stats = useMemo(() => {
    if (!data?.items) return { projects: 0, tasks: 0, total: 0 }
    
    const projects = data.items.filter((i) => i.type === 'project').length
    const tasks = data.items.filter((i) => i.type === 'task').length
    
    return { projects, tasks, total: data.items.length }
  }, [data])
  
  // 导航日期
  const navigateDate = (direction: 'prev' | 'next') => {
    const offset = direction === 'prev' ? -timeRange / 2 : timeRange / 2
    setDateOffset((prev) => prev + offset)
  }
  
  // 重置到当前时间
  const resetDate = () => {
    setDateOffset(0)
  }
  
  return (
    <div className="container mx-auto p-4 space-y-4">
      {/* 头部 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <LayoutList className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">甘特图</h1>
            <p className="text-sm text-muted-foreground">
              项目和任务时间线视图
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* 日期导航 */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => navigateDate('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={resetDate}
            >
              今天
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => navigateDate('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          {/* 时间范围选择 */}
          <div className="hidden sm:flex bg-muted rounded-lg p-1">
            {TIME_RANGES.map((range) => (
              <button
                key={range.days}
                onClick={() => setTimeRange(range.days)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  timeRange === range.days
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* 日期范围和统计 */}
      <Card className="bg-muted/50">
        <CardContent className="py-3 px-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {dateRange.start_date} ~ {dateRange.end_date}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <Clock className="h-3 w-3" />
                共 {stats.total} 项
              </Badge>
              {stats.projects > 0 && (
                <Badge variant="outline" className="border-blue-500 text-blue-600">
                  {stats.projects} 项目
                </Badge>
              )}
              {stats.tasks > 0 && (
                <Badge variant="outline" className="border-cyan-500 text-cyan-600">
                  {stats.tasks} 任务
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 视图切换 */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'chart' | 'list')}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="chart" className="gap-1">
              <LayoutList className="h-4 w-4" />
              甘特图
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-1">
              <List className="h-4 w-4" />
              列表
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="chart" className="mt-4">
          <GanttChart
            items={data?.items || []}
            isLoading={isLoading}
            title="项目/任务甘特图"
            viewMode={timeRange >= 90 ? 'month' : timeRange >= 14 ? 'week' : 'day'}
          />
        </TabsContent>
        
        <TabsContent value="list" className="mt-4">
          <GanttList
            items={data?.items || []}
            isLoading={isLoading}
            title="项目/任务时间线"
          />
        </TabsContent>
      </Tabs>
      
      {error && (
        <Card className="border-destructive">
          <CardContent className="py-6">
            <div className="text-center text-destructive">
              <p>加载甘特图数据失败</p>
              <p className="text-sm mt-1">请稍后重试</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
