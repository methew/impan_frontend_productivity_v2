import { createFileRoute, useParams, useNavigate } from '@tanstack/react-router'
import {
  FolderKanban, Plus, MoreHorizontal,
  ChevronRight, Folder as FolderIcon,
  FolderOpen, Flag, Check
} from 'lucide-react'
import { Button } from '@/packages/ui/components/button'
import { Input } from '@/packages/ui/components/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/packages/ui/components/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/packages/ui/components/dropdown-menu'
import { useState, useMemo, useRef, useCallback, useEffect } from 'react'

import { useFolders, useCreateFolder, useUpdateFolder } from '@/hooks/useFolders'
import { useProjects, useCreateProject, useUpdateProject } from '@/hooks/useProjects'
import { useTasks, useUpdateTask, useCompleteTask, useCreateTask } from '@/hooks/useTasks'
import { Inspector, type InspectorItem } from '@/packages/productivity-components/components/Inspector'
import { NewTaskDialog } from '@/components/NewTaskDialog'
import { DraggableTree, type TreeNode, type DropPosition } from '@/components/DraggableTree'
import { formatDate, cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { Folder, Folder as FolderType, Project, Task } from '@/types'

export const Route = createFileRoute('/projects')({
  component: ProjectsPage,
})

// Tree item types
type TreeItemType = 'folder' | 'project'

interface TreeItem {
  id: string
  type: TreeItemType
  name: string
  folder?: string | null
  children: TreeItem[]
  data: FolderType | Project
}

export function ProjectsPage() {
  const navigate = useNavigate()
  const params = useParams({ from: '/projects/$type/$id', shouldThrow: false })
  
  // Support both /projects/f/:folderId and /projects/p/:projectId
  const routeType = params?.type as 'f' | 'p' | undefined
  const routeId = params?.id
  
  const { data: folders } = useFolders()
  const { data: allProjects } = useProjects()
  const { data: allTasks } = useTasks()
  
  // Selected item from URL params
  const [selectedItem, setSelectedItem] = useState<{ type: 'folder' | 'project'; id: string } | null>(
    routeType && routeId 
      ? { type: routeType === 'f' ? 'folder' : 'project', id: routeId }
      : null
  )

  // Debug logging
  useEffect(() => {
    console.log('=== ProjectsPage Data ===', {
      routeType,
      routeId,
      foldersCount: folders?.length,
      projectsCount: allProjects?.length,
      tasksCount: allTasks?.length,
      selectedItem,
      // 检查前几个任务的project字段格式
      sampleTasks: allTasks?.slice(0, 5).map(t => ({ 
        id: t.id, 
        title: t.title, 
        project: t.project,
        projectType: typeof t.project 
      }))
    })
  }, [routeType, routeId, folders, allProjects, allTasks, selectedItem])

  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [inspectorOpen, setInspectorOpen] = useState(false)
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false)
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false)
  const [showNewTaskDialog, setShowNewTaskDialog] = useState(false)
  const [newProjectType, setNewProjectType] = useState<'parallel' | 'sequential' | 'single_action'>('parallel')
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [editingFolder, setEditingFolder] = useState<string | null>(null)
  const [editFolderName, setEditFolderName] = useState('')
  const updateFolder = useUpdateFolder()
  const updateTask = useUpdateTask()
  const updateProject = useUpdateProject()

  // Toggle item expansion
  const toggleExpand = useCallback((itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }, [])

  // Build unified tree with folders and projects mixed
  const treeItems = useMemo((): TreeItem[] => {
    if (!folders || !allProjects) return []

    const folderMap = new Map<string, TreeItem>()
    const projectMap = new Map<string, TreeItem>()
    const rootItems: TreeItem[] = []

    // Step 1: Create all folder items first
    folders.forEach(folder => {
      folderMap.set(String(folder.id), {
        id: String(folder.id),
        type: 'folder',
        name: folder.name,
        folder: folder.parent,
        children: [],
        data: folder,
      })
    })

    // Step 2: Create all project items
    allProjects.forEach(project => {
      const projectItem: TreeItem = {
        id: String(project.id),
        type: 'project',
        name: project.title,
        folder: project.folder,
        children: [],
        data: project,
      }
      projectMap.set(String(project.id), projectItem)
    })

    // Step 3: Build folder hierarchy (folders as children of folders)
    folderMap.forEach(folderItem => {
      const parentId = folderItem.folder
      if (parentId && folderMap.has(parentId)) {
        folderMap.get(parentId)!.children.push(folderItem)
      } else {
        rootItems.push(folderItem)
      }
    })

    // Step 4: Add projects to their parent folders
    projectMap.forEach(projectItem => {
      const parentFolderId = projectItem.folder
      if (parentFolderId && folderMap.has(parentFolderId)) {
        folderMap.get(parentFolderId)!.children.push(projectItem)
      } else {
        rootItems.push(projectItem)
      }
    })

    return rootItems
  }, [folders, allProjects])

  // Get all projects under a folder (including nested)
  const getFolderProjects = useCallback((folderId: string): Project[] => {
    if (!allProjects) return []
    const folder = folders?.find(f => String(f.id) === folderId)
    if (!folder) return []
    
    const getSubfolderIds = (parentId: string): string[] => {
      const subfolders = folders?.filter(f => String(f.parent) === parentId) || []
      const subIds = subfolders.map(f => String(f.id))
      return [...subIds, ...subIds.flatMap(getSubfolderIds)]
    }
    
    const allFolderIds = [folderId, ...getSubfolderIds(folderId)]
    return allProjects.filter(p => allFolderIds.includes(String(p.folder || '')))
  }, [allProjects, folders])

  // Get all tasks under a folder (all projects' tasks)
  const getFolderTasks = useCallback((folderId: string): Task[] => {
    if (!allTasks) return []
    const folderProjects = getFolderProjects(folderId)
    const projectIds = folderProjects.map(p => p.id)
    return allTasks.filter(t => t.project && projectIds.includes(String(t.project)))
  }, [allTasks, getFolderProjects])

  // Get tasks for a specific project
  const getProjectTasks = useCallback((projectId: string): Task[] => {
    if (!allTasks) return []
    const tasks = allTasks.filter(t => String(t.project) === projectId)
    
    // 详细调试：查看所有任务的 project 字段
    const taskProjectMapping = allTasks.map(t => ({ 
      taskId: t.id, 
      taskTitle: t.title, 
      taskProject: t.project,
      taskProjectType: typeof t.project,
      targetProjectId: projectId,
      match: String(t.project) === projectId
    }))
    console.log(`Parent getProjectTasks(${projectId}):`, { 
      allTasksCount: allTasks.length, 
      matchedCount: tasks.length,
      taskProjectMapping: taskProjectMapping
    })
    return tasks
  }, [allTasks])

  // Current view data
  const viewData = useMemo(() => {
    if (!selectedItem) return null

    console.log('=== Computing viewData ===', { selectedItem })

    if (selectedItem.type === 'folder') {
      const folder = folders?.find(f => String(f.id) === selectedItem.id)
      const projects = getFolderProjects(selectedItem.id)
      const tasks = getFolderTasks(selectedItem.id)
      console.log('Folder view:', { folder, projectsCount: projects.length, tasksCount: tasks.length })
      return {
        type: 'folder' as const,
        title: folder?.name || '文件夹',
        folder,
        projects,
        tasks,
        itemCount: projects.length + tasks.length
      }
    } else {
      const project = allProjects?.find(p => String(p.id) === selectedItem.id)
      const tasks = getProjectTasks(selectedItem.id)
      console.log('Project view:', { project, tasksCount: tasks.length, tasks: tasks.map(t => ({ id: t.id, title: t.title, project: t.project })) })
      return {
        type: 'project' as const,
        title: project?.title || '项目',
        project,
        tasks,
        projects: [] as Project[],
        itemCount: tasks.length
      }
    }
  }, [selectedItem, folders, allProjects, getFolderProjects, getFolderTasks, getProjectTasks])

  // Handle tree item click - navigate to route
  const handleTreeItemClick = (item: TreeItem) => {
    const path = item.type === 'folder' 
      ? `/projects/f/${item.id}` 
      : `/projects/p/${item.id}`
    navigate({ to: path })
    setSelectedItem({ type: item.type, id: item.id })
    setSelectedTask(null)
  }

  // Handle folder name edit
  const handleFolderDoubleClick = (folder: TreeItem, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingFolder(folder.id)
    setEditFolderName(folder.name)
  }

  const handleFolderNameSave = async () => {
    if (!editingFolder || !editFolderName.trim()) {
      setEditingFolder(null)
      return
    }

    try {
      await updateFolder.mutateAsync({
        id: editingFolder,
        data: { name: editFolderName.trim() }
      })
      toast.success('文件夹已更新')
    } catch {
      toast.error('更新失败')
    }
    setEditingFolder(null)
  }

  const handleFolderNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleFolderNameSave()
    } else if (e.key === 'Escape') {
      setEditingFolder(null)
    }
  }

  // Convert TreeItem to TreeNode for DraggableTree
  const convertToTreeNodes = (items: TreeItem[]): TreeNode[] => {
    return items.map(item => ({
      id: item.id,
      type: item.type,
      name: item.name,
      children: convertToTreeNodes(item.children),
      data: item.data,
      parentId: item.folder || null,
    }))
  }

  // Convert TreeNode back to TreeItem
  const convertFromTreeNode = (node: TreeNode): TreeItem => {
    return {
      id: node.id,
      type: node.type,
      name: node.name,
      folder: node.parentId,
      children: node.children.map(convertFromTreeNode),
      data: node.data,
    }
  }

  // Handle tree item move (drag and drop)
  const handleTreeMove = (activeId: string, overId: string | null, position: DropPosition) => {
    if (!position) return

    const activeItem = findTreeItem(treeItems, activeId)
    const overItem = overId ? findTreeItem(treeItems, overId) : null

    if (!activeItem) return

    // 约束检查
    if (activeItem.type === 'folder' && overItem?.type === 'project' && position === 'inside') {
      toast.error('文件夹不能放入项目下')
      return
    }

    // TODO: 调用 API 更新父级关系
    console.log('Move:', activeItem.name, '->', position, overItem?.name || 'root')
    
    // 如果是文件夹，更新 parent
    if (activeItem.type === 'folder') {
      const newParentId = position === 'inside' && overItem?.type === 'folder' 
        ? overItem.id 
        : undefined
      updateFolder.mutate({
        id: activeId,
        data: { parent: newParentId }
      })
    }
    // 如果是项目，更新 folder
    else if (activeItem.type === 'project') {
      const newFolderId = position === 'inside' && overItem?.type === 'folder'
        ? overItem.id
        : undefined
      updateProject.mutate({
        id: activeId,
        data: { folder: newFolderId }
      })
    }
  }

  // Helper to find tree item by id
  const findTreeItem = (items: TreeItem[], id: string): TreeItem | null => {
    for (const item of items) {
      if (item.id === id) return item
      if (item.children.length > 0) {
        const found = findTreeItem(item.children, id)
        if (found) return found
      }
    }
    return null
  }

  // Get current selected item for inspector
  const inspectorItem = selectedTask
    ? selectedTask
    : viewData?.type === 'project'
      ? viewData.project
      : viewData?.type === 'folder'
        ? folders?.find(f => String(f.id) === viewData.folder?.id) || null
        : null
  
  const inspectorType: 'task' | 'project' | 'folder' = selectedTask 
    ? 'task' 
    : viewData?.type === 'project' 
      ? 'project' 
      : viewData?.type === 'folder'
        ? 'folder'
        : 'task'

  // Handle edit button click
  const handleEditClick = () => {
    if (inspectorItem) {
      setInspectorOpen(true)
    }
  }

  // Render tree item with proper tree structure
  const renderTreeItem = (item: TreeItem, depth: number = 0) => {
    const isExpanded = expandedItems.has(item.id)
    const hasChildren = item.children.length > 0
    const isSelected = selectedItem?.id === item.id && selectedItem?.type === item.type
    const indentWidth = depth * 16

    if (item.type === 'folder') {
      return (
        <div key={item.id}>
          {/* Folder Row */}
          <div
            className={cn(
              "group flex items-center py-1.5 pr-2 text-sm select-none cursor-pointer",
              "hover:bg-accent/40 transition-colors rounded-sm mx-1",
              isSelected && "bg-accent"
            )}
            style={{ paddingLeft: `${8 + indentWidth}px` }}
            onClick={() => {
              // Click row = select only
              handleTreeItemClick(item)
            }}
            onDoubleClick={(e) => handleFolderDoubleClick(item, e)}
          >
            {/* Expand/Collapse Button */}
            <button
              type="button"
              aria-label={isExpanded ? "收起文件夹" : "展开文件夹"}
              onClick={(e) => {
                // Click arrow = toggle expand only
                e.stopPropagation()
                toggleExpand(item.id)
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

            {/* Folder Icon - OmniFocus style */}
            <div className="flex-shrink-0 ml-0.5">
              {isExpanded ? (
                <FolderOpen className="h-4 w-4 text-amber-500" />
              ) : (
                <FolderIcon className="h-4 w-4 text-amber-500" />
              )}
            </div>

            {/* Folder Name */}
            <div className="flex-1 min-w-0 ml-2">
              {editingFolder === item.id ? (
                <Input
                  value={editFolderName}
                  onChange={(e) => setEditFolderName(e.target.value)}
                  onBlur={handleFolderNameSave}
                  onKeyDown={handleFolderNameKeyDown}
                  className="h-6 text-sm py-0 px-1"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="truncate block font-medium">{item.name}</span>
              )}
            </div>

            {/* Item Count Badge */}
            {hasChildren && (
              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full ml-1">
                {item.children.length}
              </span>
            )}
          </div>

          {/* Folder Children with indentation line */}
          {isExpanded && (
            <div className="relative">
              <div
                className="absolute left-0 top-0 bottom-0 w-px bg-border/50"
                style={{ left: `${12 + indentWidth + 10}px` }}
              />
              {item.children.map(child => renderTreeItem(child, depth + 1))}
            </div>
          )}
        </div>
      )
    }

    // Project Row
    const projectData = item.data as Project
    return (
      <div
        key={item.id}
        role="button"
        tabIndex={0}
        aria-label={`项目: ${item.name}`}
        className={cn(
          "group flex items-center py-1.5 pr-2 text-sm cursor-pointer select-none",
          "hover:bg-accent/40 transition-colors rounded-sm mx-1",
          isSelected && "bg-accent"
        )}
        style={{ paddingLeft: `${12 + indentWidth}px` }}
        onClick={() => handleTreeItemClick(item)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleTreeItemClick(item)
          }
        }}
      >
        {/* Project Type Icon - OmniFocus style */}
        <ProjectTypeIcon type={projectData.project_type} />

        {/* Project Name */}
        <span className="flex-1 truncate ml-2">{item.name}</span>

        {/* Completion indicator */}
        {projectData.completion_percentage === 100 && (
          <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0" strokeWidth={3} />
        )}
      </div>
    )
  }

  return (
    <div className="h-full flex">
      {/* Column 1: Unified Tree Sidebar */}
      <div className="w-60 border-r bg-card flex flex-col">
        {/* Sidebar Header */}
        <div className="h-10 px-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">项目</h2>
        </div>

        {/* Unified Tree */}
        <div className="flex-1 overflow-y-auto p-1">
          <DraggableTree
            items={convertToTreeNodes(treeItems)}
            expandedItems={expandedItems}
            selectedItem={selectedItem}
            onToggleExpand={toggleExpand}
            onSelect={(node) => handleTreeItemClick(convertFromTreeNode(node))}
            onDoubleClick={handleFolderDoubleClick ? (node, e) => {
              if (node.type === 'folder') {
                handleFolderDoubleClick(convertFromTreeNode(node), e)
              }
            } : undefined}
            onMove={handleTreeMove}
            editingFolderId={editingFolder}
            editFolderName={editFolderName}
            onEditFolderNameChange={setEditFolderName}
            onEditFolderSave={handleFolderNameSave}
            onEditFolderKeyDown={handleFolderNameKeyDown}
            renderItemCount={(node) => {
              if (node.children.length > 0) {
                return (
                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full ml-1">
                    {node.children.length}
                  </span>
                )
              }
              return null
            }}
          />
        </div>

        {/* Sidebar Bottom - Add Button */}
        <div className="p-2 border-t flex items-center gap-1.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="flex-1 gap-1 h-8 text-xs">
                <Plus className="h-3.5 w-3.5" />
                添加
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              <DropdownMenuItem
                onClick={() => { setNewProjectType('parallel'); setShowNewProjectDialog(true); }}
                className="text-xs"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  并行项目
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => { setNewProjectType('sequential'); setShowNewProjectDialog(true); }}
                className="text-xs"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  顺序项目
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => { setNewProjectType('single_action'); setShowNewProjectDialog(true); }}
                className="text-xs"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gray-400" />
                  单动作列表
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowNewFolderDialog(true)} className="text-xs">
                <FolderIcon className="h-3.5 w-3.5 mr-2" />
                文件夹
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowNewTaskDialog(true)} className="text-xs">
                <Check className="h-3.5 w-3.5 mr-2" />
                动作
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setExpandedItems(new Set(folders?.map(f => f.id)))} className="text-xs">
                展开全部
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setExpandedItems(new Set())} className="text-xs">
                折叠全部
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Column 2: Outline */}
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        {/* Outline Header */}
        <div className="h-10 border-b flex items-center px-4 justify-between bg-card/50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-sm">
              {viewData?.title || '选择项目或文件夹'}
            </h2>
            <span className="text-xs text-muted-foreground">
              {viewData?.itemCount || 0} 项
            </span>
          </div>

          <div className="flex items-center gap-1">
            {viewData && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={handleEditClick}
              >
                编辑
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 text-xs">
                  视图
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="text-xs">可用</DropdownMenuItem>
                <DropdownMenuItem className="text-xs">剩余</DropdownMenuItem>
                <DropdownMenuItem className="text-xs">全部</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Tree Outline Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {viewData ? (
            <TreeOutline
              viewData={viewData}
              folders={folders || []}
              allProjects={allProjects || []}
              allTasks={allTasks || []}
              selectedTaskId={selectedTask?.id}
              onSelectProject={(projectId) => navigate({ to: `/projects/p/${projectId}` })}
              onSelectTask={setSelectedTask}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <FolderKanban className="h-12 w-12 opacity-10 mb-3" />
              <p className="text-sm">选择左侧项目或文件夹查看详情</p>
            </div>
          )}
        </div>
      </div>

      {/* Inspector Sheet */}
      <Inspector
        isOpen={inspectorOpen}
        item={(inspectorItem || null) as InspectorItem}
        type={inspectorType}
        onClose={() => {
          setInspectorOpen(false)
        }}
        onUpdate={(data) => {
          if (!inspectorItem) return

          if (inspectorType === 'task' && selectedTask) {
            updateTask.mutate({
              id: selectedTask.id,
              data: data as Partial<Task>
            })
          } else if (inspectorType === 'project' && viewData?.type === 'project') {
            updateProject.mutate({
              id: viewData.project!.id,
              data: data as Partial<Project>
            })
          } else if (inspectorType === 'folder' && viewData?.type === 'folder') {
            updateFolder.mutate({
              id: viewData.folder!.id,
              data: data as Partial<Folder>
            })
          }
        }}
        onSave={() => {
          toast.success('已保存')
        }}
        onConvert={(targetType) => {
          if (!inspectorItem) return
          toast.info(`转换为 ${targetType} 功能开发中...`)
        }}
        projects={allProjects || []}
        folders={folders || []}
        tasks={allTasks || []}
      />

      {/* Dialogs */}
      <NewProjectDialog
        open={showNewProjectDialog}
        onOpenChange={setShowNewProjectDialog}
        folders={folders || []}
        initialType={newProjectType}
      />
      <NewFolderDialog
        open={showNewFolderDialog}
        onOpenChange={setShowNewFolderDialog}
        folders={folders || []}
      />
      <NewTaskDialog
        open={showNewTaskDialog}
        onOpenChange={setShowNewTaskDialog}
      />
    </div>
  )
}

