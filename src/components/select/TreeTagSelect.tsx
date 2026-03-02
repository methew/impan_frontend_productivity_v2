/**
 * TreeTagSelect - 标签树形多选选择器
 * 支持树形结构展示、搜索过滤、多选
 */
import { useState, useMemo } from 'react'
import { ChevronRight, ChevronDown, Search, Check, X, Tag as TagIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { Tag } from '@/types'

interface TreeTagSelectProps {
  tags: Tag[]
  values: number[]
  onChange: (values: number[]) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  label?: string
}

// 构建标签树
function buildTagTree(tags: Tag[]): Array<Tag & { children?: Tag[] }> {
  const tagMap = new Map<number, Tag & { children?: Tag[] }>()
  const roots: Array<Tag & { children?: Tag[] }> = []
  
  for (const tag of tags) {
    tagMap.set(tag.id, { ...tag, children: [] })
  }
  
  for (const tag of tags) {
    const node = tagMap.get(tag.id)!
    if (tag.parent && tagMap.has(tag.parent)) {
      const parent = tagMap.get(tag.parent)!
      if (!parent.children) parent.children = []
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  }
  
  return roots
}

// 多选树形项目组件
function TagTreeItem({
  tag,
  level = 0,
  values,
  onToggle,
  expandedIds,
  toggleExpanded,
  searchQuery,
}: {
  tag: Tag & { children?: Tag[] }
  level?: number
  values: number[]
  onToggle: (id: number) => void
  expandedIds: Set<number>
  toggleExpanded: (id: number) => void
  searchQuery: string
}) {
  const hasChildren = tag.children && tag.children.length > 0
  const isExpanded = expandedIds.has(tag.id)
  const isSelected = values.includes(tag.id)
  const displayName = tag.title_zh || tag.title || tag.title
  
  const matchesSearch = searchQuery === '' || 
    displayName.toLowerCase().includes(searchQuery.toLowerCase())
  
  const childrenMatchSearch = hasChildren && tag.children?.some(child =>
    (child.title_zh || child.title || child.title).toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  const shouldShow = searchQuery === '' || matchesSearch || childrenMatchSearch
  
  if (!shouldShow) return null
  
  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-1 py-1.5 px-2 rounded-md cursor-pointer hover:bg-accent",
          isSelected && "bg-primary/10",
          level > 0 && "ml-4"
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => onToggle(tag.id)}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              toggleExpanded(tag.id)
            }}
            className="p-0.5 rounded hover:bg-accent-foreground/10"
          >
            {isExpanded ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
          </button>
        ) : (
          <span className="w-5" />
        )}
        
        {/* Checkbox */}
        <div className={cn(
          "w-4 h-4 border rounded mr-2 flex items-center justify-center shrink-0",
          isSelected ? "bg-primary border-primary" : "border-muted-foreground"
        )}>
          {isSelected && <Check className="size-3 text-primary-foreground" />}
        </div>
        
        <TagIcon className="size-3 text-muted-foreground mr-1 shrink-0" />
        
        <span className="flex-1 truncate">{displayName}</span>
      </div>
      
      {hasChildren && (isExpanded || searchQuery !== '') && (
        <div>
          {tag.children!.map((child) => (
            <TagTreeItem
              key={child.id}
              tag={child}
              level={level + 1}
              values={values}
              onToggle={onToggle}
              expandedIds={expandedIds}
              toggleExpanded={toggleExpanded}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function TreeTagSelect({
  tags,
  values,
  onChange,
  placeholder = 'Select tags...',
  disabled,
  className,
  label,
}: TreeTagSelectProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())
  
  const tagTree = useMemo(() => buildTagTree(tags), [tags])
  
  const selectedTags = useMemo(() => {
    return tags.filter(t => values.includes(t.id))
  }, [tags, values])
  
  const toggleExpanded = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }
  
  const handleToggle = (id: number) => {
    onChange(
      values.includes(id)
        ? values.filter(v => v !== id)
        : [...values, id]
    )
  }
  
  const handleRemove = (id: number) => {
    onChange(values.filter(v => v !== id))
  }
  
  const handleClearAll = () => {
    onChange([])
  }
  
  return (
    <div className={cn("space-y-2", className)}>
      {label && <label className="text-sm font-medium">{label}</label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className="w-full justify-between min-h-10 h-auto py-2"
          >
            <div className="flex flex-wrap gap-1 flex-1">
              {selectedTags.length === 0 ? (
                <span className="text-muted-foreground">{placeholder}</span>
              ) : (
                selectedTags.map(tag => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    <TagIcon className="size-3" />
                    {tag.title_zh || tag.title || tag.title}
                    <X
                      className="size-3 cursor-pointer hover:text-red-500"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemove(tag.id)
                      }}
                    />
                  </Badge>
                ))
              )}
            </div>
            <ChevronDown className="size-4 ml-2 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <div className="max-h-80 overflow-auto p-2">
            {tags.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No tags available</p>
            ) : (
              tagTree.map((tag) => (
                <TagTreeItem
                  key={tag.id}
                  tag={tag}
                  values={values}
                  onToggle={handleToggle}
                  expandedIds={expandedIds}
                  toggleExpanded={toggleExpanded}
                  searchQuery={searchQuery}
                />
              ))
            )}
          </div>
          {selectedTags.length > 0 && (
            <div className="p-2 border-t flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {selectedTags.length} selected
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
              >
                Clear all
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}

// 导出构建树的工具函数，便于外部使用
export { buildTagTree }
