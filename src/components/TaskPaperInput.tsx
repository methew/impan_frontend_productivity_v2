/**
 * TaskPaper 风格快速输入组件
 * 
 * 支持语法：
 * - 任务: `- 任务标题 @tag @due(2024-01-15)`
 * - 项目: `项目名称:`
 * - 标签: `@tag`, `@tag(value)`
 * - 特殊标签: @high/@important(重要), @urgent(紧急), @today(今天), @done(已完成)
 * - 日期: @due(YYYY-MM-DD), @defer(YYYY-MM-DD), @start(HH:mm), @end(HH:mm)
 * - 时长: @estimate(30min) 或 @estimate(1h)
 * 
 * 快捷键:
 * - Cmd/Ctrl + Enter: 提交
 * - Esc: 取消
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { Button } from '@/packages/ui/components/button'
import { Textarea } from '@/packages/ui/components/textarea'
import { Badge } from '@/packages/ui/components/badge'
import { 
  Lightbulb, 
  Send, 
  X, 
  CheckCircle2, 
  Circle,
  Calendar,
  Tag,
  Clock,
  Flag,
  Zap,
  FolderKanban
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'
import { format, parseISO, isValid } from 'date-fns'
import { toast } from 'sonner'

// ============================================================================
// Types
// ============================================================================

export interface TaskPaperTask {
  title: string
  project?: string
  folder?: string
  parent?: string
  level: number
  tags: string[]
  dueDate?: string
  deferDate?: string
  isImportant: boolean
  isUrgent: boolean
  isDone: boolean
  isToday: boolean
  estimatedMinutes?: number
  note?: string
}

export interface TaskPaperFolder {
  name: string
  originalName: string
  indent: number
  parent?: string      // 父文件夹名称（用于多级层级）
  fullPath: string     // 完整路径，如 "工作/开发/后端"
}

export interface TaskPaperProject {
  name: string
  folderName?: string  // 所属文件夹的完整路径
  folderPath?: string  // 兼容旧版本，同 folderName
  indent: number
  isFolder: boolean
}

interface ParsedLine {
  raw: string
  type: 'task' | 'project' | 'note' | 'empty'
  content: string
  indent: number
  tags: string[]
  dueDate?: string
  deferDate?: string
  isImportant: boolean
  isUrgent: boolean
  isDone: boolean
  isToday: boolean
  isFolder: boolean
  folderName?: string
  estimatedMinutes?: number
}

interface TaskPaperInputProps {
  onSubmit: (tasks: TaskPaperTask[]) => Promise<void> | void
  onCancel?: () => void
  placeholder?: string
  className?: string
  autoFocus?: boolean
  onParsed?: (result: { tasks: TaskPaperTask[]; folders: TaskPaperFolder[]; projects: TaskPaperProject[] }) => void
}

// ============================================================================
// Parser
// ============================================================================

/**
 * 解析单行 TaskPaper 格式
 */