// ============================================================================
// Project Type Icon Component (OmniFocus style)
// ============================================================================

interface ProjectTypeIconProps {
  type?: 'sequential' | 'parallel' | 'single_action'
  className?: string
}

export function ProjectTypeIcon({ type, className }: ProjectTypeIconProps) {
  // Sequential: Three vertical dots (1, 2, 3 style) - tasks must be done in order
  if (type === 'sequential') {
    return (
      <div className={cn("flex flex-col items-center gap-[2px] flex-shrink-0 w-4", className)}>
        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
        <div className="w-1.5 h-1.5 rounded-full bg-blue-500/40" />
        <div className="w-1.5 h-1.5 rounded-full bg-blue-500/40" />
      </div>
    )
  }
  
  // Parallel: Three horizontal dots - tasks can be done in any order
  if (type === 'parallel') {
    return (
      <div className={cn("flex items-center gap-[2px] flex-shrink-0 w-4", className)}>
        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
      </div>
    )
  }
  
  // Single Actions List: Single dot - collection of unrelated actions
  return (
    <div className={cn("flex items-center justify-center flex-shrink-0 w-4", className)}>
      <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
    </div>
  )
}

// ============================================================================
// Tree Outline Component - Shows Folder/Project + Actions Tree
// ============================================================================

