/**
 * SearchableSelect - 可搜索的选择器
 * 基础组件，提供搜索过滤功能
 */
import { useState, useMemo } from 'react'
import { Search, X, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/packages/ui/components/button'
import { Input } from '@/packages/ui/components/input'
import { ScrollArea } from '@/packages/ui/components/scroll-area'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/packages/ui/components/popover'
import { cn } from '@/lib/utils'

export interface SearchableSelectOption {
  id: number | string
  label: string
  description?: string
  disabled?: boolean
  metadata?: Record<string, any>
}

export interface SearchableSelectProps {
  /** 当前选中的值 */
  value?: number | string | null
  /** 值变化回调 */
  onChange: (value: number | string | null) => void
  /** 选项列表 */
  options: SearchableSelectOption[]
  /** 占位符文本 */
  placeholder?: string
  /** 搜索占位符文本 */
  searchPlaceholder?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 加载状态 */
  loading?: boolean
  /** 错误状态 */
  error?: boolean
  /** 错误信息 */
  errorMessage?: string
  /** 是否允许清除 */
  clearable?: boolean
  /** 自定义显示文本（覆盖默认显示） */
  displayValue?: string
  /** 自定义类名 */
  className?: string
  /** 选择器宽度 */
  width?: string | number
  /** 最大高度 */
  maxHeight?: number
  /** 空状态文本 */
  emptyText?: string
  /** 标签 */
  label?: string
}

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder,
  disabled = false,
  loading = false,
  error = false,
  errorMessage,
  clearable = true,
  displayValue,
  className,
  width = '100%',
  maxHeight = 300,
  emptyText = 'No results found',
  label,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // 过滤选项
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options
    const query = searchQuery.toLowerCase()
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(query) ||
        opt.description?.toLowerCase().includes(query)
    )
  }, [options, searchQuery])

  // 获取选中的选项
  const selectedOption = useMemo(() => {
    if (value === null || value === undefined) return null
    return options.find((opt) => String(opt.id) === String(value))
  }, [options, value])

  // 显示文本
  const displayText = displayValue ?? selectedOption?.label

  // 处理选择
  const handleSelect = (id: number | string) => {
    onChange(id)
    setOpen(false)
    setSearchQuery('')
  }

  // 处理清除
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(null)
  }

  // 宽度样式
  const widthStyle = typeof width === 'number' ? `${width}px` : width

  return (
    <div className={cn('space-y-2', className)} style={{ width: widthStyle }}>
      {label && (
        <label className="text-sm font-medium text-foreground">{label}</label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled || loading}
            className={cn(
              'w-full justify-between',
              error && 'border-red-500 focus-visible:ring-red-500',
              !displayText && 'text-muted-foreground'
            )}
          >
            <span className="truncate">
              {displayText || placeholder || 'Select...'}
            </span>
            <div className="flex items-center gap-1 ml-2">
              {displayText && clearable && !disabled && (
                <X
                  className="size-4 text-muted-foreground hover:text-foreground shrink-0"
                  onClick={handleClear}
                />
              )}
              {loading ? (
                <Loader2 className="size-4 animate-spin shrink-0" />
              ) : error ? (
                <AlertCircle className="size-4 text-red-500 shrink-0" />
              ) : null}
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0" style={{ width: widthStyle }}>
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder || 'Search...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <ScrollArea style={{ maxHeight }}>
            <div className="p-1">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                  {emptyText}
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <div
                    key={option.id}
                    className={cn(
                      'flex flex-col px-3 py-2 rounded-md cursor-pointer hover:bg-accent',
                      String(value) === String(option.id) && 'bg-primary/10',
                      option.disabled && 'opacity-50 cursor-not-allowed'
                    )}
                    onClick={() =>
                      !option.disabled && handleSelect(option.id)
                    }
                  >
                    <span className="text-sm font-medium">{option.label}</span>
                    {option.description && (
                      <span className="text-xs text-muted-foreground truncate">
                        {option.description}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
      {error && errorMessage && (
        <p className="text-xs text-red-500">{errorMessage}</p>
      )}
    </div>
  )
}
