import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Person } from '@/types'
import * as api from '@/api/persons'

const PERSONS_KEY = 'persons'

export function usePersons(params?: Parameters<typeof api.getPersons>[0]) {
  return useQuery<Person[]>({
    queryKey: [PERSONS_KEY, params],
    queryFn: () => api.getPersons(params),
    select: (data) => data || [],
  })
}

export function usePerson(id: number) {
  return useQuery<Person>({
    queryKey: [PERSONS_KEY, id],
    queryFn: () => api.getPerson(id),
    enabled: !!id,
  })
}

export function useCreatePerson() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.createPerson,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PERSONS_KEY] })
    },
  })
}

export function useUpdatePerson() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Person> }) =>
      api.updatePerson(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PERSONS_KEY] })
    },
  })
}

export function useDeletePerson() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.deletePerson,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PERSONS_KEY] })
    },
  })
}
