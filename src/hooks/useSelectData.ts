/**
 * useSelectData - 通用选择器数据 Hook
 * 用于获取 Person、Location、Tag 数据供选择器使用
 */
import { usePersons } from './usePersons'
import { useLocations } from './useLocations'
import { useTags } from './useTags'

export function useSelectData() {
  const { data: persons = [], isLoading: isLoadingPersons } = usePersons()
  const { data: locations = [], isLoading: isLoadingLocations } = useLocations()
  const { data: tags = [], isLoading: isLoadingTags } = useTags()

  return {
    persons,
    locations,
    tags,
    isLoading: isLoadingPersons || isLoadingLocations || isLoadingTags,
    isLoadingPersons,
    isLoadingLocations,
    isLoadingTags,
  }
}

// 单独导出的 hooks，方便按需使用
export { usePersons } from './usePersons'
export { useLocations } from './useLocations'
export { useTags } from './useTags'
