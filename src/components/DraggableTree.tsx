/**
 * Draggable Tree Component - 可拖拽树形组件
 * 支持拖拽按钮、放置位置指示、约束检查
 */
import { useState, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  defaultDropAnimationSideEffects,
  DragOverlay,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type DropAnimation,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, ChevronRight, FolderIcon, FolderOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Folder, Project } from '@/types'
import { useTranslation } from 'react-i18next'

// ProjectTypeIcon 组件内联定义，避免循环导入
function ProjectTypeIcon({ type, className }: { type?: 'sequential' | 'parallel' | 'single_action'; className?: string }) {
  if (type === 'sequential') {
    return (
      <div className={`flex flex-col items-center gap-[2px] flex-shrink-0 w-4 ${className || ''}`}>
        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
        <div className="w-1.5 h-1.5 rounded-full bg-blue-500/40" />
        <div className="w-1.5 h-1.5 rounded-full bg-blue-500/40" />
      </div>
    )
  }
  if (type === 'parallel') {
    return (
      <div className={`flex items-center gap-[2px] flex-shrink-0 w-4 ${className || ''}`}>
        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
      </div>
    )
  }
  return (
    <div className={`flex items-center justify-center flex-shrink-0 w-4 ${className || ''}`}>
      <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
    </div>
  )
}

// 树节点类型
type TreeNodeType = 'folder' | 'project'

interface TreeNode {
  id: string
  type: TreeNodeType
  name: string
  children: TreeNode[]
  data: Folder | Project
  parentId?: string | null
}

// 放置位置
type DropPosition = 'before' | 'after' | 'inside' | null

interface DraggableTreeProps {
  items: TreeNode[]
  expandedItems: Set<string>
  selectedItem: { type: TreeNodeType; id: string } | null
  onToggleExpand: (id: string) => void
  onSelect: (item: TreeNode) => void
  onDoubleClick?: (item: TreeNode, e: React.MouseEvent) => void
  onMove: (activeId: string, overId: string | null, position: DropPosition) => void
  editingFolderId: string | null
  editFolderName: string
  onEditFolderNameChange: (name: string) => void
  onEditFolderSave: () => void
  onEditFolderKeyDown: (e: React.KeyboardEvent) => void
  renderItemCount?: (item: TreeNode) => React.ReactNode
  getItemClassName?: (item: TreeNode, isSelected: boolean) => string
}

// 单个树项组件
interface TreeItemProps {
  node: TreeNode
  depth: number
  isExpanded: boolean
  isSelected: boolean
  dropPosition: DropPosition
  onToggle: () => void
  onSelect: () => void
  onDoubleClick?: (e: React.MouseEvent) => void
  editingFolderId: string | null
  editFolderName: string
  onEditFolderNameChange: (name: string) => void
  onEditFolderSave: () => void
  onEditFolderKeyDown: (e: React.KeyboardEvent) => void
  renderItemCount?: (item: TreeNode) => React.ReactNode
  getItemClassName?: (item: TreeNode, isSelected: boolean) => string
}

