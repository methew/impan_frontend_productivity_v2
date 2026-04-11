import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Brain, Clock, Target, TrendingUp, Zap, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FocusSession } from '@/components/focus/FocusSession'

// Mock data
const mockTasks = [
  {
    id: '1',
    title: '完成项目需求文档',
    project: '工作',
    priority: 'high' as const,
    completed: false,
  },
  {
    id: '2',
    title: '学习 React 新特性',
    project: '学习',
    priority: 'medium' as const,
    completed: false,
  },
  {
    id: '3',
    title: '阅读技术文章',
    project: '学习',
    priority: 'low' as const,
    completed: false,
  },
  {
    id: '4',
    title: '整理桌面文件',
    project: '个人',
    priority: 'low' as const,
    completed: false,
  },
]

const mockStats = {
  completedPomodoros: 6,
  totalFocusTime: 150,
  completedTasks: 3,
}

function FocusPage() {
  const [activeTab, setActiveTab] = useState('focus')

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-blue-500" />
            专注模式
          </h1>
          <p className="text-gray-500 mt-1">
            使用番茄工作法提高工作效率
          </p>
        </div>
        <span className="inline-flex items-center px-3 py-1 text-sm bg-gray-100 rounded-full">
          <Zap className="mr-1 h-4 w-4" />
          今日已完成 {mockStats.completedPomodoros} 个番茄
        </span>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
        <button
          onClick={() => setActiveTab('focus')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'focus'
              ? 'bg-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Target className="h-4 w-4" />
          开始专注
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'stats'
              ? 'bg-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          统计数据
        </button>
      </div>

      {/* Content */}
      {activeTab === 'focus' ? (
        <div className="mt-6">
          <FocusSession
            tasks={mockTasks}
            stats={mockStats}
            onTaskComplete={(taskId) => {
              console.log('Task completed:', taskId)
            }}
            onSessionComplete={(duration) => {
              console.log('Session completed:', duration, 'minutes')
            }}
          />
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">今日番茄</p>
                  <p className="text-3xl font-bold">{mockStats.completedPomodoros}</p>
                </div>
                <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Brain className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">专注时长</p>
                  <p className="text-3xl font-bold">{mockStats.totalFocusTime}分钟</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">完成任务</p>
                  <p className="text-3xl font-bold">{mockStats.completedTasks}</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Target className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Chart */}
          <div className="bg-white rounded-lg border">
            <div className="p-4 border-b">
              <h3 className="font-medium">本周专注趋势</h3>
            </div>
            <div className="p-6">
              <div className="h-48 flex items-end justify-between gap-2">
                {['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map(
                  (day, index) => {
                    const value = [4, 6, 8, 5, 6, 3, 2][index]
                    return (
                      <div key={day} className="flex-1 flex flex-col items-center gap-2">
                        <div
                          className="w-full bg-blue-200 rounded-t-lg transition-all hover:bg-blue-300"
                          style={{ height: `${value * 10}%` }}
                        />
                        <span className="text-xs text-gray-500">{day}</span>
                        <span className="text-xs font-medium">{value}</span>
                      </div>
                    )
                  }
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pomodoro Tips */}
      <div className="bg-gray-50 rounded-lg border p-6">
        <div className="flex items-start gap-4">
          <Info className="h-5 w-5 text-blue-500 mt-0.5" />
          <div>
            <h3 className="font-medium mb-2">番茄工作法使用指南</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>1. 选择一个任务，设置 25 分钟专注时间</li>
              <li>2. 全神贯注工作，直到计时器响起</li>
              <li>3. 休息 5 分钟，每 4 个番茄后休息 15-30 分钟</li>
              <li>4. 重复以上步骤，保持高效工作节奏</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/focus')({
  component: FocusPage,
})
