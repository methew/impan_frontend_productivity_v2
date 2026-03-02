import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: () => {
    // Redirect to inbox as the main productivity dashboard
    throw redirect({ to: '/inbox' })
  },
})