interface TreeOutlineProps {
  viewData: {
    type: 'folder' | 'project'
    title: string
    folder?: FolderType
    project?: Project
    projects: Project[]
    tasks: Task[]
    itemCount: number
  }
  folders: FolderType[]
  allProjects: Project[]
  allTasks: Task[]
  selectedTaskId?: string
  onSelectProject: (projectId: string) => void
  onSelectTask: (task: Task) => void
}

function TreeOutline({
  viewData,
  folders,
  allProjects,
  allTasks,
  selectedTaskId,
  onSelectProject,
  onSelectTask
}: TreeOutlineProps) {
  const updateTask = useUpdateTask()
  const completeTask = useCompleteTask()
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  // Auto-expand projects with tasks on mount
  useEffect(() => {
    const newExpanded = new Set<string>()
    
    if (viewData.type === 'folder') {
      // Get all projects for this folder
      const getFolderProjects = (folderId: string): Project[] => {
        const folder = folders.find(f => String(f.id) === folderId)
        if (!folder) return []

        const getSubfolderIds = (parentId: string): string[] => {
          const subfolders = folders.filter(f => String(f.parent) === parentId)
          const subIds = subfolders.map(f => String(f.id))
          return [...subIds, ...subIds.flatMap(getSubfolderIds)]
        }

        const allFolderIds = [folderId, ...getSubfolderIds(folderId)]
        return allProjects.filter(p => allFolderIds.includes(String(p.folder)))
      }

      const folderProjects = viewData.folder ? getFolderProjects(viewData.folder.id) : []
      
      // Auto-expand all projects that have tasks
      folderProjects.forEach(project => {
        const tasks = allTasks?.filter(t => String(t.project) === String(project.id) && !t.parent) || []
        if (tasks.length > 0) {
          newExpanded.add(`project-${project.id}`)
        }
      })
    } else if (viewData.type === 'project' && viewData.project) {
      // Auto-expand the current project
      newExpanded.add(`project-${viewData.project.id}`)
    }
    
    setExpandedItems(newExpanded)
  }, [viewData.type, viewData.folder?.id, viewData.project?.id, folders, allProjects, allTasks])

  const getProjectTasks = (projectId: string | number): Task[] => {
    const tasks = allTasks?.filter(t => {
      const match = String(t.project) === String(projectId) && !t.parent
      // Debug: 打印每个任务的匹配情况
      if (String(t.project) === String(projectId)) {
        console.log(`Task ${t.id} (${t.title}): project=${t.project}, parent=${t.parent}, match=${match}`)
      }
      return match
    }) || []
    console.log(`getProjectTasks(${projectId}): found ${tasks.length} tasks`)
    return tasks
  }

  const getChildTasks = (parentId: string): Task[] => {
    return allTasks?.filter(t => String(t.parent) === parentId) || []
  }

  const handleToggleExpand = (itemId: string) => {
    const newSet = new Set(expandedItems)
    if (newSet.has(itemId)) {
      newSet.delete(itemId)
    } else {
      newSet.add(itemId)
    }
    setExpandedItems(newSet)
  }

  const handleTaskStatusClick = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation()
    
    // Alt/Option + Click = Dropped toggle
    if (e.altKey || e.metaKey) {
      if (task.dropped_at) {
        // Restore from dropped - 清除 dropped_at
        console.log('Restore from dropped:', task.id)
        updateTask.mutate({ 
          id: task.id, 
          data: { dropped_at: null } 
        }, {
          onSuccess: () => toast.success('已恢复'),
          onError: (err) => toast.error('恢复失败', { description: err.message })
        })
      } else {
        // Mark as dropped
        console.log('Mark as dropped:', task.id)
        updateTask.mutate({ 
          id: task.id, 
          data: { dropped_at: new Date().toISOString() } 
        }, {
          onSuccess: () => toast.success('已丢弃'),
          onError: (err) => toast.error('丢弃失败', { description: err.message })
        })
      }
    } else {
      // Normal click = Completed toggle
      if (task.completed_at) {
        // Restore from completed - 清除 completed_at
        console.log('Restore from completed:', task.id, 'current completed_at:', task.completed_at)
        updateTask.mutate({ 
          id: task.id, 
          data: { completed_at: null } 
        }, {
          onSuccess: () => {
            toast.success('已取消完成')
            console.log('Restore completed successfully')
          },
          onError: (err) => {
            toast.error('取消完成失败', { description: err.message })
            console.error('Restore failed:', err)
          }
        })
      } else {
        // Mark as completed
        console.log('Mark as completed:', task.id)
        completeTask.mutate(task.id, {
          onSuccess: () => toast.success('已完成'),
          onError: (err) => toast.error('完成失败', { description: err.message })
        })
      }
    }
  }

  const renderTask = (task: Task, depth: number = 0) => {
    const childTasks = getChildTasks(task.id)
    const hasChildren = childTasks.length > 0
    const isExpanded = expandedItems.has(task.id)
    const isSelected = selectedTaskId === task.id
    const isOverdue = task.due_date && new Date(task.due_date) < new Date() && !task.completed_at
    const isDueSoon = task.due_date && !isOverdue && !task.completed_at &&
      new Date(task.due_date).getTime() - Date.now() < 24 * 60 * 60 * 1000
    const isActionGroup = task.task_type === 'action_group'

    return (
      <div key={task.id}>
        <div
          className={cn(
            "group flex items-center gap-1.5 py-1.5 cursor-pointer select-none",
            "transition-colors hover:bg-accent/30",
            isSelected && "bg-accent",
            task.completed_at && "opacity-50",
            isActionGroup && "bg-purple-50/50"
          )}
          style={{ paddingLeft: `${12 + depth * 16}px` }}
          onClick={() => onSelectTask(task)}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleToggleExpand(task.id)
            }}
            className={cn(
              "w-4 h-4 flex items-center justify-center flex-shrink-0 transition-transform",
              !hasChildren && "invisible"
            )}
          >
            <ChevronRight
              className={cn(
                "h-3.5 w-3.5 text-muted-foreground/60 transition-transform",
                isExpanded && "rotate-90"
              )}
            />
          </button>

          {/* Status Circle - OmniFocus style */}
          <StatusCircle
            task={task}
            isOverdue={!!isOverdue}
            isDueSoon={!!isDueSoon}
            onClick={(e) => handleTaskStatusClick(e, task)}
          />

          {/* 标记符号 */}
          <span className="flex items-center gap-0.5 text-xs font-bold">
            {task.flagged && (
              <Flag className="h-3 w-3 fill-amber-500 text-amber-500" />
            )}
            {task.is_urgent && (
              <span className="text-orange-500">*</span>
            )}
            {task.is_important && (
              <span className="text-red-500">!</span>
            )}
            {/* Action Group Type Indicator */}
            {isActionGroup && task.action_group_type && (
              <span className="text-purple-500 text-[10px]">
                {task.action_group_type === 'sequential' ? 'Seq' : 'Par'}
              </span>
            )}
          </span>

          <span className={cn(
            "flex-1 text-sm truncate",
            (task.completed_at || task.dropped_at) && "line-through text-muted-foreground",
            !task.completed_at && !task.dropped_at && isOverdue && "text-red-600",
            !task.completed_at && !task.dropped_at && task.flagged && "text-amber-600",
            // Action Group 使用粗体
            isActionGroup && "font-bold text-foreground"
          )}>
            {task.title}
          </span>

          {task.due_date && (
            <span className={cn(
              "text-xs",
              isOverdue && "text-red-500",
              isDueSoon && "text-yellow-600",
              !isOverdue && !isDueSoon && "text-muted-foreground"
            )}>
              {formatDate(task.due_date)}
            </span>
          )}
        </div>

        {hasChildren && isExpanded && childTasks.map(child => renderTask(child, depth + 1))}
      </div>
    )
  }

  const renderProject = (project: Project, depth: number = 0) => {
    const projectTasks = getProjectTasks(String(project.id))
    const isExpanded = expandedItems.has(`project-${project.id}`)
    
    // Debug logging
    console.log(`Project ${project.title} (ID: ${project.id}):`, {
      taskCount: projectTasks.length,
      tasks: projectTasks.map(t => ({ id: t.id, title: t.title, project: t.project })),
      isExpanded,
      expandedItems: Array.from(expandedItems)
    })
    
    return (
      <div key={project.id}>
        <div
          className={cn(
            "group flex items-center gap-2 py-2 cursor-pointer select-none",
            "transition-colors hover:bg-accent/40",
            viewData.type === 'project' && "bg-accent/20"
          )}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
          onClick={() => onSelectProject(project.id)}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleToggleExpand(`project-${project.id}`)
            }}
            className={cn(
              "w-4 h-4 flex items-center justify-center flex-shrink-0",
              projectTasks.length === 0 && "invisible"
            )}
          >
            <ChevronRight
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                isExpanded && "rotate-90"
              )}
            />
          </button>

          <ProjectTypeIcon type={project.project_type} />

          <span className="flex-1 text-sm font-medium truncate">{project.title}</span>

          {projectTasks.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {projectTasks.length}
            </span>
          )}

          {project.completion_percentage === 100 && (
            <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
          )}
        </div>

        {isExpanded && projectTasks.map(task => renderTask(task, depth + 1))}
      </div>
    )
  }

  const getFolderProjects = (folderId: string): Project[] => {
    const folder = folders.find(f => String(f.id) === folderId)
    if (!folder) return []

    const getSubfolderIds = (parentId: string): string[] => {
      const subfolders = folders.filter(f => String(f.parent) === parentId)
      const subIds = subfolders.map(f => String(f.id))
      return [...subIds, ...subIds.flatMap(getSubfolderIds)]
    }

    const allFolderIds = [folderId, ...getSubfolderIds(folderId)]
    return allProjects.filter(p => allFolderIds.includes(String(p.folder)))
  }

  if (viewData.type === 'folder') {
    if (!viewData.folder) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
          <FolderOpen className="h-12 w-12 opacity-10 mb-3" />
          <p className="text-sm">文件夹不存在</p>
        </div>
      )
    }
    
    const folderProjects = getFolderProjects(viewData.folder.id)
    
    return (
      <div className="py-2">
        <div className="px-4 py-2 flex items-center gap-2 border-b">
          <FolderOpen className="h-5 w-5 text-amber-500" />
          <span className="font-semibold">{viewData.title}</span>
          <span className="text-sm text-muted-foreground">
            ({folderProjects.length} 个项目)
          </span>
        </div>
        
        <div className="mt-2">
          {folderProjects.map(project => renderProject(project))}
        </div>
      </div>
    )
  }

  if (viewData.type === 'project') {
    if (!viewData.project) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
          <FolderKanban className="h-12 w-12 opacity-10 mb-3" />
          <p className="text-sm">项目不存在</p>
        </div>
      )
    }
    
    return (
      <div className="py-2">
        <QuickAddAction projectId={viewData.project.id} />
        {renderProject(viewData.project)}
      </div>
    )
  }

  return null
}

