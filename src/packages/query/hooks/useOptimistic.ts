/**
 * Optimistic Update Hooks
 * 乐观更新模式
 */

import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query'

interface OptimisticOptions<TData, TVariables> {
  queryKey: QueryKey
  mutationFn: (variables: TVariables) => Promise<TData>
  onMutateUpdate: (oldData: TData | undefined, variables: TVariables) => TData
  onError?: (error: Error, variables: TVariables, context: { previousData: TData | undefined }) => void
  onSuccess?: (data: TData, variables: TVariables) => void
}

export function useOptimisticMutation<TData, TVariables>({
  queryKey,
  mutationFn,
  onMutateUpdate,
  onError,
  onSuccess,
}: OptimisticOptions<TData, TVariables>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey })

      // Snapshot previous value
      const previousData = queryClient.getQueryData<TData>(queryKey)

      // Optimistically update
      queryClient.setQueryData<TData>(queryKey, (old) => onMutateUpdate(old, variables))

      return { previousData }
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(queryKey, context.previousData)
      }
      onError?.(error, variables, context as { previousData: TData | undefined })
    },
    onSuccess: (data, variables) => {
      onSuccess?.(data, variables)
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey })
    },
  })
}

// 列表项乐观更新
export function useOptimisticListUpdate<T extends { id: string }>() {
  const queryClient = useQueryClient()

  return {
    updateItem: (queryKey: QueryKey, id: string, updater: (item: T) => T) => {
      queryClient.setQueryData<T[]>(queryKey, (old) => {
        if (!old) return old
        return old.map((item) => (item.id === id ? updater(item) : item))
      })
    },

    addItem: (queryKey: QueryKey, item: T, prepend = true) => {
      queryClient.setQueryData<T[]>(queryKey, (old) => {
        if (!old) return [item]
        return prepend ? [item, ...old] : [...old, item]
      })
    },

    removeItem: (queryKey: QueryKey, id: string) => {
      queryClient.setQueryData<T[]>(queryKey, (old) => {
        if (!old) return old
        return old.filter((item) => item.id !== id)
      })
    },
  }
}
