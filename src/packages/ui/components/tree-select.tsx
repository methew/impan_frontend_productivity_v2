import { useState, useMemo } from 'react'
import { ChevronRight, ChevronDown, Search, Check, X } from 'lucide-react'
import { Button } from './button'
import { Input } from './input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './popover'
import { Badge } from './badge'
import { cn } from "../lib/utils"

interface TreeNode {
  id: string | number
  title: string
  children?: TreeNode[]
  [key: string]: any
}

interface TreeSelectProps {
  nodes: TreeNode[]
  value?: string | number | null
  onChange: (value: string | number | null) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

// Flatten tree for search
function flattenTree(nodes: TreeNode[], parentPath: string = ''): Array<{ node: TreeNode; path: string }> {
  const result: Array<{ node: TreeNode; path: string }> = []
  
  for (const node of nodes) {
    const currentPath = parentPath ? `${parentPath} > ${node.title}` : node.title
    result.push({ node, path: currentPath })
    if (node.children && node.children.length > 0) {
      result.push(...flattenTree(node.children, currentPath))
    }
  }
  
  return result
}

// Tree Item Component
function TreeItem({
  node,
  level = 0,
  value,
  onSelect,
  expandedIds,
  toggleExpanded,
  searchQuery,
}: {
  node: TreeNode
  level?: number
  value?: string | number | null
  onSelect: (id: string | number) => void
  expandedIds: Set<string | number>
  toggleExpanded: (id: string | number) => void
  searchQuery: string
}) {
  const hasChildren = node.children && node.children.length > 0
  const isExpanded = expandedIds.has(node.id)
  const isSelected = value?.toString() === node.id.toString()
  
  // Check if this node or any children match search
  const matchesSearch = searchQuery === '' || 
    node.title.toLowerCase().includes(searchQuery.toLowerCase())
  
  const childrenMatchSearch = hasChildren && node.children?.some(child =>
    child.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    child.children?.some(grandchild => 
      grandchild.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
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
        onClick={() => onSelect(node.id)}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              toggleExpanded(node.id)
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
        
        <span className="flex-1 truncate">{node.title}</span>
        
        {isSelected && <Check className="size-4 text-primary" />}
      </div>
      
      {hasChildren && (isExpanded || searchQuery !== '') && (
        <div>
          {node.children!.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
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

// Single Tree Select
export function TreeSelect({
  nodes,
  value,
  onChange,
  placeholder = 'Select...',
  disabled,
  className,
}: TreeSelectProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedIds, setExpandedIds] = useState<Set<string | number>>(new Set())
  
  const selectedNode = useMemo(() => {
    const flat = flattenTree(nodes)
    return flat.find(item => item.node.id.toString() === value?.toString())?.node
  }, [nodes, value])
  
  const toggleExpanded = (id: string | number) => {
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
  
  const handleSelect = (id: string | number) => {
    onChange(id)
    setOpen(false)
    setSearchQuery('')
  }
  
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(null)
  }
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn("w-full justify-between", className)}
        >
          <span className={cn("truncate", !selectedNode && "text-muted-foreground")}>
            {selectedNode?.title || placeholder}
          </span>
          <div className="flex items-center gap-1">
            {selectedNode && (
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
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <div className="max-h-80 overflow-auto p-2">
          {nodes.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No items</p>
          ) : (
            nodes.map((node) => (
              <TreeItem
                key={node.id}
                node={node}
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
  )
}

// Multi Tree Select (for Tags)
interface MultiTreeSelectProps {
  nodes: TreeNode[]
  values: (string | number)[]
  onChange: (values: (string | number)[]) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function MultiTreeSelect({
  nodes,
  values,
  onChange,
  placeholder = 'Select tags...',
  disabled,
  className,
}: MultiTreeSelectProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedIds, setExpandedIds] = useState<Set<string | number>>(new Set())
  
  const selectedNodes = useMemo(() => {
    const flat = flattenTree(nodes)
    return values
      .map(v => flat.find(item => item.node.id.toString() === v.toString())?.node)
      .filter(Boolean) as TreeNode[]
  }, [nodes, values])
  
  const toggleExpanded = (id: string | number) => {
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
  
  const handleToggle = (id: string | number) => {
    const idStr = id.toString()
    const newValues = values.some(v => v.toString() === idStr)
      ? values.filter(v => v.toString() !== idStr)
      : [...values, id]
    onChange(newValues)
  }
  
  const handleRemove = (id: string | number) => {
    onChange(values.filter(v => v.toString() !== id.toString()))
  }
  
  // Multi-select Tree Item
  function MultiTreeItem({
    node,
    level = 0,
    values,
    onToggle,
    expandedIds,
    toggleExpanded,
    searchQuery,
  }: {
    node: TreeNode
    level?: number
    values: (string | number)[]
    onToggle: (id: string | number) => void
    expandedIds: Set<string | number>
    toggleExpanded: (id: string | number) => void
    searchQuery: string
  }) {
    const hasChildren = node.children && node.children.length > 0
    const isExpanded = expandedIds.has(node.id)
    const isSelected = values.some(v => v.toString() === node.id.toString())
    
    const matchesSearch = searchQuery === '' || 
      node.title.toLowerCase().includes(searchQuery.toLowerCase())
    
    const childrenMatchSearch = hasChildren && node.children?.some(child =>
      child.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      child.children?.some(grandchild => 
        grandchild.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
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
          onClick={() => onToggle(node.id)}
        >
          {hasChildren ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                toggleExpanded(node.id)
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
          
          <div className={cn(
            "w-4 h-4 border rounded mr-2 flex items-center justify-center",
            isSelected ? "bg-primary border-primary" : "border-muted-foreground"
          )}>
            {isSelected && <Check className="size-3 text-primary-foreground" />}
          </div>
          
          <span className="flex-1 truncate">{node.title}</span>
        </div>
        
        {hasChildren && (isExpanded || searchQuery !== '') && (
          <div>
            {node.children!.map((child) => (
              <MultiTreeItem
                key={child.id}
                node={child}
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
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn("w-full justify-between min-h-10 h-auto py-2", className)}
        >
          <div className="flex flex-wrap gap-1 flex-1">
            {selectedNodes.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              selectedNodes.map(node => (
                <Badge
                  key={node.id}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {node.title}
                  <X
                    className="size-3 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemove(node.id)
                    }}
                  />
                </Badge>
              ))
            )}
          </div>
          <ChevronDown className="size-4 ml-2" />
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
          {nodes.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No tags</p>
          ) : (
            nodes.map((node) => (
              <MultiTreeItem
                key={node.id}
                node={node}
                values={values}
                onToggle={handleToggle}
                expandedIds={expandedIds}
                toggleExpanded={toggleExpanded}
                searchQuery={searchQuery}
              />
            ))
          )}
        </div>
        {selectedNodes.length > 0 && (
          <div className="p-2 border-t flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {selectedNodes.length} selected
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange([])}
            >
              Clear all
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
