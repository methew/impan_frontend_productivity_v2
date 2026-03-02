import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ChevronRight,
  ChevronDown,
  MapPin,
  Globe,
  Building,
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  Search,
  X,
  ListTodo,
} from 'lucide-react'
import {
  useLocationTree,
  useCreateLocation,
  useUpdateLocation,
  useDeleteLocation,
  useLocationTypeChoices,
} from '@/hooks/useLocations'
import * as api from '@/api/locations'
import { useProjectsByLocation } from '@/hooks/useProjects'
import { useTasksByLocation } from '@/hooks/useTasks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import type { Location, LocationTreeNode } from '@/types'

export const Route = createFileRoute('/_app/location')({
  component: LocationPage,
})

function LocationPage() {
  const { t } = useTranslation()
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [deletingLocation, setDeletingLocation] = useState<Location | null>(null)

  const { data: locationTree, isLoading: isTreeLoading } = useLocationTree()
  const { data: typeChoices } = useLocationTypeChoices()
  const createLocation = useCreateLocation()
  const updateLocation = useUpdateLocation()
  const deleteLocation = useDeleteLocation()

  const handleCreate = (data: {
    type: string
    code: string
    abbreviation: string
    title: string
    title_zh?: string
    title_ja?: string
    address?: string
    parent?: number | null
  }) => {
    createLocation.mutate(
      { ...data, is_valid: true },
      {
        onSuccess: () => {
          toast.success(t('location.create') + ' ' + t('common.success'))
          setIsCreateDialogOpen(false)
        },
        onError: () => {
          toast.error(t('location.create') + ' ' + t('common.error'))
        },
      }
    )
  }

  const handleUpdate = (id: number, data: api.UpdateLocationRequest) => {
    updateLocation.mutate(
      { id, data },
      {
        onSuccess: () => {
          toast.success(t('location.edit') + ' ' + t('common.success'))
          setIsEditDialogOpen(false)
          setEditingLocation(null)
        },
        onError: () => {
          toast.error(t('location.edit') + ' ' + t('common.error'))
        },
      }
    )
  }

  const handleDelete = (id: number) => {
    deleteLocation.mutate(id, {
      onSuccess: () => {
        toast.success('Location deleted successfully')
        setIsDeleteDialogOpen(false)
        setDeletingLocation(null)
        if (selectedLocation?.id === id) {
          setSelectedLocation(null)
        }
      },
      onError: () => {
        toast.error('Failed to delete location')
      },
    })
  }

  const openEditDialog = (location: Location) => {
    setEditingLocation(location)
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (location: Location) => {
    setDeletingLocation(location)
    setIsDeleteDialogOpen(true)
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-100px)]">
      {/* Left: Locations Tree */}
      <Card className="w-80 flex-shrink-0 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between mb-2">
            <CardTitle className="text-base font-medium">{t('location.title')}</CardTitle>
            <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('location.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 flex-1"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto p-2">
          {isTreeLoading ? (
            <div className="p-4 text-center text-muted-foreground">{t('common.loading')}</div>
          ) : locationTree && locationTree.length > 0 ? (
            <div className="space-y-1">
              {locationTree.map((location) => (
                <LocationTreeItem
                  key={location.id}
                  location={location}
                  selectedLocation={selectedLocation}
                  onSelect={setSelectedLocation}
                  onEdit={openEditDialog}
                  onDelete={openDeleteDialog}
                  level={0}
                />
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground">{t('location.noResults') || t('common.empty')}</div>
          )}
        </CardContent>
      </Card>

      {/* Right: Location Detail View */}
      <div className="flex-1 min-w-0">
        {selectedLocation ? (
          <LocationDetailCard
            location={selectedLocation}
            onEdit={() => openEditDialog(selectedLocation)}
            onDelete={() => openDeleteDialog(selectedLocation)}
          />
        ) : (
          <Card className="h-full flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MapPin className="mx-auto h-12 w-12 opacity-20 mb-3" />
              <p>{t('location.selectPrompt')}</p>
            </div>
          </Card>
        )}
      </div>

      {/* Create Dialog */}
      <LocationFormDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSubmit={handleCreate}
        title={t('location.create')}
        typeChoices={typeChoices || []}
        isSubmitting={createLocation.isPending}
      />

      {/* Edit Dialog */}
      {editingLocation && (
        <LocationFormDialog
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false)
            setEditingLocation(null)
          }}
          onSubmit={(data) => handleUpdate(editingLocation.id, data)}
          title={t('location.edit')}
          initialData={editingLocation}
          typeChoices={typeChoices || []}
          isSubmitting={updateLocation.isPending}
        />
      )}

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('location.delete')}</DialogTitle>
            <DialogDescription>
              {t('location.deleteConfirm', { name: deletingLocation?.title_zh || deletingLocation?.title })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setDeletingLocation(null)
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletingLocation && handleDelete(deletingLocation.id)}
              disabled={deleteLocation.isPending}
            >
              {deleteLocation.isPending ? t('common.deleting') : t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Location Tree Item Component
interface LocationTreeItemProps {
  location: LocationTreeNode
  selectedLocation: Location | null
  onSelect: (location: Location) => void
  onEdit: (location: Location) => void
  onDelete: (location: Location) => void
  level: number
}

function LocationTreeItem({
  location,
  selectedLocation,
  onSelect,
  onEdit,
  onDelete,
  level,
}: LocationTreeItemProps) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(true)
  const hasChildren = location.children && location.children.length > 0
  const isSelected = selectedLocation?.id === location.id

  const getLocationIcon = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((location.type as any) === 'BUILDING') {
      return <Building className="h-4 w-4 text-blue-500 flex-shrink-0" />
    }
    return <Globe className="h-4 w-4 text-green-500 flex-shrink-0" />
  }

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-1 rounded-md px-2 py-1.5 cursor-pointer transition-colors group',
          'hover:bg-muted',
          isSelected && 'bg-primary/10 hover:bg-primary/10'
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={() => onSelect(location)}
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

        {getLocationIcon()}

        <span className="flex-1 truncate text-sm">
          {location.title_zh || location.title}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(location)}>
              <Edit className="h-4 w-4 mr-2" />
              {t('common.edit')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(location)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t('common.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {expanded && hasChildren && location.children && (
        <div>
          {location.children.map((child) => (
            <LocationTreeItem
              key={child.id}
              location={child}
              selectedLocation={selectedLocation}
              onSelect={onSelect}
              onEdit={onEdit}
              onDelete={onDelete}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Location Detail Card
interface LocationDetailCardProps {
  location: Location
  onEdit: () => void
  onDelete: () => void
}

function LocationDetailCard({ location, onEdit, onDelete }: LocationDetailCardProps) {
  const { t } = useTranslation()
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Globe className="h-8 w-8 text-green-500" />
            <div>
              <CardTitle className="text-xl">{location.title_zh || location.title}</CardTitle>
              {location.abbreviated_path && (
                <p className="text-sm text-muted-foreground">{location.abbreviated_path}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="destructive" size="sm" onClick={onDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-3">
          {location.type_display && (
            <Badge variant="outline">{location.type_display}</Badge>
          )}
          {location.code && <Badge variant="secondary">{t('location.code')}: {location.code}</Badge>}
          {location.abbreviation && (
            <Badge variant="secondary">{t('location.abbreviation')}: {location.abbreviation}</Badge>
          )}
          {location.build_in && <Badge variant="default">{t('tags.builtIn')}</Badge>}
          {location.is_valid === false && <Badge variant="destructive">{t('tags.inactive')}</Badge>}
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-auto p-6 space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase">{t('location.basicInfo')}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground">{t('location.englishTitle')}</label>
              <p className="text-sm font-medium">{location.title || '-'}</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">{t('location.japaneseTitle')}</label>
              <p className="text-sm font-medium">{location.title_ja || '-'}</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">{t('location.locationType')}</label>
              <p className="text-sm font-medium">{location.type_display || location.type}</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">{t('location.code')}</label>
              <p className="text-sm font-medium">{location.code || '-'}</p>
            </div>
          </div>
        </div>

        {/* Address Info */}
        {(location.address || location.position) && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase">{t('location.address')}</h3>
            <div className="space-y-2">
              {location.address && (
                <div>
                  <label className="text-xs text-muted-foreground">{t('location.address')}</label>
                  <p className="text-sm font-medium">{location.address}</p>
                </div>
              )}
              {location.position && (
                <div>
                  <label className="text-xs text-muted-foreground">Position</label>
                  <p className="text-sm font-medium">{location.position}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Related Tasks & Projects */}
        <LocationRelatedItems locationId={location.id} />

        {/* Metadata */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase">{t('location.metadata')}</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="text-xs text-muted-foreground">{t('location.created')}</label>
              <p>{location.created_at ? new Date(location.created_at).toLocaleDateString() : '-'}</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">{t('location.updated')}</label>
              <p>{location.updated_at ? new Date(location.updated_at).toLocaleDateString() : '-'}</p>
            </div>
            {location.parent_name && (
              <div>
                <label className="text-xs text-muted-foreground">{t('location.parentLocation')}</label>
                <p>{location.parent_name}</p>
              </div>
            )}
          </div>
        </div>

        {/* Details JSON */}
        {location.details && Object.keys(location.details).length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase">{t('location.details')}</h3>
            <pre className="bg-muted p-3 rounded-md text-xs overflow-auto">
              {JSON.stringify(location.details, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Location Related Items Component - Tree View
interface LocationRelatedItemsProps {
  locationId: number
}

interface ProjectWithTasks {
  project: {
    id: string
    title: string
    status: string
    status_display: string
    folder_name: string | null
  }
  tasks: Array<{
    id: string
    title: string
    is_completed: boolean
    due_date: string | null
    flagged: boolean
  }>
}

function LocationRelatedItems({ locationId }: LocationRelatedItemsProps) {
  const { t } = useTranslation()
  const { data: projectsData } = useProjectsByLocation(locationId)
  const { data: tasksData } = useTasksByLocation(locationId)

  // Group tasks by project
  const projectTasksMap = new Map<string, ProjectWithTasks>()

  // Initialize projects
  projectsData?.results.forEach((project) => {
    projectTasksMap.set(project.id, {
      project: {
        id: project.id,
        title: project.title,
        status: project.status,
        status_display: project.status_display,
        folder_name: project.folder_name,
      },
      tasks: [],
    })
  })

  // Add tasks to their projects
  tasksData?.results.forEach((task) => {
    if (task.project) {
      const projectGroup = projectTasksMap.get(task.project)
      if (projectGroup) {
        projectGroup.tasks.push({
          id: task.id,
          title: task.title,
          is_completed: task.is_completed,
          due_date: task.due_date,
          flagged: task.flagged,
        })
      }
    }
  })

  // Get inbox tasks (tasks without project)
  const inboxTasks = tasksData?.results.filter((task) => !task.project) || []

  // Convert to array and sort
  const groupedProjects = Array.from(projectTasksMap.values()).sort((a, b) =>
    a.project.title.localeCompare(b.project.title)
  )

  const hasItems = groupedProjects.length > 0 || inboxTasks.length > 0

  if (!hasItems) {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase">{t('location.relatedItems')}</h3>
        <p className="text-sm text-muted-foreground">No tasks or projects associated with this location.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground uppercase">
        {t('location.relatedItems')} ({groupedProjects.length} {t('projects.title')}, {tasksData?.count || 0} {t('common.tasks')})
      </h3>

      <div className="border rounded-lg overflow-hidden">
        {/* Inbox Tasks (No Project) */}
        {inboxTasks.length > 0 && (
          <ProjectTreeItem
            project={{
              id: 'inbox',
              title: t('location.inboxTasks'),
              status: 'active',
              status_display: t('location.inboxTasks'),
              folder_name: null,
            }}
            tasks={inboxTasks.map((task) => ({
              id: task.id,
              title: task.title,
              is_completed: task.is_completed,
              due_date: task.due_date,
              flagged: task.flagged,
            }))}
            defaultExpanded={true}
          />
        )}

        {/* Projects with Tasks */}
        {groupedProjects.map((group) => (
          <ProjectTreeItem
            key={group.project.id}
            project={group.project}
            tasks={group.tasks}
            defaultExpanded={false}
          />
        ))}
      </div>
    </div>
  )
}

// Project Tree Item Component
interface ProjectTreeItemProps {
  project: {
    id: string
    title: string
    status: string
    status_display: string
    folder_name: string | null
  }
  tasks: Array<{
    id: string
    title: string
    is_completed: boolean
    due_date: string | null
    flagged: boolean
  }>
  defaultExpanded: boolean
}

function ProjectTreeItem({ project, tasks, defaultExpanded }: ProjectTreeItemProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const hasTasks = tasks.length > 0

  return (
    <div className="border-b last:border-b-0">
      {/* Project Header */}
      <div
        className={cn(
          'flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors',
          project.id === 'inbox' && 'bg-blue-50/50'
        )}
        onClick={() => setExpanded(!expanded)}
      >
        {hasTasks ? (
          <button
            className="p-0.5 hover:bg-muted-foreground/10 rounded"
            onClick={(e) => {
              e.stopPropagation()
              setExpanded(!expanded)
            }}
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        ) : (
          <span className="w-5" />
        )}

        <ListTodo className={cn(
          'h-5 w-5 flex-shrink-0',
          project.id === 'inbox' ? 'text-blue-500' : 'text-green-500'
        )} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{project.title}</span>
            {project.id === 'inbox' && (
              <Badge variant="secondary" className="text-xs">
                Inbox
              </Badge>
            )}
          </div>
          {project.folder_name && (
            <p className="text-xs text-muted-foreground">{project.folder_name}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasTasks && (
            <Badge variant="secondary" className="text-xs">
              {tasks.filter((t) => t.is_completed).length}/{tasks.length}
            </Badge>
          )}
          <Badge
            variant={project.status === 'active' ? 'default' : 'secondary'}
            className="text-xs"
          >
            {project.status_display}
          </Badge>
        </div>
      </div>

      {/* Tasks List */}
      {expanded && hasTasks && (
        <div className="bg-muted/30">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-3 px-4 py-2 pl-12 hover:bg-muted/50 transition-colors"
            >
              <Checkbox checked={task.is_completed} disabled className="h-4 w-4" />
              <span
                className={cn(
                  'flex-1 text-sm truncate',
                  task.is_completed && 'line-through text-muted-foreground'
                )}
              >
                {task.title}
              </span>
              <div className="flex items-center gap-2">
                {task.flagged && (
                  <span className="text-red-500">⚑</span>
                )}
                {task.due_date && (
                  <span className="text-xs text-muted-foreground">
                    {new Date(task.due_date).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Location Form Dialog
interface LocationFormDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: {
    type: string
    code: string
    abbreviation: string
    title: string
    title_zh?: string
    title_ja?: string
    address?: string
    parent?: number | null
  }) => void
  title: string
  initialData?: Location | null
  typeChoices: Array<{ value: string; label: string }>
  isSubmitting: boolean
}

function LocationFormDialog({
  isOpen,
  onClose,
  onSubmit,
  title,
  initialData,
  typeChoices,
  isSubmitting,
}: LocationFormDialogProps) {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    type: initialData?.type || '',
    code: initialData?.code || '',
    abbreviation: initialData?.abbreviation || '',
    title: initialData?.title || '',
    title_zh: initialData?.title_zh || '',
    title_ja: initialData?.title_ja || '',
    address: initialData?.address || '',
    parent: initialData?.parent || null,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">{t('location.form.type')} {t('location.form.required')}</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('location.form.typePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {typeChoices.map((choice) => (
                    <SelectItem key={choice.value} value={choice.value}>
                      {choice.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">{t('location.code')} {t('location.form.required')}</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder={t('location.form.codePlaceholder')}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="abbreviation">{t('location.abbreviation')} {t('location.form.required')}</Label>
            <Input
              id="abbreviation"
              value={formData.abbreviation}
              onChange={(e) => setFormData({ ...formData, abbreviation: e.target.value })}
              placeholder={t('location.form.abbreviationPlaceholder')}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">{t('location.englishTitle')} {t('location.form.required')}</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={t('location.form.titlePlaceholder')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title_zh">{t('location.chineseTitle')}</Label>
              <Input
                id="title_zh"
                value={formData.title_zh}
                onChange={(e) => setFormData({ ...formData, title_zh: e.target.value })}
                placeholder={t('location.form.titleZhPlaceholder')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title_ja">{t('location.japaneseTitle')}</Label>
            <Input
              id="title_ja"
              value={formData.title_ja}
              onChange={(e) => setFormData({ ...formData, title_ja: e.target.value })}
              placeholder={t('location.form.titleJaPlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">{t('location.address')}</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder={t('location.form.addressPlaceholder')}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('common.saving') : t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