function DraggableTreeItem({
  node,
  depth,
  isExpanded,
  isSelected,
  dropPosition,
  onToggle,
  onSelect,
  onDoubleClick,
  editingFolderId,
  editFolderName,
  onEditFolderNameChange,
  onEditFolderSave,
  onEditFolderKeyDown,
  renderItemCount,
  getItemClassName,
}: TreeItemProps) {
  const [isDragMode, setIsDragMode] = useState(false)
  
  const {
    setNodeRef: setDraggableRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `draggable-${node.id}`,
    data: {
      type: node.type,
      node,
      depth,
    },
    disabled: !isDragMode,
  })

  const {
    isOver,
    setNodeRef: setDroppableRef,
  } = useDroppable({
    id: `droppable-${node.id}`,
    data: {
      type: node.type,
      node,
      depth,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  }

  const hasChildren = node.children.length > 0
  const isFolder = node.type === 'folder'
  const isEditing = editingFolderId === node.id

  // 设置双 ref
  const setRefs = (el: HTMLElement | null) => {
    setDraggableRef(el)
    setDroppableRef(el)
  }

  // 放置位置指示线样式
  const getDropIndicator = () => {
    if (!isOver || !dropPosition) return null
    
    const baseClass = "absolute left-0 right-0 h-0.5 bg-primary z-50 pointer-events-none"
    
    switch (dropPosition) {
      case 'before':
        return <div className={`${baseClass} -top-0.5`} />
      case 'after':
        return <div className={`${baseClass} -bottom-0.5`} />
      case 'inside':
        return (
          <div className="absolute inset-0 border-2 border-primary rounded bg-primary/10 pointer-events-none z-40" />
        )
      default:
        return null
    }
  }

  const indentWidth = depth * 16

  return (
    <div
      ref={setRefs}
      style={style}
      className={cn(
        'relative group',
        isDragging && 'z-50'
      )}
    >
      {getDropIndicator()}
      
      <div
        className={cn(
          'flex items-center py-1.5 pr-2 text-sm select-none rounded-sm mx-1',
          'hover:bg-accent/40 transition-colors',
          isSelected && 'bg-accent',
          isOver && dropPosition === 'inside' && 'bg-primary/5',
          getItemClassName?.(node, isSelected)
        )}
        style={{ paddingLeft: `${8 + indentWidth}px` }}
        onClick={onSelect}
        onDoubleClick={onDoubleClick}
      >
        {/* 拖拽手柄按钮 */}
        <button
          type="button"
          onMouseDown={() => setIsDragMode(true)}
          onMouseUp={() => setIsDragMode(false)}
          onMouseLeave={() => setIsDragMode(false)}
          className={cn(
            "w-5 h-5 flex items-center justify-center flex-shrink-0 rounded",
            "cursor-grab active:cursor-grabbing hover:bg-muted-foreground/10",
            "opacity-0 group-hover:opacity-100 transition-opacity",
            isDragMode && "opacity-100 bg-primary/10"
          )}
          title={t('common.dragTooltip')}
        >
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
        </button>

        {/* 展开/折叠按钮 */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onToggle()
          }}
          className={cn(
            "w-5 h-5 flex items-center justify-center flex-shrink-0 rounded hover:bg-muted-foreground/10",
            !hasChildren && "invisible"
          )}
        >
          <ChevronRight
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-150",
              isExpanded && "rotate-90"
            )}
          />
        </button>

        {/* 图标 */}
        <div className="flex-shrink-0 ml-0.5">
          {isFolder ? (
            isExpanded ? (
              <FolderOpen className="h-4 w-4 text-amber-500" />
            ) : (
              <FolderIcon className="h-4 w-4 text-amber-500" />
            )
          ) : (
            <ProjectTypeIcon type={(node.data as Project).project_type} />
          )}
        </div>

        {/* 名称 */}
        <div className="flex-1 min-w-0 ml-2">
          {isEditing ? (
            <input
              type="text"
              value={editFolderName}
              onChange={(e) => onEditFolderNameChange(e.target.value)}
              onBlur={onEditFolderSave}
              onKeyDown={onEditFolderKeyDown}
              className="h-6 text-sm py-0 px-1 w-full border rounded"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="truncate block font-medium">{node.name}</span>
          )}
        </div>

        {/* 子项数量 */}
        {renderItemCount?.(node)}
      </div>
    </div>
  )
}

