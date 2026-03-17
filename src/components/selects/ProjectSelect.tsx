/**
 * Project Select Component
 * 项目选择器 - 可搜索，显示 【folder_path】project_name 格式
 * 如果没有文件夹，显示 【无文件夹】project_name
 */
import { SearchableSelect } from './SearchableSelect'
import type { Project } from '@/types'
import { useTranslation } from 'react-i18next'

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
  placeholder,
  showInbox = true,
  inboxLabel,
}: ProjectSelectProps) {
  const { t } = useTranslation()
  const effectivePlaceholder = placeholder || t('dialog.newAction.projectPlaceholder')
  const effectiveInboxLabel = inboxLabel || t('nav.inbox')
  
  // 转换为 SearchableSelect 选项
  const options = [
    ...(showInbox ? [{ id: '__none__', label: effectiveInboxLabel }] : []),
    ...projects.map((project) => {
      const folderDisplay = project.folder_path || project.folder_name || t('common.noneFolder')
      return {
        id: project.id,
        label: project.title,
        description: `【${folderDisplay}】`,
      }
    }),
  ]

  return (
    <SearchableSelect
      value={value || null}
      onChange={(val) => onValueChange(val as string)}
      options={options}
      placeholder={placeholder}
      clearable={false}
    />
  )
}

export default ProjectSelect
