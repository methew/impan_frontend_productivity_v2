import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  ListTodo,
} from 'lucide-react'
import { useFolderProjectTree } from '@/hooks/useFolders'
import { useTasksByProjectTree, useCompleteTask, useToggleTaskFlag } from '@/hooks/useTasks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { TaskList } from '@/components/TaskList/TaskList'
import type { FolderProjectNode, TaskTreeNode } from '@/types'

export const Route = createFileRoute('/_app/projects')({
  component: ProjectsPage,
})

function ProjectsPage() {
  const { t } = useTranslation()
  const [selectedNode, setSelectedNode] = useState<FolderProjectNode | null>(null)
  const { data: treeData, isLoading: isTreeLoading } = useFolderProjectTree()

  return (
    <div className="flex gap-6 h-[calc(100vh-100px)]">
      {/* Left: Folder/Project Tree */}
      <Card className="w-80 flex-shrink-0 flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">{t('projects.title')}</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto p-2">
          {isTreeLoading ? (
            <div className="p-4 text-center text-muted-foreground">{t('common.loading')}</div>
          ) : treeData?.nodes && Array.isArray(treeData.nodes) ? (
            <div className="space-y-1">
              {treeData.nodes.map((node) => (
                <TreeNodeItem
                  key={node.id}
                  node={node}
                  selectedNode={selectedNode}
                  onSelect={setSelectedNode}
                  level={0}
                />
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground">{t('projects.noProjects')}</div>
          )}
        </CardContent>
      </Card>

      {/* Right: Tasks View */}
      <div className="flex-1 min-w-0">
        {selectedNode ? (
          <ProjectTasksView node={selectedNode} />
        ) : (
          <Card className="h-full flex items-center justify-center border-0 shadow-none bg-transparent">
            <div className="text-center text-muted-foreground">
              <div className="w-20 h-20 rounded-full border-2 border-dashed border-muted-foreground/20 flex items-center justify-center mb-4 mx-auto">
                <Folder className="w-10 h-10 text-muted-foreground/30" />
              </div>
              <p className="text-lg font-medium">{t('projects.selectPrompt')}</p>
              <p className="text-sm text-muted-foreground mt-1">{t('projects.selectDescription')}</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

// Tree Node Item Component
interface TreeNodeItemProps {
  node: FolderProjectNode
  selectedNode: FolderProjectNode | null
  onSelect: (node: FolderProjectNode) => void
  level: number
}

function TreeNodeItem({ node, selectedNode, onSelect, level }: TreeNodeItemProps) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(true)
  const hasChildren = node.children && node.children.length > 0
  const isSelected = selectedNode?.id === node.id && selectedNode?.node_type === node.node_type

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-1 rounded-md px-2 py-1.5 cursor-pointer transition-colors',
          'hover:bg-muted',
          isSelected && 'bg-primary/10 hover:bg-primary/10'
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={() => onSelect(node)}
      >
        {hasChildren ? (
          <button
            className="p-0.5 hover:bg-muted-foreground/10 rounded"
            onClick={(e) => {
              e.stopPropagation()
              setExpanded(!expanded)
            }}
          >
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
        ) : (
          <span className="w-5" />
        )}

        {node.node_type === 'folder' ? (
          expanded ? (
            <FolderOpen className="h-4 w-4 text-blue-500 flex-shrink-0" />
          ) : (
            <Folder className="h-4 w-4 text-blue-500 flex-shrink-0" />
          )
        ) : (
          <ListTodo className="h-4 w-4 text-green-500 flex-shrink-0" />
        )}

        <span className="flex-1 truncate text-sm">{node.name}</span>

        {node.node_type === 'project' && (
          <div className="flex items-center gap-1">
            {node.flagged && <span className="text-amber-500 text-xs">⚑</span>}
            {node.tasks_count !== undefined && node.tasks_count > 0 && (
              <Badge variant="secondary" className="text-xs h-5 px-1">
                {t('projects.completionPercentage', { percentage: node.completion_percentage })}
              </Badge>
            )}
          </div>
        )}
      </div>

      {expanded && hasChildren && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeNodeItem
              key={`${child.node_type}-${child.id}`}
              node={child}
              selectedNode={selectedNode}
              onSelect={onSelect}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Project Tasks View
interface ProjectTasksViewProps {
  node: FolderProjectNode
}

function ProjectTasksView({ node }: ProjectTasksViewProps) {
  const { t } = useTranslation()
  const params =
    node.node_type === 'project'
      ? { project_id: node.id }
      : { folder_id: node.id }

  const { data: tasksData, isLoading } = useTasksByProjectTree(params)
  const completeTask = useCompleteTask()
  const toggleFlag = useToggleTaskFlag()

  const handleComplete = (taskId: string) => {
    completeTask.mutate(taskId)
  }

  const handleToggleFlag = (taskId: string) => {
    toggleFlag.mutate(taskId)
  }

  // Convert tasks to proper format for TaskList
  const getTasksForList = (): TaskTreeNode[] => {
    if (!tasksData) return []
    
    if (tasksData.filter_type === 'project') {
      return tasksData.tasks || []
    } else {
      // Flatten folder tasks - safely handle undefined
      const projects = tasksData.projects || []
      return projects.reduce<TaskTreeNode[]>((acc, project) => {
        if (project && project.tasks) {
          acc.push(...project.tasks)
        }
        return acc
      }, [])
    }
  }

  return (
    <Card className="h-full flex flex-col border-0 shadow-none bg-transparent">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              {node.node_type === 'folder' ? (
                <FolderOpen className="h-5 w-5 text-blue-500" />
              ) : (
                <ListTodo className="h-5 w-5 text-green-500" />
              )}
              <CardTitle className="text-lg">{node.name}</CardTitle>
            </div>
            {node.note && (
              <p className="text-sm text-muted-foreground mt-1">{node.note}</p>
            )}
          </div>
          {node.node_type === 'project' && (
            <div className="flex items-center gap-2">
              <Badge variant={node.status === 'active' ? 'default' : 'secondary'}>
                {node.status_display}
              </Badge>
              {node.project_type_display && (
                <Badge variant="outline">{node.project_type_display}</Badge>
              )}
            </div>
          )}
        </div>

        {/* Stats */}
        {tasksData && (
          <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
            {tasksData.filter_type === 'project' ? (
              <>
                <span>{tasksData.tasks_count} tasks</span>
              </>
            ) : (
              <>
                <span>{tasksData.projects_count} projects</span>
                <span>{tasksData.tasks_count} tasks</span>
              </>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 overflow-auto p-0 pt-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <TaskList
            tasks={getTasksForList()}
            onComplete={handleComplete}
            onToggleFlag={handleToggleFlag}
            showProject={tasksData?.filter_type !== 'project'}
            emptyMessage={node.node_type === 'project' ? t('projects.noTasksInProject') : t('projects.noTasksInFolder')}
          />
        )}
      </CardContent>
    </Card>
  )
}
