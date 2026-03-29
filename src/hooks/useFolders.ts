import {
  createListHook,
  createDetailHook,
  createCreateHook,
  createUpdateHook,
  createDeleteHook,
} from '@/packages/query/lib/factory'
import * as folderApi from '@/api/folders'
import type { Folder } from '@/types'

export const folderKeys = {
  all: ['folders'] as const,
  lists: () => [...folderKeys.all, 'list'] as const,
  detail: (id: string) => [...folderKeys.all, 'detail', id] as const,
}

// 使用工厂函数创建 hooks
export const useFolders = createListHook<Folder>('folders', folderApi.getFolders)
export const useFolder = createDetailHook<Folder>('folders', folderApi.getFolder)
export const useCreateFolder = createCreateHook<Folder>('folders', folderApi.createFolder)
export const useUpdateFolder = createUpdateHook<Folder>('folders', folderApi.updateFolder)
export const useDeleteFolder = createDeleteHook('folders', folderApi.deleteFolder)
