/**
 * TreeLocationSelect - 地点树形选择器
 * 支持树形结构展示、搜索过滤
 */
import { useState, useMemo } from 'react'
import { ChevronRight, ChevronDown, Search, Check, X, MapPin, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { Location } from '@/types'

interface TreeLocationSelectProps {
  locations: Location[]
  value?: number | null
  onChange: (value: number | null) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  label?: string
  isLoading?: boolean
}

// 构建地点树
function buildLocationTree(locations: Location[]): Array<Location & { children?: Location[] }> {
  const locationMap = new Map<number, Location & { children?: Location[] }>()
  const roots: Array<Location & { children?: Location[] }> = []
  
  for (const location of locations) {
    locationMap.set(location.id, { ...location, children: [] })
  }
  
  for (const location of locations) {
    const node = locationMap.get(location.id)!
    if (location.parent && locationMap.has(location.parent)) {
      const parent = locationMap.get(location.parent)!
      if (!parent.children) parent.children = []
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  }
  
  return roots
}

// 树形项目组件
function LocationTreeItem({
  location,
  level = 0,
  value,
  onSelect,
  expandedIds,
  toggleExpanded,
  searchQuery,
}: {
  location: Location & { children?: Location[] }
  level?: number
  value?: number | null
  onSelect: (id: number) => void
  expandedIds: Set<number>
  toggleExpanded: (id: number) => void
  searchQuery: string
}) {
  const hasChildren = location.children && location.children.length > 0
  const isExpanded = expandedIds.has(location.id)
  const isSelected = value === location.id
  const displayName = location.title_zh || location.title
  
  const matchesSearch = searchQuery === '' || 
    displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    location.address?.toLowerCase().includes(searchQuery.toLowerCase())
  
  const childrenMatchSearch = hasChildren && location.children?.some(child =>
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
        onClick={() => onSelect(location.id)}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              toggleExpanded(location.id)
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
        
        <MapPin className="size-4 text-muted-foreground shrink-0" />
        
        <div className="flex-1 min-w-0">
          <span className="truncate block">{displayName}</span>
          {location.address && (
            <span className="text-xs text-muted-foreground truncate block">{location.address}</span>
          )}
        </div>
        
        {isSelected && <Check className="size-4 text-primary shrink-0" />}
      </div>
      
      {hasChildren && (isExpanded || searchQuery !== '') && (
        <div>
          {location.children!.map((child) => (
            <LocationTreeItem
              key={child.id}
              location={child}
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

export function TreeLocationSelect({
  locations,
  value,
  onChange,
  placeholder = 'Select location...',
  disabled,
  className,
  label,
  isLoading = false,
}: TreeLocationSelectProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())
  
  const locationTree = useMemo(() => buildLocationTree(locations), [locations])
  
  const selectedLocation = useMemo(() => {
    return locations.find(l => l.id === value)
  }, [locations, value])
  
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
  
  const displayName = selectedLocation?.title_zh || selectedLocation?.title
  
  return (
    <div className={cn("space-y-2", className)}>
      {label && <label className="text-sm font-medium">{label}</label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled || isLoading}
            className="w-full justify-between"
          >
            <span className={cn("truncate flex items-center gap-2", !displayName && "text-muted-foreground")}>
              {displayName ? (
                <>
                  <MapPin className="size-4" />
                  {displayName}
                </>
              ) : (
                placeholder
              )}
            </span>
            <div className="flex items-center gap-1">
              {displayName && !isLoading && (
                <X
                  className="size-4 text-muted-foreground hover:text-foreground"
                  onClick={handleClear}
                />
              )}
              {isLoading ? <Loader2 className="size-4 animate-spin" /> : open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <div className="max-h-80 overflow-auto p-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              </div>
            ) : locations.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No locations available</p>
            ) : (
              locationTree.map((location) => (
                <LocationTreeItem
                  key={location.id}
                  location={location}
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