// ============================================================================
// Quick Add Action Component
// ============================================================================

interface QuickAddActionProps {
  projectId: string
}

function QuickAddAction({ projectId }: QuickAddActionProps) {
  const [title, setTitle] = useState('')
  const createTask = useCreateTask()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    try {
      await createTask.mutateAsync({
        title: title.trim(),
        project: projectId,
        task_type: 'project_task',
      })
      setTitle('')
      inputRef.current?.focus()
    } catch {
      toast.error('添加失败')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="px-4 py-2 border-b">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded-full border-2 border-dashed border-muted-foreground/30 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="添加新动作..."
          className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground/50"
        />
      </div>
    </form>
  )
}

// ============================================================================
// Status Circle Component - OmniFocus style
// ============================================================================

interface StatusCircleProps {
  task: Task
  isOverdue: boolean
  isDueSoon: boolean
  onClick: (e: React.MouseEvent) => void
}

function StatusCircle({ task, isOverdue, isDueSoon, onClick }: StatusCircleProps) {
  const isCompleted = !!task.completed_at
  const isDropped = !!task.dropped_at
  const isFlagged = task.flagged
  const isRepeat = !!task.repeat_rule
  const isActionGroup = task.task_type === 'action_group'

  // Determine circle color based on state
  let circleColor = 'border-gray-400' // Default active state
  let fillColor = 'bg-transparent'
  
  if (isCompleted) {
    fillColor = 'bg-green-500'
    circleColor = 'border-green-500'
  } else if (isDropped) {
    fillColor = 'bg-gray-400'
    circleColor = 'border-gray-400'
  } else {
    // Active states
    if (isOverdue) {
      circleColor = 'border-red-500'
    } else if (isDueSoon) {
      circleColor = 'border-yellow-500'
    } else if (isFlagged) {
      circleColor = 'border-orange-500'
    } else if (isActionGroup) {
      // Action Group: 紫色边框
      circleColor = 'border-purple-500'
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative w-4 h-4 rounded-full border-[1.5px] flex items-center justify-center flex-shrink-0",
        "transition-all hover:scale-110",
        circleColor,
        (isCompleted || isDropped) && fillColor
      )}
      title={isCompleted ? '已完成 (点击恢复)' : isDropped ? '已丢弃 (点击恢复)' : isActionGroup ? '动作组 - 点击完成' : '点击完成，Alt+点击丢弃'}
    >
      {/* Completed: Checkmark */}
      {isCompleted && (
        <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
      )}
      
      {/* Dropped: Dash */}
      {isDropped && (
        <div className="w-1.5 h-0.5 bg-white rounded-full" />
      )}
      
      {/* Repeat: Three dots */}
      {!isCompleted && !isDropped && isRepeat && (
        <div className="flex gap-[1px]">
          <div className="w-0.5 h-0.5 rounded-full bg-current" />
          <div className="w-0.5 h-0.5 rounded-full bg-current" />
          <div className="w-0.5 h-0.5 rounded-full bg-current" />
        </div>
      )}
      
      {/* Action Group: Inner dot indicator */}
      {!isCompleted && !isDropped && isActionGroup && !isRepeat && (
        <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
      )}
    </button>
  )
}

