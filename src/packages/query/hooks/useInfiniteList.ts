/**
 * Infinite List Hook
 * 无限滚动列表
 */

import { useInfiniteQuery } from '@tanstack/react-query'

interface PaginatedResponse<T> {
  data: T[]
  nextCursor?: string | number | null
  hasMore: boolean
  total?: number
}

interface UseInfiniteListOptions<T> {
  queryKey: string[]
  fetchFn: (cursor: string | number | undefined, limit: number) => Promise<PaginatedResponse<T>>
  limit?: number
  enabled?: boolean
}

export function useInfiniteList<T>({
  queryKey,
  fetchFn,
  limit = 20,
  enabled = true,
}: UseInfiniteListOptions<T>) {
  return useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchFn(pageParam, limit),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | number | undefined,
    enabled,
  })
}

// 合并所有分页数据为扁平数组
export function flattenInfiniteData<T>(data: { pages: PaginatedResponse<T>[] } | undefined): T[] {
  if (!data) return []
  return data.pages.flatMap((page) => page.data)
}

// 获取总数
export function getInfiniteTotal<T>(data: { pages: PaginatedResponse<T>[] } | undefined): number {
  if (!data?.pages[0]) return 0
  return data.pages[0].total || 0
}
