import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import {
  RefreshCw,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FolderKanban,
} from 'lucide-react'
import { useProjectsNeedingReview, useReviewProject } from '@/hooks/useProjects'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// Extended Project type with next_review_date
interface ProjectWithReview {
  id: string
  title: string
  note: string
  status: string
  status_display: string
  project_type_display?: string
  folder_name: string | null
  next_review_date: string | null
  review_interval_days: number | null
  completion_percentage: number | null
  flagged?: boolean
}

export const Route = createFileRoute('/_app/review')({
  component: ReviewPage,
})

function ReviewPage() {
  const { t } = useTranslation()
  const { data: projects, isLoading } = useProjectsNeedingReview()
  const reviewProject = useReviewProject()

  const handleReview = (projectId: string) => {
    reviewProject.mutate(projectId)
  }

  // Group by review status
  const overdueProjects =
    projects?.filter(
      (p: ProjectWithReview) =>
        p.next_review_date && new Date(p.next_review_date) < new Date()
    ) || []
  const upcomingProjects =
    projects?.filter(
      (p: ProjectWithReview) =>
        p.next_review_date && new Date(p.next_review_date) >= new Date()
    ) || []

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <RefreshCw className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t('review.title')}</h1>
            <p className="text-muted-foreground">
              {t('review.projectsCount', { count: projects?.length || 0 })}
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          {t('review.refresh')}
        </Button>
      </div>

      {/* Overdue Section */}
      {overdueProjects.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            {t('review.overdueReview', { count: overdueProjects.length })}
          </h2>
          <div className="space-y-3">
            {overdueProjects.map((project) => (
              <ReviewCard
                key={project.id}
                project={project}
                onReview={handleReview}
                isReviewing={reviewProject.isPending}
              />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Section */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5" />
          {t('review.dueForReview', { count: upcomingProjects.length })}
        </h2>
        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              {t('review.loadingProjects')}
            </CardContent>
          </Card>
        ) : upcomingProjects.length > 0 ? (
          <div className="space-y-3">
            {upcomingProjects.map((project) => (
              <ReviewCard
                key={project.id}
                project={project}
                onReview={handleReview}
                isReviewing={reviewProject.isPending}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <CheckCircle2 className="mx-auto h-12 w-12 opacity-20 mb-3" />
              <p>{t('review.noProjects')}</p>
              <p className="text-sm">{t('review.allUpToDate')}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Review Tips */}
      <Card className="bg-muted/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">{t('review.checklistTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500" />
              {t('review.checklist.relevant')}
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500" />
              {t('review.checklist.status')}
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500" />
              {t('review.checklist.dates')}
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500" />
              {t('review.checklist.folder')}
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500" />
              {t('review.checklist.markReviewed')}
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

interface ReviewCardProps {
  project: ProjectWithReview
  onReview: (id: string) => void
  isReviewing: boolean
}

function ReviewCard({ project, onReview, isReviewing }: ReviewCardProps) {
  const { t } = useTranslation()
  const isOverdue =
    project.next_review_date && new Date(project.next_review_date) < new Date()

  return (
    <Card
      className={cn(
        'transition-colors',
        isOverdue && 'border-red-200 bg-red-50/50'
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5 text-green-500" />
              <h3 className="font-semibold">{project.title}</h3>
              {isOverdue && (
                <Badge variant="destructive" className="text-xs">
                  Overdue
                </Badge>
              )}
            </div>

            {project.note && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {project.note}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-3">
              {project.folder_name && (
                <Badge variant="outline" className="text-xs gap-1">
                  <FolderKanban className="h-3 w-3" />
                  {project.folder_name}
                </Badge>
              )}
              <Badge variant="secondary" className="text-xs">
                {project.status_display}
              </Badge>
              {project.project_type_display && (
                <Badge variant="outline" className="text-xs">
                  {project.project_type_display}
                </Badge>
              )}
              {project.completion_percentage !== undefined && (
                <Badge
                  variant={
                    project.completion_percentage === 100
                      ? 'default'
                      : 'secondary'
                  }
                  className="text-xs"
                >
                  {t('review.completion', { percentage: project.completion_percentage })}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
              {project.next_review_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {t('review.reviewDue', { date: new Date(project.next_review_date).toLocaleDateString() })}
                </span>
              )}
              {project.review_interval_days && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {t('review.everyDays', { days: project.review_interval_days })}
                </span>
              )}
            </div>
          </div>

          <Button
            onClick={() => onReview(project.id)}
            disabled={isReviewing}
            className="flex-shrink-0"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {t('review.markReviewed')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