// ============================================================================
// New Project Dialog
// ============================================================================

interface NewProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  folders: FolderType[]
  initialType: 'parallel' | 'sequential' | 'single_action'
}

function NewProjectDialog({ open, onOpenChange, folders, initialType }: NewProjectDialogProps) {
  const [title, setTitle] = useState('')
  const [projectType, setProjectType] = useState(initialType)
  const [folderId, setFolderId] = useState('')
  const createProject = useCreateProject()

  const handleSubmit = async () => {
    if (!title.trim()) return

    try {
      await createProject.mutateAsync({
        title: title.trim(),
        project_type: projectType,
        folder: folderId || undefined,
      })
      toast.success('项目已创建')
      onOpenChange(false)
      setTitle('')
      setFolderId('')
    } catch {
      toast.error('创建失败')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>新建项目</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">标题</label>
            <Input
              placeholder="项目名称"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">类型</label>
            <div className="flex gap-2">
              {(['parallel', 'sequential', 'single_action'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setProjectType(type)}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-lg border text-sm transition-colors",
                    projectType === type
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  {type === 'parallel' && '并行'}
                  {type === 'sequential' && '顺序'}
                  {type === 'single_action' && '单动作'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">文件夹（可选）</label>
            <select
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">无</option>
              {folders.map(folder => (
                <option key={folder.id} value={folder.id}>{folder.name}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={!title.trim()}>
              创建
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// New Folder Dialog
// ============================================================================

interface NewFolderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  folders: FolderType[]
}

function NewFolderDialog({ open, onOpenChange, folders }: NewFolderDialogProps) {
  const [name, setName] = useState('')
  const [parentId, setParentId] = useState('')
  const createFolder = useCreateFolder()

  const handleSubmit = async () => {
    if (!name.trim()) return

    try {
      await createFolder.mutateAsync({
        name: name.trim(),
        parent: parentId || undefined,
      })
      toast.success('文件夹已创建')
      onOpenChange(false)
      setName('')
      setParentId('')
    } catch {
      toast.error('创建失败')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>新建文件夹</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">名称</label>
            <Input
              placeholder="文件夹名称"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">父文件夹（可选）</label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">无</option>
              {folders.map(folder => (
                <option key={folder.id} value={folder.id}>{folder.name}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={!name.trim()}>
              创建
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

