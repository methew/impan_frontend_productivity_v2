import { createFileRoute } from '@tanstack/react-router'
import { RefreshCw, CheckCircle2 } from 'lucide-react'
import { Button } from '@/packages/ui/components/button'
import { Badge } from '@/packages/ui/components/badge'
import { Progress } from '@/packages/ui/components/progress'
import { useProjects, useReviewProject } from '@/hooks/useProjects'
import { format, parseISO, isPast } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import type { Project } from '@/types'

export const Route = createFileRoute('/review')({
  component: ReviewPage,
})

function ReviewPage() {
  const { data: projects, isLoading } = useProjects()
  const reviewProject = useReviewProject()

  // Filter projects needing review
  const projectsToReview = projects?.filter(p => {
    if (p.status !== 'active') return false
    if (!p.next_review_at) return true
    return isPast(parseISO(p.next_review_at))
  }) || []

  const reviewedProjects = projects?.filter(p => {
    if (p.status !== 'active') return false
    if (!p.next_review_at) return false
    return !isPast(parseISO(p.next_review_at))
  }) || []

  const handleReview = (project: Project) => {
    reviewProject.mutate(project.id)
  }

  return (
    <div className="h-full flex flex-col bg-[#faf9f8]">
      {/* Header */}
      <div className="px-8 pt-8 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <RefreshCw className="h-8 w-8 text-[#8b5cf6]" />
          <h1 className="text-2xl font-semibold text-gray-900">回顾</h1>
        </div>
        <p className="text-gray-500 ml-11">
          {projectsToReview.length} 个项目需要回顾
        </p>
      </div>

      {/* Project List */}
      <div className="flex-1 overflow-y-auto px-8 pb-8">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">加载中...</div>
        ) : (
          <>
            {/* Projects to Review */}
            {projectsToReview.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-medium text-amber-600 mb-3">需要回顾</h3>
                <div className="space-y-3">
                  {projectsToReview.map(project => (
                    <ProjectReviewCard 
                      key={project.id}
                      project={project}
                      onReview={() => handleReview(project)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Reviewed Projects */}
            {reviewedProjects.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-green-600 mb-3">已回顾</h3>
                <div className="space-y-3">
                  {reviewedProjects.map(project => (
                    <ProjectReviewCard 
                      key={project.id}
                      project={project}
                      reviewed
                    />
                  ))}
                </div>
              </div>
            )}

            {projectsToReview.length === 0 && reviewedProjects.length === 0 && (
              <div className="text-center py-12">
                <RefreshCw className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  暂无项目需要回顾
                </h3>
                <p className="text-gray-500 max-w-sm mx-auto">
                  定期回顾项目以确保它们按计划进行
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

interface ProjectReviewCardProps {
  project: Project
  onReview?: () => void
  reviewed?: boolean
}

function ProjectReviewCard({ project, onReview, reviewed }: ProjectReviewCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-medium text-lg text-gray-900">{project.title}</h3>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="text-xs">
              {project.review_interval_days}天回顾一次
            </Badge>
            {project.last_reviewed_at && (
              <span className="text-xs text-gray-500">
                上次回顾: {format(parseISO(project.last_reviewed_at), 'M月d日', { locale: zhCN })}
              </span>
            )}
          </div>
        </div>
        {onReview && (
          <Button 
            size="sm" 
            onClick={onReview}
            className="bg-[#2563eb] hover:bg-[#1d4ed8]"
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            回顾
          </Button>
        )}
        {reviewed && (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            已回顾
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Progress value={project.completion_percentage} className="flex-1 h-2" />
        <span className="text-sm font-medium text-gray-600 w-12 text-right">
          {project.completion_percentage}%
        </span>
      </div>
    </div>
  )
}

export default ReviewPage