function parseTaskPaperLine(line: string): ParsedLine {
  const raw = line
  const indentMatch = line.match(/^(\s*)/)
  const indent = indentMatch ? indentMatch[1].length : 0
  const trimmed = line.trim()
  
  // 空行
  if (!trimmed) {
    return { raw, type: 'empty', content: '', indent, tags: [], isImportant: false, isUrgent: false, isDone: false, isToday: false, isFolder: false }
  }
  
  // 项目 (以 : 结尾)
  if (trimmed.endsWith(':') && !trimmed.startsWith('-')) {
    let content = trimmed.slice(0, -1).trim()
    const tags: string[] = []
    let isFolder = false
    let folderName: string | undefined
    
    // 提取标签 @tag 或 @tag(value)
    const tagRegex = /@(\w+)(?:\(([^)]*)\))?/g
    let match
    const matchedTags: Array<{ full: string; name: string; value?: string }> = []
    
    while ((match = tagRegex.exec(content)) !== null) {
      matchedTags.push({ full: match[0], name: match[1], value: match[2] })
    }
    
    // 处理标签
    matchedTags.forEach(({ full, name, value }) => {
      // 从内容中移除标签
      content = content.replace(full, '').trim()
      
      if (name.toLowerCase() === 'folder') {
        isFolder = true
        folderName = value
      } else {
        tags.push(value ? `${name}(${value})` : name)
      }
    })
    
    return { raw, type: 'project', content, indent, tags, isImportant: false, isUrgent: false, isDone: false, isToday: false, isFolder, folderName }
  }
  
  // 笔记 (不以 - 开头)
  if (!trimmed.startsWith('-')) {
    return { raw, type: 'note', content: trimmed, indent, tags: [], isImportant: false, isUrgent: false, isDone: false, isToday: false, isFolder: false }
  }
  
  // 任务 (以 - 开头)
  let content = trimmed.slice(1).trim()
  const tags: string[] = []
  let dueDate: string | undefined
  let deferDate: string | undefined
  let isImportant = false
  let isUrgent = false
  let isDone = false
  let isToday = false
  let estimatedMinutes: number | undefined
  
  // 提取标签 @tag 或 @tag(value)
  const tagRegex = /@(\w+)(?:\(([^)]*)\))?/g
  let match
  const matchedTags: Array<{ full: string; name: string; value?: string }> = []
  
  while ((match = tagRegex.exec(content)) !== null) {
    matchedTags.push({ full: match[0], name: match[1], value: match[2] })
  }
  
  // 处理标签
  matchedTags.forEach(({ full, name, value }) => {
    // 从内容中移除标签
    content = content.replace(full, '').trim()
    
    switch (name.toLowerCase()) {
      case 'due':
        if (value) {
          // 支持相对日期
          const date = parseRelativeDate(value)
          if (date) dueDate = date.toISOString()
        }
        break
      case 'defer':
      case 'startdate':
        if (value) {
          const date = parseRelativeDate(value)
          if (date) deferDate = date.toISOString()
        }
        break
      case 'high':
      case 'important':
        isImportant = true
        break
      case 'urgent':
        isUrgent = true
        break
      case 'today':
        isToday = true
        break
      case 'done':
        isDone = true
        break
      case 'estimate':
      case 'est':
      case 'time':
        if (value) {
          estimatedMinutes = parseDuration(value)
        }
        break
      case 'start':
        // 开始时间，与 defer 结合使用
        if (value && deferDate) {
          const [hours, minutes] = value.split(':').map(Number)
          const date = new Date(deferDate)
          date.setHours(hours || 0, minutes || 0, 0, 0)
          deferDate = date.toISOString()
        }
        break
      case 'end':
        // 结束时间，与 due 结合使用
        if (value && dueDate) {
          const [hours, minutes] = value.split(':').map(Number)
          const date = new Date(dueDate)
          date.setHours(hours || 0, minutes || 0, 0, 0)
          dueDate = date.toISOString()
        }
        break
      default:
        tags.push(value ? `${name}(${value})` : name)
    }
  })
  
  // 清理多余空格
  content = content.replace(/\s+/g, ' ').trim()
  
  return {
    raw,
    type: 'task',
    content,
    indent,
    tags,
    dueDate,
    deferDate,
    isImportant,
    isUrgent,
    isDone,
    isToday,
    isFolder: false,
    estimatedMinutes
  }
}

/**
 * 解析相对日期
 */
function parseRelativeDate(input: string): Date | null {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const lower = input.toLowerCase().trim()
  
  // 特殊关键字
  switch (lower) {
    case 'today':
    case '今天':
      return today
    case 'tomorrow':
    case '明天':
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      return tomorrow
    case 'yesterday':
    case '昨天':
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      return yesterday
    case 'next week':
    case '下周':
      const nextWeek = new Date(today)
      nextWeek.setDate(nextWeek.getDate() + 7)
      return nextWeek
  }
  
  // 星期几
  const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const weekdayIndex = weekdays.indexOf(lower)
  if (weekdayIndex !== -1) {
    const currentDay = today.getDay()
    const daysUntil = (weekdayIndex - currentDay + 7) % 7
    const targetDate = new Date(today)
    targetDate.setDate(targetDate.getDate() + (daysUntil === 0 ? 7 : daysUntil))
    return targetDate
  }
  
  // 中文星期
  const cnWeekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const cnWeekdayFull = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  const cnIndex = [...cnWeekdays, ...cnWeekdayFull].indexOf(input)
  if (cnIndex !== -1) {
    const targetWeekday = cnIndex % 7
    const currentDay = today.getDay()
    const daysUntil = (targetWeekday - currentDay + 7) % 7
    const targetDate = new Date(today)
    targetDate.setDate(targetDate.getDate() + (daysUntil === 0 ? 7 : daysUntil))
    return targetDate
  }
  
  // ISO 日期格式 YYYY-MM-DD
  const isoDate = parseISO(input)
  if (isValid(isoDate)) {
    return isoDate
  }
  
  // 尝试其他格式
  const tryDate = new Date(input)
  if (isValid(tryDate) && !isNaN(tryDate.getTime())) {
    return tryDate
  }
  
  return null
}

