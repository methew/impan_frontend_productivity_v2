/**
 * TreePersonSelect - 人员树形选择器
 * 支持树形结构展示、搜索过滤
 */
import { useState, useMemo } from 'react'
import { ChevronRight, ChevronDown, Search, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { Person } from '@/types'

interface TreePersonSelectProps {
  persons: Person[]
  value?: number | null
  onChange: (value: number | null) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  label?: string
}

// 构建人员树
function buildPersonTree(persons: Person[]): Array<Person & { children?: Person[] }> {
  const personMap = new Map<number, Person & { children?: Person[] }>()
  const roots: Array<Person & { children?: Person[] }> = []
  
  for (const person of persons) {
    personMap.set(person.id, { ...person, children: [] })
  }
  
  for (const person of persons) {
    const node = personMap.get(person.id)!
    if (person.parent && personMap.has(person.parent)) {
      const parent = personMap.get(person.parent)!
      if (!parent.children) parent.children = []
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  }
  
  return roots
}

// 树形项目组件
function PersonTreeItem({
  person,
  level = 0,
  value,
  onSelect,
  expandedIds,
  toggleExpanded,
  searchQuery,
}: {
  person: Person & { children?: Person[] }
  level?: number
  value?: number | null
  onSelect: (id: number) => void
  expandedIds: Set<number>
  toggleExpanded: (id: number) => void
  searchQuery: string
}) {
  const hasChildren = person.children && person.children.length > 0
  const isExpanded = expandedIds.has(person.id)
  const isSelected = value === person.id
  const displayName = person.title_zh || person.title
  
  const matchesSearch = searchQuery === '' || 
    displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    person.code?.toLowerCase().includes(searchQuery.toLowerCase())
  
  const childrenMatchSearch = hasChildren && person.children?.some(child =>
    (child.title_zh || child.title).toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  const shouldShow = searchQuery === '' || matchesSearch || childrenMatchSearch
  
  if (!shouldShow) return null
  
  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-1 py-1.5 px-2 rounded-md cursor-pointer hover:bg-accent",
          isSelected && "bg-primary/10 text-primary",
          level > 0 && "ml-4"
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => onSelect(person.id)}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              toggleExpanded(person.id)
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
        
        <div className="flex-1 min-w-0">
          <span className="truncate block">{displayName}</span>
          {person.code && (
            <span className="text-xs text-muted-foreground">{person.code}</span>
          )}
        </div>
        
        {isSelected && <Check className="size-4 text-primary shrink-0" />}
      </div>
      
      {hasChildren && (isExpanded || searchQuery !== '') && (
        <div>
          {person.children!.map((child) => (
            <PersonTreeItem
              key={child.id}
              person={child}
              level={level + 1}
              value={value}
              onSelect={onSelect}
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

export function TreePersonSelect({
  persons,
  value,
  onChange,
  placeholder = 'Select person...',
  disabled,
  className,
  label,
}: TreePersonSelectProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())
  
  const personTree = useMemo(() => buildPersonTree(persons), [persons])
  
  const selectedPerson = useMemo(() => {
    return persons.find(p => p.id === value)
  }, [persons, value])
  
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
  
  const handleSelect = (id: number) => {
    onChange(id)
    setOpen(false)
    setSearchQuery('')
  }
  
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(null)
  }
  
  const displayName = selectedPerson?.title_zh || selectedPerson?.title
  
  return (
    <div className={cn("space-y-2", className)}>
      {label && <label className="text-sm font-medium">{label}</label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className="w-full justify-between"
          >
            <span className={cn("truncate", !displayName && "text-muted-foreground")}>
              {displayName || placeholder}
            </span>
            <div className="flex items-center gap-1">
              {displayName && (
                <X
                  className="size-4 text-muted-foreground hover:text-foreground"
                  onClick={handleClear}
                />
              )}
              {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search persons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <div className="max-h-80 overflow-auto p-2">
            {persons.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No persons available</p>
            ) : (
              personTree.map((person) => (
                <PersonTreeItem
                  key={person.id}
                  person={person}
                  value={value}
                  onSelect={handleSelect}
                  expandedIds={expandedIds}
                  toggleExpanded={toggleExpanded}
                  searchQuery={searchQuery}
                />
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