// 主组件
export function DraggableTree({
  items,
  expandedItems,
  selectedItem,
  onToggleExpand,
  onSelect,
  onDoubleClick,
  onMove,
  editingFolderId,
  editFolderName,
  onEditFolderNameChange,
  onEditFolderSave,
  onEditFolderKeyDown,
  renderItemCount,
  getItemClassName,
}: DraggableTreeProps) {
  const { t } = useTranslation()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [dropPosition, setDropPosition] = useState<DropPosition>(null)
  const [overId, setOverId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // 查找节点
  const findNode = useCallback((nodes: TreeNode[], id: string): TreeNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node
      if (node.children.length > 0) {
        const found = findNode(node.children, id)
        if (found) return found
      }
    }
    return null
  }, [])

  // 检查是否可以放置
  const canDrop = useCallback((
    activeNode: TreeNode,
    overNode: TreeNode,
    position: DropPosition
  ): boolean => {
    // folder 不能放入 project 下
    if (activeNode.type === 'folder' && overNode.type === 'project' && position === 'inside') {
      return false
    }
    // project 不能放入 project 下（只能平级或放入 folder）
    if (activeNode.type === 'project' && overNode.type === 'project' && position === 'inside') {
      return false
    }
    // 不能放入自己
    if (activeNode.id === overNode.id) {
      return false
    }
    // 不能放入自己的子级
    if (findNode(activeNode.children, overNode.id)) {
      return false
    }
    return true
  }, [findNode])

  // 计算放置位置
  const calculateDropPosition = useCallback((
    event: DragOverEvent
  ): DropPosition => {
    const { active, over } = event
    if (!over) return null

    const activeRect = active.rect.current.translated
    const overRect = over.rect

    if (!activeRect || !overRect) return null

    const activeCenterY = activeRect.top + activeRect.height / 2
    const overTop = overRect.top
    const overHeight = overRect.height

    // 计算相对位置
    const relativeY = activeCenterY - overTop
    const threshold = overHeight / 3

    if (relativeY < threshold) {
      return 'before'
    } else if (relativeY > overHeight - threshold) {
      return 'after'
    } else {
      return 'inside'
    }
  }, [])

  // 拖拽开始
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  // 拖拽经过
  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event
    
    if (!over) {
      setDropPosition(null)
      setOverId(null)
      return
    }

    const position = calculateDropPosition(event)
    setDropPosition(position)
    setOverId(over.id as string)
  }

  // 拖拽结束
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    setActiveId(null)
    setDropPosition(null)
    setOverId(null)

    if (!over) return

    const activeNode = findNode(items, active.id.toString().replace('draggable-', ''))
    const overNode = findNode(items, over.id.toString().replace('droppable-', ''))

    if (!activeNode || !overNode) return

    // 检查约束
    if (!canDrop(activeNode, overNode, dropPosition)) {
      toast?.error(t('common.cannotDropHere'))
      return
    }

    if (activeNode.id !== overNode.id) {
      onMove(
        activeNode.id,
        overNode.id,
        dropPosition
      )
    }
  }

  // 递归渲染树
  const renderTree = (nodes: TreeNode[], depth = 0) => {
    return nodes.map((node) => {
      const isExpanded = expandedItems.has(node.id)
      const isSelected = selectedItem?.id === node.id && selectedItem?.type === node.type
      const currentDropPosition = overId === `droppable-${node.id}` ? dropPosition : null

      return (
        <div key={node.id}>
          <DraggableTreeItem
            node={node}
            depth={depth}
            isExpanded={isExpanded}
            isSelected={isSelected}
            dropPosition={currentDropPosition}
            onToggle={() => onToggleExpand(node.id)}
            onSelect={() => onSelect(node)}
            onDoubleClick={onDoubleClick ? (e) => onDoubleClick(node, e) : undefined}
            editingFolderId={editingFolderId}
            editFolderName={editFolderName}
            onEditFolderNameChange={onEditFolderNameChange}
            onEditFolderSave={onEditFolderSave}
            onEditFolderKeyDown={onEditFolderKeyDown}
            renderItemCount={renderItemCount}
            getItemClassName={getItemClassName}
          />
          
          {isExpanded && node.children.length > 0 && (
            <div className="relative">
              {/* 缩进线 */}
              <div
                className="absolute left-0 top-0 bottom-0 w-px bg-border/50"
                style={{ left: `${12 + depth * 16 + 10}px` }}
              />
              {renderTree(node.children, depth + 1)}
            </div>
          )}
        </div>
      )
    })
  }

  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.5',
        },
      },
    }),
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-0.5">
        {renderTree(items)}
      </div>
      
      <DragOverlay dropAnimation={dropAnimation}>
        {activeId ? (
          <div className="bg-accent/80 p-2 rounded shadow-lg border opacity-90">
            拖拽中...
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

// 简化版 toast 提示
const toast = {
  error: (message: string) => {
    console.error(message)
  }
}

export type { TreeNode, DropPosition }
