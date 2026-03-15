import { createFileRoute } from '@tanstack/react-router'
import { ProjectsPage } from './projects'

export const Route = createFileRoute('/projects/$type/$id')({
  component: ProjectsPage,
})
