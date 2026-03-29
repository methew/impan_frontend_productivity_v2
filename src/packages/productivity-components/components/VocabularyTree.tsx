/**
 * Vocabulary Tree Component - 词汇学习树形结构
 * 
 * 结构示例:
 * - TERM: 食べる (root节点，不是分类)
 *   - READING: た・べる[2]
 *     - SENSE: 词义1
 *       - GLOSS: 吃
 *       - PART_OF_SPEECH: 动词
 *       - EXAMPLE: りんごを食べる → 吃苹果
 *     - SENSE: 词义2
 *       - GLOSS: 维持生活
 *   - FORM: 食べます (礼貌形)
 *   - FORM: 食べた (过去形)
 */

import { useState } from 'react'
import { ChevronRight, ChevronDown, Book, Languages, MessageSquare, FileText } from 'lucide-react'
import { cn } from '@/packages/ui/lib/utils'

// 词汇节点类型
export type VocabularyNodeType = 
  | 'TERM'        // 词汇条目 (根节点)
  | 'READING'     // 读音
  | 'SENSE'       // 词义
  | 'FORM'        // 变形形式
  | 'GLOSS'       // 释义
  | 'PART_OF_SPEECH'  // 词性
  | 'EXAMPLE'     // 例句
  | 'TRANSLATION' // 翻译

// 词汇节点接口
export interface VocabularyNode {
  id: string
  type: VocabularyNodeType
  content: string
  children: VocabularyNode[]
  metadata?: {
    pitchAccent?: string      // 音调符号 [2]
    frequency?: number        // 词频
    jlptLevel?: number        // JLPT等级
    tags?: string[]           // 标签
  }
}

// 示例词汇数据
export const sampleVocabulary: VocabularyNode = {
  id: '1',
  type: 'TERM',
  content: '食べる',
  metadata: {
    frequency: 100,
    jlptLevel: 5,
    tags: ['动词', '常用']
  },
  children: [
    {
      id: '1-1',
      type: 'READING',
      content: 'た・べる',
      metadata: {
        pitchAccent: '[2]'
      },
      children: [
        {
          id: '1-1-1',
          type: 'SENSE',
          content: '词义 1',
          children: [
            {
              id: '1-1-1-1',
              type: 'GLOSS',
              content: '吃',
              children: []
            },
            {
              id: '1-1-1-2',
              type: 'PART_OF_SPEECH',
              content: '动词 (一段动词)',
              children: []
            },
            {
              id: '1-1-1-3',
              type: 'EXAMPLE',
              content: 'りんごを食べる',
              children: [
                {
                  id: '1-1-1-3-1',
                  type: 'TRANSLATION',
                  content: '吃苹果',
                  children: []
                }
              ]
            },
            {
              id: '1-1-1-4',
              type: 'EXAMPLE',
              content: '何か食べたい',
              children: [
                {
                  id: '1-1-1-4-1',
                  type: 'TRANSLATION',
                  content: '想吃点什么',
                  children: []
                }
              ]
            }
          ]
        },
        {
          id: '1-1-2',
          type: 'SENSE',
          content: '词义 2',
          children: [
            {
              id: '1-1-2-1',
              type: 'GLOSS',
              content: '维持生活',
              children: []
            },
            {
              id: '1-1-2-2',
              type: 'EXAMPLE',
              content: '学生生活を食べる',
              children: [
                {
                  id: '1-1-2-2-1',
                  type: 'TRANSLATION',
                  content: '靠学生生活维持生计',
                  children: []
                }
              ]
            }
          ]
        }
      ]
    },
    {
      id: '1-2',
      type: 'FORM',
      content: '食べます',
      metadata: {
        tags: ['礼貌形', 'ます形']
      },
      children: []
    },
    {
      id: '1-3',
      type: 'FORM',
      content: '食べた',
      metadata: {
        tags: ['过去形', 'た形']
      },
      children: []
    },
    {
      id: '1-4',
      type: 'FORM',
      content: '食べない',
      metadata: {
        tags: ['否定形', 'ない形']
      },
      children: []
    },
    {
      id: '1-5',
      type: 'FORM',
      content: '食べよう',
      metadata: {
        tags: ['意向形', 'う/よう形']
      },
      children: []
    }
  ]
}

// 节点类型图标
const NodeIcon = ({ type }: { type: VocabularyNodeType }) => {
  switch (type) {
    case 'TERM':
      return <Book className="h-4 w-4 text-blue-500" />
    case 'READING':
      return <Languages className="h-4 w-4 text-purple-500" />
    case 'SENSE':
      return <FileText className="h-4 w-4 text-green-500" />
    case 'FORM':
      return <span className="text-xs font-bold text-orange-500">変</span>
    case 'GLOSS':
      return <span className="text-xs text-gray-500">译</span>
    case 'PART_OF_SPEECH':
      return <span className="text-xs text-gray-500">词</span>
    case 'EXAMPLE':
      return <MessageSquare className="h-3 w-3 text-gray-400" />
    case 'TRANSLATION':
      return <span className="text-xs text-gray-400">→</span>
    default:
      return null
  }
}

