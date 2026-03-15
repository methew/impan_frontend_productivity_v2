/**
 * @/packages/query
 * TanStack Query 工具包
 */

// Lib - Factory functions
export {
  createQueryKeys,
  createListHook,
  createDetailHook,
  createCreateHook,
  createUpdateHook,
  createDeleteHook,
  createMutationHook,
  type CrudApi,
} from './lib/factory'

// Hooks
export { useOptimisticMutation, useOptimisticListUpdate } from './hooks/useOptimistic'
export {
  useInfiniteList,
  flattenInfiniteData,
  getInfiniteTotal,
} from './hooks/useInfiniteList'