/**
 * 解析时长
 */
function parseDuration(input: string): number | undefined {
  const lower = input.toLowerCase().trim()
  
  // 纯数字，视为分钟
  const numMatch = lower.match(/^(\d+)$/)
  if (numMatch) {
    return parseInt(numMatch[1], 10)
  }
  
  // 30min, 1h, 1.5h, 90m 等
  const hourMatch = lower.match(/^(?:(\d*\.?\d+)\s*h(?:ours?)?|(\d+)\s*h(?:ours?)?\s*(\d+)\s*m(?:in)?)$/)
  if (hourMatch) {
    if (hourMatch[1]) {
      return Math.round(parseFloat(hourMatch[1]) * 60)
    }
    return parseInt(hourMatch[2], 10) * 60 + parseInt(hourMatch[3] || '0', 10)
  }
  
  const minMatch = lower.match(/^(\d+)\s*m(?:in)?$/)
  if (minMatch) {
    return parseInt(minMatch[1], 10)
  }
  
  return undefined
}

/**
 * 解析多行 TaskPaper 文本
 */
function parseTaskPaperText(text: string): { 
  tasks: TaskPaperTask[]
  folders: TaskPaperFolder[]
  projects: TaskPaperProject[]
  preview: ParsedLine[] 
} {
  const lines = text.split('\n')
  const parsed = lines.map(parseTaskPaperLine)
  
  const tasks: TaskPaperTask[] = []
  const folders: TaskPaperFolder[] = []
  const projects: TaskPaperProject[] = []
  
  // 使用栈来跟踪当前层级
  // folderStack: 跟踪 Folder 层级，用于多级 Folder 支持
  const folderStack: Array<{ name: string; indent: number; fullPath: string }> = []
  // projectStack: 跟踪项目层级
  const projectStack: Array<{ name: string; indent: number; folderPath: string; isFolder: boolean }> = []
  const taskStack: Array<{ title: string; indent: number; level: number }> = []
  let lastNote: string | undefined
  
  parsed.forEach((line) => {
    // 跟踪当前项目/Folder
    if (line.type === 'project') {
      if (line.isFolder) {
        // 这是一个 Folder - 使用 folderStack 跟踪
        // 根据缩进调整 folderStack
        while (folderStack.length > 0 && folderStack[folderStack.length - 1].indent >= line.indent) {
          folderStack.pop()
        }
        
        const parentFolder = folderStack.length > 0 ? folderStack[folderStack.length - 1] : undefined
        const folderName = line.folderName || line.content
        // 构建完整路径: 父路径/当前名称
        const fullPath = parentFolder ? `${parentFolder.fullPath}/${folderName}` : folderName
        
        folders.push({
          name: folderName,
          originalName: line.content,
          indent: line.indent,
          parent: parentFolder?.name,
          fullPath
        })
        
        folderStack.push({
          name: folderName,
          indent: line.indent,
          fullPath
        })
        
        // 同时更新 projectStack 用于后续项目查找
        projectStack.length = 0 // Folder 层级变化时清空 projectStack
        projectStack.push({
          name: folderName,
          indent: line.indent,
          folderPath: fullPath,
          isFolder: true
        })
      } else {
        // 这是一个普通项目
        // 根据缩进调整 projectStack
        while (projectStack.length > 0 && projectStack[projectStack.length - 1].indent >= line.indent) {
          projectStack.pop()
        }
        
        // 获取当前 Folder 路径（从 folderStack 或 projectStack）
        let folderPath: string | undefined
        if (folderStack.length > 0) {
          folderPath = folderStack[folderStack.length - 1].fullPath
        }
        
        projects.push({
          name: line.content,
          folderName: folderPath,
          folderPath,
          indent: line.indent,
          isFolder: false
        })
        
        projectStack.push({
          name: line.content,
          indent: line.indent,
          folderPath: folderPath || '',
          isFolder: false
        })
      }
      
      // 清空任务栈（新项目/Folder开始）
      taskStack.length = 0
      lastNote = undefined
      return
    }
    
    // 收集笔记（跟在任务后面）
    if (line.type === 'note') {
      lastNote = line.content
      return
    }
    
    // 处理任务
    if (line.type === 'task' && line.content) {
      // 根据缩进调整任务栈
      while (taskStack.length > 0 && taskStack[taskStack.length - 1].indent >= line.indent) {
        taskStack.pop()
      }
      
      // 根据缩进找到对应的项目
      let currentProject: TaskPaperProject | undefined
      for (let i = projectStack.length - 1; i >= 0; i--) {
        if (projectStack[i].indent < line.indent && !projectStack[i].isFolder) {
          currentProject = {
            name: projectStack[i].name,
            folderName: projectStack[i].folderPath,
            folderPath: projectStack[i].folderPath,
            indent: projectStack[i].indent,
            isFolder: false
          }
          break
        }
      }
      
      // 确定父任务和层级
      const parentTask = taskStack.length > 0 ? taskStack[taskStack.length - 1] : undefined
      const level = parentTask ? parentTask.level + 1 : 0
      
      const task: TaskPaperTask = {
        title: line.content,
        project: currentProject?.name,
        folder: currentProject?.folderName,
        parent: parentTask?.title,
        level,
        tags: line.tags,
        dueDate: line.dueDate,
        deferDate: line.deferDate,
        isImportant: line.isImportant,
        isUrgent: line.isUrgent,
        isDone: line.isDone,
        isToday: line.isToday,
        estimatedMinutes: line.estimatedMinutes,
        note: lastNote
      }
      tasks.push(task)
      
      // 将当前任务加入栈
      taskStack.push({ title: line.content, indent: line.indent, level })
      lastNote = undefined
    }
  })
  
  return { tasks, folders, projects, preview: parsed }
}