// 节点类型标签
const NodeTypeLabel = ({ type }: { type: VocabularyNodeType }) => {
  const labels: Record<VocabularyNodeType, string> = {
    TERM: '词汇',
    READING: '读音',
    SENSE: '词义',
    FORM: '变形',
    GLOSS: '释义',
    PART_OF_SPEECH: '词性',
    EXAMPLE: '例句',
    TRANSLATION: '翻译'
  }
  return (
    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
      {labels[type]}
    </span>
  )
}

// 单个树节点组件
interface TreeNodeProps {
  node: VocabularyNode
  depth: number
  expandedIds: Set<string>
  onToggle: (id: string) => void
}

function TreeNode({ node, depth, expandedIds, onToggle }: TreeNodeProps) {
  const isExpanded = expandedIds.has(node.id)
  const hasChildren = node.children.length > 0
  const indentWidth = depth * 16

  // 根据节点类型确定样式
  const getNodeStyle = () => {
    switch (node.type) {
      case 'TERM':
        return 'text-lg font-bold text-foreground'
      case 'READING':
        return 'text-base font-medium text-purple-700'
      case 'SENSE':
        return 'text-sm font-medium text-green-700'
      case 'FORM':
        return 'text-sm text-orange-600'
      case 'GLOSS':
        return 'text-sm font-medium'
      case 'EXAMPLE':
        return 'text-sm text-gray-600 italic'
      case 'TRANSLATION':
        return 'text-sm text-gray-500'
      default:
        return 'text-sm'
    }
  }

  return (
    <div>
      <div
        className={cn(
          "group flex items-start gap-2 py-1.5 pr-2 rounded-sm",
          "hover:bg-accent/30 transition-colors",
          node.type === 'TERM' && "bg-accent/10 py-2"
        )}
        style={{ paddingLeft: `${8 + indentWidth}px` }}
      >
        {/* 展开/折叠按钮 */}
        {hasChildren ? (
          <button
            type="button"
            onClick={() => onToggle(node.id)}
            className="mt-0.5 w-4 h-4 flex items-center justify-center flex-shrink-0 rounded hover:bg-muted"
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            )}
          </button>
        ) : (
          <div className="w-4 flex-shrink-0" />
        )}

        {/* 节点内容 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <NodeIcon type={node.type} />
            <span className={getNodeStyle()}>
              {node.content}
              {node.metadata?.pitchAccent && (
                <span className="text-xs text-purple-500 ml-1">
                  {node.metadata.pitchAccent}
                </span>
              )}
            </span>
            {node.type !== 'TERM' && node.type !== 'EXAMPLE' && node.type !== 'TRANSLATION' && (
              <NodeTypeLabel type={node.type} />
            )}
          </div>
          
          {/* 元数据标签 */}
          {node.metadata?.tags && node.metadata.tags.length > 0 && (
            <div className="flex gap-1 mt-1">
              {node.metadata.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 子节点 */}
      {hasChildren && isExpanded && (
        <div className="relative">
          {/* 缩进线 */}
          <div
            className="absolute left-0 top-0 bottom-0 w-px bg-border/50"
            style={{ left: `${12 + indentWidth + 8}px` }}
          />
          {node.children.map(child => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              expandedIds={expandedIds}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// 主组件
interface VocabularyTreeProps {
  vocabulary?: VocabularyNode
  className?: string
}

export function VocabularyTree({ 
  vocabulary = sampleVocabulary, 
  className 
}: VocabularyTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    // 默认展开 TERM 和 READING
    return new Set([vocabulary.id, vocabulary.children[0]?.id].filter(Boolean))
  })

  const toggleExpand = (id: string) => {
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

  return (
    <div className={cn("bg-card rounded-lg border p-4", className)}>
      {/* 词汇信息头部 */}
      {vocabulary.metadata && (
        <div className="flex items-center gap-3 mb-4 pb-3 border-b">
          {vocabulary.metadata.jlptLevel && (
            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded">
              N{vocabulary.metadata.jlptLevel}
            </span>
          )}
          {vocabulary.metadata.frequency && (
            <span className="text-xs text-muted-foreground">
              词频: #{vocabulary.metadata.frequency}
            </span>
          )}
        </div>
      )}

      {/* 树形结构 */}
      <TreeNode
        node={vocabulary}
        depth={0}
        expandedIds={expandedIds}
        onToggle={toggleExpand}
      />
    </div>
  )
}

export default VocabularyTree
