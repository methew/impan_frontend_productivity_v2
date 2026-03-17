/**
 * Folder Select Component
 * 文件夹选择器 - 可搜索，显示完整路径
 */
import { SearchableSelect } from './SearchableSelect'
import type { Folder } from '@/types'
import { useTranslation } from 'react-i18next'

interface FolderSelectProps {
  value?: string
  onValueChange: (value: string) => void
  folders: Folder[]
  placeholder?: string
  showNone?: boolean
  noneLabel?: string
}

export function FolderSelect({
  value,
  onValueChange,
  folders,
  placeholder,
  showNone = true,
  noneLabel,
}: FolderSelectProps) {
  const { t } = useTranslation()
  const effectivePlaceholder = placeholder || t('projects.folderLabel')
  const effectiveNoneLabel = noneLabel || t('common.none')
  
  // 转换为 SearchableSelect 选项
  const options = [
    ...(showNone ? [{ id: '__none__', label: effectiveNoneLabel }] : []),
    ...folders.map((folder) => ({
      id: folder.id,
      label: folder.full_path || folder.name,
      description: folder.note,
    })),
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

export default FolderSelect
