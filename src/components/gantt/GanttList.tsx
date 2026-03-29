/**
 * 甘特图列表组件
 * =================
 * 
 * 以列表形式展示甘特图项目，适合移动端或紧凑视图
 */

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/packages/ui/components/card'
import { Badge } from '@/packages/ui/components/badge'
import { Progress } from '@/packages/ui/components/progress'
import { Skeleton } from '@/packages/ui/components/skeleton'
import { Flag, Calendar, Folder, Clock } from 'lucide-react'
import type { GanttItem } from '@/api/gantt'

interface GanttListProps {
  items: GanttItem[]
  isLoading?: boolean
  title?: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  active: { label: '进行中', color: 'bg-blue-500' },
  on_hold: { label: '暂停', color: 'bg-yellow-500' },
  completed: { label: '已完成', color: 'bg-green-500' },
  dropped: { label: '已放弃', color: 'bg-gray-500' },
}

export function GanttList({
  items,
  isLoading,
  title = '时间线',
}: GanttListProps) {
  // 按日期排序
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const dateA = a.start_date || a.end_date || ''
      const dateB = b.start_date || b.end_date || ''
      return dateA.localeCompare(dateB)
    })
  }, [items])

  // 按日期分组
  const groupedItems = useMemo(() => {
    const groups: Record<string, GanttItem[]> = {}
    
    sortedItems.forEach((item) => {
      const key = item.start_date || item.end_date || '未安排'
      if (!groups[key]) groups[key] = []
      groups[key].push(item)
    })
    
    return groups
  }, [sortedItems])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
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
          <div className="text-center text-muted-foreground py-8">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>暂无时间线数据</p>
            <p className="text-sm mt-1">设置截止日期以查看时间线</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(groupedItems).map(([date, dateItems]) => (
          <div key={date} className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground sticky top-0 bg-card py-1">
              <Calendar className="h-4 w-4" />
              <span className="font-medium">
                {date === '未安排' ? '未安排日期' : new Date(date).toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'short',
                })}
              </span>
              <Badge variant="secondary" className="text-xs">
                {dateItems.length}
              </Badge>
            </div>
            
            <div className="space-y-2 pl-6 border-l-2 border-muted">
              {dateItems.map((item) => {
                const status = STATUS_CONFIG[item.status] || { label: item.status, color: 'bg-gray-400' }
                
                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {item.flagged && (
                            <Flag className="h-3 w-3 text-red-500 shrink-0" />
                          )}
                          <span className="font-medium truncate">
                            {item.title}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Badge
                            variant="outline"
                            className={`text-[10px] h-5 ${
                              item.type === 'project'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-cyan-500 text-cyan-600'
                            }`}
                          >
                            {item.type === 'project' ? '项目' : '任务'}
                          </Badge>
                          
                          {item.folder_name && (
                            <span className="flex items-center gap-1">
                              <Folder className="h-3 w-3" />
                              {item.folder_name}
                            </span>
                          )}
                          
                          {item.project_title && (
                            <span>在 {item.project_title}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1">
                        <div className={`w-2 h-2 rounded-full ${status.color}`} />
                        {item.progress > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {item.progress}%
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {item.progress > 0 && (
                      <Progress value={item.progress} className="h-1 mt-2" />
                    )}
                    
                    {item.end_date && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        截止: {new Date(item.end_date).toLocaleDateString('zh-CN')}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
