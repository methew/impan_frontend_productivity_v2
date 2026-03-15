/**
 * Folder Select Component
 * 文件夹选择器 - 显示完整路径
 */
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/packages/ui/components/select'
import type { Folder } from '@/types'

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
  placeholder = '选择文件夹...',
  showNone = true,
  noneLabel = '无',
}: FolderSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="h-10">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {showNone && (
          <SelectItem value="__none__">{noneLabel}</SelectItem>
        )}
        {folders.map((folder) => {
          // 使用 full_path 或 name
          const displayText = folder.full_path || folder.name

          return (
            <SelectItem key={folder.id} value={folder.id}>
              <span className="truncate">{displayText}</span>
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}

export default FolderSelect
