/**
 * 甘特图组件
 * ==========
 * 
 * 使用 Recharts BarChart 实现的甘特图
 * 显示项目和任务的时间线
 */

import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/packages/ui/components/card'
import { Skeleton } from '@/packages/ui/components/skeleton'
import { Badge } from '@/packages/ui/components/badge'
import { Flag, AlertCircle, AlertTriangle } from 'lucide-react'
import type { GanttItem } from '@/api/gantt'

interface GanttChartProps {
  items: GanttItem[]
  isLoading?: boolean
  title?: string
  viewMode?: 'day' | 'week' | 'month'
}

interface GanttRow {
  id: string
  name: string
  type: 'project' | 'task'
  startOffset: number
  duration: number
  progress: number
  status: string
  flagged: boolean
  isImportant: boolean
  isUrgent: boolean
  folderName?: string | null
  projectTitle?: string | null
  original: GanttItem
}

const TYPE_COLORS = {
  project: {
    active: '#3b82f6',
    on_hold: '#f59e0b',
    completed: '#10b981',
    dropped: '#6b7280',
  },
  task: {
    active: '#06b6d4',
    completed: '#10b981',
    dropped: '#6b7280',
  },
}

export function GanttChart({
  items,
  isLoading,
  title = '甘特图',
  viewMode = 'day',
}: GanttChartProps) {
  // 转换数据为甘特图格式
  const { rows, days, todayOffset } = useMemo(() => {
    if (!items.length) return { rows: [], days: [], todayOffset: 0 }

    // 找出时间范围
    const dates = items
      .flatMap((item) => [item.start_date, item.end_date])
      .filter(Boolean)
      .map((d) => new Date(d!))

    if (dates.length === 0) return { rows: [], days: [], todayOffset: 0 }

    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())))
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())))

    // 添加一些边距
    minDate.setDate(minDate.getDate() - 3)
    maxDate.setDate(maxDate.getDate() + 3)

    // 生成日期数组
    const daysArray: Date[] = []
    const current = new Date(minDate)
    while (current <= maxDate) {
      daysArray.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }

    // 计算今天的偏移
    const today = new Date()
    const todayOff = Math.floor(
      (today.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    // 转换项目为行数据
    const rowsData: GanttRow[] = items.map((item) => {
      const start = item.start_date ? new Date(item.start_date) : minDate
      const end = item.end_date ? new Date(item.end_date) : start

      const startOffset = Math.floor(
        (start.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)
      )
      const duration = Math.max(
        1,
        Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
      )

      return {
        id: item.id,
        name: item.title,
        type: item.type,
        startOffset,
        duration,
        progress: item.progress,
        status: item.status,
        flagged: item.flagged || false,
        isImportant: item.is_important || false,
        isUrgent: item.is_urgent || false,
        folderName: item.folder_name || null,
        projectTitle: item.project_title || null,
        original: item,
      }
    })

    return { rows: rowsData, days: daysArray, todayOffset: todayOff }
  }, [items])

  // 准备图表数据
  const chartData = useMemo(() => {
    return rows.map((row) => ({
      ...row,
      bar: row.duration,
    }))
  }, [rows])

  // 获取颜色
  const getBarColor = (row: GanttRow) => {
    const colors = TYPE_COLORS[row.type]
    if (row.status in colors) {
      return colors[row.status as keyof typeof colors]
    }
    return row.type === 'project' ? colors.active : colors.active
  }

  // 格式化日期
  const formatDate = (date: Date) => {
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!items.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-12">
            <p>暂无甘特图数据</p>
            <p className="text-sm mt-1">创建带有截止日期的项目或任务以查看甘特图</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline" className="gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              项目
            </Badge>
            <Badge variant="outline" className="gap-1">
              <div className="w-2 h-2 rounded-full bg-cyan-500" />
              任务
            </Badge>
            <Badge variant="outline" className="gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              已完成
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex">
          {/* 左侧：项目名称列表 */}
          <div className="w-64 border-r bg-muted/30 shrink-0">
            <div className="h-10 border-b flex items-center px-4 font-medium text-sm bg-muted">
              项目/任务
            </div>
            <div className="divide-y">
              {rows.map((row) => (
                <div
                  key={row.id}
                  className="h-10 px-4 flex items-center gap-2 text-sm hover:bg-muted/50"
                >
                  {row.flagged && (
                    <Flag className="h-3 w-3 text-red-500 shrink-0" />
                  )}
                  {row.isImportant && (
                    <AlertCircle className="h-3 w-3 text-orange-500 shrink-0" />
                  )}
                  {row.isUrgent && (
                    <AlertTriangle className="h-3 w-3 text-yellow-500 shrink-0" />
                  )}
                  <span className="truncate" title={row.name}>
                    {row.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 右侧：甘特图 */}
          <div className="flex-1 overflow-auto">
            <div style={{ minWidth: Math.max(days.length * 40, 400), minHeight: 200 }}>
              <ResponsiveContainer width="100%" height={Math.max(rows.length * 40 + 60, 100)}>
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 40, right: 20, left: 0, bottom: 20 }}
                  barSize={24}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    type="number"
                    domain={[0, days.length]}
                    tickFormatter={(value: number) => {
                      const date = days[Math.floor(value)]
                      return date ? formatDate(date) : ''
                    }}
                    ticks={days
                      .map((_, i) => i)
                      .filter((i) => i % (viewMode === 'week' ? 7 : viewMode === 'month' ? 30 : 1) === 0)}
                    tick={{ fontSize: 10 }}
                    height={30}
                  />
                  <YAxis
                    type="category"
                    dataKey="id"
                    tick={false}
                    width={0}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const row = payload[0].payload as GanttRow
                      return (
                        <div className="bg-popover border rounded-lg p-3 shadow-lg text-sm">
                          <div className="font-medium mb-1">{row.name}</div>
                          <div className="text-muted-foreground space-y-1">
                            <div>
                              类型: {row.type === 'project' ? '项目' : '任务'}
                            </div>
                            {row.folderName && (
                              <div>文件夹: {row.folderName}</div>
                            )}
                            {row.projectTitle && (
                              <div>项目: {row.projectTitle}</div>
                            )}
                            <div>
                              时间: {row.original.start_date || '未设置'} ~{' '}
                              {row.original.end_date || '未设置'}
                            </div>
                            <div>进度: {row.progress}%</div>
                          </div>
                        </div>
                      )
                    }}
                  />
                  {/* 今天参考线 */}
                  {todayOffset >= 0 && todayOffset <= days.length && (
                    <ReferenceLine
                      x={todayOffset}
                      stroke="#ef4444"
                      strokeDasharray="3 3"
                      label={{
                        value: '今天',
                        position: 'top',
                        fill: '#ef4444',
                        fontSize: 10,
                      }}
                    />
                  )}
                  {/* 隐藏的起始偏移条（用于定位） */}
                  <Bar dataKey="startOffset" stackId="a" fill="transparent" />
                  {/* 实际显示的条 */}
                  <Bar dataKey="bar" stackId="a" radius={[4, 4, 4, 4]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={getBarColor(entry)}
                        fillOpacity={entry.progress === 100 ? 0.7 : 1}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
