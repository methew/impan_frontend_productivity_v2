/**
 * Project Select Component
 * 项目选择器 - 显示 【folder_path】project_name 格式
 * 如果没有文件夹，显示 【无文件夹】project_name
 */
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/packages/ui/components/select'
import type { Project } from '@/types'

interface ProjectSelectProps {
  value?: string
  onValueChange: (value: string) => void
  projects: Project[]
  placeholder?: string
  showInbox?: boolean
  inboxLabel?: string
}

export function ProjectSelect({
  value,
  onValueChange,
  projects,
  placeholder = '选择项目...',
  showInbox = true,
  inboxLabel = '收件箱',
}: ProjectSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="h-10">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {showInbox && (
          <SelectItem value="__none__">{inboxLabel}</SelectItem>
        )}
        {projects.map((project) => {
          // 优先使用 folder_path，其次 folder_name，都没有则显示【无文件夹】
          const folderDisplay = project.folder_path || project.folder_name || '无文件夹'
          const displayText = `【${folderDisplay}】${project.title}`

          return (
            <SelectItem key={project.id} value={project.id}>
              <span className="truncate">{displayText}</span>
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}

export default ProjectSelect
