/**
 * TanStack Query Hooks Factory
 * 生成通用的 CRUD hooks
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query'

// Query Key 工厂
export const createQueryKeys = (resource: string) => ({
  all: [resource] as const,
  lists: () => [...createQueryKeys(resource).all, 'list'] as const,
  list: (params: unknown) => [...createQueryKeys(resource).lists(), params] as const,
  details: () => [...createQueryKeys(resource).all, 'detail'] as const,
  detail: (id: string) => [...createQueryKeys(resource).details(), id] as const,
})

// 通用 Hook 创建工具
export function createListHook<T>(
  resource: string,
  fetchFn: () => Promise<T[]>
) {
  return function useList(
    options?: Omit<UseQueryOptions<T[], Error>, 'queryKey' | 'queryFn'>
  ) {
    return useQuery({
      queryKey: [`${resource}`, 'list'],
      queryFn: fetchFn,
      ...options,
    })
  }
}

export function createDetailHook<T>(
  resource: string,
  fetchFn: (id: string) => Promise<T>
) {
  return function useDetail(
    id: string | null | undefined,
    options?: Omit<UseQueryOptions<T, Error>, 'queryKey' | 'queryFn' | 'enabled'>
  ) {
    return useQuery({
      queryKey: [`${resource}`, 'detail', id || ''],
      queryFn: () => fetchFn(id!),
      enabled: !!id,
      ...options,
    })
  }
}

export function createCreateHook<T, CreateDTO = Partial<T>>(
  resource: string,
  mutationFn: (data: CreateDTO) => Promise<T>,
  additionalInvalidateKeys?: string[][]
) {
  return function useCreate(
    options?: Omit<UseMutationOptions<T, Error, CreateDTO>, 'mutationFn' | 'onSuccess'>
  ) {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [resource, 'list'] })
        additionalInvalidateKeys?.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: key })
        })
      },
      ...options,
    })
  }
}

export function createUpdateHook<T, UpdateDTO = Partial<T>>(
  resource: string,
  mutationFn: (id: string, data: UpdateDTO) => Promise<T>,
  additionalInvalidateKeys?: string[][]
) {
  return function useUpdate(
    options?: Omit<
      UseMutationOptions<T, Error, { id: string; data: UpdateDTO }>,
      'mutationFn' | 'onSuccess'
    >
  ) {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ id, data }) => mutationFn(id, data),
      onSuccess: (_, { id }) => {
        queryClient.invalidateQueries({ queryKey: [resource, 'list'] })
        queryClient.invalidateQueries({ queryKey: [resource, 'detail', id] })
        additionalInvalidateKeys?.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: key })
        })
      },
      ...options,
    })
  }
}

export function createDeleteHook(
  resource: string,
  mutationFn: (id: string) => Promise<void>,
  additionalInvalidateKeys?: string[][]
) {
  return function useDelete(
    options?: Omit<UseMutationOptions<void, Error, string>, 'mutationFn' | 'onSuccess'>
  ) {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [resource, 'list'] })
        additionalInvalidateKeys?.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: key })
        })
      },
      ...options,
    })
  }
}

// 通用 Mutation Hook 工厂（用于自定义操作）
export function createMutationHook<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  invalidateKeys?: string[][]
) {
  return function useCustomMutation(
    options?: Omit<UseMutationOptions<TData, Error, TVariables>, 'mutationFn' | 'onSuccess'>
  ) {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn,
      onSuccess: () => {
        invalidateKeys?.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: key })
        })
      },
      ...options,
    })
  }
}

// 兼容旧 API 的 CrudApi 接口（可选）
export interface CrudApi<T, CreateDTO = Partial<T>, UpdateDTO = Partial<T>> {
  getAll: () => Promise<T[]>
  getById: (id: string) => Promise<T>
  create: (data: CreateDTO) => Promise<T>
  update: (id: string, data: UpdateDTO) => Promise<T>
  delete: (id: string) => Promise<void>
}
