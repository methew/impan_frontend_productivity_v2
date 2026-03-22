/**
 * Kanban Board - 看板视图
 * 
 * 类似 Trello 的拖拽看板，支持任务状态流转
 * 状态列：待办 → 进行中 → 已完成
 */

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  defaultDropAnimationSideEffects,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
  type DropAnimation
} from '@dnd-kit/core'
import { 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, Calendar, Flag } from 'lucide-react'
import { Button } from '@/packages/ui/components/button'
import { Badge } from '@/packages/ui/components/badge'
import { cn } from '@/lib/utils'
import type { Task } from '@/types'

// ============================================================================
// Types
// ============================================================================

type TaskStatus = 'todo' | 'in_progress' | 'done'

interface KanbanColumn {
  id: TaskStatus
  title: string
  color: string
}

interface KanbanTask extends Task {
  status: TaskStatus
}

interface KanbanBoardProps {
  tasks: Task[]
  onTaskMove?: (taskId: string, newStatus: TaskStatus) => void
  onTaskClick?: (task: Task) => void
  onAddTask?: (status: TaskStatus) => void
}

const columns: KanbanColumn[] = [
  { id: 'todo', title: '待办', color: 'bg-slate-100' },
  { id: 'in_progress', title: '进行中', color: 'bg-blue-50' },
  { id: 'done', title: '已完成', color: 'bg-green-50' },
]

// ============================================================================
// Kanban Card Component
// ============================================================================

interface KanbanCardProps {
  task: KanbanTask
  onClick?: () => void
  isOverlay?: boolean
}

function KanbanCard({ task, onClick, isOverlay }: KanbanCardProps) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: task.id,
    data: { task }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && !task.completed_at
  const isDueSoon = task.due_date && !isOverdue && !task.completed_at &&
    new Date(task.due_date).getTime() - Date.now() < 24 * 60 * 60 * 1000

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      onClick={onClick}
      className={cn(
        "bg-white rounded-lg border p-3 cursor-grab active:cursor-grabbing",
        "hover:shadow-md transition-shadow",
        isOverlay && "shadow-xl rotate-2 cursor-grabbing",
        isDragging && "opacity-50"
      )}
    >
      {/* Title */}
      <p className="text-sm font-medium mb-2 line-clamp-2">{task.title}</p>

      {/* Tags & Meta */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {task.flagged && (
            <Flag className="h-3.5 w-3.5 text-orange-500 fill-orange-500" />
          )}
          {task.tags && task.tags.length > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1 py-0">
              {task.tags.length}
            </Badge>
          )}
        </div>

        {task.due_date && (
          <div className={cn(
            "flex items-center gap-1 text-xs",
            isOverdue && "text-red-500",
            isDueSoon && "text-amber-500"
          )}>
            <Calendar className="h-3 w-3" />
            {new Date(task.due_date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Kanban Column Component
// ============================================================================

interface KanbanColumnProps {
  column: KanbanColumn
  tasks: KanbanTask[]
  onTaskClick?: (task: Task) => void
  onAddTask?: () => void
}

function KanbanColumnComponent({ column, tasks, onTaskClick, onAddTask }: KanbanColumnProps) {
  const { setNodeRef } = useSortable({
    id: column.id,
    data: { column }
  })

  const taskIds = useMemo(() => tasks.map(t => t.id), [tasks])

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col rounded-lg w-80 min-w-[320px] max-w-[320px]",
        column.color
      )}
    >
      {/* Column Header */}
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-sm">{column.title}</h3>
          <Badge variant="secondary" className="text-xs">
            {tasks.length}
          </Badge>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7"
          onClick={onAddTask}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Tasks Container */}
      <div className="flex-1 p-2 space-y-2 min-h-[200px]">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <KanbanCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick?.(task)}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  )
}

// ============================================================================
// Main Kanban Board
// ============================================================================

export function KanbanBoard({ tasks, onTaskMove, onTaskClick, onAddTask }: KanbanBoardProps) {
  useTranslation() // Keep hook for future i18n
  const [activeTask, setActiveTask] = useState<KanbanTask | null>(null)

  // Convert tasks to kanban tasks with status
  const kanbanTasks = useMemo(() => {
    return tasks.map(task => {
      let status: TaskStatus = 'todo'
      if (task.completed_at) {
        status = 'done'
      } else if (task.dropped_at) {
        status = 'done'
      } else if (task.defer_date && new Date(task.defer_date) <= new Date()) {
        status = 'in_progress'
      }
      return { ...task, status }
    })
  }, [tasks])

  // Group tasks by status
  const tasksByColumn = useMemo(() => {
    return {
      todo: kanbanTasks.filter(t => t.status === 'todo'),
      in_progress: kanbanTasks.filter(t => t.status === 'in_progress'),
      done: kanbanTasks.filter(t => t.status === 'done')
    }
  }, [kanbanTasks])

  // Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const task = kanbanTasks.find(t => t.id === active.id)
    if (task) {
      setActiveTask(task)
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Find the column we're over
    const overColumn = columns.find(c => c.id === overId)
    if (overColumn) {
      // Moving over a column (not a task)
      const activeTask = kanbanTasks.find(t => t.id === activeId)
      if (activeTask && activeTask.status !== overColumn.id) {
        onTaskMove?.(activeId, overColumn.id)
      }
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Find if we're dropping on a column or a task
    const overColumn = columns.find(c => c.id === overId)
    const overTask = kanbanTasks.find(t => t.id === overId)

    if (overColumn) {
      // Dropped on a column
      onTaskMove?.(activeId, overColumn.id)
    } else if (overTask) {
      // Dropped on a task - determine which column
      onTaskMove?.(activeId, overTask.status)
    }
  }

  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: { opacity: '0.5' }
      }
    })
  }

  return (
    <div className="h-full overflow-x-auto">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 p-4 min-w-fit h-full">
          {columns.map(column => (
            <KanbanColumnComponent
              key={column.id}
              column={column}
              tasks={tasksByColumn[column.id]}
              onTaskClick={onTaskClick}
              onAddTask={() => onAddTask?.(column.id)}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={dropAnimation}>
          {activeTask ? (
            <KanbanCard task={activeTask} isOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

export default KanbanBoard
