import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ChevronRight,
  ChevronDown,
  Tag,
  ListTodo,
} from 'lucide-react'
import { useTags, useTagTasks, useTagProjects } from '@/hooks/useTags'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import type { Tag as TagType } from '@/types'

export const Route = createFileRoute('/_app/tags')({
  component: TagsPage,
})

function TagsPage() {
  const { t } = useTranslation()
  const [selectedTag, setSelectedTag] = useState<TagType | null>(null)
  const { data: tags, isLoading: isTagsLoading } = useTags()

  // Build tag tree from flat list
  const tagTree = tags?.results
    ? buildTagTree(tags.results.filter((t) => !t.parent), tags.results)
    : []

  return (
    <div className="flex gap-6 h-[calc(100vh-100px)]">
      {/* Left: Tags Tree */}
      <Card className="w-80 flex-shrink-0 flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">{t('tags.title')}</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto p-2">
          {isTagsLoading ? (
            <div className="p-4 text-center text-muted-foreground">{t('common.loading')}</div>
          ) : tagTree.length > 0 ? (
            <div className="space-y-1">
              {tagTree.map((tag) => (
                <TagTreeNodeItem
                  key={tag.id}
                  tag={tag}
                  selectedTag={selectedTag}
                  onSelect={setSelectedTag}
                  level={0}
                />
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground">{t('tags.noTags')}</div>
          )}
        </CardContent>
      </Card>

      {/* Right: Tasks & Projects View */}
      <div className="flex-1 min-w-0">
        {selectedTag ? (
          <TagDetailView tag={selectedTag} />
        ) : (
          <Card className="h-full flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Tag className="mx-auto h-12 w-12 opacity-20 mb-3" />
              <p>{t('tags.selectPrompt')}</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

// Tag Tree Node Item Component
interface TagTreeNodeItemProps {
  tag: TagType & { children?: TagType[] }
  selectedTag: TagType | null
  onSelect: (tag: TagType) => void
  level: number
}

function TagTreeNodeItem({
  tag,
  selectedTag,
  onSelect,
  level,
}: TagTreeNodeItemProps) {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = tag.children && tag.children.length > 0
  const isSelected = selectedTag?.id === tag.id

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-1 rounded-md px-2 py-1.5 cursor-pointer transition-colors',
          'hover:bg-muted',
          isSelected && 'bg-primary/10 hover:bg-primary/10'
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={() => onSelect(tag)}
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

        <Tag className="h-4 w-4 text-orange-500 flex-shrink-0" />

        <span className="flex-1 truncate text-sm">
          {tag.title_zh || tag.title}
          {tag.abbreviation && (
            <span className="text-muted-foreground ml-1">({tag.abbreviation})</span>
          )}
        </span>
      </div>

      {expanded && hasChildren && tag.children && (
        <div>
          {tag.children.map((child) => (
            <TagTreeNodeItem
              key={child.id}
              tag={child as TagType & { children?: TagType[] }}
              selectedTag={selectedTag}
              onSelect={onSelect}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Tag Detail View
interface TagDetailViewProps {
  tag: TagType
}

function TagDetailView({ tag }: TagDetailViewProps) {
  const { t } = useTranslation()
  const { data: tasks, isLoading: isTasksLoading } = useTagTasks(tag.id)
  const { data: projects, isLoading: isProjectsLoading } = useTagProjects(tag.id)

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center gap-2">
          <Tag className="h-5 w-5 text-orange-500" />
          <CardTitle className="text-lg">{tag.title_zh || tag.title}</CardTitle>
          {tag.abbreviation && (
            <Badge variant="secondary">{tag.abbreviation}</Badge>
          )}
        </div>

        {/* Tag Details */}
        <div className="flex flex-wrap gap-2 mt-3">
          {tag.type_display && (
            <Badge variant="outline">{tag.type_display}</Badge>
          )}
          {tag.code && (
            <Badge variant="secondary">{t('location.code')}: {tag.code}</Badge>
          )}
          {tag.build_in && <Badge variant="default">{t('tags.builtIn')}</Badge>}
          {tag.is_valid === false && (
            <Badge variant="destructive">{t('tags.inactive')}</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-auto p-0">
        <Tabs defaultValue="tasks" className="w-full">
          <TabsList className="w-full rounded-none border-b bg-transparent p-0">
            <TabsTrigger
              value="tasks"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              {t('tags.tasks')}
              {tasks?.count !== undefined && (
                <Badge variant="secondary" className="ml-2">
                  {tasks.count}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="projects"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              {t('tags.projects')}
              {projects?.count !== undefined && (
                <Badge variant="secondary" className="ml-2">
                  {projects.count}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="m-0">
            {isTasksLoading ? (
              <div className="p-8 text-center text-muted-foreground">{t('common.loading')}</div>
            ) : tasks?.results && tasks.results.length > 0 ? (
              <div className="divide-y">
                {tasks.results.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50"
                  >
                    <Checkbox checked={task.is_completed} disabled />
                    <div className="flex-1 min-w-0">
                      <span className={task.is_completed ? 'line-through text-muted-foreground' : ''}>
                        {task.title}
                      </span>
                      {task.project_name && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <ListTodo className="h-3 w-3" />
                          {task.project_name}
                        </div>
                      )}
                    </div>
                    {task.due_date && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(task.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <p>{t('tags.noTasks')}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="projects" className="m-0">
            {isProjectsLoading ? (
              <div className="p-8 text-center text-muted-foreground">{t('common.loading')}</div>
            ) : projects?.results && projects.results.length > 0 ? (
              <div className="divide-y">
                {projects.results.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-muted/50"
                  >
                    <ListTodo className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">{project.title}</span>
                      {project.folder_name && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Tag className="h-3 w-3" />
                          {project.folder_name}
                        </div>
                      )}
                    </div>
                    {project.due_date && (
                      <span className="text-xs text-muted-foreground">
                        Due: {new Date(project.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <p>{t('tags.noProjects')}</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

// Helper to build tag tree
function buildTagTree(
  topLevelTags: TagType[],
  allTags: TagType[]
): Array<TagType & { children?: TagType[] }> {
  return topLevelTags.map((tag) => ({
    ...tag,
    children: allTags.filter((t) => t.parent === tag.id),
  }))
}
