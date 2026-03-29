/**
 * Task Flag Icons - 任务标记图标
 * 
 * 显示 is_important 和 is_urgent 两种标记状态
 * - 重要 (Important): 橙色旗帜/星标
 * - 紧急 (Urgent): 红色闪电/火焰
 */

import { Flag, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TaskFlagIconsProps {
  isImportant?: boolean
  isUrgent?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showBoth?: boolean
}

const sizeMap = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5'
}

/**
 * 任务标记图标组件
 * 
 * 显示规则：
 * - 仅重要：橙色旗帜
 * - 仅紧急：红色闪电
 * - 两者都有：同时显示两个图标或组合图标
 */
export function TaskFlagIcons({ 
  isImportant, 
  isUrgent, 
  size = 'sm',
  className,
  showBoth = true
}: TaskFlagIconsProps) {
  const iconSize = sizeMap[size]
  
  // 两者都没有
  if (!isImportant && !isUrgent) {
    return null
  }
  
  // 两者都有
  if (isImportant && isUrgent && showBoth) {
    return (
      <div className={cn("flex items-center gap-0.5", className)}>
        {/* 重要标记 - 橙色 */}
        <Flag className={cn(iconSize, "text-orange-500 fill-orange-500")} />
        {/* 紧急标记 - 红色 */}
        <Zap className={cn(iconSize, "text-red-500 fill-red-500")} />
      </div>
    )
  }
  
  // 仅重要
  if (isImportant) {
    return (
      <Flag 
        className={cn(
          iconSize, 
          "text-orange-500 fill-orange-500",
          className
        )} 
      />
    )
  }
  
  // 仅紧急
  return (
    <Zap 
      className={cn(
        iconSize, 
        "text-red-500 fill-red-500",
        className
      )} 
    />
  )
}

/**
 * 重要标记按钮
 */
export function ImportantButton({ 
  isImportant, 
  onClick,
  size = 'md',
  className
}: { 
  isImportant: boolean
  onClick: () => void
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const iconSize = sizeMap[size]
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-1.5 rounded-md transition-colors",
        isImportant 
          ? "bg-orange-100 text-orange-600 hover:bg-orange-200" 
          : "text-muted-foreground hover:bg-muted hover:text-orange-500",
        className
      )}
      title={isImportant ? "取消重要标记" : "标记为重要"}
    >
      <Flag className={cn(iconSize, isImportant && "fill-current")} />
    </button>
  )
}

/**
 * 紧急标记按钮
 */
export function UrgentButton({ 
  isUrgent, 
  onClick,
  size = 'md',
  className
}: { 
  isUrgent: boolean
  onClick: () => void
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const iconSize = sizeMap[size]
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-1.5 rounded-md transition-colors",
        isUrgent 
          ? "bg-red-100 text-red-600 hover:bg-red-200" 
          : "text-muted-foreground hover:bg-muted hover:text-red-500",
        className
      )}
      title={isUrgent ? "取消紧急标记" : "标记为紧急"}
    >
      <Zap className={cn(iconSize, isUrgent && "fill-current")} />
    </button>
  )
}

/**
 * 双标记控制器
 * 
 * 同时显示重要和紧急两个按钮
 */
export function FlagControls({
  isImportant,
  isUrgent,
  onToggleImportant,
  onToggleUrgent,
  size = 'md',
  className
}: {
  isImportant: boolean
  isUrgent: boolean
  onToggleImportant: () => void
  onToggleUrgent: () => void
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <ImportantButton
        isImportant={isImportant}
        onClick={onToggleImportant}
        size={size}
      />
      <UrgentButton
        isUrgent={isUrgent}
        onClick={onToggleUrgent}
        size={size}
      />
    </div>
  )
}

export default TaskFlagIcons
