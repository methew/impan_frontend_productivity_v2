import {
  createListHook,
  createDetailHook,
  createCreateHook,
  createUpdateHook,
  createDeleteHook,
} from '@/packages/query/lib/factory'
import * as tagApi from '@/api/tags'
import type { Tag } from '@/types'

export const tagKeys = {
  all: ['tags'] as const,
  lists: () => [...tagKeys.all, 'list'] as const,
  detail: (id: string) => [...tagKeys.all, 'detail', id] as const,
}

// 使用工厂函数创建 hooks
export const useTags = createListHook<Tag>('tags', tagApi.getTags)
export const useTag = createDetailHook<Tag>('tags', tagApi.getTag)
export const useCreateTag = createCreateHook<Tag>('tags', tagApi.createTag)
export const useUpdateTag = createUpdateHook<Tag>('tags', tagApi.updateTag)
export const useDeleteTag = createDeleteHook('tags', tagApi.deleteTag)