// ============================================================================
// Preview Component
// ============================================================================

function LinePreview({ line }: { line: ParsedLine }) {
  if (line.type === 'empty') {
    return <div className="h-4" />
  }
  
  if (line.type === 'project') {
    const isFolder = line.isFolder
    return (
      <div 
        className="flex items-center gap-2 py-1"
        style={{ paddingLeft: `${line.indent * 12}px` }}
      >
        {isFolder ? (
          <>
            <FolderKanban className="h-4 w-4 text-amber-600" />
            <span className="font-semibold text-amber-700">
              {line.folderName || line.content}
            </span>
            <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700 border-amber-200">Folder</Badge>
          </>
        ) : (
          <>
            <FolderKanban className="h-4 w-4 text-blue-500" />
            <span className="font-semibold text-blue-700">{line.content}</span>
            <Badge variant="secondary" className="text-[10px]">项目</Badge>
          </>
        )}
      </div>
    )
  }
  
  if (line.type === 'note') {
    return (
      <div className="flex items-start gap-2 py-0.5 pl-6">
        <span className="text-xs text-muted-foreground italic">{line.content}</span>
      </div>
    )
  }
  
  // Task
  return (
    <div 
      className="flex items-start gap-2 py-0.5"
      style={{ paddingLeft: `${line.indent * 12}px` }}
    >
      {line.isDone ? (
        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
      ) : (
        <Circle className="h-4 w-4 text-muted-foreground mt-0.5" />
      )}
      <div className="flex-1 min-w-0">
        <span className={cn(
          "text-sm",
          line.isDone && "line-through text-muted-foreground"
        )}>
          {line.content}
        </span>
        <div className="flex flex-wrap items-center gap-1 mt-0.5">
          {line.isImportant && (
            <Badge variant="secondary" className="h-4 text-[10px] bg-orange-100 text-orange-700 border-orange-200">
              <Flag className="h-2.5 w-2.5 mr-0.5" />
              重要
            </Badge>
          )}
          {line.isUrgent && (
            <Badge variant="secondary" className="h-4 text-[10px] bg-red-100 text-red-700 border-red-200">
              <Zap className="h-2.5 w-2.5 mr-0.5" />
              紧急
            </Badge>
          )}
          {line.isToday && (
            <Badge variant="secondary" className="h-4 text-[10px] bg-blue-100 text-blue-700 border-blue-200">
              <Calendar className="h-2.5 w-2.5 mr-0.5" />
              今天
            </Badge>
          )}
          {line.dueDate && (
            <Badge variant="secondary" className="h-4 text-[10px]">
              <Calendar className="h-2.5 w-2.5 mr-0.5" />
              截止: {format(parseISO(line.dueDate), 'MM-dd')}
            </Badge>
          )}
          {line.deferDate && (
            <Badge variant="secondary" className="h-4 text-[10px]">
              <Clock className="h-2.5 w-2.5 mr-0.5" />
              开始: {format(parseISO(line.deferDate), 'MM-dd')}
            </Badge>
          )}
          {line.estimatedMinutes && (
            <Badge variant="secondary" className="h-4 text-[10px]">
              <Clock className="h-2.5 w-2.5 mr-0.5" />
              {line.estimatedMinutes}分钟
            </Badge>
          )}
          {line.tags.map((tag, i) => (
            <Badge key={i} variant="outline" className="h-4 text-[10px]">
              <Tag className="h-2.5 w-2.5 mr-0.5" />
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function TaskPaperInput({
  onSubmit,
  onCancel,
  placeholder,
  className,
  autoFocus = true,
  onParsed
}: TaskPaperInputProps) {
  useTranslation() // 保留 hook 调用以维持上下文
  const [text, setText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // 解析预览
  const { tasks, folders, projects, preview } = useMemo(() => {
    return parseTaskPaperText(text)
  }, [text])
  
  // 当解析结果变化时，通知父组件
  useEffect(() => {
    onParsed?.({ tasks, folders, projects })
  }, [tasks, folders, projects, onParsed])
  
  // 自动调整高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.max(120, textareaRef.current.scrollHeight)}px`
    }
  }, [text])
  
  // 聚焦
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [autoFocus])
  
  // 提交处理
  const handleSubmit = useCallback(async () => {
    if (tasks.length === 0) {
      toast.error('请输入至少一个任务')
      return
    }
    
    setIsSubmitting(true)
    try {
      await onSubmit(tasks)
      setText('')
      toast.success(`成功创建 ${tasks.length} 个任务`)
    } catch (error) {
      toast.error('创建任务失败')
    } finally {
      setIsSubmitting(false)
    }
  }, [tasks, onSubmit])
  
  // 键盘快捷键
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
    if (e.key === 'Escape') {
      onCancel?.()
    }
  }, [handleSubmit, onCancel])
  
  // 示例文本 - 展示了 TaskPaper 的完整语法，包括多级 Folder/项目/父子任务层级
  const examples = [
    '// === 多级 Folder + 项目 + 父子任务层级示例 ===',
    '// 使用缩进表示层级（支持无限层级 Folder）',
    '// 系统将自动提示创建不存在的 Folder 和项目',
    '',
    '// 示例 1: 三级 Folder 结构',
    '工作 @folder:',
    '  技术部 @folder:',
    '    后端组 @folder:',
    '      微服务重构项目:',
    '        - 数据库设计 @high',
    '        - API 接口开发',
    '          - 用户服务接口',
    '          - 订单服务接口',
    '        - 性能优化 @urgent',
    '    前端组 @folder:',
    '      管理后台项目:',
    '        - 页面布局设计',
    '        - 组件开发',
    '          - 表格组件',
    '          - 表单组件',
    '',
    '// 示例 2: 简单二级 Folder',
    '个人 @folder:',
    '  学习计划 @folder:',
    '    React进阶:',
    '      - 学习 Hooks @today',
    '      - 完成练习项目',
    '    TypeScript基础:',
    '      - 阅读官方文档',
    '      - 编写示例代码',
    '',
    '// 示例 3: 纯收件箱任务（无项目）',
    '- 突然想起的想法',
    '- 需要跟进的事项 @today',
    '',
    '// === 基本任务语法 ===',
    '- 完成报告 @high @due(tomorrow)',
    '- 团队会议 @today @estimate(1h)',
    '- 修复 Bug @urgent',
  ]
  
  const insertExample = () => {
    setText(examples.join('\n'))
    textareaRef.current?.focus()
  }
  
  return (
    <div className={cn("space-y-4", className)}>
      {/* 输入区域 */}
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || `- 输入任务标题 @tag\n- 支持多行输入\n项目名:\n- 子任务 @due(2024-01-15)`}
          className="min-h-[120px] font-mono text-sm resize-none pr-20"
        />
        <div className="absolute bottom-2 right-2 flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground"
            onClick={insertExample}
          >
            <Lightbulb className="h-3 w-3 mr-1" />
            示例
          </Button>
        </div>
      </div>
      
      {/* 语法帮助 */}
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <code className="bg-muted px-1 py-0.5 rounded">- 任务</code>
          任务
        </span>
        <span className="flex items-center gap-1">
          <code className="bg-muted px-1 py-0.5 rounded">项目:</code>
          项目
        </span>
        <span className="flex items-center gap-1">
          <code className="bg-muted px-1 py-0.5 rounded">项目 @folder:</code>
          Folder
        </span>
        <span className="flex items-center gap-1">
          <code className="bg-muted px-1 py-0.5 rounded">@due(明天)</code>
          截止
        </span>
        <span className="flex items-center gap-1">
          <code className="bg-muted px-1 py-0.5 rounded">@high</code>
          重要
        </span>
        <span className="flex items-center gap-1">
          <code className="bg-muted px-1 py-0.5 rounded">@today</code>
          今天
        </span>
        <span className="flex items-center gap-1">
          <code className="bg-muted px-1 py-0.5 rounded">@estimate(30min)</code>
          时长
        </span>
      </div>
      
      {/* Folder/Project 预览区域 */}
      {(folders.length > 0 || projects.length > 0) && (
        <div className="border rounded-lg bg-amber-50/50 p-3 space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-amber-700">
            <FolderKanban className="h-3.5 w-3.5" />
            <span>将创建的资源</span>
          </div>
          {folders.length > 0 && (
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Folders ({folders.length}):</span>
              <div className="flex flex-col gap-1">
                {folders.map((f, i) => (
                  <div key={i} className="flex items-center gap-1 text-xs">
                    <span className="text-muted-foreground">
                      {f.parent ? '  '.repeat(f.fullPath.split('/').length - 1) : ''}
                    </span>
                    <Badge variant="outline" className="text-[10px] bg-amber-100 border-amber-200 text-amber-700">
                      {f.name}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">({f.fullPath})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {projects.length > 0 && (
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">项目 ({projects.length}):</span>
              <div className="flex flex-wrap gap-1">
                {projects.map((p, i) => (
                  <Badge key={i} variant="outline" className="text-[10px] bg-blue-100 border-blue-200 text-blue-700">
                    {p.folderName ? `${p.folderName}/` : ''}{p.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* 预览区域 */}
      {text.trim() && (
        <div className="border rounded-lg bg-muted/30 p-3 space-y-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">
              预览 ({tasks.length} 个任务)
            </span>
          </div>
          <div className="max-h-[200px] overflow-y-auto space-y-0.5">
            {preview.map((line, i) => (
              <LinePreview key={i} line={line} />
            ))}
          </div>
        </div>
      )}
      
      {/* 操作按钮 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <kbd className="bg-muted px-1.5 py-0.5 rounded">Ctrl</kbd>
          <span>+</span>
          <kbd className="bg-muted px-1.5 py-0.5 rounded">Enter</kbd>
          <span>提交</span>
          <span className="mx-2">|</span>
          <kbd className="bg-muted px-1.5 py-0.5 rounded">Esc</kbd>
          <span>取消</span>
        </div>
        
        <div className="flex gap-2">
          {onCancel && (
            <Button variant="outline" size="sm" onClick={onCancel}>
              <X className="h-4 w-4 mr-1" />
              取消
            </Button>
          )}
          <Button 
            size="sm" 
            onClick={handleSubmit}
            disabled={tasks.length === 0 || isSubmitting}
          >
            <Send className="h-4 w-4 mr-1" />
            {isSubmitting ? '提交中...' : `创建 (${tasks.length})`}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default TaskPaperInput
