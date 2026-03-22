/**
 * Project Inspector with Financial Information
 * 
 * 扩展现有 Inspector，添加财务标签页
 */

import { useState } from 'react'
import { DollarSign, Info } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/packages/ui/components/sheet'
import { cn } from '@/lib/utils'
import { ProjectFinancialPanel } from './ProjectFinancialPanel'
import type { Project } from '@/types'

interface Tab {
  id: string
  label: string
  icon: React.ReactNode
}

const tabs: Tab[] = [
  { id: 'info', label: '基本信息', icon: <Info className="h-4 w-4" /> },
  { id: 'finance', label: '财务', icon: <DollarSign className="h-4 w-4" /> },
]

interface ProjectInspectorWithFinanceProps {
  project: Project | null
  isOpen: boolean
  onClose: () => void
  onUpdate?: (data: Partial<Project>) => void
}

export function ProjectInspectorWithFinance({
  project,
  isOpen,
  onClose,
}: ProjectInspectorWithFinanceProps) {
  const [activeTab, setActiveTab] = useState('info')

  if (!project) return null

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[400px] sm:w-[450px] p-0 flex flex-col overflow-hidden">
        <SheetHeader className="px-4 py-3 border-b space-y-0 flex-shrink-0">
          <SheetTitle className="text-sm font-medium">项目详情</SheetTitle>
        </SheetHeader>

        {/* Tabs */}
        <div className="flex border-b">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'info' && (
            <div className="p-4 space-y-4">
              {/* 这里可以复用原有的 Inspector 基本信息部分 */}
              <p className="text-sm text-muted-foreground">
                项目: {project.title}
              </p>
              <p className="text-sm text-muted-foreground">
                类型: {project.project_type === 'sequential' ? '顺序型' : 
                       project.project_type === 'parallel' ? '并行型' : '单动作列表'}
              </p>
              <p className="text-sm text-muted-foreground">
                状态: {project.status === 'active' ? '活跃' :
                       project.status === 'on_hold' ? '暂停' :
                       project.status === 'completed' ? '已完成' : '已丢弃'}
              </p>
              {project.folder_name && (
                <p className="text-sm text-muted-foreground">
                  文件夹: {project.folder_name}
                </p>
              )}
            </div>
          )}

          {activeTab === 'finance' && (
            <ProjectFinancialPanel projectId={project.id} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
