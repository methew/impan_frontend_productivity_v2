/**
 * Virtual List - 虚拟滚动列表
 * 
 * 用于处理大量任务/项目的渲染性能优化
 */

import { useRef, useCallback } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { cn } from '@/lib/utils'

interface VirtualListProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  getItemId: (item: T) => string
  itemHeight: number
  overscan?: number
  className?: string
  onEndReached?: () => void
  endReachedThreshold?: number
}

export function VirtualList<T>({
  items,
  renderItem,
  getItemId,
  itemHeight,
  overscan = 5,
  className,
  onEndReached,
  endReachedThreshold = 200
}: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan,
    getItemKey: (index) => getItemId(items[index])
  })

  // Handle end reached
  const handleScroll = useCallback(() => {
    if (!onEndReached || !parentRef.current) return
    
    const { scrollTop, scrollHeight, clientHeight } = parentRef.current
    const scrollBottom = scrollHeight - scrollTop - clientHeight
    
    if (scrollBottom < endReachedThreshold) {
      onEndReached()
    }
  }, [onEndReached, endReachedThreshold])

  const virtualItems = virtualizer.getVirtualItems()

  return (
    <div
      ref={parentRef}
      onScroll={handleScroll}
      className={cn("overflow-auto", className)}
      style={{ contain: 'strict' }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative'
        }}
      >
        {virtualItems.map((virtualItem) => {
          const item = items[virtualItem.index]
          return (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`
              }}
            >
              {renderItem(item, virtualItem.index)}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default VirtualList
